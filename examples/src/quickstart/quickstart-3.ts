import {html, render} from 'lit-html';
import {GraferController, graph, UX} from '../../../src/mod';

import nodesArray from './nodes.json';
import edgesArray from './edges.json';

export async function quickstart3(container: HTMLElement): Promise<void> {
    render(html`<canvas class="grafer_container"></canvas>`, container);
    const canvas = document.querySelector('.grafer_container') as HTMLCanvasElement;

    const points = {
        data: nodesArray,
        mappings: {
            id: (datum): string => datum.name,
            radius: (datum): number =>
                datum.total_flights && (0.25 * Math.log10(datum.total_flights) + 0.25),
        },
    };

    const nodes = {
        type: 'Ring',
        data: nodesArray,
        mappings: {
            point: (datum): string => datum.name,
        },
        options: {
            alpha: 0.3,
        },
    };

    const colors = [
        // node color
        '#ffffff',
        // edge colors
        '#3300cc', '#660099', '#990066', '#cc0033',
    ];

    const edges = {
        data: edgesArray,
        mappings: {
            source: (datum): number => datum.departure_airport,
            sourceColor: (datum): number => (datum.num_flights && Math.floor(Math.log10(datum.num_flights))) + 1,
            target: (datum): number => datum.arrival_airport,
            targetColor: (datum): number => (datum.num_flights && Math.floor(Math.log10(datum.num_flights))) + 1,

        },
        options: {
            alpha: 0.5,
            lineWidth: 3,
        },
    };

    const labels = {
        data: nodesArray,
        mappings: {
            point: (datum): string => datum.name,
            label: (datum): string => datum.name,
            fontSize: (): number => 14,
        },
        options: {
            font: 'Arial',
            halo: 0.2,
            labelPlacement: graph.labels.PointLabelPlacement.TOP,
        },
    };

    const layers = [
        { nodes, edges, labels },
    ];

    const controller = new GraferController(canvas, { colors, points, layers });
    new UX.DebugMenu(controller.viewport);
}
