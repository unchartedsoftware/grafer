import edgeVS from './StraightPath.vs.glsl';
import edgeFS from './StraightPath.fs.glsl';
import dataVS from './StraightPath.data.vs.glsl';

import {CurvedPathEdgeData, GLCurvedPathEdgeTypes, kCurvedPathEdgeMappings} from './CurvedPath';
import {
    GLDataTypes,
    RenderableShaders,
    RenderMode,
    RenderUniforms,
    setDrawCallUniforms,
} from '../../../renderer/Renderable';
import {App, DrawCall, PicoGL, Program, VertexArray, VertexBuffer} from 'picogl';
import {DataMappings, DataShader, kDataMappingFlatten} from '../../../data/DataTools';
import {BasicEdgeData, Edges} from '../Edges';
import {GraferContext} from '../../../renderer/GraferContext';
import {GraphPoints} from '../../../data/GraphPoints';
import {PickingManager} from '../../../UX/picking/PickingManager';

export const kStraightPathEdgeDataTypes: GLDataTypes<CurvedPathEdgeData> = {
    source: PicoGL.UNSIGNED_INT,
    target: PicoGL.UNSIGNED_INT,
    control: [PicoGL.UNSIGNED_INT, PicoGL.UNSIGNED_INT],
    sourceColor: PicoGL.UNSIGNED_INT,
    targetColor: PicoGL.UNSIGNED_INT,
};

export const kGLStraightPathEdgeTypes = {
    source: PicoGL.UNSIGNED_INT,
    target: PicoGL.UNSIGNED_INT,
    sourceColor: PicoGL.UNSIGNED_INT,
    targetColor: PicoGL.UNSIGNED_INT,
    colorMix: [PicoGL.FLOAT, PicoGL.FLOAT],
} as const;
export type GLStraightPathEdgeTypes = typeof kGLStraightPathEdgeTypes;

export class StraightPath extends Edges<CurvedPathEdgeData, GLCurvedPathEdgeTypes> {
    protected program: Program;
    protected drawCall: DrawCall;

    protected verticesVBO: VertexBuffer;
    protected edgesVAO: VertexArray;

    protected initialize(
        context: GraferContext,
        points: GraphPoints,
        data: unknown[],
        mappings: Partial<DataMappings<BasicEdgeData>>,
        pickingManager: PickingManager
    ): void {
        super.initialize(context, points, data, mappings, pickingManager);

        this.verticesVBO = context.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array([
            -1, 0,
            1, 0,
            -1, 1,
            1, 1,
        ]));

        this.edgesVAO = context.createVertexArray().vertexAttributeBuffer(0, this.verticesVBO);
        this.configureTargetVAO(this.edgesVAO);

        const shaders = this.getDrawShaders();
        this.program = context.createProgram(shaders.vs, shaders.fs);
        this.drawCall = context.createDrawCall(this.program, this.edgesVAO).primitive(PicoGL.TRIANGLE_STRIP);

        this.compute(context, {
            uGraphPoints: this.dataTexture,
        });

        // printDataGL(context, this.targetVBO, data.length, kGLStraightPathEdgeTypes);
    }

    public destroy(): void {
        // TODO: Implement destroy method
    }

    public render(context:App, mode: RenderMode, uniforms: RenderUniforms): void {
        this.configureRenderContext(context, mode);

        setDrawCallUniforms(this.drawCall, uniforms);
        setDrawCallUniforms(this.drawCall, this.localUniforms);

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

    protected getGLSourceTypes(): GLDataTypes<CurvedPathEdgeData> {
        return kStraightPathEdgeDataTypes;
    }

    protected getGLTargetTypes(): GLDataTypes<GLStraightPathEdgeTypes> {
        return kGLStraightPathEdgeTypes;
    }

    protected getDataShader(): DataShader {
        return {
            vs: dataVS,
            varyings: [ 'fSource', 'fTarget', 'fSourceColor', 'fTargetColor', 'fColorMix' ],
        };
    }

    protected computeMappings(mappings: Partial<DataMappings<CurvedPathEdgeData>>): DataMappings<CurvedPathEdgeData> {
        const edgesMappings = Object.assign({}, kCurvedPathEdgeMappings, super.computeMappings(mappings));

        const superControl = edgesMappings.control;
        edgesMappings.control = (entry, i, l): number | number[] => {
            const control = superControl(entry, i, l);
            if (Array.isArray(control)) {
                control.push(null);
            }
            return control;
        };

        // patches the mappings to get the points index from their IDs and account for flattening
        edgesMappings.control[kDataMappingFlatten] = (entry, i, l): number | number[] => {
            return [i, l];
        };

        const getControl = (entry: CurvedPathEdgeData, i: number): number => this.points.getPointIndex(entry.control[i]);

        edgesMappings.source[kDataMappingFlatten] = (entry, i): number => {
            if (i === 0) {
                return entry.source;
            }
            return getControl(entry, i - 1);
        };

        edgesMappings.target[kDataMappingFlatten] = (entry, i, l): number => {
            if (i === l - 1) {
                return entry.target;
            }
            return getControl(entry, i);
        };

        return edgesMappings;
    }
}
