
# [Using Points](../../examples/src/quickstart/quickstart-2.ts)

This guide builds upon the code produced in the [previous step](../../examples/src/quickstart/quickstart-1.ts).

It is prudent at this point to switch to using points with Grafer, which will make it easier to use some of Grafer's more advanced features by allowing us to reference the same point in the node, edge, and label data objects using a point ID. In addition, these point ID references can be safely used across layers.

We can build a [points data object](../api/grafer-points-data.md) as follows, mapping the airport name to the point ID.

```ts
const points = {
    data: nodesArray,
    mappings: {
        id: (datum): string => datum.name,
    },
};
```

Now we can change the node, edge, and label objects so that the data reference points using the point ID.

```ts
const nodes = {
    data: nodesArray,
    mappings: {
        point: (datum): string => datum.name,
    },
};

const edges = {
    data: edgesArray,
    mappings: {
        source: (datum): number => datum.departure_airport,
        target: (datum): number => datum.arrival_airport,
    },
};

const labels = {
    data: nodesArray,
    mappings: {
        point: (datum): string => datum.name,
        label: (datum): string => datum.name,
    },
    options: {
        labelPlacement: graph.labels.PointLabelPlacement.TOP,
    },
};
```

<br>

[Prev Page](./quickstart-1.md) - [Next Page](./quickstart-3.md)