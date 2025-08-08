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
        if (this.view.has('form')) {
            this.view.get('form').on('submit', this.#onFormSubmit.bind(this));
        } else {
            this.view.get('logoutButton').on('click', this.#onLogoutButtonClick.bind(this));
        }
    }

    /**
     * @param {jQuery.Event} event
     * @returns {void}
     */
    #onFormSubmit(event)
    {
        event.preventDefault();
        this.view.get('loginButton').leuceButton().setLoading(true);
        this.model.login(this.view.formData()).then(response => {
            if (response.isSuccess()) {
                let redirectUri = Leuce.Utility.queryParameter('redirect');
                if (!redirectUri) {
                    Controller.reloadPage();
                } else {
                    redirectUri = decodeURIComponent(redirectUri);
                    if (Leuce.Utility.isSameOrigin(redirectUri)) {
                        window.location.replace(redirectUri);
                    } else {
                        Controller.reloadPage();
                    }
                }
            } else {
                this.view.get('loginButton').leuceButton().setLoading(false);
                Leuce.UI.notifyError(response.body.message);
            }
        });
    }

    /**
     * @param {jQuery.Event} event
     * @returns {void}
     */
    #onLogoutButtonClick(event)
    {
        event.preventDefault();
        this.view.get('logoutButton').leuceButton().setLoading(true);
        this.model.logout().then(response => {
            if (response.isSuccess()) {
                Controller.reloadPage();
            } else {
                this.view.get('logoutButton').leuceButton().setLoading(false);
                Leuce.UI.notifyError(response.body.message);
            }
        });
    }
}
