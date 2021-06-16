export  * from './point/PointLabel';
export * from './circular/CircularLabel';
export * from './ring/RingLabel';

import {PointLabel} from './point/PointLabel';
import {CircularLabel} from './circular/CircularLabel';
import {RingLabel} from './ring/RingLabel';

const types = {
    PointLabel,
    CircularLabel,
    RingLabel,
};

export {types};

export * from './LabelAtlas';
