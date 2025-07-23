/**
 * Controller.js
 *
 * (C) 2025 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

class Controller extends App.Controller
{
    /** @type {Object.<string, Leuce.UI.TableController>} */
    #tableControllers;

    constructor(model, view)
    {
        super(model, view);
        this.#tableControllers = {};
        this.#createTableControllers();
    }

    /**
     * @returns {void}
     */
    async init()
    {
        for (const controller of Object.values(this.#tableControllers)) {
            await controller.load();
        }
    }

    /**
     * @return {void}
     */
    #createTableControllers()
    {
        // Mapping of table names in view storage to table names in the database.
        const tables = {
            accountTable: 'account',
            accountRoleTable: 'accountrole',
            pendingAccountTable: 'pendingaccount',
            passwordResetTable: 'passwordreset'
        };
        const fnList = this.#bindModelMethod('listRecords');
        const fnAdd = this.#bindModelMethod('addRecord');
        const fnEdit = this.#bindModelMethod('editRecord');
        const fnDelete = this.#bindModelMethod('deleteRecord');

        for (const [key, value] of Object.entries(tables)) {
            this.#tableControllers[key] = new Leuce.UI.TableController({
                tableName: value,
                $table: this.view.get(key),
                fnList, fnAdd, fnEdit, fnDelete
            });
        }
    }

    /**
     * @param {string} methodName
     * @returns {(...args: any[]) => Promise<Leuce.HTTP.Response>}
     */
    #bindModelMethod(methodName)
    {
        return this.model[methodName].bind(this.model);
    }
}
