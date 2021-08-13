import PicoGL, {App, Texture} from 'picogl';
import testVS from './shaders/GraphPoints.test.vs.glsl';
import testFS from './shaders/noop.fs.glsl';
import {GLDataTypes} from '../renderer/Renderable';
import {DataMappings, concatenateData, packData, printDataGL} from './DataTools';
import {vec3} from 'gl-matrix';
import {DataTexture} from '../renderer/DataTexture';

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

export class GraphPoints extends DataTexture {
    public static createGraphFromNodes<R extends GraphPoints>(context: App, nodes: unknown[][], mappings: Partial<PointDataMappings> = {}): R {
        let pointIndex = 0;
        const dataMappings: PointDataMappings = Object.assign({}, kDefaultMappings, {
            id: () => pointIndex++,
        }, mappings);

        const points = concatenateData(nodes, dataMappings);
        return <R>(new this(context, points));
    }

    private _dataBuffer: ArrayBuffer;
    public get dataBuffer(): ArrayBuffer {
        return this._dataBuffer;
    }

    private _dataView: DataView;
    public get dataView(): DataView {
        return this._dataView;
    }

    private _length: number = 0;
    public get length(): number {
        return this._length;
    }

    private map: Map<number | string, number>;
    protected dirty: boolean = false;

    public bb: { min: vec3, max: vec3 };
    public bbCenter: vec3;
    public bbDiagonal: number;

    constructor(context: App, data: PointData[]);
    constructor(context: App, data: unknown[], mappings: Partial<PointDataMappings>);
    constructor(context: App, data: unknown[], mappings: Partial<PointDataMappings> = {}) {
        super(context, data.length);

        this.map = new Map();
        this.bb = {
            min: vec3.fromValues(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number. MAX_SAFE_INTEGER),
            max: vec3.fromValues(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER),
        };
        this.bbCenter = vec3.create();

        this._dataBuffer = this.packData(data, mappings, true);
        this._dataView = new DataView(this._dataBuffer);

        const diagonalVec = vec3.sub(vec3.create(), this.bb.max, this.bb.min);
        this.bbDiagonal = vec3.length(diagonalVec);
        this.bbCenter = vec3.add(vec3.create(), this.bb.min, vec3.mul(vec3.create(), diagonalVec, vec3.fromValues(0.5, 0.5, 0.5)));

        this._length = data.length;

        // set the dirty flag so the texture is updated next time it is requested
        this.dirty = true;

        // this.testFeedback(context);
    }

    public destroy(): void {
        super.destroy();
        this.map.clear();

        this._dataBuffer = null;
        this.map = null;
    }

    public update(): void {
        if (this.dirty) {
            const float32 = new Float32Array(this._dataBuffer);
            this._texture.data(float32);
        }
        this.dirty = false;
    }

    public getPointIndex(id: number | string): number {
        return this.map.get(id);
    }

    public getPointByIndex(index: number): [number, number, number, number] {
        return [
            this._dataView.getFloat32(index * 16, true),
            this._dataView.getFloat32(index * 16 + 4, true),
            this._dataView.getFloat32(index * 16 + 8, true),
            this._dataView.getFloat32(index * 16 + 12, true),
        ];
    }

    public getPointByID(id: number | string): [number, number, number, number] {
        return this.getPointByIndex(this.getPointIndex(id));
    }

    public addPoints(data: unknown[], mappings: Partial<PointDataMappings> = {}): void {
        this.resizeTexture(this._length + data.length);

        const mergeBuffer = new ArrayBuffer(this.capacity * 16); // 16 bytes for 4 floats
        const mergeBytes = new Uint8Array(mergeBuffer);

        const dataBuffer = this.packData(data, mappings, false);
        const dataBytes = new Uint8Array(dataBuffer);
        const oldBytes = new Uint8Array(this._dataBuffer, 0, this._length * 16);

        mergeBytes.set(oldBytes);
        mergeBytes.set(dataBytes, oldBytes.length);

        this._dataBuffer = mergeBuffer;
        this._dataView = new DataView(this._dataBuffer);
        this._length += data.length;
        this.dirty = true;
    }

    protected createTexture(width: number, height: number): Texture {
        return this.context.createTexture2D(width, height, {
            internalFormat: PicoGL.RGBA32F,
        });
    }

    protected packData(data: unknown[], mappings: Partial<PointDataMappings>, potLength: boolean): ArrayBuffer {
        const dataMappings: PointDataMappings = Object.assign({}, kDefaultMappings, mappings);
        return packData(data, dataMappings, kGLTypes, potLength, (i, entry) => {
            this.map.set(entry.id, this._length + i);

            this.bb.min[0] = Math.min(this.bb.min[0], entry.x - entry.radius);
            this.bb.min[1] = Math.min(this.bb.min[1], entry.y - entry.radius);
            this.bb.min[2] = Math.min(this.bb.min[2], entry.z);

            this.bb.max[0] = Math.max(this.bb.max[0], entry.x + entry.radius);
            this.bb.max[1] = Math.max(this.bb.max[1], entry.y + entry.radius);
            this.bb.max[2] = Math.max(this.bb.max[2], entry.z);
        });
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
        drawCall.texture('uDataTexture', this.texture);
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
