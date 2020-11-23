import {Renderable, RenderMode, RenderUniforms} from '../renderer/Renderable';
import {App} from 'picogl';
import {mat4, quat, vec3} from 'gl-matrix';
import {Layer} from './Layer';
import {GraphPoints, PointData, PointDataMappings} from '../data/GraphPoints';

export class Graph extends GraphPoints implements Renderable {
    public enabled: boolean = true;

    private readonly _matrix: mat4;
    public get matrix(): mat4 {
        mat4.fromRotationTranslation(this._matrix, this._rotation, this._translation);
        return this._matrix;
    }

    private readonly _layers: Layer[];
    public get layers(): Layer[] {
        return this._layers;
    }

    private readonly _rotation: quat;
    public get rotation(): quat {
        return this._rotation;
    }

    private readonly _translation: vec3;
    public get translation(): vec3 {
        return this._translation;
    }

    constructor(context: App, data: PointData[]);
    constructor(context: App, data: unknown[], mappings: Partial<PointDataMappings>);
    constructor(context: App, data: unknown[], mappings: Partial<PointDataMappings> = {}) {
        super(context, data, mappings);
        this._layers = [];
        this._rotation = quat.create();
        this._translation = vec3.create();
        this._matrix = mat4.create();
    }

    public render(context:App, mode: RenderMode, uniforms: RenderUniforms): void {
        for (let i = 0, n = this._layers.length; i < n; ++i) {
            if (this._layers[i].enabled) {
                this._layers[i].renderNodes(context, mode, uniforms);
            }
        }

        for (let i = 0, n = this._layers.length; i < n; ++i) {
            if (this._layers[i].enabled) {
                this._layers[i].renderEdges(context, mode, uniforms);
            }
        }
    }

    public rotate(rotation: quat): void {
        quat.mul(this._rotation, rotation, this._rotation);
    }

    public addLayer(layer: Layer): void {
        this._layers.push(layer);
    }

    public addLayerAt(layer: Layer, index: number): void {
        if (index >= 0 && index <= this._layers.length) {
            this._layers.splice(index, 0, layer);
        }
    }

    public removeLayer(layer: Layer): void {
        const i = this._layers.indexOf(layer);
        if (i !== -1) {
            this._layers.splice(i, 1);
        }
    }

    public removeLayerAt(index: number) : void {
        if (index >= 0 && index < this._layers.length) {
            this._layers.splice(index, 1);
        }
    }
}
