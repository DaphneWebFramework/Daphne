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
        if (this.set('form', 'form')) {
            this.set('googleSignInButton', '#googleSignInButton').gsiButton({
                theme: 'filled_blue',
                width: 'responsive'
            });
            this.set('loginButton', 'form button[type=submit]').leuceButton();
        } else {
            this.set('logoutButton', '#logoutButton').leuceButton();
        }
    }

    /**
     * @returns {string|undefined}
     */
    csrfToken()
    {
        if (!this.has('form')) {
            return undefined;
        }
        const form = new Leuce.UI.Form(this.get('form'));
        return form.findInput('csrfToken').val();
    }

    /**
     * @returns {string|undefined}
     */
    formData()
    {
        return this.get('form')?.serialize();
    }
}
