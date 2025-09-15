/**
 * gsi.js
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

class Script
{
    /**
     * @type {string}
     * @const
     */
    static #URL = 'https://accounts.google.com/gsi/client';

    /**
     * @returns {Promise<void>}
     */
    static load()
    {
        if (window.google && window.google.accounts) {
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = this.#URL;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
} // class Script

class Button
{
    /** @type {jQuery} */
    #$button;

    /** @type {Object} */
    #options;

    /** @type {string} */
    #clientId;

    /** @type {number|null} */
    #resizeTimer;

    /** @type {number|null} */
    #lastWidth;

    /**
     * @param {jQuery} $button
     * @param {Object} [options]
     */
    constructor($button, options = {})
    {
        // 1
        this.#$button = $button;
        this.#options = options;
        this.#clientId = Leuce.Utility.metaContent('app:google-auth-client-id');
        this.#resizeTimer = null;
        this.#lastWidth = null;
        // 2
        Script.load()
            .then(() => this.#init())
            .catch(() => console.error('Gsi: Failed to load script.'));
    }

    /**
     * @returns {void}
     */
    #init()
    {
        // 1
        google.accounts.id.initialize({
            client_id: this.#clientId,
            callback: response => this.#onSignIn(response)
        });
        // 2
        this.#render();
        // 3
        if (this.#options.width === 'responsive') {
            $(window).on('resize', () => this.#onResize());
        }
    }

    /**
     * @returns {void}
     */
    #render()
    {
        // 1
        this.#$button.empty();
        // 2
        const options = { ...this.#options }; // clone
        if (options.width === 'responsive') {
            options.width = Math.round(this.#$button.width());
        }
        // 3
        google.accounts.id.renderButton(this.#$button[0], options);
    }

    /**
     * @returns {void}
     */
    #onResize()
    {
        // 1
        const width = this.#$button.width();
        if (width === this.#lastWidth) {
            return;
        }
        this.#lastWidth = width;
        // 2
        if (this.#resizeTimer !== null) {
            clearTimeout(this.#resizeTimer);
        }
        this.#resizeTimer = setTimeout(() => {
            this.#resizeTimer = null;
            this.#render();
        }, 100);
    }

    /**
     * @param {Object} response
     * @returns {void}
     */
    #onSignIn(response)
    {
        this.#$button.trigger('gsi:signedin', [response]);
    }
} // class Button

global.Gsi = {};
global.Gsi.VERSION = '1.0.0';
global.Gsi.Button = Button;
})(window);

(function($) {
'use strict';

/**
 * @param {Object} [options]
 * @returns {Gsi.Button}
 */
$.fn.gsiButton = function(options = {}) {
    const $button = this.first();
    const dataKey = 'gsi.button';
    let instance = $button.data(dataKey);
    if (!instance) {
        instance = new Gsi.Button($button, options);
        $button.data(dataKey, instance);
    }
    return instance;
};

})(jQuery);
