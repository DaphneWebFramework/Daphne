/**
 * View.js
 *
 * (C) 2025 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

class View extends App.View
{
    constructor()
    {
        super();
        this.set('googleSignInButton', '#googleSignInButton').gsiButton({
            theme: 'filled_blue',
            text: 'signup_with',
            width: 'responsive'
        });
        this.set('form', 'form');
        this.set('submitButton', 'form button[type=submit]').leuceButton();
    }

    /**
     * @returns {string}
     */
    csrfToken()
    {
        const form = new Leuce.UI.Form(this.get('form'));
        return form.findInput('csrfToken').val();
    }

    /**
     * @returns {string}
     */
    formData()
    {
        return this.get('form').serialize();
    }
}
