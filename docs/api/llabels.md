# Labels

The Labels class is the parent class to the label type specific classes stored and used in [Layers](./layer.md#labels), all of which contain data specifying which points to render labels for, as well as label specific rendering information.

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
###### BasicEdgeData[]

An array holding all the points to render edges between. See [EdgesData](./grafer-labels-data.md#data) for more information.

#### `mappings`
###### PointDataMappings - *optional*

Data [mappings](../guides/mappings.md) are used to compute data properties at runtime using information provided in the data array. The default mappings use property names specified in the PointData datatype. See [LabelsData](./grafer-labels-data.md#data) for explanations of properties mapped.

#### `pickingManager`
###### PickingManager - *optional*

The instance of the picking manager associated with the instance of the [graph](./ggraph.md#pickingmanager---read-only).

<br>

## Properties

### `enabled`
###### boolean

A boolean determining if the labels are rendered or not.

### `nearDepth`
###### number

A number taking a range between 0 - 1 setting the label specific near depth. While it is possible to set the near depth using this property, it is not recommended as it is likely to be overwritten by [layers](./layer.md). Instead, the near depth should be set using [nearDepth](./layer.md#neardepth) and [labelsNearDepth](./layer.md#labelsneardepth).

### `farDepth`
###### number

A number taking a range between 0 - 1 setting the label specific near depth. While it is possible to set the far depth using this property, it is not recommended as it is likely to be overwritten by [layers](./layer.md). Instead, the far depth should be set using [farDepth](./layer.md#fardepth) and [labelsFarDepth](./layer.md#labelsfardepth).

### `blendMode`
###### LayerRenderableBlendMode

Determines how overlapping labels are handled by the renderer. Defaults to NORMAL.

See [LayerRenderableBlendMode](./layer-renderable-blend-mode.md) for more information.

### `picking`
###### boolean

A boolean enabling and disabling picking for labels in this class.

### `alpha`
###### number

A number taking a range between 0 - 1 which determines the transparency of labels in this class. Alpha allows elements under a given label to be rendered.

### `fade`
###### number

A number taking a range between 0 - 1 which determines the fade of labels in this class. Fade is similar to alpha except while alpha is true transparency, fade blends the label color with the background color only.

### `desaturate`
###### number

A number taking a range between 0 - 1 which determines the desaturation of labels in this class. Desaturation, which is the opposite of saturation, mutes the colors assigned to a label.

### `brightness`
###### number

A number taking a range between -1 - 1 which changes the brightness of labels in this class by adding an offset to all components (RGB) of the color value.

### `opaque` - *read only*
###### number

A boolean indicating if the labels in this class are opaque, or if they have any level of transparency.

### `labelPlacement`
###### PointLabelPlacement

An enum determining the position of the label around its node.

### `renderBackground`
###### boolean

A boolean determining if the label background should be rendered or not. If the background is rendered, the background will take the color assigned to the label, and the text take a contrasting near-black or near-white color. If the background is not rendered, then the text will use the assigned color.

### `visibilityThreshold`
###### number

A number determining the minimum distance the camera needs to be from the point associated with the node in order to render the label.

### `padding`
###### number

A number determining the offset between the label and the node its attached to.

### `halo`
###### number

A number taking a range between 0 - 1. The halo is a border around the glyphs in the label given a contrasting color relative to the color assigned to the glyph. The halo also a the side affect of increasing the character spacing.

<br>

## Methods

### `render`
###### void

Initiates a render of the labels. This method should not be called by the user. Instead if a render is desired the render function in [Viewport](./viewport.md#render), which calls this method, should be used instead.

| Parameter  | Type | Description |
| :--- | :--- | :--- |
|  context | GraferContext | Instance of the PicoGL renderer used by Grafer for rendering. |
|  mode | RenderMode | An enum specifying the render mode that should be initiated. |
|  uniforms | RenderUniforms | An object containing the uniforms to call the renderer with. |
