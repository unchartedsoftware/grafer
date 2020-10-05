import {renderMenu} from './renderMenu.js';
import * as simple from './simple/mod.js';

const examples = {
    simple,
}

function getExample(examples, path) {
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

function main() {
    const pathName = window.location.pathname;
    const pathComponents = pathName.split('/').filter(v => Boolean(v));
    const example = getExample(examples, pathComponents);

    if (example) {
        example(document.body);
    } else {
        renderMenu(document.body, examples);
    }
}

document.addEventListener("DOMContentLoaded",() => {
    main();
});
