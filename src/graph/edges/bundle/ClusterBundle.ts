import edgeVS from './ClusterBundle.vs.glsl';
import edgeFS from './ClusterBundle.fs.glsl';
import dataVS from './ClusterBundle.data.vs.glsl';

import {App, DrawCall, PicoGL, Program, VertexArray, VertexBuffer} from 'picogl';
import {GraferInputColor} from '../../../renderer/colors/ColorRegistry';
import {DataMappings, DataShader, PackDataCB, printDataGL} from '../../../data/DataTools';
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
    hyperEdgeStats?: [number, number],
}

const kClusterBundleEdgeNoOpMapping = (): null => null;
export const kClusterBundleEdgeMappings: DataMappings<ClusterBundleEdgeData & { index: number[] }> = {
    id: (entry: ClusterBundleEdgeData, i) => 'id' in entry ? entry.id : i,
    source: (entry: ClusterBundleEdgeData) => entry.source,
    target: (entry: ClusterBundleEdgeData) => entry.target,
    sourceCluster: (entry: ClusterBundleEdgeData) => entry.sourceCluster,
    targetCluster: (entry: ClusterBundleEdgeData) => entry.targetCluster,
    sourceColor: (entry: ClusterBundleEdgeData) => 'sourceColor' in entry ? entry.sourceColor : 0, // first registered color
    targetColor: (entry: ClusterBundleEdgeData) => 'targetColor' in entry ? entry.targetColor : 0, // first registered color
    hyperEdgeStats: kClusterBundleEdgeNoOpMapping, // this will be replaced in `computeMappings`
    index: () => [0, 1, 2],
};

export const kClusterBundleEdgeDataTypes: GLDataTypes<ClusterBundleEdgeData & { index: number[] }> = {
    source: PicoGL.UNSIGNED_INT,
    target: PicoGL.UNSIGNED_INT,
    sourceCluster: PicoGL.UNSIGNED_INT,
    targetCluster: PicoGL.UNSIGNED_INT,
    sourceColor: PicoGL.UNSIGNED_INT,
    targetColor: PicoGL.UNSIGNED_INT,
    hyperEdgeStats: [PicoGL.UNSIGNED_INT, PicoGL.UNSIGNED_INT],
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
    protected hyperEdgeStats: Map<string, number> = null;

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

        this.configureRenderContext(context, mode);

        switch (mode) {
            case RenderMode.PICKING:
                // this.pickingDrawCall.draw();
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

        if (edgesMappings.hyperEdgeStats === kClusterBundleEdgeNoOpMapping) {
            this.hyperEdgeStats = new Map();
            edgesMappings.hyperEdgeStats = (entry: ClusterBundleEdgeData): [number, number] => {
                if ('hyperEdgeStats' in entry) {
                    return entry.hyperEdgeStats;
                }
                return [0, 0];
            };
        }

        return edgesMappings as DataMappings<ClusterBundleEdgeData>;
    }

    protected packDataCB(): PackDataCB<ClusterBundleEdgeData> | PackDataCB<ClusterBundleEdgeData>[] {
        if (!this.hyperEdgeStats) {
            return null;
        }

        const cb1 = (i: number, entry: ClusterBundleEdgeData): void => {
            const key = `${entry.sourceCluster}=>${entry.targetCluster}`;
            let count = this.hyperEdgeStats.get(key);
            if (count === null || count === undefined) {
                count = 0;
            }
            this.hyperEdgeStats.set(key, count + 1);
            entry.hyperEdgeStats[0] = count;
        };

        const cb2 = (i: number, entry: ClusterBundleEdgeData): void => {
            const key = `${entry.sourceCluster}=>${entry.targetCluster}`;
            entry.hyperEdgeStats[1] = this.hyperEdgeStats.get(key);
        };

        return [
            cb1,
            cb2,
        ];
    }
}
