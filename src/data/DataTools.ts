import {GL_TYPE_GETTER, GL_TYPE_SETTER, GL_TYPE_SIZE, GLDataTypes, glDataTypesInfo} from '../renderer/Renderable';
import {App, VertexBuffer} from 'picogl';

export type DataMappings<T> = {
    [key in keyof T]: ((entry: any, i: number) => T[key]);
};

export interface DataShader {
    vs: string;
    varyings: string[];
}

export type PackDataCB<T> = (i: number, entry: T) => void;

export function* dataIterator<T>(data: unknown[], dataMappings: DataMappings<T>): Generator<[number, T]> {
    const mappings = Object.assign({}, dataMappings);
    const keys = Reflect.ownKeys(mappings);

    for (let i = 0, n = data.length; i < n; ++i) {
        const entry = {};
        for (const key of keys) {
            if (mappings[key] !== null) {
                entry[key] = mappings[key](data[i], i);
            }
        }
        yield [i, entry as T];
    }
}

export function extractData<T>(data: unknown[], mappings: DataMappings<T>): T[] {
    const result: T[] = [];
    for (const [, entry] of dataIterator(data, mappings)) {
        result.push(entry);
    }
    return result;
}

export function concatenateData<T>(data: unknown[][], mappings: DataMappings<T>): T[] {
    const result = [];
    for (let i = 0, n = data.length; i < n; ++i) {
        for (const [, entry] of dataIterator(data[i], mappings)) {
            result.push(entry);
        }
    }
    return result;
}

export function computeDataTypes<T>(types: GLDataTypes<T>, mappings: DataMappings<T>): GLDataTypes<T> {
    const keys = Object.keys(mappings);
    const result: GLDataTypes<T> = {};
    for (let i = 0, n = keys.length; i < n; ++i) {
        if (types[keys[i]] && mappings[keys[i]] !== null) {
            result[keys[i]] = types[keys[i]];
        }
    }
    return result;
}

export function packData<T>(data: unknown[], mappings: DataMappings<T>, types: GLDataTypes<T>, potLength: boolean, cb?: PackDataCB<T>): ArrayBuffer {
    const typesInfo = glDataTypesInfo(computeDataTypes(types, mappings));
    const dataLength = potLength ? Math.pow(2 , Math.ceil(Math.log2(data.length))) : data.length;
    const buffer = new ArrayBuffer(typesInfo.stride * dataLength);
    const view = new DataView(buffer);

    let offset = 0;
    for (const [index, entry] of dataIterator(data, mappings)) {
        for (let i = 0, n = typesInfo.keys.length; i < n; ++i) {
            GL_TYPE_SETTER[types[typesInfo.keys[i]]](view, offset, entry[typesInfo.keys[i]]);
            offset += GL_TYPE_SIZE[types[typesInfo.keys[i]]];
        }
        if (cb) {
            cb(index, entry);
        }
    }

    return buffer;
}

export function printDataGL<T>(context: App, vbo: VertexBuffer, count: number, types: GLDataTypes<T>): void {
    const gl = context.gl as WebGL2RenderingContext;
    const typesInfo = glDataTypesInfo(types);
    const result = new ArrayBuffer(typesInfo.stride * count);
    const view = new DataView(result);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo.buffer);
    gl.getBufferSubData(gl.ARRAY_BUFFER, 0, view);

    let off = 0;
    for (let i = 0; i < count; ++i) {
        for (let ii = 0, nn = typesInfo.keys.length; ii < nn; ++ii) {
            const type = Array.isArray(types[typesInfo.keys[ii]]) ? types[typesInfo.keys[ii]] : [types[typesInfo.keys[ii]]];
            const values = [];
            for (let iii = 0, nnn = type.length; iii < nnn; ++iii) {
                values.push(GL_TYPE_GETTER[type[iii]](view, off));
                off += GL_TYPE_SIZE[type[iii]];
            }
            // eslint-disable-next-line
            console.log(`ELEMENT[${i}] ATTR[${ii}]: ${values}`);
        }
    }
}
