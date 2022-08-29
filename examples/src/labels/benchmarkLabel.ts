import {html, render} from 'lit-html';
import {
    GraferController,
    GraferLabelsData,
    GraferLayerData,
    GraferNodesData,
} from '../../../src/grafer/GraferController';

function createNodePoints(count: number, radius: number = 10.0): any[] {
    const PI2 = Math.PI * 2;
    const degStep = (PI2) / count;
    const result = [];

    for (let angle = 0, i = 0; angle < PI2; angle += degStep, ++i) {
        const pX = Math.cos(angle) * radius;
        const pY = Math.sin(angle) * radius;
        result.push({
            id: `p${i}-${radius}`,
            x: pX,
            y: pY,
            radius: 2,
            label: `The quick brown fox jumped over the lazy dog`,
            color: Math.round(Math.random() * 4),
            fontSize: 16,
        });
    }

    return result;
}

const numNodes = 10000;

export async function benchmarkLabel(container: HTMLElement): Promise<void> {
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
    const nodes: GraferNodesData = {
        type: 'Circle',
        data,
    };

    const labels: GraferLabelsData = {
        type: 'PointLabel',
        data: nodes.data,
        options: {
            visibilityThreshold: 1,
            labelPlacement: 1,
            renderBackground: true,
            padding: 6,
        },
    };

    const layers: GraferLayerData[] = [
        { nodes, labels },
    ];

    const colors = [
        '#bf616a',
        '#d08770',
        '#ebcb8b',
        '#a3be8c',
        '#b48ead',
    ];

    render(html`<canvas class="grafer_container"></canvas><mouse-interactions></mouse-interactions>`, container);
    const canvas = document.querySelector('.grafer_container') as HTMLCanvasElement;
    const controller = new GraferController(canvas, { colors, layers });

    const gl = document.createElement('canvas').getContext('webgl');
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    console.log(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
    console.log(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));

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
        console.log('Benchmark Start: %d Nodes', numNodes);
        window.requestAnimationFrame(step);
    }, benchmarkDelay);
    setTimeout(() => {
        benchmark = false;
        const frametimeAvg = frametimeList.reduce((acc, val) => val + acc) / numFrames;
        console.log('Benchmark End');
        console.log('Frames: %d', numFrames);
        console.log('Avg. time between frames: %d', frametimeAvg);
        console.log('Avg. FPS: %d', 1 / (frametimeAvg / 1000));
    }, benchmarkLength);
}
