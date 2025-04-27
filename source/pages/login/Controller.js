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
        this.view.get('loginButton')?.on('click', this.#onLoginClick.bind(this));
        this.view.get('logoutButton')?.on('click', this.#onLogoutClick.bind(this));
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
     *
     * @todo Handle error response.
     */
    #onLoginClick(event)
    {
        event.preventDefault();
        const $button = this.view.get('loginButton');
        $button.setButtonLoading(true);
        this.model.login(this.view.formData()).then(response => {
            $button.setButtonLoading(false);
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
                ;
            }
        });
    }

    /**
     * @param {jQuery.Event} event
     *
     * @todo Handle error response.
     */
    #onLogoutClick(event)
    {
        event.preventDefault();
        const $button = this.view.get('logoutButton');
        $button.setButtonLoading(true);
        this.model.logout().then(response => {
            $button.setButtonLoading(false);
            if (response.isSuccess()) {
                Controller.reloadPage();
            } else {
                ;
            }
        });
    }
}
