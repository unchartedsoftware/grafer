# PickingManager

The picking manager is responsible for providing an interface for users to interact with Grafer elements such as nodes and edges.

Grafer uses [Dekkai event-emitter](https://dekkai-data.github.io/event-emitter/) to handle events. The picking manager produces events which can be consumed my listening using the event listener available in the [GraferController](./grafer-controller.md#on).

<br>

## Constructor

### Parameters
#### `context`
###### GraferContext

Instance of the PicoGL renderer used by Grafer for rendering.

#### `mouseHandler`
###### MouseHandler

The instance of MouseHandler attached to the Grafer instance. Is used to recieve mouse events.

#### `enabled`
###### boolean - *optional*

A boolean which enables and disables the PickingManager.

<br>

## Properties

### `events`
###### PickingEventsMap

An object containing a list of events produced by the PickingManager.

See [PickingEventsMap](./picking-events-map.md) for more information.

### `offscreenBuffer`
###### OffscreenBuffer - *read only*

An instance of the OffscreenBuffer, a hidden render of the graph which is used to map pixels in the render to elements, for the purpose of picking. Internally, picking is done by sampling the OffscreenBuffer where the mouse pointer is and returning the element ID, if any, at that pixel.

The user should not need to use access this property.

### `debugRender`
###### boolean

A boolean which turns picking debug rendering on, which renders the offscreenBuffer to the screen. In this mode, elements with picking turned on will be rendered and elements with picking turned off will not be.

<br>

## Events

Events are enabled in the GraferController class. Events from the layers classes are bubbled up to the GraferController and are accessible here.

See [events](../guides/events.md) for more information on how Grafer events work.

### [hoverOn](./picking-events-map.md#hoveron)

| Parameter  | Type | Description |
| :--- | :--- | :--- |
|  type | symbol | Will always contain the [hoverOn](./picking-events-map.md#hoveron) type. |
|  output | number | Contains `id` refering to the ID of the element. |

### [hoverOff](./picking-events-map.md#hoveroff)

| Parameter  | Type | Description |
| :--- | :--- | :--- |
|  type | symbol | Will always contain the [hoverOff](./picking-events-map.md#hoveron) type. |
|  output | number | Contains `id` refering to the ID of the element. |

### [click](./picking-events-map.md#click)

| Parameter  | Type | Description |
| :--- | :--- | :--- |
|  type | symbol | Will always contain the [click](./picking-events-map.md#hoveron) type. |
|  output | number | Contains `id` refering to the ID of the element. |

### [emptyClick](./picking-events-map.md#emptyclick)

| Parameter  | Type | Description |
| :--- | :--- | :--- |
|  type | symbol | Will always contain the [emptyClick](./picking-events-map.md#emptyclick) type. |
