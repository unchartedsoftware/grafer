# mouse

The mouse object contains classes which handle mouse interaction with Grafer. The classes here are mainly provided for use with the [DebugMenu](./debug-menu.md), which is capable of using an initialized mouse class to generate a UI element and control the camera.

<br>

## Classes

### `DragModule`
###### DragModule

This class is the parent class of the other "drag" interaction classes. It is not intended to be initialized by the user.

### `DragPan`
###### DragPan

This class handles 3D panning camera movement, which involves rotating the camera about the current location of the camera without translating (moving) the camera location.

### `DragRotation`
###### DragRotation

This class handles 3D rotation graph movement, which involves rotating the graph about the origin of the graph. The camera location and angle remains unchanged.

### `DragTruck`
###### DragTruck

This class handles 3D translational camera movement to the left or right.

### `ScrollDolly`
###### ScrollDolly

This class handles 3D translational camera movement into or out of the frame. It is the 3D equivalent of scale (zoom).

### `MouseHandler`
###### DragModule

This class listens for mouse events and functions as an interface for other mouse interaction classes to listen for mouse events. It is not intended to be used by the user.
