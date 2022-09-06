# Layer

The Layer class contains any data associated with a single layer of a graph, which on this level is composed at least one set of [nodes](./nodes.md), [edges](./edges.md), or [labels](./layer.md). In addition, some rendering options applied to this specific layer are stored here.

The user is not expected to initialize this class, however this class is likely to be accessed by the user through [Graph](./ggraph.md#layer---read-only) to directly change rendering options, or provide references to Grafer's internal data store for use in [animations](./animation-manager.md).

<br>

## Constructor

The Layer constructor takes the rendering context in addition to graph data.

### Parameters
#### `nodes`
###### Nodes<any, any>

A node class instance associated with a specific node type containing all nodes to be rendered in this layer.

#### `edges`
###### Edges<any, any>

An edge class instance associated with a specific edge type containing all edges to be rendered in this layer.

#### `labels`
###### LayerRenderable<any, any>

A label class instance associated with a specific label type containing all labels to be rendered in this layer.

#### `name`
###### string - *optional*

A name associated with this layer. The name is most useful for identifying layers in the debug menu or when iterating through the layers programmatically. Will default to `Layer`.

<br>

## Properties

#### `enabled`
###### boolean

A boolean determining if the layer is rendered or not. Will default to `true`.

#### `name`
###### string

A string associated with this layer used for identification.

#### `nodes`
###### Nodes<any, any> - *read only*

An instance of the node class associated with the layer.

#### `edges`
###### Edges<any, any> - *read only*

An instance of the edge class associated with the layer.

#### `labels`
###### Nodes<any, any> - *read only*

An instance of the node class associated with the layer.

#### `nearDepth`
###### number

A number taking a range between 0 - 1 setting the base near depth of all elements in this layer. Will default to 0. This base depth value determines the minimum value of the node, edge, and label specific near depth.

#### `farDepth`
###### number

A number taking a range between 0 - 1 setting the base far depth of all elements in this layer. Will default to 1. This base depth value determines the maximum value of the node, edge, and label specific far depth.

#### `nodesNearDepth`
###### number

A number taking a range between 0 - 1 setting the node specific near depth. Will default to 0. This node specific depth value is multiplied by the depth range (difference between near depth and far depth) then added onto the layer near depth to produce the near depth applied to nodes in this layer.

#### `nodesFarDepth`
###### number

A number taking a range between 0 - 1 setting the node specific far depth. Will default to 1. This node specific depth value is multiplied by the depth range (difference between near depth and far depth) then added onto the layer far depth to produce the near depth applied to nodes in this layer.

#### `edgesNearDepth`
###### number

A number taking a range between 0 - 1 setting the edge specific near depth. Will default to 0. This edge specific depth value is multiplied by the depth range (difference between near depth and far depth) then added onto the layer near depth to produce the near depth applied to edges in this layer.

#### `edgesFarDepth`
###### number

A number taking a range between 0 - 1 setting the edge specific far depth. Will default to 1. This edge specific depth value is multiplied by the depth range (difference between near depth and far depth) then added onto the layer far depth to produce the near depth applied to edges in this layer.

#### `labelsNearDepth`
###### number

A number taking a range between 0 - 1 setting the label specific near depth. Will default to 0. This label specific depth value is multiplied by the depth range (difference between near depth and far depth) then added onto the layer near depth to produce the near depth applied to labels in this layer.

#### `labelsFarDepth`
###### number

A number taking a range between 0 - 1 setting the label specific far depth. Will default to 1. This label specific depth value is multiplied by the depth range (difference between near depth and far depth) then added onto the layer far depth to produce the near depth applied to labels in this layer.

<br>

## Methods

### `render`
###### void

Initiates a render of the layer. This method should not be called by the user. Instead if a render is desired the render function in [Viewport](./viewport.md#render), which calls this method, should be used instead.

| Parameter  | Type | Description |
| :--- | :--- | :--- |
|  context | GraferContext | Instance of the PicoGL renderer used by Grafer for rendering. |
|  mode | RenderMode | An enum specifying the render mode that should be initiated. |
|  uniforms | RenderUniforms | An object containing the uniforms to call the renderer with. |
