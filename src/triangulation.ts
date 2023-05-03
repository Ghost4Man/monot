import { type Polygon } from "geometric";
import { produce, enablePatches, type Immutable, immerable } from "immer";
import { Vec } from "ella-math";
import { StateTrace } from "./StateTrace";
import { Vertex } from "./Vertex";

enablePatches();

export type Diagonal = Immutable<[Vertex, Vertex]>;

const TriangulationState = class {
    static [immerable] = true;
    queue: Vertex[] = [];
    diagonals: Diagonal[] = [];
    sortedVertices: Vertex[] = [];
    activeVertex: Vertex | null = null;
}
export type TriangulationState = Immutable<InstanceType<typeof TriangulationState>>;

/**
 * A single triangulation of a specific polygon that
 * records the steps of the algorithm.
 */
export class Triangulation {
    trace: StateTrace<TriangulationState> | null = null;
    readonly polygon: Polygon;
    
    constructor(polygon: Polygon) {
        this.polygon = structuredClone(polygon);
    }
    
    triangulate(): TriangulationState {
        let state = new TriangulationState();

        this.trace = new StateTrace<TriangulationState>(state);

        // helper functions for producing steps with recorded mutations:
        const stepRecorder = (htmlDescription?: string) => {
            return this.trace!.recordChange.bind(this, htmlDescription ?? "");
        }
        const dummyStep = (htmlDescription: string) => {
            state = produce(state, _ => { }, stepRecorder(htmlDescription));
        }
        const setActiveVertex = (vertex: Vertex, htmlDescription: string) => {
            state = produce(state, draft => {
                draft.activeVertex = vertex;
            }, stepRecorder(htmlDescription));
        }
        const enqueue = (vertices: Vertex[]) => {
            state = produce(state, draft => {
                draft.queue.push(...vertices);
            }, stepRecorder(`add [${vertices.join(", ")}] to the queue`));
        }
        const dequeue = (index = 0) => {
            let vertex = state.queue.at(index);
            state = produce(state, draft => {
                if (index != 0)
                    draft.queue.splice(index, 1)[0]
                else
                    draft.queue.shift();
            }, stepRecorder(`remove ${vertex} from the queue`));
            return vertex;
        }
        const addDiagonal = (start: Vertex, end: Vertex, htmlDescription = "add diagonal") => {
            if (start.isAdjacentTo(end))
                return false;
            state = produce(state, draft => {
                draft.diagonals.push([start, end]);
            }, stepRecorder(htmlDescription));
        }

        // First sort the vertices by the X coordinate
        state = produce(state, draft => {
            draft.sortedVertices = this.polygon
                .map((_, i, poly) => new Vertex(i, poly))
                .sort((a, b) => a.position[0] - b.position[0]);
        }, stepRecorder("sort vertices by X coordinate"));

        const badVertex = findVertexViolatingMonotonicity(state.sortedVertices);
        if (badVertex != null) {
            setActiveVertex(badVertex, "this polygon is <b>not monotone</b>!");
            return state;
        }
        
        dummyStep("mark whether a vertex is on the top or bottom polygonal chain");

        enqueue(state.sortedVertices.slice(0, 2));

        for (let i = 2; i < state.sortedVertices.length; i++) {
            const vertex = state.sortedVertices[i];

            if (vertex.isAdjacentTo(state.queue.at(-1)!)) {
                setActiveVertex(vertex, "next vertex (on the same chain)");
                
                enqueue([vertex]);

                // try make triangle
                while (state.queue.length >= 3) {
                    // look at 3 points last added to the queue
                    const a = state.queue.at(-3)!;
                    const b = state.queue.at(-2)!;
                    const c = state.queue.at(-1)!;
                    const inwardsTurn = this.isInwardsTurn([a,b,c]);
                    if (inwardsTurn) {
                        addDiagonal(a, c, `since [${[a,b,c]}] make an <b>inwards</b> turn,
                            we can add a diagonal from ${a} to ${c}`);
                        dequeue(-2); // remove B
                    }
                    else {
                        dummyStep((inwardsTurn === null)
                            ? `we are at the rightmost vertex`
                            : `[${[a,b,c]}] make an <b>outwards</b> turn, <br>
                            so we cannot add any diagonal`)
                        break;
                    }
                }
            }
            else {
                state = produce(state, draft => {
                    draft.activeVertex = vertex;
                }, stepRecorder("next vertex (from the opposite chain)"));

                while (state.queue.length > 1) {
                    const removed = dequeue()!;
                    addDiagonal(removed, vertex,
                        `add a diagonal between the active vertex and
                        the vertex we removed from the queue`);
                }

                addDiagonal(state.queue[0], vertex,
                    `and finally, add diagonal to the last vertex in the queue
                    without removing it`);
                enqueue([vertex]);
            }
        }

        return state;
    }

    private isInwardsTurn([a, b, c]: Vertex[]): boolean | null {
        const areOnBottomChain = b.isOnBottomChain && c.isOnBottomChain;
        const areOnTopChain = b.isOnTopChain && c.isOnTopChain;
        if (areOnBottomChain === areOnTopChain) {
            return null;
        }

        const [vA, vB, vC] = [a, b, c].map(v => Vec.fromArray(v.position));
        const [vAB, vBC] = [vB.sub(vA), vC.sub(vB)];

        return areOnBottomChain
            ? to3D(vAB).cross(to3D(vBC)).z < 0
            : to3D(vAB).cross(to3D(vBC)).z > 0;

        function to3D(v: Vec): Vec { return new Vec(v.x, v.y, 0); }
    }
    
    private vertexAt(index: number): Vertex {
        return new Vertex(index, this.polygon);
    }
}

function findVertexViolatingMonotonicity(sortedVertices: Vertex[]): Vertex | null {
    // for each vertex except the first and last
    for (let i = 1; i < sortedVertices.length - 1; i++) {
        const vertex = sortedVertices[i];
        const nextIsToTheLeft = vertex.next.position[0] < vertex.position[0];
        const prevIsToTheLeft = vertex.prev.position[0] < vertex.position[0];
        // if they are both to the left or both to the right, the polygon is not monotone
        if (nextIsToTheLeft === prevIsToTheLeft) {
            return vertex;
        }
    }
    return null;
}

