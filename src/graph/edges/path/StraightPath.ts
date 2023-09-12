import edgeVS from './StraightPath.vs.glsl';
import edgeFS from './StraightPath.fs.glsl';
import pickingFS from './StraightPath.picking.fs.glsl';
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
import {PickingColors, PickingEvent, PickingManager} from '../../../UX/picking/PickingManager';
import { MouseCallback } from 'src/UX/mouse/MouseHandler';

export const kStraightPathEdgeDataTypes: GLDataTypes<CurvedPathEdgeData> = {
    source: PicoGL.UNSIGNED_INT,
    target: PicoGL.UNSIGNED_INT,
    control: [PicoGL.UNSIGNED_INT, PicoGL.UNSIGNED_INT],
    sourceColor: PicoGL.UNSIGNED_INT,
    targetColor: PicoGL.UNSIGNED_INT,
    width: PicoGL.FLOAT,
    pickingColor: [PicoGL.UNSIGNED_INT, PicoGL.UNSIGNED_INT, PicoGL.UNSIGNED_INT, PicoGL.UNSIGNED_INT],
};

export const kGLStraightPathEdgeTypes = {
    source: PicoGL.UNSIGNED_INT,
    target: PicoGL.UNSIGNED_INT,
    sourceColor: PicoGL.UNSIGNED_INT,
    targetColor: PicoGL.UNSIGNED_INT,
    colorMix: [PicoGL.FLOAT, PicoGL.FLOAT],
    width: PicoGL.FLOAT,
    pickingColor: [PicoGL.UNSIGNED_INT, PicoGL.UNSIGNED_INT, PicoGL.UNSIGNED_INT, PicoGL.UNSIGNED_INT],
} as const;
export type GLStraightPathEdgeTypes = typeof kGLStraightPathEdgeTypes;

export class StraightPath extends Edges<CurvedPathEdgeData, GLCurvedPathEdgeTypes> {
    protected program: Program;
    protected drawCall: DrawCall;

    protected pickingProgram: Program;
    protected pickingDrawCall: DrawCall;
    protected pickingColors: PickingColors;
    protected pickingHandler: MouseCallback;

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

        this.pickingHandler = this.handlePickingEvent.bind(this);

        this.edgesVAO = context.createVertexArray().vertexAttributeBuffer(0, this.verticesVBO);
        this.configureTargetVAO(this.edgesVAO);

        const shaders = this.getDrawShaders();
        this.program = context.createProgram(shaders.vs, shaders.fs);
        this.drawCall = context.createDrawCall(this.program, this.edgesVAO).primitive(PicoGL.TRIANGLE_STRIP);

        const pickingShaders = this.getPickingShaders();
        this.pickingProgram = context.createProgram(pickingShaders.vs, pickingShaders.fs);
        this.pickingDrawCall = context.createDrawCall(this.pickingProgram, this.edgesVAO).primitive(PicoGL.TRIANGLE_STRIP);

        this.compute(context, {
            uGraphPoints: this.dataTexture,
        });

        // printDataGL(context, this.targetVBO, data.length, kGLStraightPathEdgeTypes);
        this.pickingManager.on(PickingManager.events.hoverOn, this.pickingHandler);
        this.pickingManager.on(PickingManager.events.hoverOff, this.pickingHandler);
        this.pickingManager.on(PickingManager.events.click, this.pickingHandler);
    }

    public destroy(): void {
        // TODO: Implement destroy method
    }

    protected ingestData(context: App, data: unknown[], mappings: Partial<DataMappings<CurvedPathEdgeData>>): void {
        this.pickingColors = this.pickingManager.allocatePickingColors(data.length);
        super.ingestData(context, data, mappings);
    }

    protected packDataCB(): any {
        return (index, entry): void => {
            this.idArray.push(entry.id);

            const indexStart = 4 * index;
            entry.pickingColor = [
                this.pickingColors.colors[indexStart],
                this.pickingColors.colors[indexStart + 1],
                this.pickingColors.colors[indexStart + 2],
                this.pickingColors.colors[indexStart + 3],
            ];
        };
    }

    public render(context:App, mode: RenderMode, uniforms: RenderUniforms): void {
        this.configureRenderContext(context, mode);

        setDrawCallUniforms(this.drawCall, uniforms);
        setDrawCallUniforms(this.drawCall, this.localUniforms);

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
        return kStraightPathEdgeDataTypes;
    }

    protected getGLTargetTypes(): GLDataTypes<GLStraightPathEdgeTypes> {
        return kGLStraightPathEdgeTypes;
    }

    protected getDataShader(): DataShader {
        return {
            vs: dataVS,
            varyings: [ 'fSource', 'fTarget', 'fSourceColor', 'fTargetColor', 'fColorMix', 'fWidth', 'fPickingColor' ],
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

    protected handlePickingEvent(event: PickingEvent, colorID: number): void {
        if (this.picking && this.pickingColors.map.has(colorID)) {
            const id = this.idArray[this.pickingColors.map.get(colorID)];
            this.emit(event, id);
        }
    }
}
