import {mat4, vec2, vec4} from 'gl-matrix';
import {App, DrawCall, Program} from 'picogl';

export enum RenderMode {
    DRAFT,
    MEDIUM,
    HIGH,
}

export interface RenderUniforms {
    viewMatrix: mat4;
    sceneMatrix: mat4;
    projectionMatrix: mat4;
    viewportSize: vec2;
    pixelRatio: number;
    clearColor: vec4;
}

export abstract class Renderable {
    public enabled: boolean = true;

    protected _nearDepth: number = 0.0;
    public get nearDepth(): number {
        return this._nearDepth;
    }
    public set nearDepth(value: number) {
        this._nearDepth = value;
    }

    protected _farDepth: number = 1.0;
    public get farDepth(): number {
        return this._farDepth;
    }
    public set farDepth(value: number) {
        this._farDepth = value;
    }

    protected program: Program;
    protected drawCall: DrawCall;

    public abstract render(context: App, mode: RenderMode, uniforms: RenderUniforms): void;
}
