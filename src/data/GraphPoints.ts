import PicoGL, {App, Framebuffer, Texture} from 'picogl';
import pointsVS from './shaders/GraphPoints.vs.glsl';
import pointsFS from './shaders/GraphPoints.fs.glsl';
import {GLDataTypes, setDrawCallUniforms} from '../renderer/Renderable';
import {DataMappings, concatenateData, packData} from './DataTools';
import {vec3} from 'gl-matrix';
import {DataTexture} from '../renderer/DataTexture';

export enum ClassModes {
    NONE,
    ADD,
}

export interface PointOptions {
    positionClassMode?: ClassModes
    radiusClassMode?: ClassModes
    maxHierarchyDepth?: number
}

export interface PointData {
    id?: number | string;
    class?: number | string;
    x: number;
    y: number;
    z?: number;
    radius?: number;
}

export type PointDataMappings = DataMappings<PointData>;

const kDefaultMappings: PointDataMappings = {
    id: (entry: any, i) => 'id' in entry ? entry.id : i,
    class: (entry: any) => entry.class ?? null,
    x: (entry: any) => entry.x,
    y: (entry: any) => entry.y,
    z: (entry: any) => 'z' in entry ? entry.z : 0.0,
    radius: (entry: any) => 'radius' in entry ? entry.radius : 0.0,
};

const kGLTypesPoint: GLDataTypes<PointData> = {
    x: PicoGL.FLOAT,
    y: PicoGL.FLOAT,
    z: PicoGL.FLOAT,
    radius: PicoGL.FLOAT,
};

const kGLTypesClass: GLDataTypes<PointData> = {
    class: PicoGL.INT,
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

    private _frameBuffer: Framebuffer;

    private _classBuffer: ArrayBuffer;
    private _classView: DataView;
    private _classTexture: Texture;
    private _pointBuffer: ArrayBuffer;
    private _pointView: DataView;
    private _pointTexture: Texture;

    private _localUniforms = {
        uPositionClassMode: ClassModes.ADD,
        uRadiusClassMode: ClassModes.NONE,
        uMaxHierarchyDepth: 100,
    };
    private _dataArrayBuffer: Float32Array;

    private _length: number = 0;
    public get length(): number {
        return this._length;
    }

    public get positionClassMode(): ClassModes {
        return this._localUniforms.uPositionClassMode;
    }
    public set positionClassMode(value: ClassModes) {
        this._localUniforms.uPositionClassMode = value;
    }

    public get radiusClassMode(): ClassModes {
        return this._localUniforms.uRadiusClassMode;
    }
    public set radiusClassMode(value: ClassModes) {
        this._localUniforms.uRadiusClassMode = value;
    }

    public get maxHierarchyDepth(): number {
        return this._localUniforms.uMaxHierarchyDepth;
    }
    public set maxHierarchyDepth(value: number) {
        this._localUniforms.uMaxHierarchyDepth = value;
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

        const [pointBuffer, classBuffer] = this.packData(data, mappings, true, true);

        this._classBuffer = classBuffer;
        this._classView = new DataView(this._classBuffer);

        this._pointBuffer = pointBuffer;
        this._pointView = new DataView(this._pointBuffer);

        const diagonalVec = vec3.sub(vec3.create(), this.bb.max, this.bb.min);
        this.bbDiagonal = vec3.length(diagonalVec);
        this.bbCenter = vec3.add(vec3.create(), this.bb.min, vec3.mul(vec3.create(), diagonalVec, vec3.fromValues(0.5, 0.5, 0.5)));

        this._length = data.length;

        // set the dirty flag so the texture is updated next time it is requested
        this.dirty = true;
    }

    public destroy(): void {
        super.destroy();
        this.map.clear();

        this._classTexture.delete();
        this._pointTexture.delete();

        this._classBuffer = null;
        this._pointBuffer = null;
        this._dataArrayBuffer = null;
        this.map = null;
    }

    public update(): void {
        if (this.dirty) {
            const classInt32 = new Int32Array(this._classBuffer);
            this._classTexture.data(classInt32);
            const pointFloat32 = new Float32Array(this._pointBuffer);
            this._pointTexture.data(pointFloat32);

            this.processData(this.context);
        }
        this.dirty = false;
    }

    public getPointIndex(id: number | string): number {
        return this.map.get(id);
    }

    public getPointByIndex(index: number, isRelative = false): [number, number, number, number] {
        if(isRelative) {
            return [
                this._pointView.getFloat32(index * 16, true),
                this._pointView.getFloat32(index * 16 + 4, true),
                this._pointView.getFloat32(index * 16 + 8, true),
                this._pointView.getFloat32(index * 16 + 12, true),
            ];
        }
        return [
            this._dataArrayBuffer[index],
            this._dataArrayBuffer[index + 1],
            this._dataArrayBuffer[index + 2],
            this._dataArrayBuffer[index + 3],
        ];
    }

    public getPointByID(id: number | string, isRelative = false): [number, number, number, number] {
        return this.getPointByIndex(this.getPointIndex(id), isRelative);
    }

    public setPointByIndex(index: number, data: unknown, mappings: Partial<PointDataMappings> = {}): void {
        const [pointBuffer, classBuffer] = this.packData([data], mappings, false, false);

        const pointView = new Float32Array(pointBuffer);
        this._pointView.setFloat32(index * 16, pointView[0], true);
        this._pointView.setFloat32(index * 16 + 4, pointView[1], true);
        this._pointView.setFloat32(index * 16 + 8, pointView[2], true);
        this._pointView.setFloat32(index * 16 + 12, pointView[3], true);

        const classView = new Int32Array(classBuffer);
        this._classView.setInt32(index * 4, classView[0], true);

        this.dirty = true;
    }

    public setPointByID(id: number | string, data: unknown, mappings: Partial<PointDataMappings> = {}): void {
        return this.setPointByIndex(this.getPointIndex(id), data, mappings);
    }

    public addPoints(data: unknown[], mappings: Partial<PointDataMappings> = {}): void {
        this.resizeTexture(this._length + data.length);
        const [pointBuffer, classBuffer] = this.packData(data, mappings, false, true);

        // create and populate points buffer
        const pointBytes = new Uint32Array(pointBuffer);
        const pointBytesOld = new Uint32Array(this._pointBuffer, 0, this._length * 4);
        this._pointBuffer = new ArrayBuffer(this.capacity * 16); // 16 bytes for 4 floats
        this._pointView = new DataView(this._pointBuffer);
        const pointBytesMerge = new Uint32Array(this._pointBuffer);
        pointBytesMerge.set(pointBytesOld);
        pointBytesMerge.set(pointBytes, pointBytesOld.length);

        // create and populate class buffer
        const classBytes = new Uint32Array(classBuffer);
        const classBytesOld = new Uint32Array(this._classBuffer, 0, this._length);
        this._classBuffer = new ArrayBuffer(this.capacity * 4); // 4 bytes for 1 float
        this._classView = new DataView(this._classBuffer);
        const classBytesMerge = new Uint32Array(this._classBuffer);
        classBytesMerge.set(classBytesOld);
        classBytesMerge.set(classBytes, classBytesOld.length);

        this._length += data.length;
        this.dirty = true;
    }

    protected createTexture(width: number, height: number): Texture {
        this._frameBuffer = this.context.createFramebuffer();
        return this.context.createTexture2D(width, height, {
            internalFormat: PicoGL.RGBA32F,
        });
    }

    protected resizeTexture(capacity: number): void {
        if (this.capacity < capacity) {
            super.resizeTexture(capacity);
            const [textureWidth, textureHeight] = this.textureSize;

            // resize / create class texture
            if (this._classTexture) {
                this._classTexture.resize(textureWidth, textureHeight);
            } else {
                this._classTexture = this.context.createTexture2D(textureWidth, textureHeight, {
                    internalFormat: PicoGL.R32I,
                });
            }

            // resize / create point texture
            if (this._pointTexture) {
                this._pointTexture.resize(textureWidth, textureHeight);
            } else {
                this._pointTexture = this.context.createTexture2D(textureWidth, textureHeight, {
                    internalFormat: PicoGL.RGBA32F,
                });
            }
        }
    }

    protected packData(data: unknown[], mappings: Partial<PointDataMappings>, potLength: boolean, addMapEntry: boolean): [ArrayBuffer, ArrayBuffer] {
        const dataMappings: PointDataMappings = Object.assign({}, kDefaultMappings, mappings);
        const pointData = packData(data, dataMappings, kGLTypesPoint, potLength, (i, entry) => {
            if(addMapEntry) this.map.set(entry.id, this._length + i);

            this.bb.min[0] = Math.min(this.bb.min[0], entry.x - entry.radius);
            this.bb.min[1] = Math.min(this.bb.min[1], entry.y - entry.radius);
            this.bb.min[2] = Math.min(this.bb.min[2], entry.z);

            this.bb.max[0] = Math.max(this.bb.max[0], entry.x + entry.radius);
            this.bb.max[1] = Math.max(this.bb.max[1], entry.y + entry.radius);
            this.bb.max[2] = Math.max(this.bb.max[2], entry.z);
        });
        const classData = packData(data, dataMappings, kGLTypesClass, potLength, (i, entry) => {
            if(entry.class === null) {
                entry.class = -1;
            } else {
                entry.class = this.map.get(entry.class) ?? -1;
            }
        });

        return [pointData, classData];
    }

    protected processData(context: App): Texture {
        const {gl} = context;

        // resize viewport to data texture size and save original viewport size
        const savedViewport = gl.getParameter(gl.VIEWPORT);
        context.viewport(0, 0, ...this.textureSize as [number, number]);

        // reset necessary context flags
        this.context.disable(PicoGL.BLEND);

        // create program with single mesh covering clip space
        const program = context.createProgram(pointsVS, pointsFS);
        const verticesVBO = context.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1,
        ]));
        const pointsVAO = context.createVertexArray()
            .vertexAttributeBuffer(0, verticesVBO);

        // bind frame buffer to context
        context.readFramebuffer(this._frameBuffer);
        this._frameBuffer.colorTarget(0, this._texture);
        context.drawFramebuffer(this._frameBuffer)
            .clearColor(0, 0, 0, 0)
            .clear()
            .depthMask(false);

        // create and initiate draw call
        const drawCall = context.createDrawCall(program, pointsVAO)
            .primitive(PicoGL.TRIANGLE_STRIP);
        setDrawCallUniforms(drawCall, Object.assign({}, this._localUniforms, {
            uPointTexture: this._pointTexture,
            uClassTexture: this._classTexture,
        }));
        drawCall.draw();

        // read points texture into stored buffer for point coordinates readback
        this.readTextureAsync(this._frameBuffer.colorAttachments[0]).then(texArrayBuffer => {
            this._dataArrayBuffer = texArrayBuffer;
        });

        // debug print out
        // console.log(this.readTexture(this._pointTexture));
        // this._dataArrayBuffer = this.readTexture(this._frameBuffer.colorAttachments[0]);
        // console.log(this._dataArrayBuffer);

        // switch back to canvas frame buffer and restore original viewport size
        context.defaultDrawFramebuffer();
        context.viewport(...savedViewport as [number, number, number, number]);
    }
}
