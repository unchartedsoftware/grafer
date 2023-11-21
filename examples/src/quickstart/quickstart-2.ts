import {html, render} from 'lit';
import {GraferController, graph, UX} from '../../../src/mod';

import nodesArray from './nodes.json';
import edgesArray from './edges.json';

export async function quickstart2(container: HTMLElement): Promise<void> {
    render(html`<canvas class="grafer_container"></canvas>`, container);
    const canvas = document.querySelector('.grafer_container') as HTMLCanvasElement;

    const points = {
        data: nodesArray,
        mappings: {
            id: (datum): string => datum.name,
        },
    };

    const nodes = {
        data: nodesArray,
        mappings: {
            point: (datum): string => datum.name,
        },
    };

    const edges = {
        data: edgesArray,
        mappings: {
            source: (datum): number => datum.departure_airport,
            target: (datum): number => datum.arrival_airport,
        },
    };

    const labels = {
        data: nodesArray,
        mappings: {
            point: (datum): string => datum.name,
            label: (datum): string => datum.name,
        },
        options: {
            labelPlacement: graph.labels.PointLabelPlacement.TOP,
        },
    };

    const layers = [
        { nodes, edges, labels },
    ];

    const controller = new GraferController(canvas, { points, layers });
    new UX.DebugMenu(controller.viewport);
}
