
# [Decorating the Graph](../../examples/src/quickstart/quickstart-3.ts)

This guide builds upon the code produced in the [previous step](../../examples/src/quickstart/quickstart-2.ts).

In the third step, we will focus on encoding more of the information available in the node and edge lists as properties of the graph we are rendering, allowing us to increase the amount of information available in the visualization.

We can start by mapping the number of flights handled by the airport to the size of the node representing each airport. This is done in the points data object, since nodes, edges, and labels, need to know the radius of a point to be rendered.

The total flights value is mapped logarithmically to reasonably limit the growth of node size.

```ts
const points = {
    data: nodesArray,
    mappings: {
        id: (datum): string => datum.name,
        radius: (datum): number =>
            datum.total_flights && (0.25 * Math.log10(datum.total_flights) + 0.25),
    },
};
```

The nodes types are switched from the default "Circle" node type to the "Ring" type, which allows us to see edges which cross behind any given node. In addition, the alpha value is also set at 0.3, increasing node transparency for the same reason.

```ts
const nodes = {
    type: 'Ring',
    data: nodesArray,
    mappings: {
        point: (datum): string => datum.name,
    },
    options: {
        alpha: 0.3,
    },
};
```

We can use color to encode the amount of traffic travelling along an edge between two airports.

For this purpose, we first need to create a color array. The first value will hold the color given to elements by default, in this case given to all nodes and labels as no color value will be specified in either. Following that is a series of 4 colors, sampled from a gradient between blue and red. Note that in this case we know that 4 colors is sufficient due to knowledge of the data being ingested and the mapping function, which will be specified later. For our purposes blue will represent low traffic and red will represent high traffic. These colors will be used to color the edges.

```ts
const colors = [
    // node and label color
    '#ffffff',
    // edge colors
    '#3300cc', '#660099', '#990066', '#cc0033',
];
```

Some changes need to be made to the edges data object in order to take advantage of the new colors added. Two new mappings are added, `sourceColor` and `targetColor`. These mappings must return an integer value between 1 - 4, corresponding to the colors in the color array intended for use with the edges. The traffic data is mapped logarithmically to reduce the number of colors needed to cover the wide range of values present in the traffic data.

In addition, the alpha of the edge is set to 0.5 so that stacking edges do not completely obscure one another, and the line width is also increased to increase edge visibility.

```ts
const edges = {
    data: edgesArray,
    mappings: {
        source: (datum): number => datum.departure_airport,
        sourceColor: (datum): number => (datum.num_flights && Math.floor(Math.log10(datum.num_flights))) + 1,
        target: (datum): number => datum.arrival_airport,
        targetColor: (datum): number => (datum.num_flights && Math.floor(Math.log10(datum.num_flights))) + 1,

    },
    options: {
        alpha: 0.5,
        lineWidth: 3,
    },
};
```

For labels, the font size is decreased to reduce the amount of space taken up by the label. This is done by providing a mapping which returns a constant. In addition, the font was changed to "Arial" and a halo is given to the text, which increases contrast when a label overlaps another element. The label is also placed at the top of the node, rather than at the center (which is the default location).

```ts
const labels = {
    data: nodesArray,
    mappings: {
        point: (datum): string => datum.name,
        label: (datum): string => datum.name,
        fontSize: (): number => 14,
    },
    options: {
        font: 'Arial',
        halo: 0.2,
        labelPlacement: graph.labels.PointLabelPlacement.TOP,
    },
};
```

<br>

[Prev Page](./quickstart-2.md)