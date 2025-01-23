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
    constructor(classBasePath, suiteBasePath, classPaths) {
        this.classBasePath = Loader.#removeTrailingSlashes(classBasePath);
        this.suiteBasePath = Loader.#removeTrailingSlashes(suiteBasePath);
        this.classPaths = classPaths;
    }

    /**
     * Loads all class and corresponding test files.
     *
     * If the `classPaths` array is empty, a test file with an empty test is
     * loaded to prevent QUnit errors and prevent the GitHub workflow from
     * freezing.
     */
    Load() {
        if (this.classPaths.length === 0) {
            Loader.#loadScript(`${this.suiteBasePath}/.test.js`);
        } else {
            this.classPaths.forEach(classPath => {
                Loader.#loadScript(`${this.classBasePath}/${classPath}.js`);
                Loader.#loadScript(`${this.suiteBasePath}/${classPath}.test.js`);
            });
        }
    }

    //#region Private

    /**
     * Removes trailing slashes from a given path.
     *
     * @param {string} path
     *   The path from which to remove trailing slashes.
     * @returns {string}
     *   The path without trailing slashes.
     */
    static #removeTrailingSlashes(path) {
        return path.replace(/\/+$/, '');
    }

    /**
     * Loads a script file into the document.
     *
     * @param {string} src
     *   The source path of the script to be loaded.
     */
    static #loadScript(src) {
        const script = document.createElement('script');
        script.src = src;
        document.body.appendChild(script);
    }

    //#endregion Private
}
