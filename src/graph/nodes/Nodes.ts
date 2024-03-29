import PicoGL, {App} from 'picogl';
import {LayerRenderable} from '../LayerRenderable';
import {DataMappings, PackDataCB} from '../../data/DataTools';
import {GLDataTypes} from '../../renderer/Renderable';
import {GraferInputColor} from '../../renderer/colors/ColorRegistry';

export interface BasicNodeData {
    id?: number | string;
    point: number | string;
    color?: GraferInputColor;
    texture?: number;
    radius?: number;
}

export const kBasicNodeMappings: DataMappings<BasicNodeData> = {
    id: (entry: any, i) => 'id' in entry ? entry.id : i,
    point: (entry: any, i) => 'point' in entry ? entry.point : i,
    color: (entry: any) => 'color' in entry ? entry.color : 0, // first registered color
    texture: (entry: any) => 'texture' in entry ? entry.texture : 0, // first registered texture
    radius: null, // inherit the radius from the vertex data
};

export const kBasicNodeDataTypes: GLDataTypes<BasicNodeData> = {
    point: PicoGL.UNSIGNED_INT,
    color: PicoGL.UNSIGNED_INT,
    radius: PicoGL.FLOAT, // optional at the end
};

export abstract class Nodes<T_SRC extends BasicNodeData, T_TGT> extends LayerRenderable<T_SRC, T_TGT> {
    public static get defaultMappings(): DataMappings<BasicNodeData> {
        return kBasicNodeMappings;
    }

    protected map: Map<number | string, number | string>;
    protected idArray: (number | string)[];

    public get pixelSizing(): boolean {
        return this.localUniforms.uPixelSizing as boolean;
    }
    public set pixelSizing(value: boolean) {
        this.localUniforms.uPixelSizing = value;
    }

    public get billboard(): boolean {
        return this.localUniforms.uBillboard as boolean;
    }
    public set billboard(value: boolean) {
        this.localUniforms.uBillboard = value;
    }

    public get outline(): number {
        return this.localUniforms.uOutline as number;
    }
    public set outline(value: number) {
        this.localUniforms.uOutline = value;
    }

    protected initialize(...args: any[]): void {
        super.initialize(...args);
        this.localUniforms = Object.assign({}, this.localUniforms, {
            uGraphPoints: this.dataTexture,
            uPixelSizing: false,
            uBillboard: true,
            uOutline: 6.0,
        });
    }

    protected computeMappings(mappings: Partial<DataMappings<T_SRC>>): DataMappings<T_SRC> {
        const nodesMappings = Object.assign({}, kBasicNodeMappings, mappings);

        // patches the mappings to get the points index from their IDs
        const pointMapping = nodesMappings.point;
        nodesMappings.point = (entry, i): number => {
            return this.points.getPointIndex(pointMapping(entry, i));
        };

        return nodesMappings as DataMappings<T_SRC>;
    }

    protected ingestData(context: App, data: unknown[], mappings: Partial<DataMappings<T_SRC>>): void {
        this.map = new Map();
        this.idArray = [];
        super.ingestData(context, data, mappings);
    }

    protected packDataCB(): PackDataCB<T_SRC> | PackDataCB<T_SRC>[] {
        return (i, entry): void => {
            this.map.set(entry.id, entry.point);
            this.idArray.push(entry.id);
        };
    }

    public getEntryPointID(id: number | string):  number | string {
        return this.map.get(id);
    }
}
