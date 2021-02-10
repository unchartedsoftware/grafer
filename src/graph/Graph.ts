import {Renderable, RenderMode, RenderUniforms} from '../renderer/Renderable';
import {App, PicoGL} from 'picogl';
import {mat4, quat, vec3} from 'gl-matrix';
import {Layer} from './Layer';
import {GraphPoints, PointData, PointDataMappings} from '../data/GraphPoints';
import {PickingManager} from '../UX/picking/PickingManager';

export class Graph extends GraphPoints implements Renderable {
    public picking: PickingManager;
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
        if (mode === RenderMode.PICKING && this.picking && this.picking.enabled) {
            this.picking.offscreenBuffer.prepareContext(context);
        }

        // render labels
        for (let i = 0, n = this._layers.length; i < n; ++i) {
            if (this._layers[i].enabled) {
                this._layers[i].render(context, mode, uniforms);
            }
        }

        // // render nodes
        // for (let i = 0, n = this._layers.length; i < n; ++i) {
        //     if (this._layers[i].enabled) {
        //         this._layers[i].renderNodes(context, mode, uniforms);
        //     }
        // }
        //
        // // render edges
        // for (let i = 0, n = this._layers.length; i < n; ++i) {
        //     if (this._layers[i].enabled) {
        //         this._layers[i].renderEdges(context, mode, uniforms);
        //     }
        // }

        // if (this.picking) {
        //     this.picking.offscreenBuffer.blitToScreen(context);
        // }
    }

    public resize(context: App): void {
        if (this.picking) {
            this.picking.offscreenBuffer.resize(context);
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
