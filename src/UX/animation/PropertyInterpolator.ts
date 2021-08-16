export type PropertyType = number | number[] | ArrayBufferView;

export class PropertyInterpolator<T extends PropertyType> {
    private target: unknown;
    private property: string;
    private propertyOwner: unknown;
    private propertyPath: string[];
    private start: T;
    private end: T;
    private interpolator: (i: number) => void;

    constructor(target: unknown, property: string, start: T, end: T) {
        this.target = target;
        this.start = start;
        this.end = end;
        this.propertyPath = property.split('.');
        this.property = this.propertyPath[this.propertyPath.length - 1];

        this.propertyOwner = target;
        for (let i = 0, n = this.propertyPath.length - 1; i < n; ++i) {
            this.propertyOwner = this.propertyOwner[this.propertyPath[i]];
        }

        if (Array.isArray(start) || ArrayBuffer.isView(start)) {
            this.interpolator = this.interpolateArrayProperty;
        } else {
            this.interpolator = this.interpolateNumberProperty;
        }
    }

    public setPropertyValue(interpolation: number): void {
        this.interpolator(interpolation);
    }

    private interpolateNumberProperty(amount: number): void {
        this.propertyOwner[this.property] = this.interpolate(this.start as number, this.end as number, amount);
    }

    private interpolateArrayProperty(amount: number): void {
        this.propertyOwner[this.property] = this.interpolateArray(this.start as number[], this.end as number[], amount);
    }

    private interpolate(start: number, end: number, amount: number): number {
        return start + (end - start) * amount;
    }

    private interpolateArray(start: number[], end: number[], amount: number): number[] {
        const result = [];
        for (let i = 0, n = start.length; i < n; ++i) {
            result.push(this.interpolate(start[i], end[i], amount));
        }
        return result;
    }
}
