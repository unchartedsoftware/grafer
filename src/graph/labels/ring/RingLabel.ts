import nodeVS from './RingLabel.vs.glsl';
import nodeFS from './RingLabel.fs.glsl';
import {CircularLabel} from '../circular/CircularLabel';
import {RenderableShaders} from '../../../renderer/Renderable';

export class RingLabel extends CircularLabel {
    protected getDrawShaders(): RenderableShaders {
        return {
            vs: nodeVS,
            fs: nodeFS,
        };
    }
}
