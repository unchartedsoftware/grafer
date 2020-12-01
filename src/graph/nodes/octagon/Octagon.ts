import nodeFS from './Octagon.fs.glsl';
import pickingFS from './Octagon.picking.fs.glsl';
import {Circle} from '../circle/Circle';
import {RenderableShaders} from '../../../renderer/Renderable';

export class Octagon extends Circle {
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
