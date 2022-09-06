# LayerRenderableBlendMode

An enum specifying how the renderer handles stacking elements within the same layer.

<br>

## Properties

### `NONE`

Effectively makes all elements opaque. Any alpha an element may have will not reveal any other elements underneath.

### `NORMAL`

If elements stack on any particular pixel, any alpha the top element may have will permit elements beneath to show through.

### `ADDITIVE`

If elements stack on any particular pixel, the colour values of all elements in the stack will be added together to produce a final colour which will be rendered to screen.
