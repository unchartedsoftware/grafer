# AnimationManager

The AnimationManager is a class providing a very simple system for queueing and managing animations. Each animation queued is associated with a `target` and acts upon the `target` only. Each animation asynchronously runs until completion. If an animation is queued on a target before the previous animation has run until completion, the previous animation will be replaced with the new animation.

<br>

## Constructor

The AnimationManager constructor takes no parameters.

<br>

## Methods

### `animate`
###### void

A method that queues an animation.

| Parameter  | Type | Description |
| :--- | :--- | :--- |
|  target | -- | A reference to a [graph](./ggraph.md), [node](./nodes.md), [edge](./edges.md), or [label](./llabels.md) in Grafer's internal data store. |
|  property | string | Specifies the property to be mutated during the animation. The string name of any property in the target class can be used. |
|  duration | number | Duration of the animation in milliseconds. |
|  start | any | Starting value of the property to animate from. |
|  end  | any | End value of the property to animate to. |
|  cb  | (progress: number) => void | Callback which is called at every animation frame in which the animation is still running. Provides the progress as a range between 0 - 1 as a parameter. |
|  easing | (x: number) => number - *optional* | Changes the easing used by the animation. Defaults to [LinearEasing](./animation.md#lineareasing). |
