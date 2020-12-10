import nodeFS from './Star.fs.glsl';
import pickingFS from './Star.picking.fs.glsl';
import {Circle} from '../circle/Circle';
import {RenderableShaders} from '../../../renderer/Renderable';
import {GraphPoints} from '../../../data/GraphPoints';
import {DataMappings} from '../../../data/DataTools';
import {BasicNodeData} from '../Nodes';
import {PickingManager} from '../../../UX/picking/PickingManager';
import {GraferContext} from '../../../renderer/GraferContext';

export class Star extends Circle {
    public get sides(): number {
        return this.localUniforms.uSides as number;
    }
    public set sides(value: number) {
        this.localUniforms.uSides = value;
    }

    public get angleDivisor(): number {
        return this.localUniforms.uAngleDivisor as number;
    }
    public set angleDivisor(value: number) {
        this.localUniforms.uAngleDivisor = value;
    }

    constructor(
        context: GraferContext,
        points: GraphPoints,
        data: unknown[],
        mappings: Partial<DataMappings<BasicNodeData>>,
        pickingManager: PickingManager,
        sides: number = 5,
        angleDivisor: number = 3.0
    ) {
        super(context, points, data, mappings, pickingManager, sides, angleDivisor);
    }

    protected initialize(
        context: GraferContext,
        points: GraphPoints,
        data: unknown[],
        mappings: Partial<DataMappings<BasicNodeData>>,
        pickingManager: PickingManager,
        sides: number,
        angleDivisor: number
    ) {
        super.initialize(context, points, data, mappings, pickingManager);
        this.localUniforms.uSides = sides;
        this.localUniforms.uAngleDivisor = angleDivisor;
    }

    protected getDrawShaders(): RenderableShaders {
        const shaders = super.getDrawShaders();
        shaders.fs = nodeFS;
        return shaders;
    }

    protected getPickingShaders(): RenderableShaders {
        const shaders = super.getPickingShaders();
        shaders.fs = pickingFS;
        return shaders;
    }
}
