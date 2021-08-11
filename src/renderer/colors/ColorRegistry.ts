import {DataTexture} from '../DataTexture';

export type GraferInputColor = [number, number, number] | string | number;

export enum ColorRegistryType {
    mapped = 'mapped',
    indexed = 'indexed',
}

export abstract class ColorRegistry extends DataTexture {
    protected dirty: boolean = false;

    public abstract registerColor(color: GraferInputColor): number;
}
