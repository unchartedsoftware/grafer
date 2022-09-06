# Top Level

Grafer does not have a default export. The following exports are available from grafer at the top level:

- [GraferController](#GraferController)
- [UX](#UX)
- [data](#data)
- [graph](#graph)
- [loaders](#loaders)
- [renderer](#renderer)

<br>

## Syntax

```js
import {GraferController, UX, data, graph, loaders, renderer} from '@uncharted.software/grafer';
```

<br>

## Methods

### `GraferController`

The grafer controller ingests data to be displayed in addition to any configuration options. It then uses this data to generate a graph in the canvas element provided. It is responsible for holding and allowing manipulation of the graph data to be rendered, as well as initiating rendering on demand.

See [GraferController](./grafer-controller.md) for more information.

### `UX`

The UX object contains utilities needed for a user to interface with an instance of Grafer.

See [UX](./ux.md) for more information.

### `data`

The data object contains classes and functions used by Grafer internally to manipulate point data, and also interface with JS data structures.

### `graph`

The graph object contains references to all the classes Grafer uses internally to store graph data.

See [graph](./graph.md) for more information.

### `loaders`

The loaders object contains functions which are used to parse data from different formats (such as JSONL) into a format which Grafer can ingest. There are also functions to modify and manipulate incoming data.

### `renderer`

The renderer object contains type definitions and enums related to the rendering.