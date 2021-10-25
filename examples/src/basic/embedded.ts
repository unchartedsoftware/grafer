import {html, render} from 'lit-html';
import {GraferController, UX} from '../../../src/mod';

export async function embedded(container: HTMLElement): Promise<void> {
    render(html`
        <style>
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
            </main>
            <aside></aside>
            <footer></footer>
        </div>
        `,
    container);
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
