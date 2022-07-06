import {mat4, vec2, vec4} from 'gl-matrix';
import PicoGL, {App, DrawCall, Texture, VertexArray, VertexBuffer} from 'picogl';
import {CameraMode} from './Camera';

export type GLDataTypes<T> = {
    [key in keyof T]?: GLenum | readonly GLenum[];
};

export interface GLDataTypesInfo {
    keys: string[];
    stride: number;
}

export interface RenderableShaders {
    vs: string;
    fs: string;
}

export enum RenderMode {
    DRAFT,
    MEDIUM,
    HIGH,
    HIGH_PASS_1,
    HIGH_PASS_2,
    PICKING,
}

export interface RenderUniforms {
    uViewMatrix: mat4;
    uSceneMatrix: mat4;
    uProjectionMatrix: mat4;
    uViewportSize: vec2;
    uPixelRatio: number;
    uClearColor: vec4;
    uColorPalette: Texture;
    uTexBoxes: Texture;
    uTexAtlas: Texture;
    uRenderMode: RenderMode;
    uCameraMode: CameraMode;
}

export type GenericUniforms = { [key: string]: number | number[] | boolean | Texture };

export interface Renderable {
    enabled: boolean;
    render(context: App, mode: RenderMode, uniforms: RenderUniforms): void;
}

/* TOOLS */
export const GL_TYPE_SIZE = {
    [PicoGL.BYTE]: 1,
    [PicoGL.UNSIGNED_BYTE]: 1,
    [PicoGL.SHORT]: 2,
    [PicoGL.UNSIGNED_SHORT]: 2,
    [PicoGL.INT]: 4,
    [PicoGL.UNSIGNED_INT]: 4,
    [PicoGL.FLOAT]: 4,
};

export const GL_TYPE_GETTER = {
    [PicoGL.BYTE]: (view: DataView, offset: number): number => view.getInt8(offset),
    [PicoGL.UNSIGNED_BYTE]: (view: DataView, offset: number): number => view.getUint8(offset),
    [PicoGL.SHORT]: (view: DataView, offset: number): number => view.getInt16(offset, true),
    [PicoGL.UNSIGNED_SHORT]: (view: DataView, offset: number): number => view.getUint16(offset, true),
    [PicoGL.INT]: (view: DataView, offset: number): number => view.getInt32(offset, true),
    [PicoGL.UNSIGNED_INT]: (view: DataView, offset: number): number => view.getUint32(offset, true),
    [PicoGL.FLOAT]: (view: DataView, offset: number): number => view.getFloat32(offset, true),
};

export const GL_TYPE_SETTER = {
    [PicoGL.BYTE]: (view: DataView, offset: number, value: number): void => view.setInt8(offset, value),
    [PicoGL.UNSIGNED_BYTE]: (view: DataView, offset: number, value: number): void => view.setUint8(offset, value),
    [PicoGL.SHORT]: (view: DataView, offset: number, value: number): void => view.setInt16(offset, value, true),
    [PicoGL.UNSIGNED_SHORT]: (view: DataView, offset: number, value: number): void => view.setUint16(offset, value, true),
    [PicoGL.INT]: (view: DataView, offset: number, value: number): void => view.setInt32(offset, value, true),
    [PicoGL.UNSIGNED_INT]: (view: DataView, offset: number, value: number): void => view.setUint32(offset, value, true),
    [PicoGL.FLOAT]: (view: DataView, offset: number, value: number): void => view.setFloat32(offset, value, true),
};

export function glDataTypeSize(type: GLenum | GLenum[]): number {
    return Array.isArray(type) ? GL_TYPE_SIZE[type[0]] * type.length : GL_TYPE_SIZE[type];
}

export function glIntegerType(type: GLenum): number {
    return type === PicoGL.FLOAT ? 0 : 1;
}

export function glDataTypesInfo<T>(types: GLDataTypes<T>): GLDataTypesInfo {
    const mappingsKeys = Object.keys(types);
    const keys = [];
    let stride = 0;
    for (let i = 0, n = mappingsKeys.length; i < n; ++i) {
        if (types[mappingsKeys[i]]) {
            stride += glDataTypeSize(types[mappingsKeys[i]]);
            keys.push(mappingsKeys[i]);
        }
    }
    return {
        keys,
        stride,
    };
}

export function setDrawCallUniforms(drawCall: DrawCall, uniforms: GenericUniforms | RenderUniforms): void {
    for (const [key, value] of Object.entries(uniforms)) {
        if (value.texture) {
            drawCall.texture(key, value);
        } else {
            drawCall.uniform(key, value);
        }
    }
}

export function configureVAO<T>(
    vao: VertexArray,
    vbo: VertexBuffer,
    types: GLDataTypes<T>,
    typesInfo: GLDataTypesInfo,
    attrIndex: number = 0,
    instanced: boolean = false
): void {
    const functionKey = instanced ? 'instanceAttributeBuffer' : 'vertexAttributeBuffer';
    const stride = typesInfo.stride;
    let offset = 0;
    for (let i = 0, n = typesInfo.keys.length; i < n; ++i) {
        const type = types[typesInfo.keys[i]];
        const glType = Array.isArray(type) ? type[0] : type;
        const size = Array.isArray(type) ? type.length : 1;
        vao[functionKey](attrIndex + i, vbo, {
            type: glType,
            integer: glIntegerType(glType),
            size,
            stride,
            offset,
        });
        offset += glDataTypeSize(type);
    }
}


