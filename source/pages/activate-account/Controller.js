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
        this.view.get('form').on('submit', this.#onFormSubmit.bind(this));
    }

    /**
     * @param {jQuery.Event} event
     */
    #onFormSubmit(event)
    {
        event.preventDefault();
        this.model.activateAccount(this.view.formData()).then(response => {
            if (response.isSuccess()) {
                window.location.replace(response.body.redirectUrl);
            } else {
                this.view.hideSpinner();
                Leuce.UI.notifyError(response.body.message);
            }
        });
    }

    init()
    {
        this.view.get('form').submit();
    }
}
