# GraferEdgesData

<br>

## Properties

### `type`
###### string - *optional*

A string indicating the type of edge to render. Renders the "Straight" type by default. The following node types are available:

- "CurvedPath"
- "Straight"
- "Dashed"
- "Gravity"
- "StraightPath"
- "ClusterBundle"

See [edge types]() for more information.

### `data`
###### BasicEdgeData[] - *optional*

An array of edge objects to be rendered as part of this layer.

| Property  | Type | Description |
| :--- | :--- | :--- |
| id | number \| string - *optional* | Name of the edge. Will default to its index if left out. |
| source |  number \| string | Index of the node which the edge starts at in either the points array or the node array. Note that it is not recommended to omit the points array if more than one layer is used. |
| target |  number \| string | Index of the node which the edge ends at in either the points array or the node array. Note that it is not recommended to omit the points array if more than one layer is used. |
| sourceColor | GraferInputColor - *optional* | Color of the start point of the edge given as a [GraferInputColor](./grafer-input-color.md). A linear gradient will be generated between the start and end points of the edge using the SourceColor and TargetColor provided. |
| targetColor | GraferInputColor - *optional* | Color of the end point of the edge given as a [GraferInputColor](./grafer-input-color.md). A linear gradient will be generated between the start and end points of the edge using the SourceColor and TargetColor provided. |
| control | number \| number[] | Only valid for "StraightPath" and "CurvedPath" edge types. Ordered list of control (waypoint) nodes between the source and the target. If valid, cannot be left undefined. |
| sourceCluster | number \| string | Only valid for "ClusterBundling" edge types. ID of source point used to make edge path for cluster bundling. |
| targetCluster | number \| string | Only valid for "ClusterBundling" edge types. ID of target point used to make edge path for cluster bundling. |
| width | number - *optional* | Width of the edge. Will default to 1.5. |
| dashLength | number - *optional* | Only valid for "Dashed" edge types. Changes the length of the dash. Will default to 10. |
| gravity | number - *optional* | Only valid for "Gravity" edge types. Changes the gravity strength. Will default to -0.2. |

### `mappings`
###### EdgeDataMappings - *optional*

Data [mappings](../guides/mappings.md) are used to compute data properties at runtime using information provided in the data array. The default mappings use property names specified in the BasicEdgeData datatype. See data property for explanations of properties mapped.

### `options`
###### { [key: string]: any } - *optional*

An object containing configuration options for the edges.

| Property  | Type | Description |
| :--- | :--- | :--- |
| enabled | boolean | Hides or shows the layer. |
| blend-mode | LayerRenderableBlendMode | Changes blend mode used to render nodes. See [LayerRenderableBlendMode](./layer-renderable-blend-mode.md) for more information. |
| alpha | number | Takes a range between 0 to 1. Defaults to 1. |
| fade | number | Takes a range between 0 to 1. Defaults to 0. |
| desaturate | number | Takes a range between 0 to 1. Defaults to 0. |
| brightness | number | Takes a range between -1 to 1. Defaults to 0. |
| nearDepth | number | Takes a range between 0 to 1. Defaults to 0. Controls camera near depth. |
| farDepth | number | Takes a range between 0 to 1. Defaults to 1. Controls camera far depth. |
| pickingWidth | number | Sets the width of the edge picking area in the layer where applicable, as a multiplier of the edge `width`. Defaults to 8. |
