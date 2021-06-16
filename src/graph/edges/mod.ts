export * from './straight/Straight';
export * from './dashed/Dashed';
export * from './gravity/Gravity';
export * from './path/CurvedPath';
export * from './path/StraightPath';
export * from './bundle/ClusterBundle';

import {Straight} from './straight/Straight';
import {Dashed} from './dashed/Dashed';
import {Gravity} from './gravity/Gravity';
import {CurvedPath} from './path/CurvedPath';
import {StraightPath} from './path/StraightPath';
import {ClusterBundle} from './bundle/ClusterBundle';

export const types = {
    Straight,
    Dashed,
    Gravity,
    CurvedPath,
    StraightPath,
    ClusterBundle,
};

export* from './Edges';
