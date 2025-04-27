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
}

class View extends Leuce.MVC.View
{
    constructor()
    {
        super();
        this.set('root', ':root');
        this.set('logout', '#logout');
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
        this.view.get('logout')?.on('click', this.#onLogoutClick.bind(this));
    }

    static reloadPage()
    {
        window.location.reload();
    }

    /**
     * @param {jQuery.Event} event
     *
     * @todo Handle error response.
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
                ;
            }
        });
    }
}

global.App = global.App || {};
global.App.Model = Model;
global.App.View = View;
global.App.Controller = Controller;
})(window);
