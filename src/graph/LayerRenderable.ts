import {PointsReader} from '../data/PointsReader';
import {GenericUniforms, Renderable, RenderMode, RenderUniforms} from '../renderer/Renderable';
import {App} from 'picogl';
import {GraphPoints} from '../data/GraphPoints';
import {DataMappings} from '../data/DataTools';
import {PickingManager} from '../UX/picking/PickingManager';
import {GraphRenderable} from './GraphRenderable';
import {EventEmitter} from '@dekkai/event-emitter/build/lib/EventEmitter';
import {GraferContext} from '../renderer/GraferContext';

const PointsReaderEmitter = EventEmitter.mixin(PointsReader);
export abstract class LayerRenderable<T_SRC, T_TGT> extends PointsReaderEmitter<T_SRC, T_TGT> implements Renderable, GraphRenderable {
    public static get defaultMappings(): DataMappings<any> {
        return undefined;
    }

    public enabled: boolean = true;
    public nearDepth: number = 0.0;
    public farDepth: number = 1.0;
    public picking: boolean;
    public abstract render(context: App, mode: RenderMode, uniforms: RenderUniforms): void;

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
        super.initialize(context, points, data, mappings);
    }

    public abstract destroy(): void;
}
