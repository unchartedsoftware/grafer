# Mappings

Mappings are used in Grafer to make it easier to consume data, by allowing graph properties used by Grafer to be calculated on graph initialization when the data is ingested, as opposed to requiring a seperate data processing step.

If a mapping for any Grafer data property is not specified, then by default Grafer will look for the property in the data and take the data value found in the datum if it exists.

<br>

### Syntax

As an example of how mappings can be used, here is an example of using mappings to logarathmically map node degree (a non-Grafer data property) to node size. Note that while node data is used as an example, the same technique is used in edges and labels.

```js
    const layer = {
        nodes: {
            type: 'Circle',
            data: [
                {
                    point: 'node 1',
                    degree: 10
                },
                {
                    point: 'node 2',
                    degree: 100,
                },
                ...
            ],
            mappings: {
                size: (datum) => datum.degree ? Math.log10(datum.degree) + 2 : 1,
            }
        },
    };
```

The data above using mappings is equivalent to the following node data. Note that Grafer disregards any non-Grafer data properties.

```js
    const layer = {
        nodes: {
            type: 'Circle',
            data: [
                {
                    point: 'node 1',
                    size: 3
                },
                {
                    point: 'node 2',
                    size: 4
                },
                ...
            ]
        },
    };
```