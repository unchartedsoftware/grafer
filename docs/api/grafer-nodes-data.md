# GraferNodesData

<br>

## Properties

### `type`
###### string - *optional*

A string indicating the type of node to render. Renders the "Circle" type by default. The following node types are available:

- "Circle"
- "Ring"
- "Triangle" 
- "Pentagon"
- "Octagon"
- "Star"
- "Cross"
- "Plus"
- "Box"
- "Custom"

### `data`
###### BasicNodeData[] - *optional*

An array of node objects to be rendered as part of this layer. Note that the data properties which are consumed by Grafer vary drastically depending on whether a points array is present in the [Grafer controller data](./grafer-controller-data.md) or not. Property lists for both cases will be given.

#### **Points Array Present**

| Property  | Type | Description |
| :--- | :--- | :--- |
| id | number \| string - *optional* | Name of the node. Will default to its index in the PointData array if left out. |
| point | number \| string | Name of the point to pull positional and radius data from. |
| color | number | Color of the node given as either index of desired color in [color array](./grafer-controller-data.md#colors) or [GraferInputColor](./grafer-input-color.md) |
| texture | number - *optional* | Only valid for "Custom" node types. Texture of the node given as index to desired texture. Will default to 0 if left out. |
| radius | number - *optional* | Radius of node. |

#### **Points Array Omitted**

| Property  | Type | Description |
| :--- | :--- | :--- |
| id | number \| string - *optional* | Name of the node. Will default to its index in the PointData array if left out. |
| x | number | X-Coordinate of the point.  |
| y | number | Y-Coordinate of the point. |
| z | number - *optional* | Z-Coordinate of the point. Will default to 0 if left out. |
| color | number \| GraferInputColor - *optional* | Color of the node given as either index of desired color in [color array](./grafer-controller-data.md#colors) or [GraferInputColor](./grafer-input-color.md) |
| texture | number - *optional* | Only valid for "Custom" node types. Texture of the node given as index to desired texture. Will default to 0 if left out. |
| radius | number - *optional* | Radius of node. |

### `mappings`
###### NodeDataMappings - *optional*

Data [mappings](../guides/mappings.md) are used to compute data properties at runtime using information provided in the data array. The default mappings use property names specified in the BasicNodeData datatype. See data property for explanations of properties mapped.

### `options`
###### { [key: string]: any } - *optional*

An object containing configuration options for the nodes.

| Property  | Type | Description |
| :--- | :--- | :--- |
| enabled | boolean | Hides or shows the layer. |
| blend-mode | LayerRenderableBlendMode | Changes blend mode used to render nodes. See [LayerRenderableBlendMode](./layer-renderable-blend-mode.md) for more information. |
| pixelSizing | boolean | Locks size of node rendered to pixel `size` specified in node data. |
| billboard | boolean | Enables and disables node [billboarding](http://www.opengl-tutorial.org/intermediate-tutorials/billboards-particles/billboards/) when 3D rendering is enabled. |
| alpha | number | Takes a range between 0 to 1. Defaults to 1. |
| fade | number | Takes a range between 0 to 1. Defaults to 0. |
| desaturate | number | Takes a range between 0 to 1. Defaults to 0. |
| brightness | number | Takes a range between -1 to 1. Defaults to 0. |
| nearDepth | number | Takes a range between 0 to 1. Defaults to 0. Controls camera near depth. |
| farDepth | number | Takes a range between 0 to 1. Defaults to 1. Controls camera far depth. |
