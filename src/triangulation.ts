import type { Point, Polygon } from "geometric";
import { produce, enablePatches, type Immutable, immerable } from "immer";
import { StateTrace } from "./StateTrace";

enablePatches();

export type Diagonal = Immutable<[Vertex, Vertex]>;

export class Vertex {
    [immerable] = true;

    readonly position: Point;
    
    constructor(
            readonly index: number,
            readonly sourcePolygon: Polygon) {
        this.position = sourcePolygon[index];
    }

    isAdjacentTo(other: Vertex) {
        return other === this.next || other === this.prev;
    }

    get next(): Vertex { return this.getNeighbor(+1); }
    get prev(): Vertex { return this.getNeighbor(-1); }

    getNeighbor(delta = 1): Vertex {
        return new Vertex(
            mod(this.index + delta, this.sourcePolygon.length),
            this.sourcePolygon);
    }

    toString(): string {
        return `#${this.index}`;
    }
};

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

    check(): "ok" | string {
        return "ok";
    }
    
    triangulate(): TriangulationState {
        let state = new TriangulationState();

        this.trace = new StateTrace<TriangulationState>(state);

        const stepRecorder = (htmlDescription?: string) => {
            return this.trace!.recordChange.bind(this, htmlDescription ?? "");
        }

        const dummyStep = () => {
            state = produce(state, draft => {
            }, stepRecorder());
        }
        
        const enqueue = (vertices: Vertex[]) => {
            state = produce(state, draft => {
                draft.queue.push(...vertices);
            }, stepRecorder(`add [${vertices.join(", ")}] to the queue`));
        }

        const dequeue = () => {
            let vertex: Vertex | undefined;
            state = produce(state, draft => {
                vertex = draft.queue.shift();
            }, stepRecorder());
            return vertex;
        }

        state = produce(state, draft => {
            draft.sortedVertices = this.polygon
                .map((_, i, poly) => new Vertex(i, poly))
                .sort((a, b) => a.position[0] - b.position[0]);
        }, stepRecorder("sort vertices by X coordinate"));

        enqueue(state.sortedVertices.slice(0, 2));

        // TODO: the rest of the triangulation algorithm
        
        state = produce(state, draft => {
            draft.diagonals.push([
                this.vertexAt(3),
                this.vertexAt(5)
            ]);
        }, stepRecorder());
        
        return state;
    }

    private vertexAt(index: number): Vertex {
        return new Vertex(index, this.polygon);
    }
}

function mod(n: number, m: number) { return ((n % m) + m) % m; }
