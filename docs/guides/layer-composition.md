# Layer Composition

An inherent limitation of Grafer is that each layer can only contain one set of nodes, one set of edges, and one set of labels. In addition to that, the majority of settings available to nodes, edges, and labels apply to all elements of the same type in the entire layer.

A situation where a user might run against this limitation might be the case that a user might want to fade a graph except for a specific subgraph within the graph, which one might want to display normally, in order to highlight the subgraph within the larger graph.

The key to getting around this limitation is to take advantage of Grafer's ability to render multiple layers. In the above case, the entire graph layer can be faded out, and then a new layer can be drawn on top, containing only the nodes, edges, and labels present. Assuming that no changes are made that increase the size of the elements, the new layer should completely obscure the faded out elements and only the elements in the new layer should be visible.

Using this technique of building layers on top of one another, it is possible to generate very visually complex visualizations.