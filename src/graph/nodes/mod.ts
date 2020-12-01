export * from './circle/Circle';
export * from './ring/Ring';
export * from './triangle/Triangle';
export * from './pentagon/Pentagon';
export * from './octagon/Octagon';

import {Circle} from './circle/Circle';
import {Ring} from './ring/Ring';
import {Triangle} from './triangle/Triangle';
import {Pentagon} from './pentagon/Pentagon';
import {Octagon} from './octagon/Octagon';

const types = {
    Circle,
    Ring,
    Triangle,
    Pentagon,
    Octagon,
};

export {types};

export * from './Nodes';
