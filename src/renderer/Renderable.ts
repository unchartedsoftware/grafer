import {mat4, vec2} from 'gl-matrix';
import {App} from 'picogl';

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
}

export interface Renderable {
    render(context: App, mode: RenderMode, uniforms: RenderUniforms): void;
}
