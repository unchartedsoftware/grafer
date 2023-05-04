# GraferLabelsData

<br>

## Properties

### `type`
###### string - *optional*

A string indicating the type of label to render. Renders the "PointLabel" type by default. The following label types are available:

- "PointLabel"
- "CircularLabel"
- "RingLabel"

See [label types]() for more information.

### `data`
###### LabelData[] - *optional*

An array of label objects to be rendered as part of this layer.

| Property  | Type | Description |
| :--- | :--- | :--- |
| id | number \| string - *optional* | Name of the label. Will default to its index if left out. |
| point | number \| string | Name of the point to pull positional and radius data from. Defaults to index of the label if left out. |
| fontSize | number | Font size of the label. |
| label | string | Label string to be rendered. All UTF-8 characters are valid but colored characters will be rendered in black & white. In addition unusually tall characters will be cut off. |

### `mappings`

Data [mappings](../guides/mappings.md) are used to compute data properties at runtime using information provided in the data array. The default mappings use property names specified in the LabelData datatype. See data property for explanations of properties mapped.

### `options`
###### { [key: string]: any } - *optional*

An object containing configuration options for the labels.

| Property  | Type | Description |
| :--- | :--- | :--- |
| enabled | boolean | Hides or shows the layer. |
| blend-mode | LayerRenderableBlendMode | Changes blend mode used to render nodes. See [LayerRenderableBlendMode](./layer-renderable-blend-mode.md) for more information. |
| pixelSizing | boolean | Locks size of node rendered to pixel `size` specified in label data. |
| billboard | boolean | Enables and disables label [billboarding](http://www.opengl-tutorial.org/intermediate-tutorials/billboards-particles/billboards/) when 3D rendering is enabled. |
| alpha | number | Takes a range between 0 to 1. Defaults to 1. |
| fade | number | Takes a range between 0 to 1. Defaults to 0. |
| desaturate | number | Takes a range between 0 to 1. Defaults to 0. |
| brightness | number | Takes a range between -1 to 1. Defaults to 0. |
| nearDepth | number | Takes a range between 0 to 1. Defaults to 0. Controls camera near depth. |
| farDepth | number | Takes a range between 0 to 1. Defaults to 1. Controls camera far depth. |
| labelPlacement | PointLabelPlacement | Changes the label placement relative to the node. Defaults to CENTER. See [PointLabelPlacement](./point-label-placement.md) for more information. |
| renderBackground | boolean | Renders a rectangular background around the label. Defaults to true. |
| visibilityThreshold | number | Determines the minimum distance the camera needs to be from the point associated with the node in order to render. The lower the number the further away the minimum distance is. Defaults to 15. |
| font | string | The name of the font to be used by labels in this layer. Note that the font must be loaded before data using the font is loaded in Grafer. Defaults to monospace. |
| bold | boolean | Determines if the label is rendered with a bolded font. Defaults to false. |
| padding | number | Determines the offset between the label and the node its attached to. Defaults to 4. |
| halo | number | Takes a range between 0 to 1. Determines the width of the halo around glyphs in the label. Defaults to 0. |
