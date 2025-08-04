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
        // 1
        this.set('entityMappingTable', '#entityMappingTable')
            .leuceTable()
            .setFormatter('codeFont', View.#codeFontFormatter)
            .setFormatter('boolean', View.#booleanFormatter)
            .setFormatter('tableType', View.#tableTypeFormatter)
            .setRenderer('inlineActions', View.#entityMappingTableInlineActionsRenderer);
        // 2
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
     * @param {boolean} value
     * @returns {jQuery}
     */
    static #codeFontFormatter(row, value)
    {
        return $('<code>', {
            class: 'text-body',
            text: value
        });
    }

    /**
     * @param {Object} row
     * @param {boolean} value
     * @returns {jQuery}
     */
    static #booleanFormatter(row, value)
    {
        let iconClass;
        if (value === true) {
            iconClass = 'bi bi-check-lg text-success';
        } else if (value === false) {
            iconClass = 'bi bi-x-lg text-danger';
        } else {
            iconClass = 'bi bi-question-lg text-warning';
        }
        return $('<i>', { class: iconClass });
    }

    /**
     * @param {Object} row
     * @param {string} value
     * @returns {jQuery}
     */
    static #tableTypeFormatter(row, value)
    {
        const color = value === 'table' ? 'primary' : 'info';
        return $('<span>', {
            class: `badge text-bg-${color}`,
            text: value
        });
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

    /**
     * @param {Object} row
     * @returns {jQuery}
     */
    static #entityMappingTableInlineActionsRenderer(row)
    {
        return $('<div>', {
            class: 'leuce-table-inline-actions btn-group btn-group-sm'
        }).append(
            $('<button>', {
                type: 'button',
                class: 'btn btn-outline-success btn-sm',
                disabled: row.tableType === 'table' && row.tableExists,
                text: Leuce.UI.translate('create'),
                'data-action': 'create'
            }),
            $('<button>', {
                type: 'button',
                class: 'btn btn-outline-danger btn-sm',
                disabled: !row.tableExists,
                text: Leuce.UI.translate('drop'),
                'data-action': 'drop'
            })
        );
    }
}
