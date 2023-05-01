import { type Patch, applyPatches } from "immer";

// Immer can only apply patches to "Objectish" types
type Objectish = Parameters<typeof applyPatches>[0];

export class Step {
    constructor(
        readonly forwardPatches: Patch[],
        readonly backwardPatches: Patch[],
        readonly htmlDescription: string,
    ) { }
}

/**
 * Records the changes (as steps) to an object so that they can
 * be later played back (forward and backward).
 */
export class StateTrace<T extends Objectish> {
    state: T;
    stepIndex: number = 0;
    steps: Step[] = [];

    constructor(
        public readonly initialState: T
    ) {
        this.state = initialState;
    }

    recordChange = (htmlDescription: string, patches: Patch[], inversePatches: Patch[]) => {
        this.steps.push(new Step(patches, inversePatches, htmlDescription));
    };

    private get nextForwardPatchSet(): Patch[] | null {
        return this.nextStep?.forwardPatches ?? null;
    }
    private get nextBackwardPatchSet(): Patch[] | null {
        return this.prevStep?.backwardPatches ?? null;
    }

    get canGoForward() { return this.nextForwardPatchSet != null; }
    get canGoBackward() { return this.nextBackwardPatchSet != null; }
    get nextStep(): Step | null { return this.steps[this.stepIndex] ?? null; }
    get prevStep(): Step | null { return this.steps[this.stepIndex - 1] ?? null; }

    forward() {
        const patchSet = this.nextForwardPatchSet;
        if (!patchSet)
            return null;

        console.debug(`Applying forward patchSet (${this.stepIndex} -> ${this.stepIndex + 1})`, patchSet);
        this.state = applyPatches(this.state, patchSet);
        this.stepIndex++;
        return this;
    }

    backward() {
        const patchSet = this.nextBackwardPatchSet;
        if (!patchSet)
            return null;

        console.debug(`Applying backward patchSet (${this.stepIndex} -> ${this.stepIndex - 1})`, patchSet);
        this.state = applyPatches(this.state, patchSet);
        this.stepIndex--;
        return this;
    }

    goToStep(stepIndex: number) {
        while (this.stepIndex < stepIndex && this.forward())
            ;
        while (this.stepIndex > stepIndex && this.backward())
            ;
    }

    reset() {
        this.state = this.initialState;
        this.stepIndex = 0;
    }
}
