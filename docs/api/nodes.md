# Nodes

The Nodes class is the parent class to the node type specific classes stored and used in [Layers](./layer.md#nodes), all of which contain data specifying which points to render nodes for, as well as node specific rendering information.

The user is not expected to initialize this class, however this class is likely to be accessed by the user through the [Viewport](./viewport.md#graph) to directly change rendering options, or provide references to Grafer's internal data store for use in [animations](./animation-manager.md).

<br>

## Constructor

### Parameters
#### `context`
###### GraferContext

Instance of the PicoGL renderer used by Grafer for rendering.

#### `graph`
###### Graph

The instance of the [Graph](./ggraph.md) class which the Node class is a child of.

#### `data`
###### BasicNodeData[]

An array holding all the points to render nodes for. See [NodesData](./grafer-nodes-data.md#data) for more information.

#### `mappings`
###### PointDataMappings - *optional*

Data [mappings](../guides/mappings.md) are used to compute data properties at runtime using information provided in the data array. The default mappings use property names specified in the PointData datatype. See [NodesData](./grafer-nodes-data.md#data) for explanations of properties mapped.

#### `pickingManager`
###### PickingManager - *optional*

The instance of the picking manager associated with the instance of the [graph](./ggraph.md#pickingmanager---read-only).

<br>

## Properties

### `enabled`
###### boolean

A boolean determining if the nodes are rendered or not.

### `nearDepth`
###### number

A number taking a range between 0 - 1 setting the node specific near depth. While it is possible to set the near depth using this property, it is not recommended as it is likely to be overwritten by [layers](./layer.md). Instead, the near depth should be set using [nearDepth](./layer.md#neardepth) and [nodesNearDepth](./layer.md#nodesneardepth).

### `farDepth`
###### number

A number taking a range between 0 - 1 setting the node specific near depth. While it is possible to set the far depth using this property, it is not recommended as it is likely to be overwritten by [layers](./layer.md). Instead, the far depth should be set using [farDepth](./layer.md#fardepth) and [nodesFarDepth](./layer.md#nodesfardepth).

### `blendMode`
###### LayerRenderableBlendMode

Determines how overlapping nodes are handled by the renderer. Defaults to NORMAL.

See [LayerRenderableBlendMode](./layer-renderable-blend-mode.md) for more information.

### `picking`
###### boolean

A boolean enabling and disabling picking for nodes in this class.

### `alpha`
###### number

A number taking a range between 0 - 1 which determines the transparency of nodes in this class. Alpha allows elements under a given node to be rendered.

### `fade`
###### number

A number taking a range between 0 - 1 which determines the fade of nodes in this class. Fade is similar to alpha except while alpha is true transparency, fade blends the node color with the background color only.

### `desaturate`
###### number

A number taking a range between 0 - 1 which determines the desaturation of nodes in this class. Desaturation, which is the opposite of saturation, mutes the colors assigned to a node.

### `brightness`
###### number

A number taking a range between -1 - 1 which changes the brightness of nodes in this class by adding an offset to all components (RGB) of the color value.

### `opaque` - *read only*
###### number

A boolean indicating if the nodes in this class are opaque, or if they have any level of transparency.

### `pixelSizing`
###### boolean

A boolean locking the size of node rendered to pixel `size` specified in label data.

### `billboard`
###### boolean

A boolean determining if the nodes in this class use [billboarding](http://www.opengl-tutorial.org/intermediate-tutorials/billboards-particles/billboards/) when 3D rendering is enabled.

### `outline`
###### number

A number changing the width of the node border.

<br>

## Methods

### `render`
###### void

Initiates a render of the nodes. This method should not be called by the user. Instead if a render is desired the render function in [Viewport](./viewport.md#render), which calls this method, should be used instead.

| Parameter  | Type | Description |
| :--- | :--- | :--- |
|  context | GraferContext | Instance of the PicoGL renderer used by Grafer for rendering. |
|  mode | RenderMode | An enum specifying the render mode that should be initiated. |
|  uniforms | RenderUniforms | An object containing the uniforms to call the renderer with. |
