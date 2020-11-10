import {mat4, vec2, vec4} from 'gl-matrix';
import {App, DrawCall, Program, VertexBuffer} from 'picogl';

export enum RenderMode {
    DRAFT,
    MEDIUM,
    HIGH,
    PICKING,
}

export interface RenderUniforms {
    uViewMatrix: mat4;
    uSceneMatrix: mat4;
    uProjectionMatrix: mat4;
    uViewportSize: vec2;
    uPixelRatio: number;
    uClearColor: vec4;
}

export type GenericUniforms = RenderUniforms | { [key: string]: number | number[] | boolean };

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

    protected pickingProgram: Program;
    protected pickingDrawCall: DrawCall = null;
    protected pickingColors: VertexBuffer = null;

    public abstract render(context: App, mode: RenderMode, uniforms: RenderUniforms): void;

    protected setDrawCallUniforms(drawCall: DrawCall, uniforms: GenericUniforms): void {
        for (const [key, value] of Object.entries(uniforms)) {
            drawCall.uniform(key, value);
        }
    }
}
