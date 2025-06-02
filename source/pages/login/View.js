/**
 * View.js
 *
 * (C) 2025 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

class View extends App.View
{
    /** @type {boolean} */
    #isLoginMode;

    constructor()
    {
        super();
        this.set('form', 'form');
        this.#isLoginMode = this.has('form');
        if (this.#isLoginMode) {
            this.set('loginButton', 'form button[type=submit]');
        } else {
            this.set('logoutButton', '#logoutButton');
        }
    }

    /**
     * @returns {boolean}
     */
    get isLoginMode()
    {
        return this.#isLoginMode;
    }

    /**
     * @returns {string|undefined}
     */
    formData()
    {
        return this.get('form').serialize();
    }
}
