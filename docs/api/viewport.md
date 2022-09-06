# Viewport

The Viewport class controls the renderer and options associated with rendering. The viewport is not initialized by the user, but it can be acessed via the [GraferController](./grafer-controller.md#viewport) and properties in the viewport can be changed.

<br>

## Properties

### `element`
###### HTMLElement \| HTMLElement - *read-only*

An element Grafer is rendering into. Can either be a canvas element or any other HTML element (e.g. div).

See [GraferController](./grafer-controller.md#canvas) for more information.

#### `canvas`
###### HTMLCanvasElement - *read-only*

A canvas element Grafer is rendering into.

See [GraferController](./grafer-controller.md#canvas) for more information.

#### `context`
###### GraferContext - *read-only*

A picoGL instance which Grafer is using for rendering.

#### `mouseHandler`
###### MouseHandler - *read-only*

A picoGL instance which Grafer is using for rendering.

#### `colorRegistry`
###### ColorRegistry - *read-only*

A picoGL instance which Grafer is using for rendering.

#### `textureRegistry`
###### TextureRegistry - *read-only*

A picoGL instance which Grafer is using for rendering.

#### `rect`
###### DOMRectReadOnly - *read-only*

An object containing positional information about the element Grafer is rendering into. Is kept updated by polling the position of the element on a slow timer.

See [DOMRectReadOnly](https://developer.mozilla.org/en-US/docs/Web/API/DOMRectReadOnly) for more information on object properties.

#### `size`
###### [number, number] - *read-only*

A picoGL instance which Grafer is using for rendering.

#### `camera`
###### Camera - *read-only*

A picoGL instance which Grafer is using for rendering.

#### `graph`
###### Graph

Returns the Graph instance currently being used for rendering, containing all of the graph data to be rendered along with associated parameters.

See [Graph](./ggraph.md) for more information.


#### `clearColor`
###### [number, number, number, number]

Get and set the background color of the graph. The color is formatted as a [vec4](https://thebookofshaders.com/glossary/?search=vec4) where each number in the array corresponds to RGBA, where each number takes a range between 0 to 1. Defaults to [0.141176471, 0.160784314, 0.2, 1.0] which corresponds to the color `#242933`.

#### `pixelRatio`
###### number - *read-only*

Retrieves the [pixel ratio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio) used by Grafer.

<br>

## Methods

### `resetContextFlags`
###### void

### `render`
###### void

Initiates a graph render.
