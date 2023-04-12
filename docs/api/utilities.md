# utilities

An object containing classes and functions designed to make Grafer easier to use.

<br>

## Properties

### `ColorManager`
###### ColorManager

A class which can be used to manage the numerically indexed color arrays used by Grafer in a more user friendly way.

See [ColorManager](./color-manager.md) for more information.

### `generateGradient`
###### string[]

A function which allows a user to specify a color range and the number of samples to take, returning an array of colours sampled from the color range.

| Property  | Type | Description |
| :--- | :--- | :--- |
| colorList | string[] | A list of colors defining the color range in 6-character hexadecimal form (e.g. #FFFFFF). The number of colors provided should not be larger than the number of samples to be taken. |
| samples | number | Number of samples to take from the color range. |
