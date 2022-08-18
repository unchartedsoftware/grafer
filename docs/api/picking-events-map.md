# PickingEventsMap

An enum containing picking events produced by the [PickingManager](./picking-manager.md). The value of the enum is used to specify the type of event the [GraferController event listener](./grafer-controller.md#on) is listening to.

<br>

## Properties

### `hoverOn`
###### symbol

This event is produced when the user moves a pointing device over any element which has the picking manager enabled. It is fired when the pointer crosses the boundary of the element.

The event returns details of the element which produced the event.

### `hoverOff`

This event is produced when the user moves a pointing device out of any element which has the picking manager enabled. It is fired when the pointer crosses the boundary of the element.

The event returns details of the element which produced the event.

### `click`

This event is produced when the user clicks any element which has the picking manager enabled.

The event returns details of the element which produced the event.

### `emptyClick`

This event is produced when the user clicks any element which does not have the picking manager enabled, or when the user clicks the background of the graph.
