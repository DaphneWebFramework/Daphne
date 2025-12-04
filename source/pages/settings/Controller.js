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
     * @param {Model} model
     * @param {View} view
     */
    constructor(model, view)
    {
        super(model, view);
        this.#bindEvents();
    }

    #bindEvents()
    {
        this.view.get('tabButtons')
            .on('shown.bs.tab', this.#handleTabShown.bind(this));
        this.view.get('displayNameChangeForm')
            .on('submit', this.#handleDisplayNameChangeFormSubmit.bind(this));
        this.view.get('passwordChangeForm')
            .on('submit', this.#handlePasswordChangeFormSubmit.bind(this));
        this.view.get('accountDeleteCheckbox')
            .on('change', this.#handleAccountDeleteCheckboxChange.bind(this));
        this.view.get('accountDeleteForm')
            .on('submit', this.#handleAccountDeleteFormSubmit.bind(this));
    }

    //#region Event Handlers

    /**
     * @param {jQuery.Event} event
     * @returns {void}
     */
    #handleTabShown(event)
    {
        const tabKey = event.target.id.replace('tab-', '');
        const url = new URL(window.location);
        url.searchParams.set('tab', tabKey);
        window.history.replaceState({}, '', url);
    }

    /**
     * @param {jQuery.Event} event
     * @returns {void}
     */
    #handleDisplayNameChangeFormSubmit(event)
    {
        event.preventDefault();
        const button = this.view.get('displayNameChangeButton').leuceButton();
        button.setLoading(true);
        this.model.changeDisplayName(this.view.displayNameChangeFormData()).then(response => {
            button.setLoading(false);
            if (response.isSuccess()) {
                this.view.setNavbarDisplayName(this.view.displayNameInput().val());
                Leuce.UI.notifySuccess("Display name changed successfully.");
            } else {
                Leuce.UI.notifyError(response.body.message);
            }
        });
    }

    /**
     * @param {jQuery.Event} event
     * @returns {void}
     */
    #handlePasswordChangeFormSubmit(event)
    {
        event.preventDefault();
        const button = this.view.get('passwordChangeButton').leuceButton();
        button.setLoading(true);
        this.model.changePassword(this.view.passwordChangeFormData()).then(response => {
            button.setLoading(false);
            if (response.isSuccess()) {
                Leuce.UI.notifySuccess("Password changed successfully.");
            } else {
                Leuce.UI.notifyError(response.body.message);
            }
        });
    }

    /**
     * @param {jQuery.Event} event
     * @returns {void}
     */
    #handleAccountDeleteCheckboxChange(event)
    {
        const checkbox = this.view.get('accountDeleteCheckbox');
        const button = this.view.get('accountDeleteButton');
        button.prop('disabled', !checkbox.prop('checked'));
    }

    /**
     * @param {jQuery.Event} event
     * @returns {void}
     */
    #handleAccountDeleteFormSubmit(event)
    {
        event.preventDefault();
        Leuce.UI.messageBox({
            title: "Confirm account deletion",
            message: "Deleting your account will permanently erase all your data. This action cannot be undone.",
            primaryButtonLabel: 'Delete account',
            primaryButtonVariant: 'danger',
            secondaryButtonLabel: 'Cancel'
        }).then(confirmed => {
            if (!confirmed) return;
            const button = this.view.get('accountDeleteButton').leuceButton();
            button.setLoading(true);
            this.model.deleteAccount().then(response => {
                if (response.isSuccess()) {
                    Controller.reloadPage();
                } else {
                    button.setLoading(false);
                    Leuce.UI.notifyError(response.body.message);
                }
            });
        });
    }

    //#endregion Event Handlers
}
