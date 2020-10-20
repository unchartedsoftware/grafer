import {Renderable, RenderMode, RenderUniforms} from '../renderer/Renderable';
import {App} from 'picogl';
import {mat4, quat, vec3} from 'gl-matrix';

export class Graph implements Renderable {
    private _matrix: mat4;
    public get matrix(): mat4 {
        mat4.fromRotationTranslation(this._matrix, this._rotation, this._translation);
        return this._matrix;
    }

    private _renderables: Renderable[];
    public get renderables(): Renderable[] {
        return this._renderables;
    }

    private _rotation: quat;
    public get rotation(): quat {
        return this._rotation;
    }

    private _translation: vec3;
    public get translation(): vec3 {
        return this._translation;
    }


    constructor() {
        this._renderables = [];
        this._rotation = quat.create();
        this._translation = vec3.create();
        this._matrix = mat4.create();
    }

    public render(context:App, mode: RenderMode, uniforms: RenderUniforms): void {
        for (let i = 0, n = this._renderables.length; i < n; ++i) {
            this._renderables[i].render(context, mode, uniforms);
        }
    }

    public rotate(x: number, y: number, z: number): void {
        const r = quat.fromEuler(quat.create(), x, y, z);
        quat.mul(this._rotation, r, this._rotation);
    }
}
