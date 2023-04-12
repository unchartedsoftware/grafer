import { GraferInputColor } from '../renderer/colors/ColorRegistry';

export class ColorManager {
    private keyArray;
    public colorArray: GraferInputColor[];

    constructor(colorMap = {}) {
        this.keyArray = Object.keys(colorMap);
        this.colorArray = Object.values(colorMap);
    }

    addColor(id: string, color: GraferInputColor): void {
        if (!this.keyArray.includes(id)) {
            this.keyArray.push(id);
            this.colorArray.push(color);
        }
    }

    getIndexByKey(id: string): number {
        const index = this.keyArray.indexOf(id);
        if(index === -1) {
            throw Error(`Color with key ${id} not found`);
        }
        return index;
    }
}