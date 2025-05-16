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
        this.view.get('form')?.on('submit', this.#onFormSubmit.bind(this));
        this.view.get('logoutButton')?.on('click', this.#onLogoutButtonClick.bind(this));
    }

    /**
     * @param {string} uri
     * @returns {boolean}
     */
    static #isSameHost(uri)
    {
        try {
            const url = new URL(uri, window.location.href);
            return url.hostname === window.location.hostname;
        } catch {
            return false;
        }
    }

    /**
     * @param {jQuery.Event} event
     */
    #onFormSubmit(event)
    {
        event.preventDefault();
        this.view.get('loginButton').setButtonLoading(true);
        this.model.login(this.view.formData()).then(response => {
            if (response.isSuccess()) {
                let redirectUri = Leuce.Utility.queryParameter('redirect');
                if (!redirectUri) {
                    Controller.reloadPage();
                } else {
                    redirectUri = decodeURIComponent(redirectUri);
                    if (Controller.#isSameHost(redirectUri)) {
                        window.location.replace(redirectUri);
                    } else {
                        Controller.reloadPage();
                    }
                }
            } else {
                this.view.get('loginButton').setButtonLoading(false);
                Leuce.UI.notifyError(response.body.message);
            }
        });
    }

    /**
     * @param {jQuery.Event} event
     */
    #onLogoutButtonClick(event)
    {
        event.preventDefault();
        this.view.get('logoutButton').setButtonLoading(true);
        this.model.logout().then(response => {
            if (response.isSuccess()) {
                Controller.reloadPage();
            } else {
                this.view.get('logoutButton').setButtonLoading(false);
                Leuce.UI.notifyError(response.body.message);
            }
        });
    }
}
