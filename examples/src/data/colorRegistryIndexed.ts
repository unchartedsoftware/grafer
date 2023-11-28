import {html, render} from 'lit';
import {GraferController, GraferControllerOptions, renderer} from '../../../src/mod';

function getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

export async function colorRegistryIndexed(container: HTMLElement): Promise<void> {

    // create a 'points' data structure to hold all positional data
    const points = {
        data: [
            { id: 'tl', x: -100, y: -100, radius: 4 },
            { id: 'tr', x: 100, y: -100, radius: 4 },
            { id: 'bl', x: -100, y: 100, radius: 4 },
            { id: 'br', x: 100, y: 100, radius: 4 },
        ],
    };

    // nodes reference points
    const nodes = {
        data: [
            { point: 'tl', color: 1},
            { point: 'tr', color: 0 },
            { point: 'bl', color: 0 },
            { point: 'br', color: 1 },
        ],
    };

    // edges also reference points
    const edges = {
        data: [
            { source: 'tl', target: 'tr', sourceColor: 0, targetColor: 1 },
            { source: 'tr', target: 'br', sourceColor: 0, targetColor: 1 },
            { source: 'br', target: 'bl', sourceColor: 0, targetColor: 1 },
            { source: 'bl', target: 'tl', sourceColor: 0, targetColor: 1 },
        ],
    };
    const layers = [
        { nodes, edges },
    ];
    const colors = [
        'green',
        'red',
    ];

    render(html`<canvas class="grafer_container"></canvas><mouse-interactions></mouse-interactions>`, container);
    const canvas = document.querySelector('.grafer_container') as HTMLCanvasElement;

    const controllerOptions: GraferControllerOptions = {
        viewport: {
            colorRegistryType: renderer.colors.ColorRegistryType.indexed,
        },
    };

    const controller = new GraferController(canvas, { points, colors, layers }, controllerOptions);
    setInterval(() => {
        // TODO: updateColor should be a public interface of an indexed ColorRegistry
        (controller.viewport.colorRegistry as any).updateColor(0, getRandomColor());
        (controller.viewport.colorRegistry as any).updateColor(1, getRandomColor());
        controller.render();
    }, 1000);
}
