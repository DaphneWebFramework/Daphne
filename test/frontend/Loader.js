/**
 * Loader.js
 *
 * (C) 2025 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

/**
 * Dynamically loads class and test files into the document.
 */
class Loader
{
    /**
     * Creates a new instance.
     *
     * @param {string} classBasePath
     *   The base directory path for the class files.
     * @param {string} suiteBasePath
     *   The base directory path for the test suite files.
     * @param {string[]} classPaths
     *   A list of class paths to test, without extensions.
     */
    constructor(classBasePath, suiteBasePath, classPaths)
    {
        this.classBasePath = Loader.#trimTrailingSlashes(classBasePath);
        this.suiteBasePath = Loader.#trimTrailingSlashes(suiteBasePath);
        this.classPaths = classPaths;
    }

    /**
     * Loads all class and corresponding test files in serial order.
     *
     * If the `classPaths` array is empty, a test file with an empty test is
     * loaded to prevent QUnit errors and prevent the GitHub workflow from
     * freezing.
     */
    async load()
    {
        if (this.classPaths.length === 0) {
            await Loader.#loadScript(`${this.suiteBasePath}/.test.js`);
        } else {
            for (const classPath of this.classPaths) {
                await Loader.#loadScript(`${this.classBasePath}/${classPath}.js`);
                await Loader.#loadScript(`${this.suiteBasePath}/${classPath}.test.js`);
            }
        }
    }

    /**
     * Removes slashes from the end of a path.
     *
     * @param {string} path
     *   The path from which to trim trailing slashes.
     * @returns {string}
     *   The path without trailing slashes.
     */
    static #trimTrailingSlashes(path)
    {
        return path.replace(/\/+$/, '');
    }

    /**
     * Loads a script file into the document.
     *
     * @param {string} src
     *   The source path of the script to be loaded.
     * @returns {Promise<void>}
     *   A Promise that resolves when the script is loaded or rejects if it
     *   fails.
     */
    static #loadScript(src)
    {
        return new Promise(function(resolve, reject) {
            const script = document.createElement('script');
            script.src = src;
            script.onload = function() { resolve(); };
            script.onerror = function() { reject(new Error(`Failed to load script: ${src}`)); };
            document.body.appendChild(script);
        });
    }
}
