import {PointsReader} from '../data/PointsReader';
import {GenericUniforms, Renderable, RenderMode, RenderUniforms} from '../renderer/Renderable';
import {App, PicoGL} from 'picogl';
import {GraphPoints} from '../data/GraphPoints';
import {DataMappings} from '../data/DataTools';
import {PickingManager} from '../UX/picking/PickingManager';
import {GraphRenderable} from './GraphRenderable';
import {EventEmitter} from '@dekkai/event-emitter/build/lib/EventEmitter';
import {GraferContext} from '../renderer/GraferContext';

export enum LayerRenderableBlendMode {
    NONE,
    NORMAL,
    ADDITIVE,
}

const PointsReaderEmitter = EventEmitter.mixin(PointsReader);
export abstract class LayerRenderable<T_SRC, T_TGT> extends PointsReaderEmitter<T_SRC, T_TGT> implements Renderable, GraphRenderable {
    public static get defaultMappings(): DataMappings<any> {
        return undefined;
    }

    public enabled: boolean = true;
    public nearDepth: number = 0.0;
    public farDepth: number = 1.0;
    public blendMode: LayerRenderableBlendMode = LayerRenderableBlendMode.NORMAL;
    public picking: boolean;

    public get alpha(): number {
        return this.localUniforms.uAlpha as number;
    }
    public set alpha(value: number) {
        this.localUniforms.uAlpha = value;
    }

    public get fade(): number {
        return this.localUniforms.uFade as number;
    }
    public set fade(value: number) {
        this.localUniforms.uFade = value;
    }

    public get desaturate(): number {
        return this.localUniforms.uDesaturate as number;
    }
    public set desaturate(value: number) {
        this.localUniforms.uDesaturate = value;
    }

    protected pickingManager: PickingManager;
    protected localUniforms: GenericUniforms;

    protected constructor(
        context: GraferContext,
        points: GraphPoints,
        data: unknown[],
        mappings: Partial<DataMappings<T_SRC>>,
        pickingManager: PickingManager,
    );
    protected constructor(...args: any[]);
    protected constructor(...args: any[]) {
        super(...args);
    }

    public abstract render(context: App, mode: RenderMode, uniforms: RenderUniforms): void;

    protected initialize(...args: any[]): void;
    protected initialize(
        context: GraferContext,
        points: GraphPoints,
        data: unknown[],
        mappings: Partial<DataMappings<T_SRC>>,
        pickingManager: PickingManager
    ): void {
        this.pickingManager = pickingManager;
        this.picking = true;
        this.localUniforms = Object.assign({}, this.localUniforms, {
            uAlpha: 1.0,
            uFade: 0.0,
            uDesaturate: 0.0,
        });
        super.initialize(context, points, data, mappings);
    }

    protected configureRenderContext(context: App, renderMode: RenderMode): void {
        context.depthRange(this.nearDepth, this.farDepth);

        switch (renderMode) {
            case RenderMode.PICKING:
                context.depthMask(true);
                context.disable(PicoGL.BLEND);
                break;

            case RenderMode.HIGH_PASS_2:
                context.depthMask(false);
                context.enable(PicoGL.BLEND);
                if (this.blendMode === LayerRenderableBlendMode.ADDITIVE) {
                    context.blendFuncSeparate(PicoGL.SRC_ALPHA, PicoGL.ONE, PicoGL.ONE, PicoGL.ONE);
                } else { // NORMAL
                    context.blendFuncSeparate(PicoGL.SRC_ALPHA, PicoGL.ONE_MINUS_SRC_ALPHA, PicoGL.ONE, PicoGL.ONE);
                }
                break;

            default:
                if (this.localUniforms.uAlpha >= 1.0 || this.blendMode === LayerRenderableBlendMode.NONE) {
                    context.disable(PicoGL.BLEND);
                    context.depthMask(true);
                } else {
                    context.enable(PicoGL.BLEND);
                    context.depthMask(false);
                    if (this.blendMode === LayerRenderableBlendMode.ADDITIVE) {
                        context.blendFuncSeparate(PicoGL.SRC_ALPHA, PicoGL.ONE, PicoGL.ONE, PicoGL.ONE);
                    } else { // NORMAL
                        context.blendFuncSeparate(PicoGL.SRC_ALPHA, PicoGL.ONE_MINUS_SRC_ALPHA, PicoGL.ONE, PicoGL.ONE);
                    }
                }
                break;
        }
    }

    public abstract destroy(): void;
}
