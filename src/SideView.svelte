<script lang="ts">
    import { type TriangulationState } from "./triangulation";
    export let state: TriangulationState;
    export let sliderPosition: number = 0;
</script>

<style>
    pre {
        padding: 0.2em;
        background: #8883;
    }
    dt { font-weight: bold; }
    dd { margin: 0.3em 0 0 1em; }
    dd + dt { margin-top: 1em; }
    dd > ul { margin: 0; padding: 0; }
    .horizontal-list {
        display: flex;
        flex-flow: row wrap;
        gap: 0.1em;
    }
    .horizontal-list > li {
        list-style-type: none;
        border: 1px solid var(--gray-800);
        padding: 0.1em 0.4em;
        cursor: default;
    }
    li.left-of-scanline {
        color: var(--scanline-color);
        border-color: var(--scanline-color); /* as fallback for color-mix */
        border-color: color-mix(in srgb, var(--scanline-color), 50% transparent);
    }
</style>

<details hidden>
    <summary>Triangulation state (debug)</summary>
    <pre style="margin:0">{JSON.stringify(state, undefined, 4)}</pre>
</details>

<dl>
    <dt>Vertices sorted by X-coordinate:</dt>
    <dd>
        <ul class="horizontal-list">
            {#each state.sortedVertices as vertex}
                <li class:left-of-scanline={vertex.position[0] < sliderPosition}>{vertex}</li>
            {:else}
                -
            {/each}
        </ul>
    </dd>

    <dt>Queue:</dt>
    <dd>
        <ul class="horizontal-list">
            {#each state.queue as vertex}
                <li>{vertex}</li>
            {:else}
                -
            {/each}
        </ul>
    </dd>

    <dt>Diagonals (output):</dt>
    <dd>
        <ul class="horizontal-list">
            {#each state.diagonals as diagonal}
                <li>{diagonal}</li>
            {:else}
                -
            {/each}
        </ul>
    </dd>
</dl>
