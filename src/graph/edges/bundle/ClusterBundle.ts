import edgeVS from './ClusterBundle.vs.glsl';
import edgeFS from './ClusterBundle.fs.glsl';
import dataVS from './ClusterBundle.data.vs.glsl';

import {App, DrawCall, PicoGL, Program, VertexArray, VertexBuffer} from 'picogl';
import {GraferInputColor} from '../../../renderer/ColorRegistry';
import {DataMappings, DataShader, printDataGL} from '../../../data/DataTools';
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
import {GraferContext} from '../../../renderer/GraferContext';

export interface ClusterBundleEdgeData {
    id?: number | string;
    source: number;
    target: number;
    sourceCluster: number;
    targetCluster: number;
    sourceColor?: GraferInputColor,
    targetColor?: GraferInputColor,
}

export const kClusterBundleEdgeMappings: DataMappings<ClusterBundleEdgeData & { index: number[] }> = {
    id: (entry: ClusterBundleEdgeData, i) => 'id' in entry ? entry.id : i,
    source: (entry: ClusterBundleEdgeData) => entry.source,
    target: (entry: ClusterBundleEdgeData) => entry.target,
    sourceCluster: (entry: ClusterBundleEdgeData) => entry.sourceCluster,
    targetCluster: (entry: ClusterBundleEdgeData) => entry.targetCluster,
    sourceColor: (entry: ClusterBundleEdgeData) => 'sourceColor' in entry ? entry.sourceColor : 0, // first registered color
    targetColor: (entry: ClusterBundleEdgeData) => 'targetColor' in entry ? entry.targetColor : 0, // first registered color
    index: () => [0, 1, 2],
};

export const kClusterBundleEdgeDataTypes: GLDataTypes<ClusterBundleEdgeData & { index: number[] }> = {
    source: PicoGL.UNSIGNED_INT,
    target: PicoGL.UNSIGNED_INT,
    sourceCluster: PicoGL.UNSIGNED_INT,
    targetCluster: PicoGL.UNSIGNED_INT,
    sourceColor: PicoGL.UNSIGNED_INT,
    targetColor: PicoGL.UNSIGNED_INT,
    index: PicoGL.UNSIGNED_INT,
};

export const kGLClusterBundleEdgeTypes = {
    source: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    target: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    control: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    sourceColor: PicoGL.UNSIGNED_INT,
    targetColor: PicoGL.UNSIGNED_INT,
    colorMix: [PicoGL.FLOAT, PicoGL.FLOAT],
} as const;
export type GLClusterBundleEdgeTypes = typeof kGLClusterBundleEdgeTypes;

export class ClusterBundle extends Edges<ClusterBundleEdgeData, GLClusterBundleEdgeTypes> {
    protected program: Program;
    protected drawCall: DrawCall;

    protected verticesVBO: VertexBuffer;
    protected edgesVAO: VertexArray;

    constructor(
        context: GraferContext,
        points: GraphPoints,
        data: unknown[],
        mappings: Partial<DataMappings<ClusterBundleEdgeData>>,
        pickingManager: PickingManager,
        segments: number = 16
    ) {
        super(context, points, data, mappings, pickingManager, segments);
    }

    protected initialize(
        context: GraferContext,
        points: GraphPoints,
        data: unknown[],
        mappings: Partial<DataMappings<ClusterBundleEdgeData>>,
        pickingManager: PickingManager,
        segments: number
    ): void {
        super.initialize(context, points, data, mappings, pickingManager);

        const segmentVertices = [];
        for (let i = 0; i <= segments; ++i) {
            segmentVertices.push(
                -1, i,
                1, i
            );
        }

        this.verticesVBO = context.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array(segmentVertices));
        this.edgesVAO = context.createVertexArray().vertexAttributeBuffer(0, this.verticesVBO);
        this.configureTargetVAO(this.edgesVAO);

        const shaders = this.getDrawShaders();
        this.program = context.createProgram(shaders.vs, shaders.fs);
        this.drawCall = context.createDrawCall(this.program, this.edgesVAO).primitive(PicoGL.TRIANGLE_STRIP);

        this.compute(context, {
            uGraphPoints: this.dataTexture,
        });

        // printDataGL(context, this.targetVBO, data.length, kGLClusterBundleEdgeTypes);

        this.localUniforms.uSegments = segments;
    }

    public destroy(): void {
        // TODO: Implement destroy method
    }

    public render(context:App, mode: RenderMode, uniforms: RenderUniforms): void {
        setDrawCallUniforms(this.drawCall, uniforms);
        setDrawCallUniforms(this.drawCall, this.localUniforms);

        context.enable(PicoGL.BLEND);

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

    protected getGLSourceTypes(): GLDataTypes<ClusterBundleEdgeData> {
        return kClusterBundleEdgeDataTypes;
    }

    protected getGLTargetTypes(): GLDataTypes<GLClusterBundleEdgeTypes> {
        return kGLClusterBundleEdgeTypes;
    }

    protected getDataShader(): DataShader {
        return {
            vs: dataVS,
            varyings: [ 'vSource', 'vTarget', 'vControl', 'vSourceColor', 'vTargetColor', 'vColorMix' ],
        };
    }

    protected computeMappings(mappings: Partial<DataMappings<ClusterBundleEdgeData>>): DataMappings<ClusterBundleEdgeData> {
        const edgesMappings = Object.assign({}, kClusterBundleEdgeMappings, super.computeMappings(mappings));

        // patches the mappings to get the points index from their IDs
        const sourceClusterMapping = edgesMappings.sourceCluster;
        edgesMappings.sourceCluster = (entry, i): number => {
            return this.points.getPointIndex(sourceClusterMapping(entry, i));
        };

        const targetClusterMapping = edgesMappings.targetCluster;
        edgesMappings.targetCluster = (entry, i): number => {
            return this.points.getPointIndex(targetClusterMapping(entry, i));
        };

        return edgesMappings as DataMappings<ClusterBundleEdgeData>;
    }
}
