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
     * @type {string|null}
     */
    #turnstileId = null;

    /**
     * @param {Model} model
     * @param {View} view
     */
    constructor(model, view)
    {
        super(model, view);
        turnstile.ready(() => {
            this.#turnstileId = turnstile.render('#turnstile-container', {
                sitekey: Leuce.Utility.metaContent('app:cloudflare-turnstile-site-key'),
                callback: (token) => this.#handleTurnstileSuccess()
            });
        });
        this.view.get('form').on(
            'submit',
            this.#handleFormSubmit.bind(this)
        );
    }

    /**
     * @returns {void}
     */
    #handleTurnstileSuccess()
    {
        this.view.get('submitButton').prop('disabled', false);
    }

    /**
     * @param {jQuery.Event} event
     * @returns {void}
     */
    #handleFormSubmit(event)
    {
        event.preventDefault();
        this.view.get('submitButton').leuceButton().setLoading(true);
        this.model.sendPasswordReset(this.view.formData()).then(response => {
            this.view.get('submitButton').leuceButton().setLoading(false);
            if (response.isSuccess()) {
                Leuce.UI.notifySuccess(response.body.message);
            } else {
                turnstile.reset(this.#turnstileId);
                Leuce.UI.notifyError(response.body.message);
            }
        });
    }
}
