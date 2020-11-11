import nodeFS from './Ring.fs.glsl';
import {Circle} from '../circle/Circle';

export class Ring extends Circle {
    protected getDrawingShaders(): string[] {
        const shaders = super.getDrawingShaders();
        shaders[1] = nodeFS;
        return shaders;
    }
}
