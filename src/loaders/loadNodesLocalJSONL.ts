import {Viewport} from '../renderer/Viewport';
import {Circular} from '../graph/nodes/circular/Circular';
import {DataFile} from '@dekkai/data-source/build/lib/file/DataFile';
import {Straight} from '../graph/edges/straight/Straight';
import {Gravity} from '../graph/edges/gravity/Gravity';

const kColorPalette = [
    [127, 200, 126, 1.0],
    [189, 172, 211, 1.0],
    [253, 191, 132, 1.0],
    [254, 251, 152, 1.0],
    [60, 107, 174, 1.0],
    [239, 47, 126, 1.0],
    [190, 92, 28, 1.0],
    [102, 102, 102, 1.0],
];

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

        console.log(`${chunkEnd} / ${byteLength} - ${((chunkEnd/byteLength) * 100).toFixed(2)}%`);
    }
}

export async function loadNodesLocalJSONL(viewport: Viewport, nodesFile: File, edgesFile: File): Promise<{ nodes: Circular; edges: Straight | Gravity }> {
    const nodeMap: Map<number, number> = new Map();
    const colorMap: Map<number, number[]> = new Map();
    const positions = [];
    const colors = [];
    const sizes = [];

    let max = 0;

    let minX = Number.MAX_SAFE_INTEGER;
    let cX = 0;

    let minY = Number.MAX_SAFE_INTEGER;
    let cY = 0;

    let minZ = Number.MAX_SAFE_INTEGER;
    let cZ = 0;

    let count = 0;

    let minSize = Number.MAX_SAFE_INTEGER;
    let maxSize = Number.MIN_SAFE_INTEGER;

    await parseJSONL(nodesFile, (json): void => {
        const x = json.x;
        const y = json.y;
        const z = json.z;
        positions.push(x, y, z);

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        minZ = Math.min(minZ, z);

        cX += x;
        cY += y;
        cZ += z;

        nodeMap.set(json.id, count);

        ++count;

        const group = (json.group ?? json.clusterID)[0];
        if (!colorMap.has(group)) {
            if (group >= kColorPalette.length) {
                colorMap.set(group, [
                    Math.round(Math.random() * 127 + 128),
                    Math.round(Math.random() * 127 + 128),
                    Math.round(Math.random() * 127 + 128),
                    1.0,
                ]);
            } else {
                colorMap.set(group, kColorPalette[group]);
            }
        }

        const color = colorMap.get(group);
        colors.push(...color);

        if (json.hasOwnProperty('size')) {
            sizes.push(json.size);
            minSize = Math.min(minSize, json.size);
            maxSize = Math.max(maxSize, json.size);
        }
    });

    const centerX = cX / count;
    const centerY = cY / count;
    const centerZ = cZ / count;

    for (let i = 0; i < count; ++i) {
        positions[i * 3] -= centerX;
        positions[i * 3 + 1] -= centerY;
        positions[i * 3 + 2] -= centerZ;

        max = Math.max(max, Math.abs(positions[i * 3]) + positions[i * 3 + 2], Math.abs(positions[i * 3 + 1]) + positions[i * 3 + 2]);

        if (sizes.length) {
            sizes[i] = (sizes[i] - minSize) / (maxSize - minSize);
        }
    }

    if (max < 300) {
        const mult = 300 / max;

        for (let i = 0; i < count; ++i) {
            positions[i * 3] *= mult;
            positions[i * 3 + 1] *= mult;
            positions[i * 3 + 2] *= mult;
        }

        max = 300;
    }

    const edgePositions = [];
    const edgeColors = [];

    // let edgeCount = 0;
    await parseJSONL(edgesFile, (json): void => {
        if (nodeMap.has(json.source) && nodeMap.has(json.target)) {
            // if (edgeCount++ > 300) return;

            const sourceIndex = nodeMap.get(json.source);
            const targetIndex = nodeMap.get(json.target);

            edgePositions.push(
                positions[sourceIndex * 3],
                positions[sourceIndex * 3 + 1],
                positions[sourceIndex * 3 + 2],
            );

            edgePositions.push(
                positions[targetIndex * 3],
                positions[targetIndex * 3 + 1],
                positions[targetIndex * 3 + 2],
            );

            edgeColors.push(
                colors[sourceIndex * 4],
                colors[sourceIndex * 4 + 1],
                colors[sourceIndex * 4 + 2],
                colors[sourceIndex * 4 + 3],
            );

            edgeColors.push(
                colors[targetIndex * 4],
                colors[targetIndex * 4 + 1],
                colors[targetIndex * 4 + 2],
                colors[targetIndex * 4 + 3],
            );
        }
    });

    viewport.camera.position = [0, 0, Math.ceil(max)];

    return {
        nodes: new Circular(viewport.context, new Float32Array(positions), new Uint8Array(colors), new Float32Array(sizes)),
        edges: new Gravity(viewport.context, new Float32Array(edgePositions), new Uint8Array(edgeColors)),
    };
}
