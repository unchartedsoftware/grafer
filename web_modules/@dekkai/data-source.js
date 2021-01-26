import { i as isNodeJS, l as loadModule, a as isDeno } from './env.js';

/**
 * [[DataSource]] that represents a section (chunk) of a larger data source (parent). Useful when chunking a data source to
 * parallelize processing.
 */
class DataChunk {
    /**
     * @param source - The parent data source for this chunk
     * @param start - The start of this chunk, in bytes, within the parent data source
     * @param end - The end of this chunk, in bytes, within the parent data source
     */
    constructor(source, start, end) {
        /**
         * Variable to store the loaded data for this chunk.
         */
        this._buffer = null;
        this.source = source;
        this.start = start;
        this.end = end;
    }
    /**
     * When this chunk is loaded, returns the buffer containing the data for this chunk, `null` otherwise.
     */
    get buffer() {
        return this._buffer;
    }
    /**
     * The total byte length this chunk represents.
     *
     * NOTE: This value can change after a chunk is loaded for the first time if the chunk belongs to a remote data
     * source for which the total size is unknown.
     */
    get byteLength() {
        return this.end - this.start;
    }
    /**
     * Is this chunk loaded in memory.
     */
    get loaded() {
        return Boolean(this._buffer);
    }
    /**
     * Loads this chunk into memory.
     *
     * NOTE: If this chunk belongs to a remote [[DataSource]], this function waits until the data for this chunk has been
     * transferred from the remote and into memory. Also, if the final size for the remote [[DataSource]] is unknown,
     * the [[byteLength]] of this chunk could change after it finishes loading.
     */
    async load() {
        if (!this._buffer) {
            this._buffer = await this.loadData();
            // if we don't know the total size of remote files, the actual size of the chunk could change
            if (this._buffer === null) { // the chunk could not be loaded
                this.start = 0;
                this.end = 0;
            }
            else if (this.byteLength > this._buffer.byteLength) { // the actual data is smaller than the requested size
                this.end -= this.byteLength - this._buffer.byteLength;
            }
        }
    }
    /**
     * Unloads this chunk from memory.
     */
    unload() {
        this._buffer = null;
    }
    /**
     * Slices this chunk and returns a new data chunk pointing at the data within the specified boundaries.
     * @param start - Pointer to the start of the data in bytes
     * @param end - Pointer to the end of the data in bytes
     */
    slice(start, end) {
        return new DataChunk(this, start, end);
    }
    /**
     * Loads the data source into an ArrayBuffer. Optionally a `start` and `end` can be specified to load a part of the
     * data.
     * @param start - The offset at which the data will start loading
     * @param end - The offset at which the data will stop loading
     */
    loadData(start = 0, end = this.byteLength) {
        return this.source.loadData(this.start + start, this.start + end);
    }
}

class LocalDataFile {
    /**
     * Slices the file and returns a data chunk pointing at the data within the specified boundaries.
     * @param start - Pointer to the start of the data in bytes
     * @param end - Pointer to the end of the data in bytes
     */
    slice(start, end) {
        return new DataChunk(this, start, end);
    }
}

/**
 * Cached [`fs`](https://nodejs.org/api/fs.html) module in node and `null` in every other platform. If this in null in
 * node, `await` for [[kFsPromise]] to finish.
 * @internal
 */
let gFS = null;
/**
 * Promise that resolves to the [`fs`](https://nodejs.org/api/fs.html) module in node and `null` in every other platform.
 * @internal
 */
const kFsPromise = (isNodeJS() ? loadModule('fs') : Promise.resolve(null)).then(fs => (gFS = fs));
/**
 * Represents a data file on the node platform.
 */
class LocalDataFileNode extends LocalDataFile {
    /**
     * @param handle - A node file handle
     * @param stats - Stats for the file the handle points at
     */
    constructor(handle, stats) {
        super();
        this.handle = handle;
        this.stats = stats;
    }
    /**
     * Utility function to wrap a file as a [[DataFile]] for this platform.
     * @param source - The file to wrap
     */
    static async fromSource(source) {
        // wait for `fs` to be loaded
        await kFsPromise;
        let handle;
        if (source instanceof URL || typeof source === 'string') {
            handle = gFS.openSync(source);
        }
        else if (typeof source === 'number') {
            handle = source;
        }
        else {
            throw `A LocalDataFileNode cannot be created from a ${typeof source} instance`;
        }
        const stats = gFS.fstatSync(handle);
        return new LocalDataFileNode(handle, stats);
    }
    /**
     * The total length, in bytes, of the file this instance represents.
     */
    get byteLength() {
        return this.stats.size;
    }
    /**
     * Closes the local file handle for the current platform. After this function is called all subsequent operations
     * on this file, or any other data sources depending on this file, will fail.
     */
    close() {
        const handle = this.handle;
        kFsPromise.then(() => gFS.closeSync(handle));
        this.handle = null;
        this.stats = null;
    }
    /**
     * Loads the file into an ArrayBuffer. Optionally a `start` and `end` can be specified to load a part of the file.
     * @param start - The offset at which the data will start loading
     * @param end - The offset at which the data will stop loading
     */
    async loadData(start = 0, end = this.byteLength) {
        // wait for `fs` to be loaded
        await kFsPromise;
        const length = end - start;
        const result = new Uint8Array(length);
        let loaded = 0;
        while (loaded < length) {
            loaded += await this.loadDataIntoBuffer(result, loaded, start + loaded, end);
        }
        return result.buffer;
    }
    /**
     * Loads data into a buffer with the specified parameters.
     * @param buffer - The buffer in which the data will be loaded. It must be large enough to fit the data requested
     * @param offset - The byte offset within the buffer at which the data will be written
     * @param start - The byte offset within the file where data will be read
     * @param end - The byte offset within the file at which the data will stop being read
     */
    loadDataIntoBuffer(buffer, offset, start, end) {
        return new Promise((resolve, reject) => {
            const length = end - start;
            gFS.read(this.handle, buffer, offset, length, start, (err, bytesRead) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(bytesRead);
                }
            });
        });
    }
}

/**
 * Represents a data file on the browser platform.
 */
class LocalDataFileBrowser extends LocalDataFile {
    /**
     * @param blob - Container of the file
     */
    constructor(blob) {
        super();
        this.blob = blob;
    }
    /**
     * Utility function to wrap a file as a [[DataFile]] for this platform.
     * @param source - The file to wrap
     */
    static async fromSource(source) {
        return new LocalDataFileBrowser(source);
    }
    /**
     * The total length, in bytes, of the file this instance represents.
     */
    get byteLength() {
        return this.blob.size;
    }
    /**
     * Closes the local file handle for the current platform. After this function is called all subsequent operations
     * on this file, or any other data sources depending on this file, will fail.
     */
    close() {
        this.blob = null;
    }
    /**
     * Loads the file into an ArrayBuffer. Optionally a `start` and `end` can be specified to load a part of the file.
     * @param start - The offset at which the data will start loading
     * @param end - The offset at which the data will stop loading
     */
    async loadData(start = 0, end = this.byteLength) {
        const slice = this.blob.slice(start, end);
        return await this.loadBlob(slice);
    }
    /**
     * Loads the specified blob into an array buffer.
     * @param blob - The blob to load
     */
    loadBlob(blob) {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve(reader.result);
            };
            reader.readAsArrayBuffer(blob);
        });
    }
}

/**
 * Represents a data file on the deno platform.
 */
class LocalDataFileDeno extends LocalDataFile {
    /**
     * @param file - A deno file instance
     * @param info - Info for the file instance
     */
    constructor(file, info) {
        super();
        this.file = file;
        this.info = info;
    }
    /**
     * Utility function to wrap a file as a [[DataFile]] for this platform.
     * @param source - The file to wrap
     */
    static async fromSource(source) {
        if (!(source instanceof URL) && typeof source !== 'string') {
            throw `A LocalDataFileDeno cannot be created from a ${typeof source} instance`;
        }
        const stats = await Deno.stat(source);
        if (!stats.isFile) {
            throw `The path "${source} does not point to a file"`;
        }
        const file = await Deno.open(source, { read: true, write: false });
        return new LocalDataFileDeno(file, stats);
    }
    /**
     * The total length, in bytes, of the file this instance represents.
     */
    get byteLength() {
        return this.info.size;
    }
    /**
     * Closes the local file handle for the current platform. After this function is called all subsequent operations
     * on this file, or any other data sources depending on this file, will fail.
     */
    close() {
        Deno.close(this.file.rid);
        this.file = null;
        this.info = null;
    }
    /**
     * Loads the file into an ArrayBuffer. Optionally a `start` and `end` can be specified to load a part of the file.
     * @param start - The offset at which the data will start loading
     * @param end - The offset at which the data will stop loading
     */
    async loadData(start = 0, end = this.byteLength) {
        const length = end - start;
        const result = new Uint8Array(length);
        let loaded = 0;
        while (loaded < length) {
            loaded += await this.loadDataIntoBuffer(result, loaded, start + loaded, end);
        }
        return result.buffer;
    }
    /**
     * Loads data into a buffer with the specified parameters.
     * @param buffer - The buffer in which the data will be loaded. It must be large enough to fit the data requested
     * @param offset - The byte offset within the buffer at which the data will be written
     * @param start - The byte offset within the file where data will be read
     * @param end - The byte offset within the file at which the data will stop being read
     */
    async loadDataIntoBuffer(buffer, offset, start, end) {
        const cursorPosition = await this.file.seek(start, Deno.SeekMode.Start);
        if (cursorPosition !== start) {
            throw 'ERROR: Cannot seek to the desired position';
        }
        const result = new Uint8Array(end - start);
        const bytesRead = await this.file.read(result);
        buffer.set(result, offset);
        return bytesRead;
    }
}

/**
 * Base class for data files on all platforms.
 */
class DataFile {
    /**
     * Utility function to wrap a local file as a [[DataFile]] for this platform.
     * @param source - The file to wrap
     */
    static async fromLocalSource(source) {
        if (isNodeJS()) {
            return LocalDataFileNode.fromSource(source);
        }
        else if (isDeno()) {
            return LocalDataFileDeno.fromSource(source);
        }
        return LocalDataFileBrowser.fromSource(source);
    }
    /**
     * Utility function to wrap a remote file as a [[DataFile]] for this platform.
     * @param source - The file to wrap
     */
    static async fromRemoteSource(source) {
        throw 'Not implemented yet!';
    }
}

export { DataFile as D };
//# sourceMappingURL=data-source.js.map
