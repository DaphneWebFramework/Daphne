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
     * @param {string} csrfToken
     * @param {string} credential
     * @returns {Promise<Leuce.HTTP.Response<
     *   {
     *     redirectUrl: string
     *   } | {
     *     message: string
     *   }
     * >>}
     */
    signInWithGoogle(csrfToken, credential)
    {
        return this.post()
            .handler('account')
            .action('sign-in-with-google')
            .header('x-csrf-token', csrfToken)
            .body({ credential })
            .send();
    }

    /**
     * @param {string} data
     * @returns {Promise<Leuce.HTTP.Response>}
     */
    logIn(data)
    {
        return this.post()
            .handler('account')
            .action('log-in')
            .body(data)
            .send();
    }
}
