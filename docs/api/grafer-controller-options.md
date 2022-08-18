# GraferControllerOptions

This datatype is an object holding configuration options which can be used to configure the Grafer controller on initialization.

<br>

## Properties

### `viewportOptions`
###### ViewportOptions - *optional*
| Property  | Type | Description |
| :--- | :--- | :--- |
<!-- |  colorRegistryType | ColorRegistryType - *optional* | This feature is functionally incomplete. | -->
|  colorRegistryCapacity | number - *optional* | Number must be a power of 2. Will default to 1024. |
|  camera | CameraOptions - *optional* | See [CameraOptions](./camera-options.md) for more information. |

### `loadTexturesAsync`
###### boolean - *optional*

A boolean determining if asynchronous texture loading is enabled.

If textures are loaded asynchrounously then the first render will be done before any of the textures are loaded, consequently all nodes depending on textures will be invisible initially. As each individual texture loads in, a render will be called to update the canvas with the new texture.

Otherwise if textures are loaded synchronously, then the render will be deferred until all textures has loaded. Note that it is still possible to call renders manually before textures have loaded.