/**
 * TableConfig.js
 *
 * (C) 2025 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

class TableConfig
{
    /** @type {Object.<string, string>} */
    static #map = {
        accountTable: 'account',
        accountRoleTable: 'accountrole',
        pendingAccountTable: 'pendingaccount',
        passwordResetTable: 'passwordreset',
        persistentLoginTable: 'persistentlogin',
    };

    /**
     * @returns {[string, string][]}
     */
    static entries()
    {
        return Object.entries(this.#map);
    }

    /**
     * @returns {string[]}
     */
    static viewKeys()
    {
        return Object.keys(this.#map);
    }
}
