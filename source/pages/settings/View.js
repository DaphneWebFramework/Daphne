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
        this.set('displayNameChangeForm', '#displayNameChangeForm');
        this.set('displayNameChangeButton', '#displayNameChangeForm button[type=submit]').leuceButton();
        this.set('passwordChangeForm', '#passwordChangeForm');
        this.set('passwordChangeButton', '#passwordChangeForm button[type=submit]').leuceButton();
        this.set('accountDeleteForm', '#accountDeleteForm');
        this.set('accountDeleteCheckbox', '#accountDeleteForm input[type=checkbox]');
        this.set('accountDeleteButton', '#accountDeleteForm button[type=submit]').leuceButton();
    }

    /**
     * @returns {string}
     */
    displayNameChangeFormData()
    {
        return this.get('displayNameChangeForm').serialize();
    }

    /**
     * @returns {jQuery}
     */
    displayNameInput()
    {
        return this.get('displayNameChangeForm').find('[name=displayName]');
    }

    /**
     * @param {string} displayName
     */
    setNavbarDisplayName(displayName)
    {
        this.get('navbarDisplayName').text(displayName);
    }

    /**
     * @returns {string}
     */
    passwordChangeFormData()
    {
        return this.get('passwordChangeForm').serialize();
    }
}
