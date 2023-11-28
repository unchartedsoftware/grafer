import {html, render} from 'lit';
import { mat4, vec4, vec2 } from 'gl-matrix';
import {GraferController, UX} from '../../../src/mod';

const WINDOW_DEVICE_PIXEL_RATIO = window.devicePixelRatio;

function worldToPixel(controller, position): vec2 {
    const { camera } = controller.viewport; // prefer-destructing is a dumb eslint rule...
    const renderMatrix = mat4.mul(mat4.create(), camera.projectionMatrix, camera.viewMatrix);
    mat4.mul(renderMatrix, renderMatrix, controller.viewport.graph.matrix);

    const projected = vec4.set(vec4.create(), position[0], position[1], position[2], 1);
    vec4.transformMat4(projected, projected, renderMatrix);

    const { size } = controller.viewport; // prefer-destructing is a dumb eslint rule...
    const x = (projected[0] / projected[3]) * size[0] * 0.5 + size[0] * 0.5;
    const y = (projected[1] / projected[3]) * size[1] * 0.5 + size[1] * 0.5;

    return vec2.set(vec2.create(), x, y);
}

export async function embedded(container: HTMLElement): Promise<void> {
    render(html`
        <style>
            .overlay_container {
                width: 100%;
                height: 100%;
                position: absolute;
                top: 0;
                left: 0;
                pointer-events: none;
            }
            .wrapper {
                display: grid;
                grid-template-columns: 200px minmax(0, 1fr) 150px;
                grid-template-rows: 4rem minmax(0, 1fr) 5rem;
                height: 100%;
                width: 100%;
            }
            .grafer_container {
                width: 100%;
                height: 100%;
            }
            header {
                grid-column: 1 / -1;
            }
            nav {
                grid-column: 1;
            }
            main {
                grid-column: 2 / -2;
            }
            aside {
                grid-column: -2;
            }
            footer {
                grid-column: 1 / -1;
            }

            /* Styling */
            header, nav, aside, main, footer {
                border: 3px solid;
            }
            header {
                border-color: hsl(45deg 100% 50%);
                background-color: hsl(45deg 100% 50% / 0.2);
            }
            main {
                border-color: hsl(220deg 100% 50%);
                background-color: hsl(220deg 100% 50% / 0.2);
            }
            nav {
                border-color: hsl(170deg 100% 35%);
                background-color: hsl(170deg 100% 35% / 0.2);
            }
            aside {
                border-color: hsl(300deg 100% 45%);
                background-color: hsl(300deg 100% 45% / 0.2);
            }
            footer {
                border-color: hsl(350deg 100% 60%);
                background-color: hsl(350deg 100% 60% / 0.2);
            }
        </style>

        <div class="wrapper">
            <header></header>
            <nav></nav>
            <main>
                <canvas class="grafer_container"></canvas>
                <mouse-interactions></mouse-interactions>
                <canvas class="overlay_container"></canvas>
            </main>
            <aside></aside>
            <footer></footer>
        </div>
        `,
    container);
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

    const printEventFactory = (controller, ctx /* overlay */) => {
        return (event, detail): void => {
            // eslint-disable-next-line
            console.log(`${event.description} => layer:"${detail.layer}" ${detail.type}:"${detail.id}"`);
            const point = controller.viewport.graph.getPointByID(detail.id);
            const pxPoint = worldToPixel(controller, point);

            const bb = controller.viewport.canvas.getBoundingClientRect();
            const rect = ctx.canvas.getBoundingClientRect();
            ctx.canvas.width = rect.width * WINDOW_DEVICE_PIXEL_RATIO;
            ctx.canvas.height = rect.height * WINDOW_DEVICE_PIXEL_RATIO;
            ctx.clearRect(0, 0, ctx.canvas.width*WINDOW_DEVICE_PIXEL_RATIO, ctx.canvas.height*WINDOW_DEVICE_PIXEL_RATIO);
            ctx.beginPath();
            ctx.arc(bb.left*WINDOW_DEVICE_PIXEL_RATIO+pxPoint[0], bb.bottom*WINDOW_DEVICE_PIXEL_RATIO-pxPoint[1], 10, 0, 2 * Math.PI);
            ctx.fillStyle = "#" + Math.floor(Math.random()*16777215).toString(16);
            ctx.fill();
            ctx.stroke();
        };
    };

    // Overlay canvas
    const canvasDraw = document.querySelector('.overlay_container') as HTMLCanvasElement;
    const rect = canvasDraw.getBoundingClientRect();
    canvasDraw.width = rect.width * WINDOW_DEVICE_PIXEL_RATIO;
    canvasDraw.height = rect.height * WINDOW_DEVICE_PIXEL_RATIO;
    const ctx = canvasDraw.getContext('2d');

    const controller = new GraferController(canvas, { layers });
    // controller.on(UX.picking.PickingManager.events.hoverOn, printEventFactory(controller, ctx));
    // controller.on(UX.picking.PickingManager.events.hoverOff, printEventFactory(controller, ctx));
    controller.on(UX.picking.PickingManager.events.click, printEventFactory(controller, ctx));
}
