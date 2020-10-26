import {Renderable, RenderMode, RenderUniforms} from '../renderer/Renderable';
import {App} from 'picogl';
import {mat4, quat, vec3} from 'gl-matrix';
import {Layer} from './Layer';

export class Graph extends Renderable {
    private _matrix: mat4;
    public get matrix(): mat4 {
        mat4.fromRotationTranslation(this._matrix, this._rotation, this._translation);
        return this._matrix;
    }

    private _layers: Layer[];
    public get layers(): Layer[] {
        return this._layers;
    }

    private _rotation: quat;
    public get rotation(): quat {
        return this._rotation;
    }

    private _translation: vec3;
    public get translation(): vec3 {
        return this._translation;
    }


    constructor() {
        super();
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

    public rotate(x: number, y: number, z: number): void {
        const r = quat.fromEuler(quat.create(), x, y, z);
        quat.mul(this._rotation, r, this._rotation);
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
