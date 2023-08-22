import PicoGL, {App} from 'picogl';
import {LayerRenderable} from '../LayerRenderable';
import {GraphPoints} from '../../data/GraphPoints';
import {DataMappings, PackDataCB} from '../../data/DataTools';
import {PickingManager} from '../../UX/picking/PickingManager';
import {GLDataTypes} from '../../renderer/Renderable';
import {GraferInputColor} from '../../renderer/colors/ColorRegistry';
import {GraferContext} from '../../renderer/GraferContext';

export interface BasicEdgeData {
    id?: number | string;
    source: number;
    target: number;
    sourceColor?: GraferInputColor,
    targetColor?: GraferInputColor,
}

export const kBasicEdgeMappings: DataMappings<BasicEdgeData> = {
    id: (entry: any, i) => 'id' in entry ? entry.id : i,
    source: (entry: any) => entry.source,
    target: (entry: any) => entry.target,
    sourceColor: (entry: any) => 'sourceColor' in entry ? entry.sourceColor : 0, // first registered color
    targetColor: (entry: any) => 'targetColor' in entry ? entry.targetColor : 0, // first registered color
};

export const kBasicEdgeDataTypes: GLDataTypes<BasicEdgeData> = {
    source: PicoGL.UNSIGNED_INT,
    target: PicoGL.UNSIGNED_INT,
    sourceColor: PicoGL.UNSIGNED_INT,
    targetColor: PicoGL.UNSIGNED_INT,
};

export abstract class Edges<T_SRC extends BasicEdgeData, T_TGT> extends LayerRenderable<T_SRC, T_TGT> {
    protected idArray: (number | string)[];

    public static get defaultMappings(): DataMappings<BasicEdgeData> {
        return kBasicEdgeMappings;
    }

    public get lineWidth(): number {
        return this.localUniforms.uLineWidth as number;
    }
    public set lineWidth(value: number) {
        this.localUniforms.uLineWidth = value;
    }

    public get pickingWidth(): number {
        return this.localUniforms.uPickingWidth as number;
    }
    public set pickingWidth(value: number) {
        this.localUniforms.uPickingWidth = value;
    }

    protected initialize(...args: any[]): void {
        super.initialize(...args);
        this.localUniforms = Object.assign({}, this.localUniforms, {
            uGraphPoints: this.dataTexture,
            uLineWidth: 1.5,
            uPickingWidth: 8,
        });
    }

    constructor(
        context: GraferContext,
        points: GraphPoints,
        data: unknown[],
        mappings: Partial<DataMappings<T_SRC>>,
        pickingManager: PickingManager,
    );
    constructor(...args: any[]);
    constructor(...args: any[]) {
        super(...args);
    }

    protected computeMappings(mappings: Partial<DataMappings<T_SRC>>): DataMappings<T_SRC> {
        const edgesMappings = Object.assign({}, kBasicEdgeMappings, mappings);

        // patches the mappings to get the points index from their IDs
        const sourceMapping = edgesMappings.source;
        edgesMappings.source = (entry, i): number => {
            return this.points.getPointIndex(sourceMapping(entry, i));
        };

        const targetMapping = edgesMappings.target;
        edgesMappings.target = (entry, i): number => {
            return this.points.getPointIndex(targetMapping(entry, i));
        };

        return edgesMappings as DataMappings<T_SRC>;
    }

    protected ingestData(context: App, data: unknown[], mappings: Partial<DataMappings<T_SRC>>): void {
        // this.map = new Map();
        this.idArray = [];
        super.ingestData(context, data, mappings);
    }

    protected packDataCB(): PackDataCB<T_SRC> | PackDataCB<T_SRC>[] {
        return (i, entry): void => {
            // this.map.set(entry.id, entry.point);
            this.idArray.push(entry.id);
        };
    }
}
