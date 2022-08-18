
# [Drawing a Basic Graph](../../examples/src/quickstart/quickstart-1.ts)

In the first step, we will focus on just getting the data on the screen, to quickly get an idea about what we are dealing with. Thus we aim to write the minimum required code to parse the dataset and generate the visualization.

Thus, we will parse the node and edge lists into [GraferNodesData](../api/grafer-nodes-data.md), [GraferEdgesData](../api/grafer-edges-data.md), and [GraferLabelsData](../api/grafer-edges-data.md) objects.

The node list provides the x and y coordinates using the properties `x` and `y`, which means that the `nodesArray` can be simply assigned to [data](../api/grafer-nodes-data.md#data) and Grafer will parse the relevant information out.

```ts
const nodes: GraferNodesData = {
    data: nodesArray,
};
```

Unfortunately, the properties used in the edge list do not correspond with the [edge data properties](../api/grafer-edges-data.md#data) that Grafer is looking for. Thus, in addition to assigning the edge list to the `data` property as done above, we must also instruct Grafer on how to compute the properties it requires using [mappings](./mappings.md). Reminder that because we are omitting the points then we must reference the index of the desired node in the node list when specifying edge source and target.

```ts
const edges = {
    data: edgesArray,
    mappings: {
        source: (datum): number =>
            nodesArray.findIndex((node) => node.name === datum.departure_airport),
        target: (datum): number =>
            nodesArray.findIndex((node) => node.name === datum.arrival_airport),
    },
};
```

Finally, we can produce the GraferLabelsData object, again using the `nodesArray`. A mapping will be used to map the airport name to the node label. The [labelPlacement](../api/grafer-labels-data.md#options) is set to render the label above the node, so that the label is not obscured by the node itself.

```ts
const labels = {
    data: nodesArray,
    mappings: {
        label: (datum): string => datum.name,
    },
    options: {
        labelPlacement: graph.labels.PointLabelPlacement.TOP,
    },
};
```

These 3 objects are then combined into a single [layer object](../api/grafer-layer-data.md), which is then fed into the [GraferController constructor](../api/grafer-controller.md#constructor), along with an HTML canvas element to render the graph in. At this point a graph should be sucessfully rendered.

```ts
const layers = [
    { nodes, edges, labels },
];

const controller = new GraferController(canvas, { layers });
```

Finally, it is recommended during development to keep the [DebugMenu](../api/debug-menu.md) enabled, which provides visibility into the graph data being rendered, as well as provide access to a multitude of rendering options.

```ts
new UX.DebugMenu(controller.viewport);
```

<br>

[Prev Page](./quickstart-0.md) - [Next Page](./quickstart-2.md)