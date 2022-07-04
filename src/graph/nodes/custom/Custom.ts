import dataVS from './Custom.data.vs.glsl';
import nodeVS from './Custom.vs.glsl';
import nodeFS from './Custom.fs.glsl';
import pickingFS from './Custom.picking.fs.glsl';
import {Circle} from '../circle/Circle';
import {GLDataTypes, RenderableShaders} from '../../../renderer/Renderable';
import {DataShader, DataMappings} from '../../../data/DataTools';
import {BasicNodeData} from '../Nodes';
import {GraphPoints} from '../../../data/GraphPoints';
import {GraferContext} from '../../../renderer/GraferContext';
import {PickingManager} from '../../../UX/picking/PickingManager';
import PicoGL from 'picogl';

export const kCustomDataTypes = {
    point: PicoGL.UNSIGNED_INT,
    color: PicoGL.UNSIGNED_INT,
    texture: PicoGL.UNSIGNED_INT,
    radius: PicoGL.FLOAT, // optional at the end
};

export const kGLCustomNodeTypes = {
    position:PicoGL.UNSIGNED_INT,
    radius: PicoGL.FLOAT, // the radius must be computed since it can be overridden
    color: PicoGL.UNSIGNED_INT,
    texture: PicoGL.UNSIGNED_INT,
} as const;
export type GLCustomNodeTypes = typeof kGLCustomNodeTypes;

export class Custom extends Circle {
    // same as circle except for changed attribute index for picking VBO
    protected initialize(...args: any[]): void;
    protected initialize(
        context: GraferContext,
        points: GraphPoints,
        data: unknown[],
        mappings: Partial<DataMappings<BasicNodeData>>,
        pickingManager: PickingManager
    ): void {
        super.initialize(context, points, data, mappings, pickingManager);
        this.verticesVBO = context.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1,
        ]));

        this.pickingHandler = this.handlePickingEvent.bind(this);
        this.pickingColors = this.pickingManager.allocatePickingColors(data.length);
        this.pickingVBO = context.createVertexBuffer(PicoGL.UNSIGNED_BYTE, 4, this.pickingColors.colors);

        this.nodesVAO = context.createVertexArray().vertexAttributeBuffer(0, this.verticesVBO);
        this.configureTargetVAO(this.nodesVAO);
        this.nodesVAO.instanceAttributeBuffer(5, this.pickingVBO);

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

    protected getGLSourceTypes(): GLDataTypes<BasicNodeData> {
        return kCustomDataTypes;
    }

    protected getDataShader(): DataShader {
        return {
            vs: dataVS,
            varyings: [ 'fPoint', 'fRadius', 'fColor', 'fTexture' ],
        };
    }

    protected getGLTargetTypes(): GLDataTypes<GLCustomNodeTypes> {
        return kGLCustomNodeTypes;
    }

    protected getDrawShaders(): RenderableShaders {
        return {
            vs: nodeVS,
            fs: nodeFS,
        };
    }

    protected getPickingShaders(): RenderableShaders {
        const shaders = super.getPickingShaders();
        shaders.fs = pickingFS;
        return shaders;
    }
}
