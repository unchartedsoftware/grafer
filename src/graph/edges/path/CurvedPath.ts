import edgeVS from './CurvedPath.vs.glsl';
import edgeFS from './CurvedPath.fs.glsl';
import dataVS from './CurvedPath.data.vs.glsl';

import {App, DrawCall, PicoGL, Program, VertexArray, VertexBuffer} from 'picogl';
import {GraferInputColor} from '../../../renderer/ColorRegistry';
import {DataMappings, DataShader, kDataMappingFlatten} from '../../../data/DataTools';
import {
    GLDataTypes,
    RenderableShaders,
    RenderMode,
    RenderUniforms,
    setDrawCallUniforms,
} from '../../../renderer/Renderable';
import {Edges} from '../Edges';
import {GraphPoints} from '../../../data/GraphPoints';
import {PickingManager} from '../../../UX/picking/PickingManager';

export interface PathEdgeData {
    id?: number | string;
    source: number;
    target: number;
    control: number | number[];
    sourceColor?: GraferInputColor,
    targetColor?: GraferInputColor,
}

export const kPathEdgeMappings: DataMappings<PathEdgeData> = {
    id: (entry: PathEdgeData, i) => 'id' in entry ? entry.id : i,
    source: (entry: PathEdgeData) => entry.source,
    target: (entry: PathEdgeData) => entry.target,
    control: (entry: PathEdgeData) => entry.control,
    sourceColor: (entry: PathEdgeData) => 'sourceColor' in entry ? entry.sourceColor : 0, // first registered color
    targetColor: (entry: PathEdgeData) => 'targetColor' in entry ? entry.targetColor : 0, // first registered color
};

export const kPathEdgeDataTypes: GLDataTypes<PathEdgeData> = {
    source: PicoGL.UNSIGNED_INT,
    target: PicoGL.UNSIGNED_INT,
    control: [PicoGL.UNSIGNED_INT, PicoGL.UNSIGNED_INT, PicoGL.UNSIGNED_INT],
    sourceColor: PicoGL.UNSIGNED_INT,
    targetColor: PicoGL.UNSIGNED_INT,
};

export const kGLPathEdgeTypes = {
    source: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    target: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    control: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    sourceColor: PicoGL.UNSIGNED_INT,
    targetColor: PicoGL.UNSIGNED_INT,
    colorMix: [PicoGL.FLOAT, PicoGL.FLOAT],
} as const;
export type GLPathEdgeTypes = typeof kGLPathEdgeTypes;

export class CurvedPath extends Edges<PathEdgeData, GLPathEdgeTypes> {
    protected program: Program;
    protected drawCall: DrawCall;

    protected verticesVBO: VertexBuffer;
    protected edgesVAO: VertexArray;

    constructor(context: App,
                points: GraphPoints,
                data: unknown[],
                mappings: Partial<DataMappings<PathEdgeData>>,
                pickingManager: PickingManager,
                segments: number = 16
    ) {
        super(context, points, data, mappings, pickingManager);

        const segmentVertices = [];
        for (let i = 0; i <= segments; ++i) {
            segmentVertices.push(i / segments, 0);
        }

        this.verticesVBO = context.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array(segmentVertices));
        this.edgesVAO = context.createVertexArray().vertexAttributeBuffer(0, this.verticesVBO);
        this.configureTargetVAO(this.edgesVAO);

        const shaders = this.getDrawShaders();
        this.program = context.createProgram(shaders.vs, shaders.fs);
        this.drawCall = context.createDrawCall(this.program, this.edgesVAO).primitive(PicoGL.LINE_STRIP);

        this.compute(context, {
            uGraphPoints: this.dataTexture,
        });

        // printDataGL(context, this.targetVBO, data.length, kGLStraightEdgeTypes);
    }

    public destroy(): void {
        // TODO: Implement destroy method
    }

    public render(context:App, mode: RenderMode, uniforms: RenderUniforms): void {
        setDrawCallUniforms(this.drawCall, uniforms);
        setDrawCallUniforms(this.drawCall, this.localUniforms);

        context.enable(PicoGL.BLEND);
        context.blendFuncSeparate(PicoGL.SRC_ALPHA, PicoGL.ONE_MINUS_SRC_ALPHA, PicoGL.ONE, PicoGL.ONE);

        context.depthRange(this.nearDepth, this.farDepth);
        context.depthMask(false);

        switch (mode) {
            case RenderMode.PICKING:
                // this.pickingDrawCall.draw();
                break;

            case RenderMode.HIGH_PASS_2:
                break;

            default:
                this.drawCall.draw();
                break;
        }
    }

    protected getDrawShaders(): RenderableShaders {
        return {
            vs: edgeVS,
            fs: edgeFS,
        };
    }

    protected getPickingShaders(): RenderableShaders {
        return {
            vs: edgeVS,
            fs: null, // pickingFS,
        };
    }

    protected getGLSourceTypes(): GLDataTypes<PathEdgeData> {
        return kPathEdgeDataTypes;
    }

    protected getGLTargetTypes(): GLDataTypes<GLPathEdgeTypes> {
        return kGLPathEdgeTypes;
    }

    protected getDataShader(): DataShader {
        return {
            vs: dataVS,
            varyings: [ 'vSource', 'vTarget', 'vControl', 'vSourceColor', 'vTargetColor', 'vColorMix' ],
        };
    }

    protected computeMappings(mappings: Partial<DataMappings<PathEdgeData>>): DataMappings<PathEdgeData> {
        const edgesMappings = Object.assign({}, kPathEdgeMappings, super.computeMappings(mappings));

        // patches the mappings to get the points index from their IDs and account for flattening
        edgesMappings.control[kDataMappingFlatten] = (entry, i, l): number | number[] => {
            return [this.points.getPointIndex(entry.control[i]), i, l];
        };

        edgesMappings.source[kDataMappingFlatten] = (entry, i, l): number => {
            if (i === 0) {
                return entry.source;
            }
            return edgesMappings.control[kDataMappingFlatten](entry, i - 1, l)[0] as number;
        };

        edgesMappings.target[kDataMappingFlatten] = (entry, i, l): number => {
            if (i === l - 1) {
                return entry.target;
            }
            return edgesMappings.control[kDataMappingFlatten](entry, i + 1, l)[0] as number;
        };

        return edgesMappings as DataMappings<PathEdgeData>;
    }
}
