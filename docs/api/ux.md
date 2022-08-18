# UX

UX contains classes and tools needed to interface with Grafer by recieving and respond to user input. It also provides a utility to generate a debug menu which displays layer data currently being rendered by Grafer. The debug menu also allows for interaction and modification of Grafer rendering settings in real time.

<br>

## Classes

### `mouse`
###### void

An object storing classes which allow the user to interact with the graph using the mouse to move the camera and change the zoom level (scale). Note that it is not necessary to call these methods to have basic interactivity in Grafer as the [GraferController](./grafer-controller.md) constructor calls them automatically.

See [mouse](./mouse.md) for more information.

### `picking`
###### void

An object containing the PickingManager, a class which is used to handle graph interaction events.

See [picking](./picking.md) for more information.

### `animation`
###### object

An object containing an interface to queue and initiate animated changes to Grafer camera settings and render settings, as well as any utilities required.

See [animation](./animation.md) for more information.

### `coordinate`
###### void

An object containing tools which can be used to find screen pixel coordinates of elements in Grafer. Typically used to place non-Grafer UI elements like tooltips.

See [coordinate](./coordinate.md) for more information.

### `DebugMenu`
###### void

The class generates a small debug interface in the top right corner of the Grafer element which allows the user get an overview of what data Grafer is trying to render, as well as provide tools to change rendering properties in real time.

See [DebugMenu](./debug-menu.md) for more information.