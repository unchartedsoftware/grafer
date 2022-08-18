# Quick Start Introduction

In this guide, the process behind setting up a complex network graph visualization is detailed. The goal is to walk through how such a visualization might be built in Grafer, step-by-step for clarity. Each step builds upon the code produced upon the previous step. All of the more complex features will be covered, to provide an overview of how these features might work in practice, as well as provide an example to refer to.

A working snapshot of the code at each step is provided and can be found in the `quickstart` folder in the list of examples.

## Data

The toy dataset that will be used in this example is a collection of flight statistics from a handful of American airports. The graph data will be provided in the form of a node-list and an edge-list. An example of the data format is given below, the full data is available in the examples folder.

### [Nodes](../../examples/src/quick-start/nodes.json)

```json
[
    {
        "name": "IAD",
        "x": 38.94449997,
        "y": -77.45580292,
        "departing_flights": 48132,
        "arriving_flights": 48053,
        "total_flights": 96185
    },
    {
        "name": "SEA",
        "x": 47.4490013122559,
        "y": -122.30899810791,
        "departing_flights": 53180,
        "arriving_flights": 53105,
        "total_flights": 106285
    },
    ...
]
```

### [Edges](../../examples/src/quick-start/edges.json)

```json
[
    {
        "name": "IAD_to_SEA",
        "departure_airport": "IAD",
        "arrival_airport": "SEA",
        "num_flights": 758
    },
    {
        "name": "IAD_to_ORD",
        "departure_airport": "IAD",
        "arrival_airport": "ORD",
        "num_flights": 2036
    },
    ...
]
```

In all examples to follow, the node-list and edge-list will be referenced using the variables `nodeArray` and `edgeArray` respectively.

<br>

[Next Page](./quickstart-1.md)
