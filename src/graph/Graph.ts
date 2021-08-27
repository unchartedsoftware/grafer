import {Renderable, RenderMode, RenderUniforms} from '../renderer/Renderable';
import {App} from 'picogl';
import {mat4, quat, vec3} from 'gl-matrix';
import {Layer} from './Layer';
import {GraphPoints, PointData, PointDataMappings} from '../data/GraphPoints';
import {PickingManager} from '../UX/picking/PickingManager';
import {EventEmitter} from '@dekkai/event-emitter/build/lib/EventEmitter';

const kEvents  = {
    preRender: Symbol('grafer_graph_pre_render'),
    postRender: Symbol('grafer_graph_post_render'),
};
Object.freeze(kEvents);

export type GraphEventsMap = { [K in keyof typeof kEvents]: ReturnType<() => { readonly 0: unique symbol }[0]> };

export class Graph extends EventEmitter.mixin(GraphPoints) implements Renderable {
    public static get events(): GraphEventsMap {
        return kEvents as GraphEventsMap;
    }

    public picking: PickingManager;
    public enabled: boolean = true;

    private readonly _matrix: mat4;
    public get matrix(): mat4 {
        mat4.fromRotationTranslationScale(this._matrix, this._rotation, this._translation, this._scale);
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

    private readonly _scale: vec3;
    public get scale(): number {
        return this._scale[0];
    }
    public set scale(value: number) {
        vec3.set(this._scale, value, value, value);
    }

    constructor(context: App, data: PointData[]);
    constructor(context: App, data: unknown[], mappings: Partial<PointDataMappings>);
    constructor(context: App, data: unknown[], mappings: Partial<PointDataMappings> = {}) {
        super(context, data, mappings);
        this._layers = [];
        this._rotation = quat.create();
        this._translation = vec3.create();
        this._scale = vec3.fromValues(1, 1, 1);
        this._matrix = mat4.create();
    }

    public render(context:App, mode: RenderMode, uniforms: RenderUniforms): void {
        this.emit(kEvents.preRender, this, mode, uniforms);
        if (mode === RenderMode.PICKING && this.picking && this.picking.enabled) {
            this.picking.offscreenBuffer.prepareContext(context);
        }

        // render layers
        for (let i = 0, n = this._layers.length; i < n; ++i) {
            if (this._layers[i].enabled) {
                this._layers[i].render(context, mode, uniforms);
            }
        }
        if (this.picking && this.picking.enabled && this.picking.debugRender) {
            this.picking.offscreenBuffer.blitToScreen(context);
        }
        this.emit(kEvents.postRender, this, mode, uniforms);
    }

    public resize(context: App): void {
        if (this.picking) {
            this.picking.offscreenBuffer.resize(context);
        }
    }

    public rotate(rotation: quat): void {
        quat.mul(this._rotation, rotation, this._rotation);
    }

    public translate(translation: vec3): void {
        vec3.add(this._translation, this._translation, translation);
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
