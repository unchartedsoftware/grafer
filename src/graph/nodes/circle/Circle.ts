import nodeVS from './Circle.vs.glsl';
import nodeFS from './Circle.fs.glsl';
import dataVS from './Circle.data.vs.glsl';
import pickingFS from './Circle.picking.fs.glsl';

import {BasicNodeData, kBasicNodeDataTypes, Nodes} from '../Nodes';
import {App, DrawCall, PicoGL, Program, VertexArray, VertexBuffer} from 'picogl';
import {GraphPoints} from '../../../data/GraphPoints';
import {DataMappings, DataShader} from '../../../data/DataTools';
import {PickingColors, PickingEvent, PickingManager} from '../../../UX/picking/PickingManager';
import {MouseCallback} from '../../../UX/mouse/MouseHandler';
import {
    GLDataTypes,
    RenderableShaders,
    RenderMode,
    RenderUniforms,
    setDrawCallUniforms,
} from '../../../renderer/Renderable';
import {GraferContext} from '../../../renderer/GraferContext';

export const kGLCircleNodeTypes = {
    // TODO: maybe use points indices?
    position: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    // TODO: maybe skip and use vertex indices when point radius is used.
    radius: PicoGL.FLOAT,
    // TODO: Create a color texture and use indices here.
    color: PicoGL.UNSIGNED_INT,
} as const;
export type GLCircleNodeTypes = typeof kGLCircleNodeTypes;

export class Circle extends Nodes<BasicNodeData, GLCircleNodeTypes> {
    protected program: Program;
    protected drawCall: DrawCall;

    protected pickingProgram: Program;
    protected pickingDrawCall: DrawCall;
    protected pickingColors: PickingColors;
    protected pickingVBO: VertexBuffer;
    protected pickingHandler: MouseCallback;

    protected verticesVBO: VertexBuffer;
    protected nodesVAO: VertexArray;

    protected usePointRadius: boolean;

    constructor(
        context: GraferContext,
        points: GraphPoints,
        data: unknown[],
        mappings: Partial<DataMappings<BasicNodeData>>,
        pickingManager: PickingManager
    );
    constructor(...args: any[]);
    constructor(...args: any[]) {
        super(...args);
    }

    protected initialize(...args: any[]);
    protected initialize(
        context: GraferContext,
        points: GraphPoints,
        data: unknown[],
        mappings: Partial<DataMappings<BasicNodeData>>,
        pickingManager: PickingManager
    ) {
        super.initialize(context, points, data, mappings, pickingManager);
        this.verticesVBO = context.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1,
        ]));

        this.pickingHandler = this.handlePickingEvent.bind(this)
        this.pickingColors = this.pickingManager.allocatePickingColors(data.length);
        this.pickingVBO = context.createVertexBuffer(PicoGL.UNSIGNED_BYTE, 4, this.pickingColors.colors);

        this.nodesVAO = context.createVertexArray().vertexAttributeBuffer(0, this.verticesVBO);
        this.configureTargetVAO(this.nodesVAO);
        this.nodesVAO.instanceAttributeBuffer(4, this.pickingVBO);

        const shaders = this.getDrawShaders();
        this.program = context.createProgram(shaders.vs, shaders.fs);
        this.drawCall = context.createDrawCall(this.program, this.nodesVAO).primitive(PicoGL.TRIANGLE_STRIP);

        const pickingShaders = this.getPickingShaders();
        this.pickingProgram = context.createProgram(pickingShaders.vs, pickingShaders.fs);
        this.pickingDrawCall = context.createDrawCall(this.pickingProgram, this.nodesVAO).primitive(PicoGL.TRIANGLE_STRIP);

        const computedMappings = this.computeMappings(mappings);
        this.usePointRadius = computedMappings.radius === null;

        this.compute(context, {
            uGraphPoints: this.dataTexture,
            uUsePointRadius: this.usePointRadius,
        });

        this.pickingManager.on(PickingManager.events.hoverOn, this.pickingHandler);
        this.pickingManager.on(PickingManager.events.hoverOff, this.pickingHandler);
        this.pickingManager.on(PickingManager.events.click, this.pickingHandler);

        // printDataGL(context, this.targetVBO, data.length, kGLCircleNodeTypes);
    }

    public destroy(): void {
        // TODO: Implement destroy method
    }

    public render(context:App, mode: RenderMode, uniforms: RenderUniforms): void {
        context.disable(PicoGL.BLEND);

        context.depthRange(this.nearDepth, this.farDepth);
        context.depthMask(true);

        switch (mode) {
            case RenderMode.PICKING:
                if (this.picking) {
                    setDrawCallUniforms(this.pickingDrawCall, uniforms);
                    setDrawCallUniforms(this.pickingDrawCall, this.localUniforms);
                    this.pickingDrawCall.uniform('uPicking', true);
                    this.pickingDrawCall.draw();
                }
                break;

            case RenderMode.HIGH_PASS_2:
                context.depthMask(false);
                context.enable(PicoGL.BLEND);
                /* fallthrough */
            default:
                setDrawCallUniforms(this.drawCall, uniforms);
                setDrawCallUniforms(this.drawCall, this.localUniforms);
                this.drawCall.uniform('uPicking', false);
                this.drawCall.draw();
                break;
        }
    }

    protected getDrawShaders(): RenderableShaders {
        return {
            vs: nodeVS,
            fs: nodeFS,
        };
    }

    protected getPickingShaders(): RenderableShaders {
        return {
            vs: nodeVS,
            fs: pickingFS,
        };
    }

    protected getGLSourceTypes(): GLDataTypes<BasicNodeData> {
        return kBasicNodeDataTypes;
    }

    protected getGLTargetTypes(): GLDataTypes<GLCircleNodeTypes> {
        return kGLCircleNodeTypes;
    }

    protected getDataShader(): DataShader {
        return {
            vs: dataVS,
            varyings: [ 'vPosition', 'vRadius', 'vColor' ],
        };
    }

    protected handlePickingEvent(event: PickingEvent, colorID: number): void {
        if (this.picking && this.pickingColors.map.has(colorID)) {
            const id = this.idArray[this.pickingColors.map.get(colorID)];
            this.emit(event, id);
        }
    }
}
