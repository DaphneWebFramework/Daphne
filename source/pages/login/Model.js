/**
 * Model.js
 *
 * (C) 2025 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

class Model extends App.Model
{
    /**
     * @param {string} data
     * @returns {Promise}
     */
    login(data)
    {
        return this.post()
            .handler('account')
            .action('login')
            .body(data)
            .send();
    }
}
