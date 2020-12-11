import {
    GL_TYPE_GETTER,
    GL_TYPE_SETTER,
    GL_TYPE_SIZE,
    GLDataTypes,
    GLDataTypesInfo,
    glDataTypesInfo,
} from '../renderer/Renderable';
import {App, VertexBuffer} from 'picogl';

export const kDataMappingFlatten = Symbol('graffer:data::mapping::flatten::key');
const kDataEntryNeedsFlatten = Symbol('graffer:data::tools::needs::flatten');

export type DataMapping<T, R> = {
    (entry: T, i: number, fi?: number, fl?: number): R,
    [kDataMappingFlatten]?: (entry: {[key in keyof T]: R}, i: number, l: number) => R,
}

export type DataMappings<T> = {
    [key in keyof Required<T>]: DataMapping<T, T[key]>;
};

export interface DataShader {
    vs: string;
    varyings: string[];
}

export type PackDataCB<T> = (i: number, entry: T) => void;

export function* dataIterator<T>(data: unknown[], mappings: DataMappings<T>): Generator<[number, T]> {
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
    const keys = Object.keys(types);
    const result: GLDataTypes<T> = {};
    for (let i = 0, n = keys.length; i < n; ++i) {
        if (keys[i] in mappings && mappings[keys[i]] !== null) {
            result[keys[i]] = types[keys[i]];
        }
    }
    return result;
}

export function writeValueToDataView(view: DataView, value: number | number[], type: GLenum | GLenum[], offset: number): number {
    if (Array.isArray(value)) {
        let writeOffset = 0;
        for (let i = 0, n = value.length; i < n; ++i) {
            GL_TYPE_SETTER[type[i]](view, offset + writeOffset, value[i]);
            writeOffset += GL_TYPE_SIZE[type[i]];
        }
        return writeOffset;
    }

    GL_TYPE_SETTER[type as GLenum](view, offset, value);
    return GL_TYPE_SIZE[type as GLenum];
}

export function flattenEntry<T>(entry: T, types: GLDataTypes<T>, typesInfo: GLDataTypesInfo, mappings: DataMappings<T>, view: DataView, offset: number): number {
    // build an internal mappings object to flatten the values
    const flatMappings = {};
    let flattenLength = 0;
    for (let i = 0, n = typesInfo.keys.length; i < n; ++i) {
        const key = typesInfo.keys[i];
        if (entry[kDataEntryNeedsFlatten].has(key)) {
            flatMappings[key] = mappings[key][kDataMappingFlatten] ?? ((entry, i): unknown => entry[key][i]);
            // all values to flatten should have the same length
            flattenLength = entry[key].length;
        } else {
            flatMappings[key] = mappings[key][kDataMappingFlatten] ?? ((entry): unknown => entry[key]);
        }
    }

    let flatOffset = 0;
    for (let i = 0; i < flattenLength; ++i) {
        for (let ii = 0, n = typesInfo.keys.length; ii < n; ++ii) {
            const key = typesInfo.keys[ii];
            flatOffset += writeValueToDataView(view, flatMappings[key](entry, i, flattenLength), types[key], offset + flatOffset);
        }
    }

    return flatOffset;
}

export function packData<T>(data: unknown[], mappings: DataMappings<T>, types: GLDataTypes<T>, potLength: boolean, cb?: PackDataCB<T> | PackDataCB<T>[]): ArrayBuffer {
    const typesInfo = glDataTypesInfo(computeDataTypes(types, mappings));
    const entries = [];
    let dataLength = 0;

    const cb1 = Array.isArray(cb) ? cb[0] : cb;
    const cb2 = Array.isArray(cb) ? cb[1] : null;

    // go over the data once to compute the data byte length. Sorry future Dario :(
    // TODO: Investigate a better way to do this in one iteration
    for (const [index, entry] of dataIterator(data, mappings)) {
        let entryLength = 1;
        for (let i = 0, n = typesInfo.keys.length; i < n; ++i) {
            const value = entry[typesInfo.keys[i]];
            if (Array.isArray(value) && (!Array.isArray(types[typesInfo.keys[i]]) || mappings[typesInfo.keys[i]][kDataMappingFlatten])) {
                if (!entry[kDataEntryNeedsFlatten]) {
                    entry[kDataEntryNeedsFlatten] = new Set<string>();
                }
                entry[kDataEntryNeedsFlatten].add(typesInfo.keys[i]);
                entryLength = Math.max(entryLength, value.length);
            }
        }

        entries.push(entry);
        dataLength += entryLength;

        // call the first callback with the entries
        if (cb1) {
            cb1(index, entry);
        }
    }

    dataLength = potLength ? Math.pow(2 , Math.ceil(Math.log2(dataLength))) : dataLength;

    const buffer = new ArrayBuffer(typesInfo.stride * dataLength);
    const view = new DataView(buffer);

    let offset = 0;
    for (let i = 0, n = entries.length; i < n; ++i) {
        const entry = entries[i];

        // give the caller a last chance to modify the entries
        if (cb2) {
            cb2(i, entry);
        }

        if (entry[kDataEntryNeedsFlatten]) {
            offset += flattenEntry(entry, types, typesInfo, mappings, view, offset);
        } else {
            for (let i = 0, n = typesInfo.keys.length; i < n; ++i) {
                offset += writeValueToDataView(view, entry[typesInfo.keys[i]], types[typesInfo.keys[i]], offset);
            }
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
