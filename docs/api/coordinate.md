# coordinate

An object containing the Coordinate class, which is a utility for aiding the conversion between coordinates in Grafer space to coordinates in screen space. It also contains various enums to change Coordinate class behaviour when it is given points with non-zero radii as input, useful for finding points in screen space at the border of nodes rather than at the center.

<br>

## Properties

### `Coordinate`
###### Coordinate

A class which contains methods to perform the coordinate space conversion.

See [Coordinate](./ccoordinate.md) for more information.

### `PixelCoordXPosition`

An enum used to specify how point radii is handled in the x-axis.

See [PixelCoordXPosition](./pixel-coord-x-position.md) for more information.

### `PixelCoordYPosition`

An enum used to specify how point radii is handled in the y-axis.

See [PixelCoordYPosition](./pixel-coord-y-position.md) for more information.