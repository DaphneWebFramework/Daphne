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
            .on('submit', this.#onDisplayNameChangeFormSubmit.bind(this));
        this.view.get('passwordChangeForm')
            .on('submit', this.#onPasswordChangeFormSubmit.bind(this));
    }

    /**
     * @param {jQuery.Event} event
     */
    #onDisplayNameChangeFormSubmit(event)
    {
        event.preventDefault();
        this.view.get('displayNameChangeButton').setButtonLoading(true);
        this.model.changeDisplayName(this.view.displayNameChangeFormData()).then(response => {
            this.view.get('displayNameChangeButton').setButtonLoading(false);
            if (response.isSuccess()) {
                this.view.setNavbarDisplayName(this.view.displayNameInput().val());
            } else {
                Leuce.UI.notifyError(response.body.message, 3000);
            }
        });
    }

    /**
     * @param {jQuery.Event} event
     */
    #onPasswordChangeFormSubmit(event)
    {
        event.preventDefault();
        this.view.get('passwordChangeButton').setButtonLoading(true);
        this.model.changePassword(this.view.passwordChangeFormData()).then(response => {
            this.view.get('passwordChangeButton').setButtonLoading(false);
            if (!response.isSuccess()) {
                Leuce.UI.notifyError(response.body.message, 3000);
            }
        });
    }
}
