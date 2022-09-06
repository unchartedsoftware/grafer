import {html, render} from 'lit-html';
import {GraferController, graph, UX} from '../../../src/mod';

import nodesArray from './nodes.json';
import edgesArray from './edges.json';

export async function quickstart1(container: HTMLElement): Promise<void> {
    render(html`<canvas class="grafer_container"></canvas>`, container);
    const canvas = document.querySelector('.grafer_container') as HTMLCanvasElement;

    const nodes = {
        data: nodesArray,
    };

    const edges = {
        data: edgesArray,
        mappings: {
            source: (datum): number =>
                nodesArray.findIndex((node) => node.name === datum.departure_airport),
            target: (datum): number =>
                nodesArray.findIndex((node) => node.name === datum.arrival_airport),
        },
    };

    const labels = {
        data: nodesArray,
        mappings: {
            label: (datum): string => datum.name,
        },
        options: {
            labelPlacement: graph.labels.PointLabelPlacement.TOP,
        },
    };

    const layers = [
        { nodes, edges, labels },
    ];

    const controller = new GraferController(canvas, { layers });
    new UX.DebugMenu(controller.viewport);
}
