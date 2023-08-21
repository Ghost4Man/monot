<script lang="ts">
    import type { Point } from "geometric";

    import SideView from './SideView.svelte';
    import DemoCanvas from './DemoCanvas.svelte';
    import { CanvasMode } from './DemoCanvas.svelte';
    import { Triangulation } from "./triangulation";
    
    let mode: CanvasMode;
    let triangulation: Triangulation|null = null;
    let points = getDefaultPolygon();
    let displayVertexIndices = true;
    let sliderPosition: number = -1;
    let width: number;
    let zoomLevel: number;

    const darkThemeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    let darkTheme = darkThemeMediaQuery.matches;
    darkThemeMediaQuery.addEventListener("change", event => { darkTheme = event.matches; });

    $: mode = triangulation != null ? CanvasMode.ReadOnly : CanvasMode.Editable;
    
    $: shouldShowScanlineSlider = triangulation?.trace?.stepIndex === 1;
    // whenever the slider's visibility changes, reset its value
    $: shouldShowScanlineSlider, sliderPosition = -1;
    
    function getDefaultPolygon(): Point[] {
        return [
            [478, 39],
            [387, 108],
            [358, 196],
            [250, 86],
            [50, 127],
            [74, 215],
            [146, 234],
            [205, 263],
            [280, 331],
            [436, 358],
            [594, 274],
            [630, 166],
            [544, 57]
        ];
    }

    function copyPolygonToClipboard(points: Point[]) {
        const text = "[\n" + points
            .map(p => "    " + JSON.stringify(p.map(Math.round)))
            .join(",\n") + "\n]";
        navigator.clipboard.writeText(text);
    }

    function triangulate() {
        triangulation = new Triangulation(points);
        triangulation.triangulate();
    }

    function stepForward() {
        triangulation?.trace?.forward();
        triangulation = triangulation; // to trigger Svelte update
    }

    function stepBackward() {
        triangulation?.trace?.backward();
        triangulation = triangulation; // to trigger Svelte update
    }

    function goToStep(stepIndex: number): any {
        triangulation?.trace?.goToStep(stepIndex);
        triangulation = triangulation; // to trigger Svelte update
    }

    function joinNonEmpty(sep: string, items: any[]) {
        return items.filter(x => x || x === 0).join(sep);
    }
</script>

<style>
    #appContainer {
        display: flex;
        flex-flow: row nowrap;
        gap: 0.5em;
    }

    @media (orientation: portrait) {
        #appContainer { flex-direction: column; }
    }

    main {
        flex: 2 0;
    }
    main, aside {
        display: flex;
        flex-direction: column;
        gap: 0.6em;
    }
    aside {
        flex: 1 0;
        border: 1px solid var(--gray-800);
        padding: 0.5em;
    }
    input[type=range] {
        width: 100%;
    }
    .scanline-slider {
        accent-color: var(--scanline-color);
    }
    .floating-controls {
        position: absolute;
        background: var(--gray-900);
        width: 100%;
        bottom: 0;
        padding-top: 0.3em;
        z-index: 1;
    }
    .button-bar {
        display: flex;
        flex-flow: row wrap;
        gap: 0.2em;
    }
    .step-description {
        padding: 0.5em;
        margin: 0;
        line-height: 1.2;
        min-height: calc(1.2em * 3); /* reserve 3 lines to prevent jumping */
        background: var(--shade-900);
    }
</style>

<div id="appContainer">
    <main>
        <div class="button-bar">
            {#if mode === CanvasMode.Editable}
                <button class="primary" on:click={() => triangulate()}>
                    &#x25B6; Triangulate
                </button>
                <button class="tertiary" on:click={() => points = getDefaultPolygon()}>
                    Reset to default polygon
                </button>
                <button class="tertiary" on:click={() => copyPolygonToClipboard(points)}>
                    Copy polygon data to clipboard
                </button>
            {:else}
                <button class="primary" on:click={() => triangulation = null}>
                    &#9198; Edit Polygon
                </button>
            {/if}
        </div>

        <label>
            <input type="checkbox" id="displayVertexIndices" bind:checked={displayVertexIndices} />
            Show vertex indices
        </label>

        <div style="position:relative">
            <DemoCanvas
                bind:points
                bind:width
                bind:zoomLevel
                {mode}    
                {darkTheme}
                {triangulation}
                {displayVertexIndices}
                {sliderPosition}
                />

            {#if shouldShowScanlineSlider}
                <label class="floating-controls">
                    Scan line position:
                    <input type="range" id="slider" class="scanline-slider"
                        min="0" max={width / zoomLevel}
                        bind:value={sliderPosition} />
                </label>
            {/if}

            <button on:click={() => zoomLevel += 0.2 * zoomLevel} title="Zoom in">&plus;</button>
            <button on:click={() => zoomLevel -= 0.2 * zoomLevel} title="Zoom out">&minus;</button>
        </div>
    </main>
    
    {#if triangulation?.trace?.state}
        {@const trace = triangulation.trace}
        <aside>
            <div class="button-bar">
                <button class="secondary" on:click={() => stepBackward()}
                        disabled={!triangulation?.trace?.canGoBackward}>
                    &#x25C0; Prev
                </button>
                <button class="secondary" on:click={() => stepForward()}
                        disabled={!triangulation?.trace?.canGoForward}>
                    &#x25B6; Next
                </button>
            </div>

            <label>
                Step: {trace.stepIndex}/{trace.steps.length}
                <input type="range" id="step"
                    min="0" max={trace.steps.length}
                    value={trace.stepIndex}
                    on:input={e => goToStep(e.currentTarget.valueAsNumber)} />
            </label>

            <p class="step-description">
                {@html trace.prevStep?.htmlDescription || "&nbsp;"}
            </p>
            
            <SideView state={trace.state} {sliderPosition} />
        </aside>
    {/if}
</div>
