import {renderMenu} from './renderMenu';
import {playground} from './playground';
import {layoutTester} from './layoutTester';
import {bundledEdgesLoader} from './bundledEdgesLoader';
import * as basic from './basic/mod';
import * as data from './data/mod';
import * as nodes from './nodes/mod';
import * as edges from './edges/mod';
import * as labels from './labels/mod';
import './HelpElements';

const examples = {
    basic,
    data,
    nodes,
    edges,
    labels,
    playground,
    layoutTester,
    bundledEdgesLoader,
};

function getExample(examples, path): (HTMLElement) => void | null {
    let obj = examples;
    for (let i = 0, n = path.length; i < n; ++i) {
        if (Object.prototype.hasOwnProperty.call(obj, path[i])) {
            obj = obj[path[i]];
        } else {
            return null;
        }
    }

    if (typeof obj === 'function') {
        return obj;
    }

    return null;
}

async function main(): Promise<void> {
    const pathName = window.location.pathname;
    const pathComponents = pathName.split('/').filter(v => Boolean(v));
    const example = getExample(examples, pathComponents);

    if (example) {
        await example(document.body);
    } else {
        renderMenu(document.body, examples, pathComponents);
    }
}

document.addEventListener("DOMContentLoaded",async () => {
    await main();
});
