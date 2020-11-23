import PicoGL, {App} from 'picogl';
import {LayerRenderable} from '../LayerRenderable';
import {GraphPoints} from '../../data/GraphPoints';
import {DataMappings} from '../../data/DataTools';
import {PickingManager} from '../../UX/picking/PickingManager';
import {GLDataTypes} from '../../renderer/Renderable';

export interface BasicEdgeData {
    id: number | string;
    source: number;
    target: number;
}

export const kBasicEdgeMappings: DataMappings<BasicEdgeData> = {
    id: (entry: any, i) => 'id' in entry ? entry.id : i,
    source: (entry: any, i) => 'source' in entry ? entry.source : i,
    target: (entry: any, i) => 'target' in entry ? entry.target : i,
};

export const kBasicEdgeDataTypes: GLDataTypes<BasicEdgeData> = {
    source: PicoGL.UNSIGNED_INT,
    target: PicoGL.UNSIGNED_INT,
};

export abstract class Edges<T_SRC, T_TGT> extends LayerRenderable<T_SRC, T_TGT> {
    public static get defaultMappings(): DataMappings<BasicEdgeData> {
        return kBasicEdgeMappings;
    }

    public alpha: number = 0.3;

    protected constructor(context: App,
                          points: GraphPoints,
                          data: unknown[],
                          mappings: Partial<DataMappings<T_SRC>>,
                          pickingManager: PickingManager
    ) {
        super(context, points, data, mappings, pickingManager);
    }
}
