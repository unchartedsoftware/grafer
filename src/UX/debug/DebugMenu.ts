import Tweakpane from 'tweakpane';
import {Viewport} from '../../renderer/Viewport';
import {FolderApi} from 'tweakpane/dist/types/api/folder';
import {Layer} from '../../graph/Layer';
import {kButton2Index} from '../mouse/MouseHandler';
import {LayerRenderableBlendMode} from '../../graph/LayerRenderable';

export class DebugMenu {
    private viewport: Viewport;
    private pane: Tweakpane;
    private uxFolder: FolderApi;

    constructor(viewport: Viewport) {
        this.viewport = viewport;

        const layers = viewport.graph.layers;
        this.pane = new Tweakpane({ title: 'Debug Menu', expanded: false });
        for (let i = 0, n = layers.length; i < n; ++i) {
            const layer = layers[i];
            const layerFolder = this.pane.addFolder({ title: layer.name, expanded: false });
            this.addLayerOptions(layerFolder, layer);
        }

        this.uxFolder = null;

        this.pane.on('change', ()=> {
            this.viewport.render();
        });
    }

    public registerUX(ux: {[key: string]: any}): void {
        if (!this.uxFolder) {
            this.uxFolder = this.pane.addFolder({ title: 'UX', expanded: false });
        }

        const folder = this.uxFolder.addFolder({ title: ux.constructor.name, expanded: false });
        folder.addInput(ux, 'enabled');

        if ('button' in ux) {
            const keys = Object.keys(kButton2Index);
            const options = {};
            for (let i = 0, n = keys.length; i < n; ++i) {
                options[keys[i]] = keys[i];
            }
            folder.addInput(ux, 'button', { options });
        }

        if ('speed' in ux) {
            folder.addInput(ux, 'speed', { min: -100, max: 100 });
        }
    }

    private addLayerOptions(folder: FolderApi, layer: Layer): void {
        folder.addInput(layer, 'enabled');
        folder.addInput(layer, 'nearDepth', { min: 0, max: 1, label: 'near' });
        folder.addInput(layer, 'farDepth', { min: 0, max: 1, label: 'far' });

        if (layer.nodes) {
            const nodesFolder = folder.addFolder({title: 'Nodes', expanded: false});
            this.addLayerElementOptions(nodesFolder, layer, 'nodes');
        }

        if (layer.labels) {
            const labelsFolder = folder.addFolder({ title: 'Labels', expanded: false });
            this.addLayerElementOptions(labelsFolder, layer, 'labels');
        }

        if (layer.edges) {
            const edgesFolder = folder.addFolder({ title: 'Edges', expanded: false });
            this.addLayerElementOptions(edgesFolder, layer, 'edges');
        }
    }

    private addLayerElementOptions(folder: FolderApi, layer: Layer, key: string): void {
        const element = layer[key];

        const options = {
            enabled: [element, {}],
            blendMode: [element, {
                options: {
                    normal: LayerRenderableBlendMode.NORMAL,
                    additive: LayerRenderableBlendMode.ADDITIVE,
                    none: LayerRenderableBlendMode.NONE,
                },
            }],
            pixelSizing: [element, { label: 'pixel sizing ' }],
            billboard: [element, { label: 'billboarding' }],
            minSize: [element, { label: 'min size' }],
            maxSize: [element, { label: 'max size' }],
            gravity: [element, { min: -2, max: 2 }],
            alpha: [element, { min: 0, max: 1 }],
            fade: [element, { min: 0, max: 1 }],
            desaturate: [element, { min: 0, max: 1 }],
            [`${key}NearDepth`]: [layer, { min: 0, max: 1, label: 'near' }],
            [`${key}FarDepth`]: [layer, { min: 0, max: 1, label: 'far' }],
        };

        // menu.addInput(result, 'clusterEdgesMode', {
        //     options: {
        //         bundle: 'bundle',
        //         straight: 'straight',
        //         curved: 'curved',
        //     },
        // });

        const keys = Object.keys(options);
        for (let i = 0, n = keys.length; i < n; ++i) {
            if (keys[i] in options[keys[i]][0]) {
                folder.addInput(options[keys[i]][0], keys[i], options[keys[i]][1]);
            }
        }
    }
}
