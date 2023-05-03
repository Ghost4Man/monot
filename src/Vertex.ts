import { type Point, type Polygon } from "geometric";
import { immerable } from "immer";

export class Vertex {
    [immerable] = true;

    readonly position: Point;

    constructor(
        readonly index: number,
        readonly sourcePolygon: Polygon) {
        this.position = sourcePolygon[index];
    }

    isAdjacentTo(other: Vertex) {
        return other.equals(this.next) || other.equals(this.prev);
    }

    get next(): Vertex { return this.getNeighbor(+1); }
    get prev(): Vertex { return this.getNeighbor(-1); }

    get isOnBottomChain() { return this.prev.position[0] < this.position[0]; }
    get isOnTopChain() { return this.prev.position[0] > this.position[0]; }

    getNeighbor(delta = 1): Vertex {
        return new Vertex(
            mod(this.index + delta, this.sourcePolygon.length),
            this.sourcePolygon);
    }

    equals(other: Vertex) {
        return this.sourcePolygon === other.sourcePolygon
            && this.index === other.index;
    }

    toString(): string {
        return `#${this.index}`;
    }
}

function mod(n: number, m: number) { return ((n % m) + m) % m; }
