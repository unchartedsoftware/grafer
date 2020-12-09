import nodeFS from './Pentagon.fs.glsl';
import pickingFS from './Pentagon.picking.fs.glsl';
import {Circle} from '../circle/Circle';
import {RenderableShaders} from '../../../renderer/Renderable';

export class Pentagon extends Circle {
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
