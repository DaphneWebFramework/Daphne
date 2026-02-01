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
            this.view.get('googleSignInButton')
                .on('gsi:signedin', this.#onGoogleSignedIn.bind(this));
            this.view.get('form')
                .on('submit', this.#onSubmitForm.bind(this));
        } else {
            this.view.get('logoutButton')
                .on('click', this.#onClickLogoutButton.bind(this));
        }
    }

    /**
     * @param {jQuery.Event} event
     * @param {Object} response
     * @returns {void}
     */
    #onGoogleSignedIn(event, response)
    {
        this.view.get('loginButton').prop('disabled', true);
        this.model.signInWithGoogle(
            this.view.csrfToken(),
            response.credential
        ).then(response => {
            if (response.isSuccess()) {
                this.#redirect();
            } else {
                this.view.get('loginButton').prop('disabled', false);
                Leuce.UI.notifyError(response.body.message);
            }
        });
    }

    /**
     * @param {jQuery.Event} event
     * @returns {void}
     */
    #onSubmitForm(event)
    {
        event.preventDefault();
        this.view.get('loginButton').leuceButton().setLoading(true);
        this.model.logIn(this.view.formData()).then(response => {
            if (response.isSuccess()) {
                this.#redirect();
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
    #onClickLogoutButton(event)
    {
        event.preventDefault();
        this.view.get('logoutButton').leuceButton().setLoading(true);
        this.model.logOut().then(response => {
            if (response.isSuccess()) {
                Controller.reloadPage();
            } else {
                this.view.get('logoutButton').leuceButton().setLoading(false);
                Leuce.UI.notifyError(response.body.message);
            }
        });
    }

    /**
     * @returns {void}
     */
    #redirect()
    {
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
    }
}
