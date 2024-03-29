import nodeVS from './RingLabel.vs.glsl';
import nodeFS from './RingLabel.fs.glsl';
import pickingFS from './RingLabel.picking.fs.glsl';
import {CircularLabel} from '../circular/CircularLabel';
import {RenderableShaders} from '../../../renderer/Renderable';
import {GraferContext} from '../../../renderer/GraferContext';
import {GraphPoints} from '../../../data/GraphPoints';
import {DataMappings} from '../../../data/DataTools';
import {PickingManager} from '../../../UX/picking/PickingManager';
import {LabelAtlas} from '../LabelAtlas';
import {LabelNodeData} from '../point/PointLabel';

export class RingLabel extends CircularLabel {
    protected initialize(
        context: GraferContext,
        points: GraphPoints,
        data: unknown[],
        mappings: Partial<DataMappings<LabelNodeData>>,
        pickingManager: PickingManager,
        font: string = 'monospace',
        bold: boolean = false,
        charSpacing: number = 0,
        labelAtlas?: LabelAtlas
    ): void {
        super.initialize(context, points, data, mappings, pickingManager, font, bold, charSpacing, labelAtlas);
        this.localUniforms.uPadding = 2.0;
    }
    protected getDrawShaders(): RenderableShaders {
        return {
            vs: nodeVS,
            fs: nodeFS,
        };
    }
    protected getPickingShaders(): RenderableShaders {
        return {
            vs: nodeVS,
            fs: pickingFS,
        };
    }
}
