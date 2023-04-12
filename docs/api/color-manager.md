# ColorManager

A class which aids in maintaining and using the color lists consumed by Grafer in a more user friendly way. It does this by allowing colors to be referenced using a user-readable string rather than via the index number which would otherwise be required.

<br>

## Constructor

The ColorManager constructor ingests a color key-value object to populate the colorArray.

### Parameters
#### `colorObject`
###### {[colorKey: string]: GraferInputColor}

An object containing key-value pairs, where each key is the id and the value is the color associated with it.

<br>

## Properties

### `colorArray`
###### GraferInputColor[] - *read-only*

An array containing all the colors which have been added to the ColorManager. A reference to this array can be provided to the [GraferController](./grafer-controller-data.md#colors) on Grafer initialization.

See [GraferInputColor](./grafer-input-color.md) for more information.

<br>

## Methods

### `addColor`
###### void

Add a new color to the colorArray.

| Property  | Type | Description |
| :--- | :--- | :--- |
| id | string | The id associated with the color to be added. |
| color | GraferInputColor | The color to be added. See [GraferInputColor](./grafer-input-color.md) for more information. |

### `getIndexByKey`
###### number

Get the index of a color stored in the ColorManager by key. This is intended to be called in a `mappings` function.

| Property  | Type | Description |
| :--- | :--- | :--- |
| id | string | The id associated with the color to be retrieved. |
