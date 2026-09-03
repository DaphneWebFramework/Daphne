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
        this.view.tabButtons.on(
            'shown.bs.tab',
            this.#handleTabShown.bind(this)
        );
        this.view.displayNameChangeForm.on(
            'submit',
            this.#handleDisplayNameChangeFormSubmit.bind(this)
        );
        this.view.passwordChangeForm.on(
            'submit',
            this.#handlePasswordChangeFormSubmit.bind(this)
        );
        this.view.accountDeleteCheckbox.on(
            'change',
            this.#handleAccountDeleteCheckboxChange.bind(this)
        );
        this.view.accountDeleteForm.on(
            'submit',
            this.#handleAccountDeleteFormSubmit.bind(this)
        );
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
        this.view.displayNameChangeButton.leuceButton().setLoading(true);
        this.model.changeDisplayName(this.view.displayNameChangeFormData()).then(response => {
            this.view.displayNameChangeButton.leuceButton().setLoading(false);
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
        this.view.passwordChangeButton.leuceButton().setLoading(true);
        this.model.changePassword(this.view.passwordChangeFormData()).then(response => {
            this.view.passwordChangeButton.leuceButton().setLoading(false);
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
        this.view.accountDeleteButton.prop(
            'disabled',
            !this.view.accountDeleteCheckbox.prop('checked')
        );
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
            this.view.accountDeleteButton.leuceButton().setLoading(true);
            this.model.deleteAccount().then(response => {
                if (response.isSuccess()) {
                    Controller.reloadPage();
                } else {
                    this.view.accountDeleteButton.leuceButton().setLoading(false);
                    Leuce.UI.notifyError(response.body.message);
                }
            });
        });
    }

    //#endregion Event Handlers
}
