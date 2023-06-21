// disable lint rule to allow use of function hoisting
/* eslint-disable  @typescript-eslint/no-use-before-define */

import {html, render} from 'lit-html';
import {GraferController, UX} from '../../../src/mod';

export async function drag(container: HTMLElement): Promise<void> {
    render(html`<canvas class="grafer_container"></canvas><mouse-interactions></mouse-interactions>`, container);
    const canvas = document.querySelector('.grafer_container') as HTMLCanvasElement;
    let hoveredNodeIndex = 0;
    let selectedNodeIndex = 0;

    const points = {
        data: [
            { id: 'left', x: -8.6, y: 5.0 },
            { id: 'right', x: 8.6, y: 5.0 },
            { id: 'bottom', x: 0.0, y: -10.0 },
            { id: 'center', x: 0.0, y: 0.0 },
        ],
    };

    const nodes = {
        data: [
            { point: 'left' },
            { point: 'right' },
            { point: 'bottom' },
            { point: 'center' },
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
        { name: 'Awesomeness', nodes, edges },
    ];

    const controller = new GraferController(canvas, { points, layers });
    controller.on(UX.picking.PickingManager.events.hoverOn, onHoverEvent);
    controller.on(UX.picking.PickingManager.events.hoverOff, onHoverOffEvent);

    function onHoverEvent(_, detail): void {
        if(detail.type === 'node') {
            hoveredNodeIndex = detail.id;

            // allow node drag
            document.addEventListener('mousedown', mousedownEvent);
        }
    }
    function onHoverOffEvent(): void {
        // disallow node drag
        document.removeEventListener('mousedown', mousedownEvent);
    }

    function mousemoveEvent(e): void {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left; // x position within the element.
        const y = (rect.height - e.clientY) + rect.top; // y position within the element.
    
        // get world space coordinates at cursor
        const newPointCoords = UX.coordinate.Coordinate.relativePixelCoordinateToWorldPoint(
            controller,
            [x * devicePixelRatio, y * devicePixelRatio]
        );

        // get point data associated with selected node
        const point = controller.viewport.graph.getPointByIndex(selectedNodeIndex);

        // set new point data using new coords and old radius
        controller.viewport.graph.setPointByIndex(
            selectedNodeIndex,
            {
                x: newPointCoords[0],
                y: newPointCoords[1],
                z: 0,
                radius: point[3],
            }
        );

        // update texture and render
        controller.viewport.graph.update();
        controller.render();
    }
    function mousedownEvent(): void {
        // attach mouseup (stop drag) and mousemove (update node position) events
        document.addEventListener('mouseup', mouseupEvent);
        canvas.addEventListener('mousemove', mousemoveEvent);

        // disable camera translation to avoid interference with drag
        controller.interactionModules.translate.enabled = false;

        // set currently hovered node as selected node
        selectedNodeIndex = hoveredNodeIndex;
    }
    function mouseupEvent(): void {
        // remove drag events
        document.removeEventListener('mouseup', mouseupEvent);
        canvas.removeEventListener('mousemove', mousemoveEvent);

        // re-enable camera translation
        controller.interactionModules.translate.enabled = true;
    }

    document.addEventListener('mousedown', mousedownEvent);
    document.addEventListener('mouseup', mouseupEvent);
}
