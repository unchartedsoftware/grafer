# GraferController

The Grafer controller ingests data to be displayed in addition to configuration options. It then uses this data to generate a graph in the canvas element provided. It is responsible for holding and allowing manipulation of the graph to be rendered, as well as initiating rendering on demand.

<br>

## Constructor

The GraferController constructor ingests graph data in addition to configuration options.

### Parameters
#### `element`
###### HTMLElement \| HTMLCanvasElement

An HTML element which Grafer will render the graph into. If a canvas element is provided Grafer will render into that, otherwise a canvas element will be created as a child of the provided HTML element.

**Warning**: Grafer assumes that the dimensions of the canvas element, whether it be created by the user or by Grafer, will be limited by either the CSS properties of the canvas itself, or the parent of the canvas. In other words, the canvas size should not be able to effect the dimensions of its parent element.

Note that this requirement is not met by using a grid item as the parent without limiting the ability of the grid element to overflow the grid. Neither is it met using a flex item as the parent without limiting the ability of the flex item to overflow its bounds. In either case, this can be fixed by adding the CSS property `min-[height/width]: 0` to the parent. See [here](https://css-tricks.com/preventing-a-grid-blowout/) for more information on grid behaviour and [here](https://css-tricks.com/preventing-a-grid-blowout/) for more information on flex behaviour.

Failure to meet this requirement can result in unexpected behaviour from Grafer, such as infinite growth of the canvas dimensions.

#### `data`
###### GraferControllerData

An object holding the information needed to render the graph, including an array of layers, each composed of lists of nodes, edges, and labels. See [GraferControllerData](./grafer-controller-data.md) for more information.

#### `options`
###### GraferControllerOptions - *optional*

An object containing options specifying how the renderer operates. See [GraferControllerOptions](./grafer-controller-options.md) for more information.

<br>

## Properties

### `viewport`
###### Viewport - *read only*

Returns the viewport instance associated with this Grafer controller instance. See [Viewport](./viewport.md) for more information.

### `context`
###### GraferContext - *read only*

Instance of the PicoGL renderer used by Grafer for rendering.

### `hasColors`
###### boolean - *read only*

Indication of whether a colors array was provided to the grafer controller during initialization.

### `interactionModules`
###### InteractionModules - *read only*

Contains references to instances of all interaction modules active on the graph. Interaction modules are the classes responsible for moving the camera. A 2D camera requires different interaction modules compared to a 3D camera. See [InteractionModules](./interaction-modules.md) for more information.

<br>

## Methods

### `render`
###### void

Initiates a graph render using the [viewport method](./viewport.md#render).

### `addLayer`
###### void

| Parameter  | Type | Description |
| :--- | :--- | :--- |
|  layerData  | GraferLayerData | An object containing lists of nodes, edges, and labels. See [GraferLayerData](./grafer-layer-data.md) for more information. |
|  name  | string | A string serving as an identifier for the layer to be added. Should be unique. |
|  useColors  | boolean - *optional* | A boolean indicating if the nodes, edges, and labels in the layer should use colors stored in the grafer controller during rendering, otherwise use colors specified in the layer data. |

### `removeLayerByName`
###### void

| Parameter  | Type | Description |
| :--- | :--- | :--- |
|  name  | string | Name of the layer to be removed from the graph. |

### `removeLayerByIndex`
###### void

| Parameter  | Type | Description |
| :--- | :--- | :--- |
|  index  | number | Index of the layer to be removed from the graph. |

<br>

## Events

Events are enabled in the GraferController class. Events from the layers classes are bubbled up to the GraferController and are accessible here.

See [events](../guides/events.md) for more information on how Grafer events work.

### [hoverOn](./picking-events-map.md#hoveron)

| Parameter  | Type | Description |
| :--- | :--- | :--- |
|  type | symbol | Will always contain the [hoverOn](./picking-events-map.md#hoveron) type. |
|  output | object | An object containing information about the element triggering the event. Contains `id` refering to the ID of the element, `layer` refering to the [name](./grafer-layer-data.md#name) of the layer producing the event, and `type` refering to the type of Grafer element producing the event which is a `node`, `edge`, or `label` string. |

### [hoverOff](./picking-events-map.md#hoveroff)

| Parameter  | Type | Description |
| :--- | :--- | :--- |
|  type | symbol | Will always contain the [hoverOff](./picking-events-map.md#hoveron) type. |
|  output | object | An object containing information about the element triggering the event. Contains `id` refering to the ID of the element, `layer` refering to the [name](./grafer-layer-data.md#name) of the layer producing the event, and `type` refering to the type of Grafer element producing the event which is a `node`, `edge`, or `label` string. |

### [click](./picking-events-map.md#hoveron)

| Parameter  | Type | Description |
| :--- | :--- | :--- |
|  type | symbol | Will always contain the [click](./picking-events-map.md#hoveron) type. |
|  output | object | An object containing information about the element triggering the event. Contains `id` refering to the ID of the element, `layer` refering to the [name](./grafer-layer-data.md#name) of the layer producing the event, and `type` refering to the type of Grafer element producing the event which is a `node`, `edge`, or `label` string. |

<br>

## Syntax

```js
const graferController = new GraferController(canvas, { layers }, {
    viewport: {
        camera: {
            mode: CameraMode['3D'],
        },
    },
});
```
