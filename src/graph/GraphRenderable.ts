import {Renderable} from '../renderer/Renderable';

export interface GraphRenderable extends Renderable {
    nearDepth: number;
    farDepth: number;
}
