import {vec3} from 'gl-matrix';

export interface GraferLoaderVec3 {
    x: number;
    y: number;
    z: number;
}

export interface GraferLoaderDomain {
    min: number;
    max: number;
}



interface GraferLoaderNodesStatsBase {
    sizeDomain: GraferLoaderDomain;
    coordsDomain: {
        x: GraferLoaderDomain;
        y: GraferLoaderDomain;
        z: GraferLoaderDomain;
    };
    count: number;
}

interface GraferLoaderNodesStatsCumulative extends GraferLoaderNodesStatsBase {
    cumulative: GraferLoaderVec3;
}

interface GraferLoaderNodesStatsCenter extends GraferLoaderNodesStatsBase {
    center: GraferLoaderVec3;
}

export interface GraferLoaderNodesStats extends GraferLoaderNodesStatsCenter {
    cornerLength: number;
}

export interface GraferLoaderNodes extends GraferLoaderNodesStatsCumulative {
    map: Map<number, number>;
    raw: any[],
    positions: Float32Array;
    sizes: Float32Array;
    colors: Uint8Array;
}

export interface GraferLoaderEdges {
    raw: any[],
    positions: Float32Array;
    colors: Uint8Array;
}

export interface GraferLoader {
    loadNodes: (file: File, palette: number[][]) => Promise<GraferLoaderNodes>;
    loadEdges: (file: File, nodes: GraferLoaderNodes) => Promise<GraferLoaderEdges>;
    loadMeta: (file: File) => Promise<any[]>;
}

export function createGraferLoaderVec3(x: number = 0, y: number = 0, z: number = 0): GraferLoaderVec3 {
    return { x, y, z };
}

export function createGraferLoaderDomain(min: number = Number.MAX_SAFE_INTEGER, max: number = Number.MIN_SAFE_INTEGER): GraferLoaderDomain {
    return { min, max };
}

export function setGraferLoaderDomain(value: number, domain: GraferLoaderDomain = createGraferLoaderDomain()): GraferLoaderDomain {
    domain.min = Math.min(domain.min, value);
    domain.max = Math.max(domain.max, value);
    return domain;
}

export function mergeGraferLoaderDomain(a: GraferLoaderDomain, b: GraferLoaderDomain, out: GraferLoaderDomain = a): GraferLoaderDomain {
    out.min = Math.min(a.min, b.min);
    out.max = Math.max(a.max, b.max);
    return out;
}

export function normalizeNodeLayers(layers: GraferLoaderNodes[]): GraferLoaderNodesStats {
    const center = createGraferLoaderVec3();
    const sizeDomain = createGraferLoaderDomain();
    const coordsDomain = {
        x: createGraferLoaderDomain(),
        y: createGraferLoaderDomain(),
        z: createGraferLoaderDomain(),
    };
    let count = 0;

    for (let i = 0, n = layers.length; i < n; ++i) {
        center.x += layers[i].cumulative.x;
        center.y += layers[i].cumulative.y;
        center.z += layers[i].cumulative.z;
        count += layers[i].count;

        mergeGraferLoaderDomain(sizeDomain, layers[i].sizeDomain);
        mergeGraferLoaderDomain(coordsDomain.x, layers[i].coordsDomain.x);
        mergeGraferLoaderDomain(coordsDomain.y, layers[i].coordsDomain.y);
        mergeGraferLoaderDomain(coordsDomain.z, layers[i].coordsDomain.z);
    }

    center.x /= count;
    center.y /= count;
    center.z /= count;

    coordsDomain.x.min -= center.x;
    coordsDomain.x.max -= center.x;

    coordsDomain.y.min -= center.y;
    coordsDomain.y.max -= center.y;

    coordsDomain.z.min -= center.z;
    coordsDomain.z.max -= center.z;

    const bbCorners = vec3.fromValues(
        Math.max(Math.abs(coordsDomain.x.min), Math.abs(coordsDomain.x.max)),
        Math.max(Math.abs(coordsDomain.y.min), Math.abs(coordsDomain.y.max)),
        Math.max(Math.abs(coordsDomain.z.min), Math.abs(coordsDomain.z.max))
    );
    const cornerLength = vec3.len(bbCorners);

    // resize the coordinates so the corner length is always 300 (because it looks nice)
    // sorry future Dario, you'll have to explain this one out and then deal with it :(
    const positionMult = 300 / cornerLength;
    // scale the coordinates domain
    coordsDomain.x.min *= positionMult;
    coordsDomain.x.max *= positionMult;
    coordsDomain.y.min *= positionMult;
    coordsDomain.y.max *= positionMult;
    coordsDomain.z.min *= positionMult;
    coordsDomain.z.max *= positionMult;

    // iterate through all the layers and apply the changes
    for (let i = 0, n = layers.length; i < n; ++i) {
        const layer = layers[i];
        const positions = layer.positions;
        const sizes = layer.sizes;
        // iterate through all the nodes in each layer
        for (let ii = 0, pi = 0, nn = layer.count; ii < nn; ++ii, pi += 3) {
            // move the position to the center and then scale it
            positions[pi] = (positions[pi] - center.x) * positionMult;
            positions[pi + 1] = (positions[pi + 1] - center.y) * positionMult;
            positions[pi + 2] = (positions[pi + 2] - center.z) * positionMult;

            // normalize the sizes
            sizes[ii] = (sizes[ii] - sizeDomain.min) / (sizeDomain.max - sizeDomain.min);
        }
    }

    return {
        center,
        sizeDomain,
        coordsDomain,
        count,
        cornerLength: cornerLength * positionMult,
    };
}
