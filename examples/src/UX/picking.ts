import {html, render} from 'lit';
import {GraferController, UX} from '../../../src/mod';

export async function picking(container: HTMLElement): Promise<void> {
    render(html`<canvas class="grafer_container"></canvas><mouse-interactions></mouse-interactions>`, container);
    const canvas = document.querySelector('.grafer_container') as HTMLCanvasElement;

    const nodes = {
        data: [
            { id: 'left', x: -8.6, y: 5.0 },
            { id: 'right', x: 8.6, y: 5.0 },
            { id: 'bottom', x: 0.0, y: -10.0 },
            { id: 'center', x: 0.0, y: 0.0 },
        ],
    };

    const edges = {
        data: [
            { source: 'left', target: 'right' },
            { source: 'right', target: 'bottom' },
            { source: 'bottom', target: 'left' },

            { source: 'center', target: 'left' },
            { source: 'center', target: 'right' },
            { source: 'center', target: 'bottom' },
        ],
    };

    const layers = [
        // let's name the layer
        { name: 'Awesomeness', nodes, edges },
    ];

    const printEvent = (event, detail): void => {
        // eslint-disable-next-line
        console.log(`${event.description} => layer:"${detail.layer}" ${detail.type}:"${detail.id}"`);
    };

    const controller = new GraferController(canvas, { layers });
    controller.on(UX.picking.PickingManager.events.hoverOn, printEvent);
    controller.on(UX.picking.PickingManager.events.hoverOff, printEvent);
    controller.on(UX.picking.PickingManager.events.click, printEvent);
}
