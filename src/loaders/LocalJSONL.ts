import {DataFile} from '@dekkai/data-source/build/lib/file/DataFile';
import {
    createGraferLoaderDomain,
    createGraferLoaderVec3,
    GraferLoader,
    GraferLoaderEdges,
    GraferLoaderNodes,
    setGraferLoaderDomain,
} from './GraferLoader';

function macrotaskQueue(task, initialState, resolver?): Promise<void> {
    return new Promise((resolve) => {
        const result = task(initialState, !Boolean(resolver));
        if(result !== false) {
            window.requestAnimationFrame(() => macrotaskQueue(task, result, resolver ?? resolve));
        }
        else {
            if(resolver) {
                resolver();
            }
            else {
                resolve();
            }
        }
    });
}

function processJSONL(state, firstRun): any {
    const startTime = Date.now();
    const MAX_RUNTIME = 20; // ms
    const ITER_PER_CHECK = 10000;

    for (firstRun && (state.i = 0); state.i < state.chunk.byteLength; ++state.i) {
        if(state.i % ITER_PER_CHECK === 0 && Date.now() - startTime > MAX_RUNTIME) {
            return state;
        }
        if (state.view.getUint8(state.i) === state.lineBreak || state.offset + state.i === state.byteLength) {
            const statementBuffer = new Uint8Array(state.chunk, state.start, state.i - state.start);
            state.start = state.i + 1;

            const str = state.decoder.decode(statementBuffer);
            const json = JSON.parse(str);

            state.cb(json);
        }
    }
    return false;
}

async function parseJSONL(input, cb): Promise<void> {
    const file = await DataFile.fromLocalSource(input);
    const state: any = {};
    state.cb = cb;

    // load 16MB chunks
    const sizeOf16MB = 16 * 1024 * 1024;
    state.byteLength = file.byteLength;
    state.decoder = new TextDecoder();
    state.lineBreak = '\n'.charCodeAt(0);

    for(state.offset = 0; state.offset <= state.byteLength; state.offset += sizeOf16MB) {
        const chunkEnd = Math.min(state.offset + sizeOf16MB, state.byteLength);
        state.chunk = await file.loadData(state.offset, chunkEnd);
        state.view = new DataView(state.chunk);
        state.start = 0;
        await macrotaskQueue(processJSONL, state);

        if (state.start < state.chunk.byteLength) {
            state.offset -= state.chunk.byteLength - state.start;
        }

        // console.log(`${chunkEnd} / ${byteLength} - ${((chunkEnd/byteLength) * 100).toFixed(2)}%`);
    }
}

async function loadNodes(file: File, palette: number[][] = []): Promise<GraferLoaderNodes> {
    const colorMap: Map<number, number[]> = new Map();
    const map: Map<number, number> = new Map();
    const raw = [];
    const points = [];
    const nodes = [];
    const positions = [];
    const sizes = [];
    const colors = [];
    const cumulative = createGraferLoaderVec3();
    const sizeDomain = createGraferLoaderDomain();
    const coordsDomain = {
        x: createGraferLoaderDomain(),
        y: createGraferLoaderDomain(),
        z: createGraferLoaderDomain(),
    };

    let count = 0;

    await parseJSONL(file, (json: any): void => {
        raw.push(json);

        json.z = json.hasOwnProperty('z') ? json.z : 0.0;
        const {x, y, z, id, ...node} = json;
        points.push({
            id,
            x,
            y,
            z,
        });
        nodes.push({
            point: id,
            ...node,
        });
        positions.push(x, y, z);
        map.set(json.id, count);

        setGraferLoaderDomain(x, coordsDomain.x);
        setGraferLoaderDomain(y, coordsDomain.y);
        setGraferLoaderDomain(z, coordsDomain.z);

        cumulative.x += x;
        cumulative.y += y;
        cumulative.z += z;

        ++count;

        const group = (json.group ?? json.clusterID ?? [0])[0];
        if (group < palette.length) {
            colors.push(...palette[group], 255);
        } else {
            if (!colorMap.has(group)) {
                colorMap.set(group, [
                    Math.round(Math.random() * 127 + 128),
                    Math.round(Math.random() * 127 + 128),
                    Math.round(Math.random() * 127 + 128),
                ]);
            }
            colors.push(...colorMap.get(group), 255);
        }

        sizes.push(json.size);
        setGraferLoaderDomain(json.size, sizeDomain);
    });

    return {
        map,
        raw,
        points,
        nodes,
        positions: new Float32Array(positions),
        sizes: new Float32Array(sizes),
        colors: new Uint8Array(colors),
        cumulative,
        sizeDomain,
        coordsDomain,
        count,
    };
}

async function loadEdges(file: File, nodes: GraferLoaderNodes): Promise<GraferLoaderEdges> {
    const raw = [];
    const positions = [];
    const colors = [];

    await parseJSONL(file, json => {
        if (nodes.map.has(json.source) && nodes.map.has(json.target)) {
            raw.push(json);

            const sourceIndex = nodes.map.get(json.source);
            const targetIndex = nodes.map.get(json.target);

            positions.push(
                nodes.positions[sourceIndex * 3],
                nodes.positions[sourceIndex * 3 + 1],
                nodes.positions[sourceIndex * 3 + 2]
            );

            positions.push(
                nodes.positions[targetIndex * 3],
                nodes.positions[targetIndex * 3 + 1],
                nodes.positions[targetIndex * 3 + 2]
            );

            colors.push(
                nodes.colors[sourceIndex * 4],
                nodes.colors[sourceIndex * 4 + 1],
                nodes.colors[sourceIndex * 4 + 2],
                nodes.colors[sourceIndex * 4 + 3]
            );

            colors.push(
                nodes.colors[targetIndex * 4],
                nodes.colors[targetIndex * 4 + 1],
                nodes.colors[targetIndex * 4 + 2],
                nodes.colors[targetIndex * 4 + 3]
            );
        }
    });

    return {
        raw,
        edges: raw,
        positions: new Float32Array(positions),
        colors: new Uint8Array(colors),
    };
}

async function loadMeta(file: File): Promise<any[]> {
    const result = [];
    await parseJSONL(file, json => {
        result.push(json);
    });
    return result;
}

export const LocalJSONL: GraferLoader = {
    loadNodes,
    loadEdges,
    loadMeta,
};
