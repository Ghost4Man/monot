# Monotone Polygon Triangulation Demo

- available online at https://monot.netlify.app
- created as a project for the computational geometry (VGE) course at FIT VUT, 2022/2023

## About

This is an interactive web application demonstrating the basic algorithm for **triangulation of a monotone polygon**. It allows you to move forward and backward in the algorithm execution timeline and see what's happening at any point (a description of the current step and values of internal variables).

## Controls

2 modes: editing the input data (monotone polygon) and playback of the triangulation process:

1. polygon editing:
    - **move vertex** by dragging it
    - **add vertex** by dragging or clicking on an existing edge
    - **remove a vertex** by double clicking it

2. playing back the triangulation process:
    - **step forward/backward** by clicking the _Prev_ and _Next_ buttons or by dragging the step slider
    - the description of the current step is displayed in the blue box, followed by the new internal state of the algorithm (input data after sorting, vertex queue, output list of diagonals)

Tip: you can "export" the canvas contents as an image by right clicking on it and selecting "Save image as..."

## Building from source

1. `pnpm install` to download all dependencies

2. `pnpm run dev` (or directly `vite`) to start the development server

Note: you should also be able to use `npm` instead of `pnpm`

Now, to build and serve the app:

1. `pnpm run build` (or directly `vite build`) to build the app as a static website (just HTML+CSS+JS) into the `dist` directory

2. now serve the contents of the `dist` directory using any HTTP server, for example:
    - `cd dist && python start.py` (uses the included python script to start a simple HTTP server)
    - `cd dist && php -S localhost:8000`

## Dependencies

- _Svelte_: a framework/compiler for creating interactive web apps using components
- _Vite_: development and build tool (_devserver_ & _build tool_)
- _Svelte_ for interactive UI applications
- _Immer.js_ to record algorithm steps and play back in both directions
- _geometric_ and _ella.js_ for geometric calculations and vectors
- _itertools_
- _canvasimo_

## Overview of source code files

- `src/App.svelte` - the main application component (contains and manages everything else)
- `src/DemoCanvas.svelte` - component rendering polygon and triangulation state + interactions
- `src/SideView.svelte` - component for the sidebar with control and status overview
- `src/StateTrace.ts` - helper class for recording and replaying object state changes
- `src/triangulation.ts` - implementation of the triangulation algorithm and progress playback
- `src/Vertex.ts` - polygon vertex
- `src/app.css` - global styles of the web application

## Literature & inspiration

- _Computational Geometry_ [de Berg, Cheong, van Kreveld, Overmars; 2008]

- most of the implementation of the algorithm procedure was inspired by the video ["04 13 polygon triangulation - triangulating a y monotone"](https://www.youtube.com/watch?v=LBUgWiU3Rvk) by _peyman afshani_

## TODO

Current limitations and missing features (in no particular order) to be added:

- [ ] make the canvas more responsive (stretch to full viewport height in landscape orientation)
- [ ] visualize _why_ a certain polygon is not monotone
- [ ] add visualizations for the "mark whether a vertex is on the top or bottom polygonal chain" step
- [ ] more explanations (e.g. how do we recognize an inwards turn)
- [ ] use actual icons instead of unicode symbols
- [ ] use vector-based rendering (probably SVG) instead of canvas
    - [ ] export to SVG
        - [ ] allow adjusting the text size, vertex radius, colors, etc.
- [ ] remove the redraw count (the number in the bottom left corner)
- [ ] if the input polygon is not monotone, perform the partitioning into monotone polygons (with all the visualizations and step descriptions for that algorithm)
