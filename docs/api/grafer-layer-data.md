# GraferLayerData

This datatype is an object holding data for a single layer, which consists of at least one node property, edge property, or label property, in addition to corresponding parameters and options. It is not valid to omit all three data properties.

<br>

## Properties

<!-- #### `id`
###### number | string - *optional*

Unused property. -->

### `name`
###### string - *optional*

An identifier unique to layer, used to manipulate layer after initiation. If none is provided, then a default name will be given `Layer_i` where `i` is the index of the layer in the layer list.

### `nodes`
###### GraferNodesData - *optional*

An object containing node data along with related option data.

See [GraferNodesData](./grafer-nodes-data.md) for more information.


### `edges`
###### GraferEdgesData - *optional*

An object containing edge data along with related option data.

See [GraferEdgesData](./grafer-edges-data.md) for more information.


### `labels`
###### GraferLabelsData - *optional*

An object containing label data along with related option data.

See [GraferLabelsData](./grafer-labels-data.md) for more information.

### `options`

An object containing configuration options for the layer.

| Property  | Type | Description |
| :--- | :--- | :--- |
| enabled | boolean | Hides or shows the layer. |
| nearDepth | number | Takes a range between 0 - 1. Defaults to 0. Controls camera near depth. |
| farDepth | number | Takes a range between 0 - 1. Defaults to 1. Controls camera far depth. |
