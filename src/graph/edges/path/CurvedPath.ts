import edgeVS from './CurvedPath.vs.glsl';
import edgeFS from './CurvedPath.fs.glsl';
import pickingFS from './CurvedPath.picking.fs.glsl';
import dataVS from './CurvedPath.data.vs.glsl';

import {App, DrawCall, PicoGL, Program, VertexArray, VertexBuffer} from 'picogl';
import {GraferInputColor} from '../../../renderer/colors/ColorRegistry';
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
import {PickingColors, PickingEvent, PickingManager} from '../../../UX/picking/PickingManager';
import {MouseCallback} from '../../../UX/mouse/MouseHandler';
import {GraferContext} from '../../../renderer/GraferContext';

export interface CurvedPathEdgeData {
    id?: number | string;
    source: number;
    target: number;
    control: number | number[];
    sourceColor?: GraferInputColor,
    targetColor?: GraferInputColor,
}

export const kCurvedPathEdgeMappings: DataMappings<CurvedPathEdgeData> = {
    id: (entry: CurvedPathEdgeData, i) => 'id' in entry ? entry.id : i,
    source: (entry: CurvedPathEdgeData) => entry.source,
    target: (entry: CurvedPathEdgeData) => entry.target,
    control: (entry: CurvedPathEdgeData) => entry.control,
    sourceColor: (entry: CurvedPathEdgeData) => 'sourceColor' in entry ? entry.sourceColor : 0, // first registered color
    targetColor: (entry: CurvedPathEdgeData) => 'targetColor' in entry ? entry.targetColor : 0, // first registered color
};

export const kCurvedPathEdgeDataTypes: GLDataTypes<CurvedPathEdgeData> = {
    source: PicoGL.UNSIGNED_INT,
    target: PicoGL.UNSIGNED_INT,
    control: [PicoGL.UNSIGNED_INT, PicoGL.UNSIGNED_INT, PicoGL.UNSIGNED_INT],
    sourceColor: PicoGL.UNSIGNED_INT,
    targetColor: PicoGL.UNSIGNED_INT,
};

export const kGLCurvedPathEdgeTypes = {
    source: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    target: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    control: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    sourceColor: PicoGL.UNSIGNED_INT,
    targetColor: PicoGL.UNSIGNED_INT,
    colorMix: [PicoGL.FLOAT, PicoGL.FLOAT],
} as const;
export type GLCurvedPathEdgeTypes = typeof kGLCurvedPathEdgeTypes;

export class CurvedPath extends Edges<CurvedPathEdgeData, GLCurvedPathEdgeTypes> {
    protected program: Program;
    protected drawCall: DrawCall;

    protected pickingProgram: Program;
    protected pickingDrawCall: DrawCall;
    protected pickingColors: PickingColors;
    protected pickingVBO: VertexBuffer;
    protected pickingHandler: MouseCallback;

    protected verticesVBO: VertexBuffer;
    protected edgesVAO: VertexArray;

    constructor(
        context: GraferContext,
        points: GraphPoints,
        data: unknown[],
        mappings: Partial<DataMappings<CurvedPathEdgeData>>,
        pickingManager: PickingManager,
        segments: number = 16
    ) {
        super(context, points, data, mappings, pickingManager, segments);
    }

    protected initialize(
        context: GraferContext,
        points: GraphPoints,
        data: unknown[],
        mappings: Partial<DataMappings<CurvedPathEdgeData>>,
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

        this.pickingHandler = this.handlePickingEvent.bind(this);
        this.pickingColors = this.pickingManager.allocatePickingColors(data.length);
        this.pickingVBO = context.createVertexBuffer(PicoGL.UNSIGNED_BYTE, 4, this.pickingColors.colors);

        this.edgesVAO = context.createVertexArray().vertexAttributeBuffer(0, this.verticesVBO);
        this.configureTargetVAO(this.edgesVAO);
        this.edgesVAO.instanceAttributeBuffer(7, this.pickingVBO);

        const shaders = this.getDrawShaders();
        this.program = context.createProgram(shaders.vs, shaders.fs);
        this.drawCall = context.createDrawCall(this.program, this.edgesVAO).primitive(PicoGL.TRIANGLE_STRIP);

        const pickingShaders = this.getPickingShaders();
        this.pickingProgram = context.createProgram(pickingShaders.vs, pickingShaders.fs);
        this.pickingDrawCall = context.createDrawCall(this.pickingProgram, this.edgesVAO).primitive(PicoGL.TRIANGLE_STRIP);

        this.compute(context, {
            uGraphPoints: this.dataTexture,
        });

        // printDataGL(context, this.targetVBO, data.length, kGLCurvedPathEdgeTypes);

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
                setDrawCallUniforms(this.pickingDrawCall, uniforms);
                setDrawCallUniforms(this.pickingDrawCall, this.localUniforms);
                this.pickingDrawCall.uniform('uPicking', true);
                this.pickingDrawCall.draw();
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
            fs: pickingFS,
        };
    }

    protected getGLSourceTypes(): GLDataTypes<CurvedPathEdgeData> {
        return kCurvedPathEdgeDataTypes;
    }

    protected getGLTargetTypes(): GLDataTypes<GLCurvedPathEdgeTypes> {
        return kGLCurvedPathEdgeTypes;
    }

    protected getDataShader(): DataShader {
        return {
            vs: dataVS,
            varyings: [ 'vSource', 'vTarget', 'vControl', 'vSourceColor', 'vTargetColor', 'vColorMix' ],
        };
    }

    protected computeMappings(mappings: Partial<DataMappings<CurvedPathEdgeData>>): DataMappings<CurvedPathEdgeData> {
        const edgesMappings = Object.assign({}, kCurvedPathEdgeMappings, super.computeMappings(mappings));

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

        return edgesMappings;
    }

    protected handlePickingEvent(event: PickingEvent, colorID: number): void {
        if (this.picking && this.pickingColors.map.has(colorID)) {
            const id = this.idArray[this.pickingColors.map.get(colorID)];
            this.emit(event, id);
        }
    }
}
