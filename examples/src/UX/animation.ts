import {html, render} from 'lit';
import {AnimationManager} from 'src/UX/animation/AnimationManager';
import {GraferController, UX} from '../../../src/mod';


function animate(controller: GraferController, manager: AnimationManager, point): void {
    const diameter = point[3] * 2;
    const scale = Math.min(controller.viewport.size[0] / diameter, controller.viewport.size[1] / diameter);

    const translation = controller.viewport.graph.translation.slice();
    const endTranslation = [-point[0] * scale, -point[1] * scale, translation[2]];
    const args = [
      controller.viewport.graph,
      'translation',
      2000,
      translation,
      endTranslation,
      (): void => controller.render(),
      UX.animation.EaseOutCubic,
    ];

    // animate the translation
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    manager.animate(...args);

    // disable the callback
    args[5] = null;

    // set the scale animation
    args[1] = 'scale';
    args[3] = controller.viewport.graph.scale;
    args[4] = scale;

    // animate the scale
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    manager.animate(...args);
}

export async function animation(container: HTMLElement): Promise<void> {
    render(html`<canvas class="grafer_container"></canvas><mouse-interactions></mouse-interactions>`, container);
    const canvas = document.querySelector('.grafer_container') as HTMLCanvasElement;

    const nodes = {
        data: [
            { id: 0, x: -8.6, y: 5.0 },
            { id: 1, x: 8.6, y: 5.0 },
            { id: 2, x: 0.0, y: -10.0 },
            { id: 3, x: 0.0, y: 0.0 },
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

    const animationManager = new UX.animation.AnimationManager();

    const controller = new GraferController(canvas, { layers });
    controller.on(UX.picking.PickingManager.events.click, (event, detail) => {
        const point = controller.viewport.graph.getPointByID(detail.id);
        animate(controller, animationManager, point);
    });
}
