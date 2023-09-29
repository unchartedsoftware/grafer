# GraferPointsData

This datatype is an object containing both an array of point data and an object with data mappings.

<br>

## Properties

### `data`
###### PointData[] - *optional*

An array of point objects to be loaded into Grafer. The PointData property list is given below:

| Property  | Type | Description |
| :--- | :--- | :--- |
|  id  | string - *optional* | Name of the point. Will be used as an ID when referencing point in node, edge, and label data. Will default to its index in the PointData array if left out. |
|  parentId  | string - *optional* | ID of the point which this point is the child of. Used to enable relative positioning of points and relative radius. Will default to *No Parent* if left out.
|  x  | number | X-Coordinate of the point. |
|  y  | number | Y-Coordinate of the point. |
|  z  | number - *optional* | Z-Coordinate of the point. Will default to 0 if left out. |
|  radius  | number - *optional* | Z-Coordinate of the point. Will default to 0 if left out. |

### `mappings`
###### PointDataMappings - *optional*

Data [mappings](../guides/mappings.md) are used to compute properties at runtime using information provided in the data array. The default mappings use property names specified in the PointData datatype. See data property for explanations of properties mapped.

| Property  | Type | Description |
| :--- | :--- | :--- |
|  id  | (datum: PointData) => string - *optional* | |
|  parentId  | (datum: PointData) => string - *optional* | |
|  x  | (datum: PointData) => number - *optional* | |
|  y  | (datum: PointData) => number - *optional* | |
|  z  | (datum: PointData) => number - *optional* | |
|  radius  | (datum: PointData) => number - *optional* | |

### `options`
###### { [key: string]: any } - *optional*

An object containing configuration options for the points.

| Property  | Type | Description |
| :--- | :--- | :--- |
| positionHierarchyType | HierarchyTypes | Changes how point hierarchies changes the point positions. See [HierarchyTypes](./hierarchy-types.md) for more information. |
| radiusHierarchyType | HierarchyTypes | Changes how point hierarchies changes the point radius. See [HierarchyTypes](./hierarchy-types.md) for more information. |
| maxHierarchyDepth | number | Sets the maximum hierarchy depth that any point will have. Defaults to 100. |
