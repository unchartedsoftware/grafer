export * from './straight/Straight';
export * from './dashed/Dashed';
export * from './gravity/Gravity';
export * from './path/CurvedPath';

import {Straight} from './straight/Straight';
import {Dashed} from './dashed/Dashed';
import {Gravity} from './gravity/Gravity';
import {CurvedPath} from './path/CurvedPath';

export const types = {
    Straight,
    Dashed,
    Gravity,
    CurvedPath,
};

export* from './Edges';
