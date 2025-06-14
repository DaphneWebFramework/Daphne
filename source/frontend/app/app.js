/**
 * app.js
 *
 * Defines base Model, View, and Controller classes for pages, providing
 * centralized logout functionality and global loading state management.
 *
 * (C) 2025 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

(function(global) {
'use strict';

class Model extends Leuce.MVC.Model
{
    /**
     * @returns {Promise}
     */
    logout()
    {
        return this.post()
            .handler('account')
            .action('logout')
            .send();
    }

    /**
     * @param {string} data
     * @returns {Promise}
     */
    changeLanguage(data)
    {
        return this.post()
            .handler('language')
            .action('change')
            .body(data)
            .send();
    }
}

class View extends Leuce.MVC.View
{
    constructor()
    {
        super();
        this.set('root', ':root');
        this.set('logout', '#navbarLogout');
        this.set('language', '#navbarLanguage');
        this.set('languageItems', '#navbarLanguage + .dropdown-menu .dropdown-item');
    }

    /**
     * @param {boolean} isLoading
     */
    setLoading(isLoading)
    {
        this.get('root').css('cursor', isLoading ? 'progress' : '');
    }
}

class Controller extends Leuce.MVC.Controller
{
    /**
     * @param {Model} model
     * @param {View} view
     */
    constructor(model, view)
    {
        super(model, view);
        this.view.get('logout')
            ?.on('click', this.#onLogoutClick.bind(this));
        this.view.get('languageItems')
            ?.on('click', this.#onLanguageItemsClick.bind(this));

    }

    static reloadPage()
    {
        window.location.reload();
    }

    /**
     * @param {jQuery.Event} event
     */
    #onLogoutClick(event)
    {
        event.preventDefault();
        this.view.setLoading(true);
        this.model.logout().then(response => {
            this.view.setLoading(false);
            if (response.isSuccess()) {
                Controller.reloadPage();
            } else {
                Leuce.UI.notifyError(response.body.message);
            }
        });
    }

    /**
     * @param {jQuery.Event} event
     */
    #onLanguageItemsClick(event)
    {
        event.preventDefault();
        const $language = this.view.get('language');
        const languageCode = $(event.currentTarget).data('language-code');
        const prevLanguageCode = $language.text();
        $language.text(languageCode);
        const data = {
            languageCode: languageCode,
            csrfToken: $language.data('csrf-token')
        };
        this.view.setLoading(true);
        this.model.changeLanguage(data).then(response => {
            if (response.isSuccess()) {
                Controller.reloadPage();
            } else {
                $language.text(prevLanguageCode);
                this.view.setLoading(false);
                Leuce.UI.notifyError(response.body.message);
            }
        });
    }
}

global.App = global.App || {};
global.App.Model = Model;
global.App.View = View;
global.App.Controller = Controller;
})(window);
