import PicoGL, {App} from 'picogl';
import {LayerRenderable} from '../LayerRenderable';
import {GraphPoints} from '../../data/GraphPoints';
import {DataMappings} from '../../data/DataTools';
import {PickingManager} from '../../UX/picking/PickingManager';
import {GLDataTypes} from '../../renderer/Renderable';

export interface BasicNodeData {
    id: number | string;
    point: number | string;
    radius?: number;
}

export const kBasicNodeMappings: DataMappings<BasicNodeData> = {
    id: (entry: any, i) => 'id' in entry ? entry.id : i,
    point: (entry: any, i) => 'point' in entry ? entry.point : i,
    radius: null, // inherit the radius from the vertex data
};

export const kBasicNodeDataTypes: GLDataTypes<BasicNodeData> = {
    point: PicoGL.UNSIGNED_INT,
    radius: PicoGL.FLOAT,
};

export abstract class Nodes<T_SRC, T_TGT> extends LayerRenderable<T_SRC, T_TGT> {
    public static get defaultMappings(): DataMappings<BasicNodeData> {
        return kBasicNodeMappings;
    }

    protected localUniforms = {
        uConstraintSize: true,
        uMinSize: 1.0,
        uMaxSize: 4.0,
        uPixelSizing: false,
        uBillboard: true,
    }

    public get constraintSize(): boolean {
        return this.localUniforms.uConstraintSize;
    }
    public set constraintSize(value: boolean) {
        this.localUniforms.uConstraintSize = value;
    }

    public get minSize(): number {
        return this.localUniforms.uMinSize;
    }
    public set minSize(value: number) {
        this.localUniforms.uMinSize = value;
    }

    public get maxSize(): number {
        return this.localUniforms.uMaxSize;
    }
    public set maxSize(value: number) {
        this.localUniforms.uMaxSize = value;
    }

    public get pixelSizing(): boolean {
        return this.localUniforms.uPixelSizing;
    }
    public set pixelSizing(value: boolean) {
        this.localUniforms.uPixelSizing = value;
    }

    public get billboard(): boolean {
        return this.localUniforms.uBillboard;
    }
    public set billboard(value: boolean) {
        this.localUniforms.uBillboard = value;
    }

    protected constructor(context: App,
                          points: GraphPoints,
                          data: unknown[],
                          mappings: Partial<DataMappings<T_SRC>>,
                          pickingManager: PickingManager
    ) {
        super(context, points, data, mappings, pickingManager);
        // this.positions = context.createVertexBuffer(PicoGL.FLOAT, 3, positions);
        //
        // if (colors) {
        //     this.colors = context.createVertexBuffer(PicoGL.UNSIGNED_BYTE, 4, colors);
        // } else {
        //     const colorsArray = new Uint8Array((positions.length / 3) * 4);
        //     colorsArray.fill(128);
        //     this.colors = context.createVertexBuffer(PicoGL.UNSIGNED_BYTE, 4, colorsArray);
        // }
        //
        // if (sizes) {
        //     this.sizes = context.createVertexBuffer(PicoGL.FLOAT, 1, sizes);
        // } else {
        //     const sizesArray = new Float32Array(positions.length / 3);
        //     sizesArray.fill(0.0);
        //     this.sizes = context.createVertexBuffer(PicoGL.FLOAT, 1, sizesArray);
        // }
        //
        // if (pickingColors) {
        //     this.pickingColors = context.createVertexBuffer(PicoGL.UNSIGNED_BYTE, 4, pickingColors);
        // }
    }
}
