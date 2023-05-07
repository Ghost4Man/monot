<script context="module" lang="ts">
    export enum CanvasMode { Editable, ReadOnly }
</script>

<script lang="ts">
    import { onMount, afterUpdate } from "svelte";
    import type { Point } from "geometric";
    import * as geometric from "geometric";
    import { Vec } from "ella-math";
    import { Canvasimo } from "canvasimo";
    import { Vertex } from "./Vertex";
    import { Triangulation } from "./triangulation";

    export let mode: CanvasMode;
    export let points: Point[];
    export let triangulation: Triangulation | null;
    export let width: number;
    export let height = 500;
    export let displayVertexIndices = true;
    export let sliderPosition = 0;
    export let darkTheme = false;
    export let zoomLevel = 1.0;
    
    let canvasElement: HTMLCanvasElement;

    let draggingIndex = -1;
    const pointDragRadius = 10;
    const pointOnEdgeEpsilon = 1000;
    
    function screenToWorld(p: Point): Point {
        return [p[0] / zoomLevel, p[1] / zoomLevel];
    }

    function worldToScreen(p: Point): Point {
        return [p[0] * zoomLevel, p[1] * zoomLevel];
    }

    function findVertexAt(position: Point, radius: number): Vertex | null {
        for (let i = 0; i < points.length; i++) {
            const dx = points[i][0] - position[0];
            const dy = points[i][1] - position[1];
            if (dx*dx + dy*dy <= radius * radius) {
                return new Vertex(i, points);
            }
        }
        return null;
    }

    function getMousePosition(event: MouseEvent) {
        return screenToWorld([event.offsetX, event.offsetY]);
    }

    function handleDragMove(event: MouseEvent) {
        if (mode != CanvasMode.Editable)
            return;

        if (draggingIndex >= 0) {
            points[draggingIndex][0] += event.movementX / zoomLevel;
            points[draggingIndex][1] += event.movementY / zoomLevel;
        }
    }
    
    function handleDragEnd() {
        draggingIndex = -1;
    }

    function handleDoubleClick(event: MouseEvent) {
        if (mode != CanvasMode.Editable)
            return;

        const mousePos = getMousePosition(event);
        let vertexIndex = findVertexAt(mousePos, pointDragRadius * 2)?.index;
        if (vertexIndex != null) {
            points.splice(vertexIndex, 1); // remove vertex from polygon
            points = points;
        }
    }
    
    function handleMouseDown(event: MouseEvent) {
        const mousePos = getMousePosition(event);
        
        // Check if the mouse is on a polygon vertex
        draggingIndex = findVertexAt(mousePos, pointDragRadius)?.index ?? -1;
        if (draggingIndex >= 0)
            return;

        if (mode != CanvasMode.Editable)
            return;

        // If mouse is on a polygon edge, add a new vertex
        for (let i = 0; i < points.length; i++) {
            if (geometric.pointOnLine(mousePos, [points.at(i-1)!, points[i]], pointOnEdgeEpsilon)) {
                points.splice(i, 0, mousePos);
                points = points;
                draggingIndex = i;
                return;
            }
        }
    }
    
    let canvas: Canvasimo;
    let redraws = 0;
    
    onMount(() => {
        canvas = new Canvasimo(canvasElement);

        canvasElement.addEventListener("dblclick", handleDoubleClick);
        canvasElement.addEventListener("mousedown", handleMouseDown);
        canvasElement.addEventListener("mousemove", handleDragMove);
        canvasElement.addEventListener("mouseup", handleDragEnd);
        canvasElement.addEventListener("wheel", ev => {
            const wheelMultiplier =
                (ev.deltaMode == WheelEvent.DOM_DELTA_LINE) ? 0.02 :
                (ev.deltaMode == WheelEvent.DOM_DELTA_PAGE) ? 0.5 :
                0.01;
            console.debug("deltaY", ev.deltaY, "mode:", ev.deltaMode);
            zoomLevel = Math.max(0.2, zoomLevel - clamp(ev.deltaY, -20, 20) * wheelMultiplier);
            ev.preventDefault();
        });
    });

    // Redraw when any prop (component parameter) changes
    afterUpdate(() => requestAnimationFrame(draw));

    // Redraw when some internal variables changes
    $: draggingIndex,
        requestAnimationFrame(draw);

    $: edgeVectors = points.map((p, i, pts) => {
        const v = Vec.fromArray(p);
        const vNext = Vec.fromArray(pts[(i + 1) % pts.length]);
        return vNext.sub(v);
    });

    function draw()
    {
        if (!canvas) return;
        
        canvas.save();

        const foregroundColor = darkTheme ? "silver" : "black";
        const gray = darkTheme ? "#888" : "silver";
        const red = darkTheme ? "#f22" : "red";
        const green = darkTheme ? "lime" : "#3d0";
        const vertexCircleRadius = 4;
        const triangulationState = triangulation?.trace?.state;
        
        canvas.clearRect(0, 0, width, height);
        canvas.setFont(`14px Verdana`);
        canvas.fillText(redraws.toString(), 10, height - 10, null, "pink");
        redraws++;

        canvas.scale(zoomLevel, zoomLevel);

        // Draw the polygon on the canvas
        canvas.beginPath().strokeClosedPath(points, foregroundColor);

        // Draw the scan line
        canvas.beginPath().strokeLine(sliderPosition, 0, sliderPosition, height, red);

        // Draw a scan line at the active vertex
        let activeVertexX = triangulationState?.activeVertex?.position[0];
        if (activeVertexX) {
            canvas.save().beginPath().setStrokeDash([5, 5])
                .strokeLine(activeVertexX, 0, activeVertexX, height, green)
                .restore();
        }
        
        // Draw the vertices of the polygon
        for (let i = 0; i < points.length; i++) {
            const [x, y] = points[i];
            const [color, radiusMultiplier] =
                (i === draggingIndex) ? [, 2, ] :
                (i === triangulation?.trace?.state.activeVertex?.index) ? [green, 1.5, ] :
                (x < sliderPosition) ? [red, , ] :
                [, , ];
            canvas.beginPath().plotCircle(x, y, vertexCircleRadius * (radiusMultiplier ?? 1));
            // Highlight dragged vertex and vertices to the left of the scanline
            canvas.fill(color ?? foregroundColor);
            if (displayVertexIndices) {
                const normalVector = rot90CW(edgeVectors[i].normalized.add(edgeVectors.at(i - 1)!.normalized));
                const labelDir = normalVector.normalized.mul(16);
                canvas.setTextAlign("center").setTextBaseline("middle")
                    .fillText(i.toString(), x + labelDir.x, y + labelDir.y);
            }
        }

        if (triangulationState) {
            // Draw vertices in the queue
            canvas.save().setCompositeOperation(darkTheme ? "lighten" : "darken");
            for (const vertex of triangulationState.queue) {
                canvas.beginPath().fillCircle(...vertex.position, 15, null, "#1c17");
            }
            canvas.restore();

            // Draw all diagonals (triangulation output)
            for (const [start, end] of triangulationState.diagonals) {
                canvas.beginPath().setStrokeWidth(2)
                    .strokeLine(...start.position, ...end.position, green);
            }
        }

        canvas.restore();
    }

    function clamp(x: number, min: number, max: number) {
        return Math.max(min, Math.min(x, max));
    }

    function rot90CW(v: Vec) {
        return new Vec(-v.y, v.x);
    }
</script>

<style>
    canvas {
        border: 1px solid #f555;
        display: block;
        width: 100%;
        object-fit: none;
    }
    canvas:not(.editable) {
        border-style: dashed;
    }
</style>

<div class="canvasContainer" bind:clientWidth="{width}">
    <canvas bind:this={canvasElement}
        width={width} height={height}
        class:editable={mode === CanvasMode.Editable} />
</div>

