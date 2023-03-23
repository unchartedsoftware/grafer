# InteractionModules

This datatype is an object holding instances of all of the interaction modules active in the graph. It is possible to use access to these modules to change how a user interacts with the camera. For example it is possible to turn modules on or off or change buttons bound to the modules. The specific modules contained in the object change, depending on the camera mode Grafer is using, 2D or 3D.

<br>

## Properties

### `translate`
###### DragTranslate - *optional*

A module which allows for camera translation (traversing left/right and top/down) when the 2D camera mode is active.

### `scale`
###### ScrollScale - *optional*

A module which allows for camera zoom when the 2D camera mode is active.

### `dolly`
###### ScrollDolly - *optional*

A module which allows the camera to move into or out of the current viewport when the 3D camera mode is active. This behaviour is analogous to zoom in 2D.

### `truck`
###### DragTruck - *optional*

A module which allows camera translation relative to the current viewport when the 3D camera mode is active.

### `rotation`
###### DragRotation - *optional*

A module which allows the scene to rotate about the centre (origin) of the scene when the 3D camera mode is active.

### `pan`
###### DragPan - *optional*

A module which allows scene translation relative to the current viewport when the 3D camera mode is active. This behaviour is analogous to translate in 2D.
