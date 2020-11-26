import nodeFS from './Ring.fs.glsl';
import {Circle} from '../circle/Circle';
import {RenderableShaders} from '../../../renderer/Renderable';

export class Ring extends Circle {
    protected getDrawShaders(): RenderableShaders {
        const shaders = super.getDrawShaders();
        shaders.fs = nodeFS;
        return shaders;
    }
}
