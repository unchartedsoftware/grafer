import {GraphPoints} from './GraphPoints';
import {App, DrawCall, PicoGL, Program, Texture, TransformFeedback, VertexArray, VertexBuffer} from 'picogl';
import {computeDataTypes, DataMappings, DataShader, packData, PackDataCB} from './DataTools';
import {configureVAO, GenericUniforms, GLDataTypes, glDataTypesInfo, setDrawCallUniforms} from '../renderer/Renderable';
import noopFS from './shaders/noop.fs.glsl';
import {GraferContext} from '../renderer/GraferContext';

export abstract class PointsReader<T_SRC, T_TGT> {
    private dataDrawCall: DrawCall;
    private dataProgram: Program;
    private dataBuffer: ArrayBuffer;
    private dataStride: number;
    private dataView: DataView;

    protected points: GraphPoints;

    protected sourceVBO: VertexBuffer;
    protected sourceVAO: VertexArray;

    protected targetVBO: VertexBuffer;
    protected targetTFO: TransformFeedback;

    protected get dataTexture(): Texture {
        return this.points.texture;
    }

    protected constructor(context: GraferContext, points: GraphPoints, data: unknown[], mappings: Partial<DataMappings<T_SRC>>);
    protected constructor(...args: any[]); // TypeScript is weird some times!
    protected constructor(...args: any[]) {
        this.initialize(...args);
    }

    protected initialize(...args: any[]): void;
    protected initialize(context: GraferContext, points: GraphPoints, data: unknown[], mappings: Partial<DataMappings<T_SRC>>): void {
        this.points = points;
        this.ingestData(context, data, mappings);
        this.initializeTargetBuffers(context, this.dataBuffer.byteLength / this.dataStride);
        this.initializeDataDrawCall(context);
    }

    protected ingestData(context: App, data: unknown[], mappings: Partial<DataMappings<T_SRC>>): void {
        // compute the data mappings for this instance
        const dataMappings: DataMappings<T_SRC> = this.computeMappings(mappings);

        // get the GL data types for this instance
        const types = computeDataTypes(this.getGLSourceTypes(), dataMappings);

        this.dataBuffer = packData(data, dataMappings, types, false, this.packDataCB());
        this.dataView = new DataView(this.dataBuffer);

        // initialize the data WebGL objects
        const typesInfo = glDataTypesInfo(types);
        this.dataStride = typesInfo.stride;
        this.sourceVBO = context.createInterleavedBuffer(this.dataStride, this.dataView);
        this.sourceVAO = context.createVertexArray();

        configureVAO(this.sourceVAO, this.sourceVBO, types, typesInfo);
    }

    protected initializeTargetBuffers(context: App, dataLength: number): void {
        const targetTypes = this.getGLTargetTypes();
        const stride = glDataTypesInfo(targetTypes).stride;

        this.targetVBO = context.createInterleavedBuffer(stride, dataLength * stride);
        this.targetTFO = context.createTransformFeedback().feedbackBuffer(0, this.targetVBO);
    }

    protected initializeDataDrawCall(context: App): void {
        const dataShader = this.getDataShader();

        this.dataProgram = context.createProgram(dataShader.vs, noopFS, {
            transformFeedbackVaryings: dataShader.varyings,
            transformFeedbackMode: PicoGL.INTERLEAVED_ATTRIBS,
        });

        this.dataDrawCall = context.createDrawCall(this.dataProgram, this.sourceVAO).transformFeedback(this.targetTFO);
        this.dataDrawCall.primitive(PicoGL.POINTS);
    }

    public compute(context: App, uniforms: GenericUniforms): void {
        setDrawCallUniforms(this.dataDrawCall, uniforms);

        context.enable(PicoGL.RASTERIZER_DISCARD);
        this.dataDrawCall.draw();
        context.disable(PicoGL.RASTERIZER_DISCARD);
    }

    protected configureTargetVAO(vao: VertexArray, attrIndex: number = 1): void {
        const types = this.getGLTargetTypes();
        const typesInfo = glDataTypesInfo(types);
        configureVAO(vao, this.targetVBO, types, typesInfo, attrIndex, true);
    }

    protected packDataCB(): PackDataCB<T_SRC> | PackDataCB<T_SRC>[] {
        return (): null => null;
    }

    protected abstract computeMappings(mappings: Partial<DataMappings<T_SRC>>): DataMappings<T_SRC>;
    protected abstract getGLSourceTypes(): GLDataTypes<T_SRC>;
    protected abstract getGLTargetTypes(): GLDataTypes<T_TGT>;
    protected abstract getDataShader(): DataShader;
}
