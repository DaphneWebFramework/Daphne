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
    /**
     * @type {string}
     */
    #installKey;

    /**
     * @param {Model} model
     * @param {View} view
     */
    constructor(model, view)
    {
        super(model, view);
        this.#installKey = Leuce.Utility.metaContent('app:install-key');
    }

    /**
     * @returns {void}
     */
    async start()
    {
        // 1
        if (!await this.#runStep(
            this.view.get('databaseInstallStep'),
            () => this.model.checkDatabase(this.#installKey),
            () => this.model.createDatabase(this.#installKey),
            this.#createMessages('database')
        )) {
            return;
        }
        // 2
        const tables = {
            accountTableInstallStep: 'account',
            accountRoleTableInstallStep: 'accountrole',
            pendingAccountTableInstallStep: 'pendingaccount',
            passwordResetTableInstallStep: 'passwordreset'
        };
        for (const [viewKey, tableName] of Object.entries(tables)) {
            if (!await this.#runStep(
                this.view.get(viewKey),
                () => this.model.checkTable(this.#installKey, tableName),
                () => this.model.createTable(this.#installKey, tableName),
                this.#createMessages(`'${tableName}' table`)
            )) {
                return;
            }
        }
        // 3
        if (!await this.#runStep(
            this.view.get('adminAccountInstallStep'),
            () => this.model.checkAdminAccount(this.#installKey),
            () => this.model.createAdminAccount(this.#installKey),
            this.#createMessages('admin account')
        )) {
            return;
        }
        // 4
        this.view.get('installSummary').removeClass('d-none');
    }

    /**
     * @param {string} subject
     * @returns {Object.<string, string>}
     */
    #createMessages(subject)
    {
        return {
            checkingText: `Checking if the ${subject} exists...`,
            foundText: `The ${subject} exists.`,
            notFoundText: `The ${subject} was not found. Creating...`,
            checkFailedText: `An error occurred while checking the ${subject}.`,
            createSuccessText: `The ${subject} was created successfully.`,
            createFailText: `An error occurred while creating the ${subject}.`
        };
    }

    /**
     * @param {InstallStep} step
     * @param {() => Promise<Leuce.HTTP.Response>} checkFn
     * @param {() => Promise<Leuce.HTTP.Response>} createFn
     * @param {Object.<string, string>} messages
     * @returns {Promise<boolean>}
     */
    async #runStep(step, checkFn, createFn, messages)
    {
        // 1
        step.show();
        step.setText(messages.checkingText);
        // 2
        let response = await checkFn();
        if (!response.isSuccess()) {
            step.setErrorIcon();
            step.setText(messages.checkFailedText);
            return false;
        }
        // 3
        if (response.body.result) {
            step.setSuccessIcon();
            step.setText(messages.foundText);
            return true;
        }
        // 4
        step.setText(messages.notFoundText);
        // 5
        response = await createFn();
        // 6
        if (!response.isSuccess()) {
            step.setErrorIcon();
            step.setText(messages.createFailText);
            return false;
        }
        // 7
        step.setSuccessIcon(true);
        step.setText(messages.createSuccessText);
        return true;
    }
}
