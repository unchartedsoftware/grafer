import {html, render} from 'lit-html';
import {
    GraferController,
    GraferEdgesData,
    GraferLayerData,
    GraferPointsData,
} from '../../../src/grafer/GraferController';

import { createNodePoints, log } from './helpers';

const numNodes = 3000000;

export async function benchmarkEdge(container: HTMLElement): Promise<void> {
    const startingNodes = 2;
    const addedNodesPerRing = 5;
    let data = [];

    let nodesToCreate = numNodes;
    let nodesPerRing = startingNodes;
    while (nodesToCreate > 0) {
        data = data.concat(createNodePoints(
            nodesToCreate - nodesPerRing >= 0 ? nodesPerRing : nodesToCreate, nodesPerRing)
        );
        nodesToCreate -= nodesPerRing;
        nodesPerRing += addedNodesPerRing;
    }

    const edges: GraferEdgesData = {
        data: [],
    };
    for (let i = 0; i < data.length; i++) {
        edges.data.push({
            source: data[i ? i - 1 : data.length - 1].id,
            sourceColor: Math.round(Math.random() * 4),
            target: data[i].id,
            targetColor: Math.round(Math.random() * 4),
        });
    }

    // bypass nodes requirement when points is omitted
    const points: GraferPointsData = {
        data,
    };

    const layers: GraferLayerData[] = [
        {edges},
    ];

    const colors = [
        '#bf616a',
        '#d08770',
        '#ebcb8b',
        '#a3be8c',
        '#b48ead',
    ];

    render(html`<canvas class="grafer_container"></canvas><div class="log_output"></div><mouse-interactions></mouse-interactions>`, container);
    const canvas = document.querySelector('.grafer_container') as HTMLCanvasElement;
    const controller = new GraferController(canvas, { points, colors, layers });

    const gl = document.createElement('canvas').getContext('webgl');
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    log(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
    log(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));

    const benchmarkDelay = 5 * 1000;
    const benchmarkLength = benchmarkDelay + 15 * 1000;
    let benchmark = true;
    let numFrames = 0;
    const frametimeList = [];
    let frametimeOld = performance.now();

    function step(): void {
        numFrames++;
        const frametimeNew = performance.now();
        controller.render();
        frametimeList.push(frametimeNew - frametimeOld);
        frametimeOld = frametimeNew;

        if (benchmark) {
            window.requestAnimationFrame(step);
        }
    }

    setTimeout(() => {
        log(`Benchmark Start: ${numNodes} Edges`);
        window.requestAnimationFrame(step);
    }, benchmarkDelay);
    setTimeout(() => {
        benchmark = false;
        const frametimeAvg = frametimeList.reduce((acc, val) => val + acc) / numFrames;
        log('Benchmark End');
        log(`Frames: ${numFrames}`);
        log(`Avg. time between frames: ${frametimeAvg}`);
        log(`Avg. FPS: ${1 / (frametimeAvg / 1000)}`);
    }, benchmarkLength);
}
