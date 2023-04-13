# Table of Contents

## Guides

- [Quick Start Introduction](./guides/quickstart-0.md)
    - [Drawing Basic Graphs](./guides/quickstart-1.md)
    - [Using Points](./guides/quickstart-2.md)
    - [Decorating the Graph](./guides/quickstart-3.md)

- [Layer Composition](./guides/layer-composition.md)
- [Events](./guides/events.md)
- [Mappings](./guides/mappings.md)

## API

A brief overview of how to access various parts of the Grafer library is provided here.

- [Top Level](./api/top-level.md)
    - [GraferController](./api/grafer-controller.md)
    - [UX](./api/ux.md)
        - [DebugMenu](./api/debug-menu.md)
        - [animation](./api/animation.md)
            - [AnimationManager](./api/animation-manager.md)
            - [PropertyInterpolator](./api/animation.md#propertyinterpolator)
        - [coordinate](./api/coordinate.md)
            - [Coordinate](./api/ccoordinate.md)
            - [PixelCoordXPosition](./api/pixel-coord-x-position.md)
            - [PixelCoordYPosition](./api/pixel-coord-y-position.md)
        - [mouse](./api/mouse.md)
            - [MouseHandler](./api/mouse.md#mousehandler)
            - [DragModule](./api/mouse.md#dragmodule)
            - [DragPan](./api/mouse.md#dragpan)
            - [DragRotation](./api/mouse.md#dragrotation)
            - [DragTruck](./api/mouse.md#dragtruck)
            - [ScrollDolly](./api/mouse.md#scrolldolly)
        - [picking](./api/picking.md)
            - [PickingManager](./api/picking-manager.md)
                - [events](./api/picking-manager.md#events)
    - [data](./api/top-level.md#data)
    - [graph](./api/graph.md)
        - [Graph](./api/ggraph.md)
        - [nodes](./api/graph.md#nodes)
        - [edges](./api/graph.md#edges)
        - [labels](./api/graph.md#labels)
            - [PointLabelPlacement](./api/point-label-placement.md)
    - [loaders](./api/top-level.md#loaders)
    - [renderer](./api/top-level.md#renderer)
    - [utilities][./api/utilities.md]
        - [ColorManager](./api/color-manager.md)
        - [generateGradient](./api/utilities.md#generategradient)
