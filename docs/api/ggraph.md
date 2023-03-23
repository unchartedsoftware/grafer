# Graph

The Graph class contains any data associated with a single graph, which on this level is composed of a series of [layers](./layer.md), each of which can be decomposed further into nodes, edges, and labels. In addition, the state of the camera and various features associated with the graph such as picking are also stored here. The 

The user is not expected to initialize this class, however this class is likely to be accessed by the user through the [Viewport](./viewport.md#graph) to directly change rendering options, or provide references to Grafer's internal data store for use in [animations](./animation-manager.md).

<br>

## Constructor

The Graph constructor takes the rendering context in addition to graph data.

### Parameters
#### `context`
###### GraferContext

Instance of the PicoGL renderer used by Grafer for rendering.

#### `data`
###### PointData[]

An array holding data for all the points present in the graph.

See [PointData](./grafer-points-data.md#pointdata---optional) for more information.

#### `mappings`
###### PointDataMappings - *optional*

Data [mappings](../guides/mappings.md) are used to compute data properties at runtime using information provided in the data array. The default mappings use property names specified in the PointData datatype.

See [PointData](./grafer-points-data.md#pointdata---optional) for explanations of properties mapped.

<br>

## Properties

#### `events`
###### GraphEventsMap - *read only*

#### `enabled`
###### boolean

A boolean determining if the graph is rendered or not. Will default to `true`.

#### `picking`
###### PickingManager - *read only*

An instance of the PickingManager used by the graph.

#### `matrix`
###### mat4 - *read only*

A 16 element array or [Float32Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float32Array) containing all the information specifying the state of the camera. These include translational, rotational, and scale (zoom) data.

#### `layers`
###### Layer[] - *read only*

An array of [Layer]() data containing information specifying the graph to be rendered. This property will be accessed if the user wishes to dive deeper into the internal graph data Grafer stores.

#### `rotation`
###### quat - *read only*

A 4 element array or [Float32Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float32Array) specifying the rotational state of the camera.

#### `translation`
###### vec3

A 3 element array or [Float32Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float32Array) specifying the translational state of the camera.

#### `scale`
###### number

A number specifying the scale (zoom) state of the camera.

<br>

## Methods

### `render`
###### void

Initiates a render of the graph. This method should not be called by the user. Instead if a render is desired the render function in [Viewport](./viewport.md#render), which calls this method, should be used instead.

| Parameter  | Type | Description |
| :--- | :--- | :--- |
|  context | GraferContext | Instance of the PicoGL renderer used by Grafer for rendering. |
|  mode | RenderMode | An enum specifying the render mode that should be initiated. |
|  uniforms | RenderUniforms | An object containing the uniforms to call the renderer with. |

### `resize`
###### void

| Parameter  | Type | Description |
| :--- | :--- | :--- |
|  context | GraferContext | Instance of the PicoGL renderer used by Grafer for rendering. |

### `rotate`
###### void

| Parameter  | Type | Description |
| :--- | :--- | :--- |
|  rotation | quat | Specifies the rotation of the camera from the current rotational state of the camera. |

### `translate`
###### void

| Parameter  | Type | Description |
| :--- | :--- | :--- |
| translation | vec3 | Specifies the translation of the camera from the current translational state of the camera. |

### `addLayer`
###### void

| Parameter  | Type | Description |
| :--- | :--- | :--- |
| layer | Layer | Layer to be added onto the graph at the top of the layers array. |

### `addLayerAt`
###### void

| Parameter  | Type | Description |
| :--- | :--- | :--- |
| layer | Layer | Layer to be added onto the graph at the index specified to the layers array. |
| index | number | Index to place the layer at. |

### `removeLayer`
###### void

| Parameter  | Type | Description |
| :--- | :--- | :--- |
| layer | Layer | A reference to the layer to be removed. |

### `removeLayerAt`
###### void

| Parameter  | Type | Description |
| :--- | :--- | :--- |
|  index  | number | Index of the layer to be removed from the graph. |

### `getPointIndex`
###### number

Returns index of the point associated with a given point ID. If index is not found for a given ID, returns undefined.

| Parameter  | Type | Description |
| :--- | :--- | :--- |
|  id  | string \| number | ID of the point to look up. |

### `getPointByIndex`
###### [number, number, number, number]

Returns point data, looking up the point by index. The output array numbers correspond to: x-coordinate, y-coordinate, z-coordinate, and radius, respectively.

| Parameter  | Type | Description |
| :--- | :--- | :--- |
|  index  | number | Index of the point. |

### `getPointByID`
###### [number, number, number, number]

Returns point data, looking up the point by ID. The output array numbers correspond to: x-coordinate, y-coordinate, z-coordinate, and radius, respectively.

| Parameter  | Type | Description |
| :--- | :--- | :--- |
|  id  | string \| number | ID of the point. |

### `setPointByIndex`
###### void

Modifies existing point data, looking up the point by index.

| Parameter  | Type | Description |
| :--- | :--- | :--- |
|  index  | number | Index of the point. |
|  data  | PointData[] | List of points to be added to the graph. See [GraferPointsData](./grafer-points-data.md#data) for more information on the PointData type. |
|  mappings  | PointDataMappings | See [PointDataMappings](./grafer-points-data.md#mappings) for more information on PointDataMappings type. |

### `setPointByID`
###### void

Returns point data, looking up the point by ID.

| Parameter  | Type | Description |
| :--- | :--- | :--- |
|  id  | string \| number | ID of the point. |
|  data  | PointData[] | List of points to be added to the graph. See [GraferPointsData](./grafer-points-data.md#data) for more information on the PointData type. |
|  mappings  | PointDataMappings | See [PointDataMappings](./grafer-points-data.md#mappings) for more information on PointDataMappings type. |

### `addPoints`
###### void

| Parameter  | Type | Description |
| :--- | :--- | :--- |
|  data  | PointData[] | List of points to be added to the graph. See [GraferPointsData](./grafer-points-data.md#data) for more information on the PointData type. |
|  mappings  | PointDataMappings | See [PointDataMappings](./grafer-points-data.md#mappings) for more information on PointDataMappings type. |