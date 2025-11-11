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
     * @param {string} payload
     *   "displayName={string}"
     * @returns {Promise<Leuce.HTTP.Response<
     *   void | {message: string}
     * >>}
     */
    changeDisplayName(payload)
    {
        return this.post()
            .handler('account')
            .action('change-display-name')
            .body(payload)
            .send();
    }

    /**
     * @param {string} payload
     *   "currentPassword={string}&newPassword={string}"
     * @returns {Promise<Leuce.HTTP.Response<
     *   void | {message: string}
     * >>}
     */
    changePassword(payload)
    {
        return this.post()
            .handler('account')
            .action('change-password')
            .body(payload)
            .send();
    }

    /**
     * @returns {Promise<Leuce.HTTP.Response<
     *   void | {message: string}
     * >>}
     */
    deleteAccount() {
        return this.post()
            .handler('account')
            .action('delete')
            .send();
    }
}
