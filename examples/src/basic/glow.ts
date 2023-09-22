import {html, render} from 'lit-html';
import {GraferController, graph} from '../../../src/mod';

export async function glow(container: HTMLElement): Promise<void> {
    render(html`<canvas class="grafer_container"></canvas><mouse-interactions></mouse-interactions>`, container);
    const canvas = document.querySelector('.grafer_container') as HTMLCanvasElement;

    const points = {
        data: [
            { id: 0, x: -8.6, y: 5.0 },
            { id: 1, x: 8.6, y: 5.0 },
            { id: 2, x: 0.0, y: -10.0 },
            { id: 3, x: 0.0, y: 0.0 },
        ],
        options: {
            positionClassMode: 1,
        },
    };

    const layers = [
        {
            nodes: { data: [
                { point: 0 },
                { point: 1 },
            ]},
            labels: {
                data: [
                    { point: 0, label: 'glow' },
                    { point: 1, label: 'glow' },
                ],
                options: {
                    labelPlacement: graph.labels.PointLabelPlacement.TOP,
                },
            },
            edges: {
                data: [
                    { source: 0, target: 1 },
                    { source: 1, target: 2 },
                    { source: 2, target: 0 },
                ],
                mappings: { width: (): number => 5 },
            },
            options: { glow: 0.1 },
        },
        {
            nodes: {data: [
                { point: 2 },
                { point: 3 },
            ]},
            labels: {
                data: [
                    { point: 2, label: 'no glow' },
                    { point: 3, label: 'no glow' },
                ],
                options: {
                    labelPlacement: graph.labels.PointLabelPlacement.TOP,
                },
            },
            edges: {
                data: [
                    { source: 3, target: 0 },
                    { source: 3, target: 1 },
                    { source: 3, target: 2 },
                ],
            },
            options: { glow: 0 },
        },
    ];

    new GraferController(canvas, { points, layers });
}
