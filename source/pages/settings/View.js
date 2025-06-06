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
        this.set('navbarDisplayName', '#navbarDisplayName');
        this.set('displayNameForm', '#displayNameForm');
        this.set('displayNameChangeButton', '#displayNameForm button[type=submit]');
    }

    /**
     * @returns {string}
     */
    displayNameFormData()
    {
        return this.get('displayNameForm').serialize();
    }

    /**
     * @returns {jQuery}
     */
    displayNameInput()
    {
        return this.get('displayNameForm').find('[name=displayName]');
    }

    /**
     * @param {string} displayName
     */
    setNavbarDisplayName(displayName)
    {
        this.get('navbarDisplayName').text(displayName);
    }
}
