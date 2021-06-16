import PicoGL, {App, Texture} from 'picogl';
import testVS from './shaders/GraphPoints.test.vs.glsl';
import testFS from './shaders/noop.fs.glsl';
import {GLDataTypes} from '../renderer/Renderable';
import {DataMappings, concatenateData, packData, printDataGL} from './DataTools';
import {vec3} from 'gl-matrix';

export interface PointData {
    id?: number | string;
    x: number;
    y: number;
    z?: number;
    radius?: number;
}

export type PointDataMappings = DataMappings<PointData>;

const kDefaultMappings: PointDataMappings = {
    id: (entry: any, i) => 'id' in entry ? entry.id : i,
    x: (entry: any) => entry.x,
    y: (entry: any) => entry.y,
    z: (entry: any) => 'z' in entry ? entry.z : 0.0,
    radius: (entry: any) => 'radius' in entry ? entry.radius : 0.0,
};

const kGLTypes: GLDataTypes<PointData> = {
    x: PicoGL.FLOAT,
    y: PicoGL.FLOAT,
    z: PicoGL.FLOAT,
    radius: PicoGL.FLOAT,
};

export class GraphPoints {
    public static createGraphFromNodes<R extends GraphPoints>(context: App, nodes: unknown[][], mappings: Partial<PointDataMappings> = {}): R {
        let pointIndex = 0;
        const dataMappings: PointDataMappings = Object.assign({}, kDefaultMappings, {
            id: () => pointIndex++,
        }, mappings);

        const points = concatenateData(nodes, dataMappings);
        return <R>(new this(context, points));
    }

    private _dataTexture: Texture;
    public get dataTexture(): Texture {
        return this._dataTexture;
    }

    private _dataBuffer: ArrayBuffer;
    public get dataBuffer(): ArrayBuffer {
        return this._dataBuffer;
    }

    private _dataView: DataView;
    public get dataView(): DataView {
        return this._dataView;
    }

    private map: Map<number | string, number>;

    public bb: { min: vec3, max: vec3 };
    public bbCorner: vec3;
    public bbCornerLength: number;

    constructor(context: App, data: PointData[]);
    constructor(context: App, data: unknown[], mappings: Partial<PointDataMappings>);
    constructor(context: App, data: unknown[], mappings: Partial<PointDataMappings> = {}) {
        this.map = new Map();
        this.bb = {
            min: vec3.fromValues(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number. MAX_SAFE_INTEGER),
            max: vec3.fromValues(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER),
        };
        this.bbCorner = vec3.fromValues(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);

        const dataMappings: PointDataMappings = Object.assign({}, kDefaultMappings, mappings);
        this._dataBuffer = packData(data, dataMappings, kGLTypes, true, (i, entry) => {
            this.map.set(entry.id, i);

            this.bb.min[0] = Math.min(this.bb.min[0], entry.x);
            this.bb.min[1] = Math.min(this.bb.min[1], entry.y);
            this.bb.min[2] = Math.min(this.bb.min[2], entry.z);

            this.bb.max[0] = Math.max(this.bb.max[0], entry.x);
            this.bb.max[1] = Math.max(this.bb.max[1], entry.y);
            this.bb.max[2] = Math.max(this.bb.max[2], entry.z);

            this.bbCorner[0] = Math.max(this.bbCorner[0], Math.abs(entry.x));
            this.bbCorner[1] = Math.max(this.bbCorner[1], Math.abs(entry.y));
            this.bbCorner[2] = Math.max(this.bbCorner[2], Math.abs(entry.z));
        });
        this._dataView = new DataView(this._dataBuffer);

        this.bbCornerLength = vec3.length(this.bbCorner);

        // calculate the smallest texture rectangle with POT sides, is this optimization needed? - probably not
        const textureWidth = Math.pow(2 , Math.ceil(Math.log2(Math.ceil(Math.sqrt(data.length)))));
        const textureHeight = Math.pow(2 , Math.ceil(Math.log2(Math.ceil(data.length / textureWidth))));
        this._dataTexture = context.createTexture2D(textureWidth, textureHeight, {
            internalFormat: PicoGL.RGBA32F,
        });

        const float32 = new Float32Array(this._dataBuffer);
        this._dataTexture.data(float32);

        // this.testFeedback(context);
    }

    public destroy(): void {
        this._dataTexture.delete();
        this.map.clear();

        this._dataTexture = null;
        this._dataBuffer = null;
        this.map = null;
    }

    public getPointIndex(id: number | string): number {
        return this.map.get(id);
    }

    private testFeedback(context: App): void {
        const program = context.createProgram(testVS, testFS, { transformFeedbackVaryings: [ 'vPosition', 'vRadius', 'vYolo' ], transformFeedbackMode: PicoGL.INTERLEAVED_ATTRIBS });
        const pointsTarget = context.createVertexBuffer(PicoGL.FLOAT, 4, 40);
        const pointsIndices = context.createVertexBuffer(PicoGL.UNSIGNED_BYTE, 1, new Uint8Array([
            0,
            1,
            2,
            3,
            4,
            5,
        ]));

        const transformFeedback = context.createTransformFeedback().feedbackBuffer(0, pointsTarget);
        const vertexArray = context.createVertexArray().vertexAttributeBuffer(0, pointsIndices);

        const drawCall = context.createDrawCall(program, vertexArray).transformFeedback(transformFeedback);
        drawCall.primitive(PicoGL.POINTS);
        drawCall.texture('uDataTexture', this._dataTexture);
        context.enable(PicoGL.RASTERIZER_DISCARD);
        drawCall.draw();
        context.disable(PicoGL.RASTERIZER_DISCARD);

        printDataGL(context, pointsTarget, 6, {
            position: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
            radius: PicoGL.FLOAT,
            yolo: PicoGL.FLOAT,
        });
    }
}
