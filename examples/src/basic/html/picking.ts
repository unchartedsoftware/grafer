import {html, render} from 'lit-html';
import '../../../../src/grafer/GraferView';

export async function picking(container: HTMLElement): Promise<void> {
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

    const printEvent = (event): void => {
        const detail = event.detail[0];
        // eslint-disable-next-line
        console.log(`${event.type} => layer:"${detail.layer}" ${detail.type}:"${detail.id}"`);
    };

    render(html`
        <grafer-view
            class="grafer_container"
            .layers="${layers}"
            @grafer_hover_on="${printEvent}"
            @grafer_hover_off="${printEvent}"
            @grafer_click="${printEvent}"
        ></grafer-view>
        <mouse-interactions></mouse-interactions>
    `, container);
}
