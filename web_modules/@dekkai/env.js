/**
 * Caches the result of a  NodeJS environment check.
 * @internal
 */
const kIsNodeJS = Object.prototype.toString.call(typeof process !== 'undefined' ? process : 0) === '[object process]';
/**
 * Checks if the current environment is NodeJS.
 */
function isNodeJS() {
    return kIsNodeJS;
}

/**
 * Checks if the current environment supports dynamic imports.
 * @internal
 */
function checkDynamicImport() {
    try {
        import(`${null}`).catch(() => false);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Caches the result of a dynamic imports check.
 * @internal
 */
const kSupportsDynamicImport = checkDynamicImport();
/**
 * Detects the environment and loads a module using either `require` or `import`.
 * @param mod - The name or path to the module to load.
 */
async function loadModule(mod) {
    if (kSupportsDynamicImport) {
        return await import(mod.toString());
    }
    else if (isNodeJS()) {
        return typeof module !== 'undefined' && typeof module.require === 'function' && module.require(mod.toString()) ||
            // eslint-disable-next-line camelcase
            typeof __non_webpack_require__ === 'function' && __non_webpack_require__(mod.toString()) ||
            typeof require === 'function' && require(mod.toString()); // eslint-disable-line
    }
    // not supported, a dynamic loader could be created for browser environments here, all modern browsers support
    // dynamic imports though so not implemented for now.
    throw 'ERROR: Can\'t load modules dynamically on this platform';
}

/**
 * Caches the result of a  NodeJS environment check.
 * @internal
 */
const kIsDeno = Boolean(typeof Deno !== 'undefined');
/**
 * Checks if the current environment is Deno.
 */
function isDeno() {
    return kIsDeno;
}

export { isDeno as a, isNodeJS as i, loadModule as l };
//# sourceMappingURL=env.js.map
