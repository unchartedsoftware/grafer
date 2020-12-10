import edgeVS from './Dashed.vs.glsl';
import edgeFS from './Dashed.fs.glsl';

import {Straight} from '../straight/Straight';
import {RenderableShaders} from '../../../renderer/Renderable';
import {GraphPoints} from '../../../data/GraphPoints';
import {DataMappings} from '../../../data/DataTools';
import {BasicEdgeData} from '../Edges';
import {PickingManager} from '../../../UX/picking/PickingManager';
import {GraferContext} from '../../../renderer/GraferContext';

export class Dashed extends Straight {
    public get dashLength(): number {
        return this.localUniforms.uDashLength as number;
    }
    public set dashLength(value: number) {
        this.localUniforms.uDashLength = value;
    }

    protected initialize(
        context: GraferContext,
        points: GraphPoints,
        data: unknown[],
        mappings: Partial<DataMappings<BasicEdgeData>>,
        pickingManager: PickingManager
    ) {
        super.initialize(context, points, data, mappings, pickingManager);
        this.localUniforms.uDashLength = 10.0;
    }

    protected getDrawShaders(): RenderableShaders {
        return {
            vs: edgeVS,
            fs: edgeFS,
        };
    }
}
