# GraferControllerData

This datatype is an object holding data needed to generate the graph, including a list of layers containing graph data, assets referenced by the graph data such as colors and textures, and options applying to all layers.

<br>

## Properties

### `textures`
###### string[] - *optional*

An array of image source strings to be loaded into Grafer as textures. Source strings can be relative paths or absolute paths. Used by custom node type only.

### `colors`
###### GraferInputColor[] - *optional*

An array of GraferInputColor data representing a list of colours which can be referenced by nodes, edges, and labels.

See [GraferInputColor](./grafer-input-color.md) for more information.

### `points`
###### GraferPointsData - *optional*

An array of objects representing points, each containing at the minimum an id, and 2D/3D coordinates. Nodes, edges, and labels in each layer reference points specified here using the id provided to retrieve node information, reducing duplication of data.

Note that this can be omitted when drawing a graph, however this will change the way `layers` is parsed. In most cases it will limit the features available to the user.

See [GraferPointsData](./grafer-points-data.md) for more information.

### `layers`
###### GraferLayerData[] - *optional*

An array of objects each representing one layer. Each layer is drawn on the canvas in the order provided.

See [GraferLayerData](./grafer-layer-data.md) for more information.

<br>

## Syntax

```js
const graferControllerData = {
    colors: [
        'white',
        '#bf616a',
    ],
    textures: [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Tokugawa_family_crest.svg/1920px-Tokugawa_family_crest.svg.png'
    ],
    points: {
        data: [
            {
                id: 'node 1',
                x: 0,
                y: 10,
                radius: 1,
            },
            {
                id: 'node 2',
                x: 0,
                y: 0,
                radius: 1,
            },
        ],
    },
    layers: [{
        nodes: {
            type: 'Custom',
            data: [
                {
                    point: 'node 1',
                    color: 0,
                    texture: 0,
                },
                {
                    point: 'node 2',
                    color: 1,
                    texture: 0,
                },
            ],
        },
    }],
};
```