function getExamplePaths(examples, currentPath, entries = [], path = '') {
    const keys = Object.keys(examples);
    for (let i = 0, n = keys.length; i < n; ++i) {
        if (typeof examples[keys[i]] === 'function') {
            if (path === currentPath) {
                entries.push(`${path}/${keys[i]}`);
            }
        }
        else {
            if (path === currentPath) {
                entries.push(`${path}/${keys[i]}`);
            }
            else {
                getExamplePaths(examples[keys[i]], currentPath, entries, `${path}/${keys[i]}`);
            }
        }
    }
    return entries;
}
function renderMenu(element, examples, pathComponents) {
    const currentPath = pathComponents.length ? `/${pathComponents.join('/')}` : '';
    const entries = getExamplePaths(examples, currentPath);
    const container = document.createElement('div');
    container.className = 'menu-container';
    const header = document.createElement('div');
    header.className = 'menu-header';
    container.appendChild(header);
    if (pathComponents.length) {
        const backPath = `/${pathComponents.slice(0, -1).join('/')}`;
        const div = document.createElement('div');
        div.className = 'menu-back';
        const a = document.createElement('a');
        a.href = backPath;
        a.appendChild(div);
        header.appendChild(a);
    }
    const title = document.createElement('div');
    title.innerText = 'Examples';
    title.className = 'menu-title';
    header.appendChild(title);
    const items = document.createElement('div');
    items.className = 'menu-items-container';
    container.appendChild(items);
    for (let i = 0, n = entries.length; i < n; ++i) {
        const div = document.createElement('div');
        div.className = 'menu-item';
        div.innerText = entries[i];
        const a = document.createElement('a');
        a.href = entries[i];
        a.appendChild(div);
        items.appendChild(a);
    }
    element.appendChild(container);
}

export { renderMenu };
//# sourceMappingURL=renderMenu.js.map
