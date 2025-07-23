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
    constructor()
    {
        super();
        this.#initTables();
    }

    /**
     * @returns {void}
     */
    #initTables()
    {
        const tableNames = [
            'accountTable',
            'accountRoleTable',
            'pendingAccountTable',
            'passwordResetTable'
        ];

        for (const name of tableNames) {
            this.set(name, `#${name}`)
                .leuceTable()
                .setFormatter('truncate', View.#truncateFormatter);
        }
    }

    /**
     * @param {Object} row
     * @param {*} value
     * @param {string} [arg='100px']
     * @returns {jQuery}
     */
    static #truncateFormatter(row, value, arg = '100px')
    {
        return $('<span>', {
            class: 'd-inline-block text-truncate',
            style: `max-width: ${arg};`,
            text: value
        });
    }
}
