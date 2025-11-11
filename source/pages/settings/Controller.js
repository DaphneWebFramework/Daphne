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
        this.view.get('displayNameChangeForm')
            .on('submit', this.#onSubmitDisplayNameChangeForm.bind(this));
        this.view.get('passwordChangeForm')
            .on('submit', this.#onSubmitPasswordChangeForm.bind(this));
        this.view.get('accountDeleteCheckbox')
            .on('change', this.#onChangeAccountDeleteCheckbox.bind(this));
        this.view.get('accountDeleteForm')
            .on('submit', this.#onSubmitAccountDeleteForm.bind(this));
    }

    /**
     * @param {jQuery.Event} event
     * @returns {void}
     */
    #onSubmitDisplayNameChangeForm(event)
    {
        event.preventDefault();
        this.view.get('displayNameChangeButton').leuceButton().setLoading(true);
        this.model.changeDisplayName(this.view.displayNameChangeFormData()).then(response => {
            this.view.get('displayNameChangeButton').leuceButton().setLoading(false);
            if (response.isSuccess()) {
                this.view.setNavbarDisplayName(this.view.displayNameInput().val());
            } else {
                Leuce.UI.notifyError(response.body.message, 3000);
            }
        });
    }

    /**
     * @param {jQuery.Event} event
     * @returns {void}
     */
    #onSubmitPasswordChangeForm(event)
    {
        event.preventDefault();
        this.view.get('passwordChangeButton').leuceButton().setLoading(true);
        this.model.changePassword(this.view.passwordChangeFormData()).then(response => {
            this.view.get('passwordChangeButton').leuceButton().setLoading(false);
            if (!response.isSuccess()) {
                Leuce.UI.notifyError(response.body.message, 3000);
            }
        });
    }

    /**
     * @param {jQuery.Event} event
     * @returns {void}
     */
    #onChangeAccountDeleteCheckbox(event)
    {
        const checkbox = this.view.get('accountDeleteCheckbox');
        const button = this.view.get('accountDeleteButton');
        button.prop('disabled', !checkbox.prop('checked'));
    }

    /**
     * @param {jQuery.Event} event
     * @returns {void}
     */
    #onSubmitAccountDeleteForm(event)
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
                    Leuce.UI.notifyError(response.body.message, 3000);
                }
            });
        });
    }
}
