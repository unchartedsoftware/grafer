function getExamplePaths(examples, entries = [], path = '') {
    const keys = Object.keys(examples);
    for (let i = 0, n = keys.length; i < n; ++i) {
        if (typeof examples[keys[i]] === 'function') {
            entries.push(`${path}/${keys[i]}`);
        } else {
            getExamplePaths(examples[keys[i]], entries, `${path}/${keys[i]}`);
        }
    }
    return entries;
}

export function renderMenu(element, examples) {
    const entries = getExamplePaths(examples);
    const container = document.createElement('div');
    container.className = 'menu-container';

    const title = document.createElement('div');
    title.innerText = 'Examples';
    title.className = 'menu-title';
    container.appendChild(title);

    for (let i = 0, n = entries.length; i < n; ++i) {
        const div = document.createElement('div');
        div.className = 'menu-item';
        div.innerText = entries[i];

        const a = document.createElement('a');
        a.href = entries[i];
        a.appendChild(div);

        container.appendChild(a);
    }

    element.appendChild(container);
}
