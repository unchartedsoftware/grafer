# Coordinate

This class contains static methods to aid in the conversion between Grafer coordinate space and screen space in terms of pixels.

<br>

## Constructor

The Coordinate constructor takes no parameters.

<br>

## Methods

### `worldPointToRelativePixelCoordinate` - *static*
###### [number, number]

Returns an array of length 2 containing pixel coordinate values representing the pixel x-coordinate, and pixel y coordinate, respectively, of the input point value.

The pixel coordinate value is relative to the Grafer canvas container, where the bottom-left corner of the container is the origin, with the x-value increasing to the right, and the y-value increasing upwards.

The pixel coordinate values returned are in terms of CSS/logical pixels. If the pixel coordinate value is to be used, for example to place a tooltip using CSS, the CSS pixel value must be divided by the [devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio) to convert the unit into physical pixel values.

| Property  | Type | Description |
| :--- | :--- | :--- |
| controller | GraferController | Instance of GraferController containing graph to do conversion with. |
| point | vec4 | An array of length 4 containing values representing the x-coordinate, y-coordinate, z-coordinate, and radius, respectively, in Grafer coordinate space. Can directly use values produced by [getPointByIndex](./ggraph.md#getpointbyindex) and [getPointByID](./ggraph.md#getpointbyid), but arbitrary point values are also valid. |
| position | PixelCoordPosition | If a non-zero radius value is provided, determines the direction of offset, if any, from the center of the point. See [PixelCoordPosition](./pixel-coord-position.md) for more information. |

### `relativePixelCoordinateToWorldPoint` - *static*
###### [number, number, number, number]

Returns an array of length 4 contain world coordinate values, representing the x-coordinate, y-coordinate, z-coordinate, and radius, respectively, corresponding to the input pixel value.

The pixel coordinate value is relative to the Grafer canvas container, where the bottom-left corner of the container is the origin, with the x-value increasing to the right, and the y-value increasing upwards.

The pixel coordinate values returned are in terms of CSS/logical pixels. If the pixel coordinate value is to be used, for example to place a tooltip using CSS, the CSS pixel value must be divided by the [devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio) to convert the unit into physical pixel values.

Note: Until further notice, this function is only to be considered reliable when using Grafer in 2D mode only due to assumptions made in the implementation.

| Property  | Type | Description |
| :--- | :--- | :--- |
| controller | GraferController | Instance of GraferController containing graph to do conversion with. |
| point | vec2 | An array of length 2 containing values representing the x-coordinate, and y-coordinate, respectively, in pixel coordinate space. |
