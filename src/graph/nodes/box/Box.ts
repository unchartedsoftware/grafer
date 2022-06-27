import nodeFS from './Box.fs.glsl';
import pickingFS from './Box.picking.fs.glsl';
import {Circle} from '../circle/Circle';
import {RenderableShaders} from '../../../renderer/Renderable';

export class Box extends Circle {
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
