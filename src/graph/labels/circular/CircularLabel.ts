import {LabelNodeData, PointLabel} from '../point/PointLabel';
import {RenderableShaders} from '../../../renderer/Renderable';
import nodeVS from './CircularLabel.vs.glsl';
import nodeFS from './CircularLabel.fs.glsl';
import {GraferContext} from '../../../renderer/GraferContext';
import {GraphPoints} from '../../../data/GraphPoints';
import {DataMappings} from '../../../data/DataTools';
import {PickingManager} from '../../../UX/picking/PickingManager';
import {LabelAtlas} from '../LabelAtlas';

export enum CircularLabelPlacement {
    INSIDE = 0,
    OUTSIDE = 1,
}

export class CircularLabel extends PointLabel {

    public get repeatLabel(): number {
        return this.localUniforms.uRepeatLabel as number;
    }
    public set repeatLabel(value: number) {
        this.localUniforms.uRepeatLabel = value;
    }

    public get repeatGap(): number {
        return this.localUniforms.uRepeatGap as number;
    }
    public set repeatGap(value: number) {
        this.localUniforms.uRepeatGap = value;
    }

    public get placementMargin(): number {
        return this.localUniforms.uPlacementMargin as number;
    }
    public set placementMargin(value: number) {
        this.localUniforms.uPlacementMargin = value;
    }

    public get mirror(): boolean {
        return this.localUniforms.uMirror as boolean;
    }
    public set mirror(value: boolean) {
        this.localUniforms.uMirror = value;
    }

    public get labelPlacement(): CircularLabelPlacement {
        return this.localUniforms.uLabelPlacement as CircularLabelPlacement;
    }
    public set labelPlacement(value: CircularLabelPlacement) {
        this.localUniforms.uLabelPlacement = value;
    }

    protected _labelDirection: number;
    public get labelDirection(): number {
        return this._labelDirection;
    }
    public set labelDirection(value: number) {
        const rad = value * 0.0174533;
        this.localUniforms.uLabelDirection = [Math.cos(rad), Math.sin(rad)];
    }

    protected initialize(
        context: GraferContext,
        points: GraphPoints,
        data: unknown[],
        mappings: Partial<DataMappings<LabelNodeData>>,
        pickingManager: PickingManager,
        labelAtlas?: LabelAtlas
    ): void {
        super.initialize(context, points, data, mappings, pickingManager, labelAtlas);
        this.localUniforms.uRepeatLabel = -1;
        this.localUniforms.uRepeatGap = 5;
        this.localUniforms.uPlacementMargin = 0;
        this.localUniforms.uMirror = false;
        this.localUniforms.uLabelPlacement = CircularLabelPlacement.OUTSIDE;
        this.labelDirection = 90;
    }

    protected getDrawShaders(): RenderableShaders {
        return {
            vs: nodeVS,
            fs: nodeFS,
        };
    }
}
