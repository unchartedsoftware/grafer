import { a as render, h as html } from '../../web_modules/lit-html.js';
import '../../web_modules/GraferView.js';
import '../../web_modules/tslib.js';
import '../../web_modules/lit-element.js';
import '../../web_modules/GraferController.js';
import '../../web_modules/picogl.js';
import '../../web_modules/gl-matrix.js';
import '../../web_modules/@dekkai/event-emitter.js';
import '../../web_modules/chroma-js.js';
import '../../web_modules/_commonjsHelpers.js';
import '../../web_modules/potpack.js';

function createClusterNodePoints(cluster, x, y, r, count) {
    const PI2 = Math.PI * 2;
    const degStep = (PI2) / count;
    const radius = r - 7;
    const result = [];
    for (let angle = 0, i = 0; angle < PI2; angle += degStep, ++i) {
        const pX = Math.cos(angle) * (Math.random() * radius + 5.0);
        const pY = Math.sin(angle) * (Math.random() * radius + 5.0);
        result.push({
            id: `${cluster}-p${i}`,
            x: x + pX,
            y: y + pY,
        });
    }
    return result;
}
function createInnerEdges(cluster) {
    const result = [];
    for (let i = 0, n = cluster.length; i < n; ++i) {
        const n1 = cluster[i];
        for (let ii = i + 1, nn = cluster.length; ii < nn; ++ii) {
            if (Math.random() > 0.75) {
                const n2 = cluster[ii];
                result.push({
                    source: n1.id,
                    target: n2.id,
                    sourceColor: 2,
                    targetColor: 2,
                });
            }
        }
    }
    return result;
}
async function bundling(container) {
    // create an array od colors to be used
    const colors = [
        /* 0 */ '#d08770',
        /* 1 */ '#88c0d0',
        /* 2 */ '#ebcb8b',
    ];
    const pointsC1 = createClusterNodePoints('c1', -30.0, 0.0, 20, 12);
    const nodesC1 = pointsC1.map(p => ({ point: p.id }));
    const pointsC2 = createClusterNodePoints('c2', 40.0, 0.0, 25, 14);
    const nodesC2 = pointsC2.map(p => ({ point: p.id }));
    // create a 'points' data structure to hold all positional data
    const points = {
        data: [
            { id: 'c1', x: -30.0, y: 0.0 },
            { id: 'c1-c1', x: -10.0, y: 0.0 },
            { id: 'c1-c2', x: -0.0, y: 0.0 },
            ...pointsC1,
            { id: 'c2', x: 40.0, y: 0.0 },
            { id: 'c2-c1', x: 15.0, y: 0.0 },
            { id: 'c2-c2', x: 5.0, y: 0.0 },
            ...pointsC2,
        ],
    };
    // nodes reference points
    const nodes = {
        data: [
            ...nodesC1,
            ...nodesC2,
        ],
    };
    const clusters = {
        type: 'Ring',
        data: [
            { point: 'c1', radius: 20.0, color: 1 },
            { point: 'c2', radius: 25.0, color: 1 },
        ],
        mappings: {
            radius: (entry) => entry.radius,
        },
        options: {
            billboard: false,
        },
    };
    const clusterEdgesData = [];
    for (let i = 0, n = pointsC1.length; i < n; ++i) {
        const pointA = pointsC1[i];
        for (let ii = 0, nn = pointsC2.length; ii < nn; ++ii) {
            if (Math.random() > 0.5) {
                const pointB = pointsC2[ii];
                clusterEdgesData.push({
                    source: pointA.id,
                    target: pointB.id,
                    control: ['c1-c1', 'c1-c2', 'c2-c2', 'c2-c1'],
                    sourceColor: 1,
                    targetColor: 1,
                });
            }
        }
    }
    const clusterEdges = {
        type: 'CurvedPath',
        data: clusterEdgesData,
        options: {
            alpha: 0.04,
            nearDepth: 0.9,
        },
    };
    const nodesEdges = {
        data: [
            ...createInnerEdges(pointsC1),
            ...createInnerEdges(pointsC2),
        ],
        options: {
            alpha: 0.55,
            nearDepth: 0.9,
        },
    };
    const layers = [
        { nodes: clusters, edges: clusterEdges },
        { nodes, edges: nodesEdges },
    ];
    // pass the points to grafer
    render(html `<grafer-view class="grafer_container" .colors="${colors}" .points="${points}" .layers="${layers}"></grafer-view><mouse-interactions></mouse-interactions>`, container);
}

export { bundling };
//# sourceMappingURL=bundling.js.map
