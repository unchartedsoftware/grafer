import {DataFile} from '@dekkai/data-source/build/lib/file/DataFile';
import {
    createGraferLoaderDomain,
    createGraferLoaderVec3,
    GraferLoader,
    GraferLoaderEdges,
    GraferLoaderNodes,
    setGraferLoaderDomain,
} from './GraferLoader';

async function parseJSONL(input, cb): Promise<void> {
    const file = await DataFile.fromLocalSource(input);

    // load 16MB chunks
    const sizeOf16MB = 16 * 1024 * 1024;
    const byteLength = file.byteLength;
    const decoder = new TextDecoder();
    const lineBreak = '\n'.charCodeAt(0);

    for(let offset = 0; offset <= byteLength; offset += sizeOf16MB) {
        const chunkEnd = Math.min(offset + sizeOf16MB, byteLength);
        const chunk = await file.loadData(offset, chunkEnd);
        const view = new DataView(chunk);
        let start = 0;
        for (let i = 0, n = chunk.byteLength; i < n; ++i) {
            if (view.getUint8(i) === lineBreak || offset + i === byteLength) {
                const statementBuffer = new Uint8Array(chunk, start, i - start);
                start = i + 1;

                const str = decoder.decode(statementBuffer);
                const json = JSON.parse(str);

                cb(json);
            }
        }

        if (start < chunk.byteLength) {
            offset -= chunk.byteLength - start;
        }

        // console.log(`${chunkEnd} / ${byteLength} - ${((chunkEnd/byteLength) * 100).toFixed(2)}%`);
    }
}

async function loadNodes(file: File, palette: number[][] = []): Promise<GraferLoaderNodes> {
    const colorMap: Map<number, number[]> = new Map();
    const map: Map<number, number> = new Map();
    const raw = [];
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

        const x = json.x;
        const y = json.y;
        const z = json.z;
        positions.push(x, y, z);
        map.set(json.id, count);

        setGraferLoaderDomain(x, coordsDomain.x);
        setGraferLoaderDomain(y, coordsDomain.y);
        setGraferLoaderDomain(z, coordsDomain.z);

        cumulative.x += x;
        cumulative.y += y;
        cumulative.z += z;

        ++count;

        const group = (json.group ?? json.clusterID)[0];
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
