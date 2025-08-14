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

    /**
     * @param {Model} model
     * @param {View} view
     */
    constructor(model, view)
    {
        super(model, view);
        // 1
        this.#tableControllers = {};
        this.#createTableControllers();
        // 2
        Leuce.UI.registerTranslations({
            "are_you_sure_you_want_to_drop_this_table": {
                "en": "Are you sure you want to drop this table?",
                "tr": "Bu tabloyu silmek istediğinize emin misiniz?"
            },
            "create": {
                "en": "Create",
                "tr": "Oluştur"
            },
            "drop": {
                "en": "Drop",
                "tr": "Sil"
            }
        });
        // 3
        this.view.get('entityMappingTable').on('click', '[data-action]',
            this.#onClickEntityMappingTableInlineAction.bind(this));
    }

    /**
     * @returns {void}
     */
    async start()
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
        // 1
        this.#tableControllers['entityMappingTable'] = new Leuce.UI.TableController({
            $table: this.view.get('entityMappingTable'),
            fnList: this.#bindModelMethod('listEntityMappings'),
        });
        // 2
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
        for (const [viewKey, tableName] of Object.entries(tables)) {
            this.#tableControllers[viewKey] = new Leuce.UI.TableController({
                $table: this.view.get(viewKey),
                tableName,
                fnList,
                fnAdd,
                fnEdit,
                fnDelete
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

    /**
     * @param {jQuery.Event} event
     * @returns {void}
     */
    #onClickEntityMappingTableInlineAction(event)
    {
        // 1
        const methodFor = {
            create: this.model.createTable,
            drop: this.model.dropTable
        };
        const $button = $(event.currentTarget);
        const action = $button.data('action');
        const method = methodFor[action];
        if (typeof method !== 'function') {
            console.warn('Unknown action:', action);
            return;
        }
        // 2
        function performAction() {
            const rowData = $button.closest('tr').data('row');
            $button.leuceButton().setLoading(true);
            method.call(this.model, rowData.entityClass).then(response => {
                $button.leuceButton().setLoading(false);
                if (!response.isSuccess()) {
                    Leuce.UI.notifyError(response.body.message);
                    return;
                }
                this.#tableControllers['entityMappingTable'].load();
            });
        }
        // 3
        if (action === 'drop') {
            Leuce.UI.messageBox({
                title: Leuce.UI.translate('drop'),
                message: Leuce.UI.translate('are_you_sure_you_want_to_drop_this_table'),
                primaryButtonLabel: Leuce.UI.translate('yes'),
                secondaryButtonLabel: Leuce.UI.translate('no')
            }).then(confirmed => {
                if (confirmed) {
                    performAction.call(this);
                }
            });
        } else {
            performAction.call(this);
        }
    }
}
