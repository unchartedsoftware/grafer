export * from './circle/Circle';
export * from './ring/Ring';
export * from './triangle/Triangle';
export * from './pentagon/Pentagon';

import {Circle} from './circle/Circle';
import {Ring} from './ring/Ring';
import {Triangle} from './triangle/Triangle';
import {Pentagon} from './pentagon/Pentagon';

const types = {
    Circle,
    Ring,
    Triangle,
    Pentagon,
};

export {types};

export * from './Nodes';
