import {Renderable, RenderMode, RenderUniforms} from '../renderer/Renderable';
import PicoGL, { App } from 'picogl';
import {mat4, quat, vec3} from 'gl-matrix';
import {Layer} from './Layer';
import {GraphPoints, PointData, PointDataMappings} from '../data/GraphPoints';
import {PickingManager} from '../UX/picking/PickingManager';
import {EventEmitter} from '@dekkai/event-emitter/build/lib/EventEmitter';
import { OffscreenBuffer } from 'src/renderer/OffscreenBuffer';
import { PostProcess } from '../renderer/PostProcess';

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

    private _renderBuffer: OffscreenBuffer;
    private _postProcess: PostProcess;

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
    public set translation(value: vec3) {
        vec3.set(this._translation, value[0], value[1], value[2]);
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

        this._renderBuffer = new OffscreenBuffer(context);
        this._postProcess = new PostProcess(context);
    }

    public render(context:App, mode: RenderMode, uniforms: RenderUniforms): void {
        this.emit(kEvents.preRender, this, mode, uniforms);

        const isPicking = mode === RenderMode.PICKING && this.picking && this.picking.enabled;
        if (isPicking) {
            this.picking.offscreenBuffer.prepareContext(context);
        }

        const localUniforms = [uniforms];
        if (mode === RenderMode.HIGH) {
            localUniforms.push(Object.assign({}, uniforms, { uRenderMode: RenderMode.HIGH_PASS_1 }));
            localUniforms.push(Object.assign({}, uniforms, { uRenderMode: RenderMode.HIGH_PASS_2 }));
        }

        // render layers, back to front
        for (let i = 0, n = this._layers.length; i < n; ++i) {
            // clamp glow value
            const glow = Math.min(Math.max(this._layers[i].glow, 0), 1);
            if (glow && !isPicking) {
                this._renderBuffer.prepareContext(context);
            }
            if (this._layers[i].enabled) {
                this._layers[i].render(context, mode, localUniforms, i);
            }
            if (glow && !isPicking) {
                const { outputBuffer1, outputBuffer2, outputTexture1, outputTexture2 } = this._postProcess;

                const renderFrameTexture = this._renderBuffer.colorTarget;
                context.disable(PicoGL.BLEND);

                const downsampledRatio = 1/7; // magic number
                const maxBlurPasses = 20;
                const downsampledSize: [number, number] = [
                    Math.round(context.width * downsampledRatio),
                    Math.round(context.height * downsampledRatio),
                ];
                outputTexture1.resize(...downsampledSize);
                outputBuffer1.colorTarget(0, outputTexture1);
                outputTexture2.resize(...downsampledSize);
                outputBuffer2.colorTarget(0, outputTexture2);

                this.context.drawFramebuffer(outputBuffer1);
                this._postProcess.resample(downsampledSize, renderFrameTexture);

                for(let i = 0; i < Math.round(glow * maxBlurPasses) + 1; i++) {
                    this.context.drawFramebuffer(outputBuffer2);
                    this._postProcess.blur(outputTexture1, true);
                    this.context.drawFramebuffer(outputBuffer1);
                    this._postProcess.blur(outputTexture2, false);
                }

                outputTexture2.resize(context.width, context.height);
                outputBuffer2.colorTarget(0, outputTexture2);

                this.context.drawFramebuffer(outputBuffer2);
                this._postProcess.resample([context.width, context.height], outputTexture1);

                outputTexture1.resize(context.width, context.height);
                outputBuffer1.colorTarget(0, outputTexture1);

                this.context.drawFramebuffer(outputBuffer1);
                this._postProcess.blur(outputTexture2, true);
                this.context.drawFramebuffer(outputBuffer2);
                this._postProcess.blur(outputTexture1, false);

                context.defaultDrawFramebuffer();
                this._postProcess.blend(renderFrameTexture, outputTexture2);
            }
        }

        if (isPicking && this.picking.debugRender) {
            this.picking.offscreenBuffer.blitToScreen(context);
        }

        this.emit(kEvents.postRender, this, mode, uniforms);
    }

    public resize(context: App): void {
        this._renderBuffer.resize(context);
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
