/**
 * leuce.js
 *
 * A lightweight HTTP, MVC, UI, and Utility framework for Daphne-powered apps.
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

//#region HTTP

class Request
{
    /** @type {string} */
    method = '';

    /** @type {string} */
    url = '';

    /** @type {Object.<string, string>} */
    headers = {};

    /** @type {string|Object|FormData|null} */
    body = '';

    /** @type {boolean} */
    isMultipart = false;
}

class Response
{
    /** @type {number} */
    statusCode = 0;

    /** @type {Object.<string, string>} */
    headers = {};

    /** @type {string|Object|null} */
    body = null;

    /**
     * @param {Object} jqXHR
     * @returns {Response}
     */
    static fromJqXHR(jqXHR)
    {
        const response = new Response();
        response.statusCode = jqXHR.status;
        jqXHR.getAllResponseHeaders().split(/[\r\n]+/).forEach(function(line) {
            const parts = line.split(': ');
            if (parts.length === 2) {
                response.headers[parts[0]] = parts[1];
            }
        });
        response.body = jqXHR.responseJSON ?? jqXHR.responseText;
        return response;
    }

    /**
     * @returns {boolean}
     */
    isSuccess()
    {
        return (this.statusCode >= 200 && this.statusCode < 300)
            || this.statusCode === 304;
    }
}

class Client
{
    /**
     * @param {Request} request
     * @param {(function(Response))=} onResponse
     * @param {(function(number))=} onProgress
     * @returns {Promise<Response>|undefined}
     */
    send(request, onResponse = null, onProgress = null)
    {
        const settings = this.#buildSettings(request, onProgress);
        if (typeof onResponse === 'function') {
            this.#sendWithCallback(settings, onResponse);
        } else {
            return this.#sendWithPromise(settings);
        }
    }

    /**
     * @param {Request} request
     * @param {(function(number))=} onProgress
     * @returns {Object}
     */
    #buildSettings(request, onProgress = null)
    {
        const settings = {
            method: request.method,
            url: request.url,
            headers: request.headers,
            data: request.body
        };
        if (request.isMultipart) {
            settings.contentType = false;
            settings.processData = false;
        }
        if (typeof onProgress === 'function') {
            settings.xhr = function() {
                const xhr = $.ajaxSettings.xhr();
                if (xhr.upload) {
                    xhr.upload.addEventListener('progress', function(e) {
                        if (e.lengthComputable) {
                            onProgress((e.loaded / e.total) * 100);
                        }
                    });
                }
                return xhr;
            };
        }
        return settings;
    }

    /**
     * @param {Object} settings
     * @param {function(Response)} callback
     */
    #sendWithCallback(settings, callback)
    {
        settings.complete = function(jqXHR) {
            callback(Response.fromJqXHR(jqXHR));
        };
        $.ajax(settings);
    }

    /**
     * @param {Object} settings
     * @returns {Promise<Response>}
     */
    #sendWithPromise(settings)
    {
        return new Promise(function(resolve) {
            settings.complete = function(jqXHR) {
                resolve(Response.fromJqXHR(jqXHR));
            };
            $.ajax(settings);
        });
    }
}

class RequestBuilder
{
    /** @type {Client} */
    #client = null;

    /** @type {Request} */
    #request = null;

    /** @type {string} */
    #handler = '';

    /** @type {string} */
    #action = '';

    /** @type {Object.<string, string|number>|null} */
    #queryParams = null;

    /**
     * @param {Client} client
     */
    constructor(client)
    {
        this.#client = client;
        this.#request = new Request();
    }

    /**
     * @returns {RequestBuilder}
     */
    get()
    {
        this.#request.method = 'GET';
        return this;
    }

    /**
     * @returns {RequestBuilder}
     */
    post()
    {
        this.#request.method = 'POST';
        return this;
    }

    /**
     * @param {string} name
     * @returns {RequestBuilder}
     */
    handler(name)
    {
        this.#handler = name;
        return this;
    }

    /**
     * @param {string} name
     * @returns {RequestBuilder}
     */
    action(name)
    {
        this.#action = name;
        return this;
    }

    /**
     * @param {Object.<string, string|number>} params
     * @returns {RequestBuilder}
     */
    query(params)
    {
        this.#queryParams = params;
        return this;
    }

    /**
     * @param {any} body
     * @returns {RequestBuilder}
     */
    body(body)
    {
        this.#request.body = body;
        this.#request.isMultipart = false;
        return this;
    }

    /**
     * @param {any} body
     * @returns {RequestBuilder}
     */
    jsonBody(body)
    {
        this.#request.headers['Content-Type'] = 'application/json';
        this.#request.body = JSON.stringify(body);
        this.#request.isMultipart = false;
        return this;
    }

    /**
     * @param {FormData} formData
     * @returns {RequestBuilder}
     */
    multipartBody(formData)
    {
        this.#request.body = formData;
        this.#request.isMultipart = true;
        return this;
    }

    /**
     * @param {(function(Response))=} onResponse
     * @param {(function(number))=} onProgress
     * @returns {Promise<Response>|undefined}
     */
    send(onResponse = null, onProgress = null)
    {
        let apiUrl = Utility.metaContent('app:api-url');
        if (apiUrl === null) {
            throw new Error('Missing meta tag: app:api-url');
        }
        if (!apiUrl.endsWith('/')) {
            apiUrl += '/';
        }
        const handler = encodeURIComponent(this.#handler);
        const action = encodeURIComponent(this.#action);
        this.#request.url = `${apiUrl}${handler}/${action}`;
        if (this.#queryParams) {
            this.#request.url += '?'
                + new URLSearchParams(this.#queryParams).toString();
        }
        return this.#client.send(this.#request, onResponse, onProgress);
    }
}

//#endregion HTTP

//#region MVC

class Model
{
    /** @type {Client} */
    #client = null;

    /**
     * @param {Client=} client
     */
    constructor(client = null)
    {
        this.#client = client ?? new Client();
    }

    /**
     * @returns {RequestBuilder}
     */
    get()
    {
        return this.#buildRequest().get();
    }

    /**
     * @returns {RequestBuilder}
     */
    post()
    {
        return this.#buildRequest().post();
    }

    /**
     * @returns {RequestBuilder}
     */
    #buildRequest()
    {
        return new RequestBuilder(this.#client);
    }
}

class View
{
    /** @type {Object.<string, jQuery>} */
    #store = {};

    /**
     * @param {string} name
     * @param {string|HTMLElement|Array<HTMLElement>|jQuery} selector
     * @returns {jQuery|null}
     */
    set(name, selector)
    {
        const $el = $(selector);
        if (!$el.length) {
            return null;
        }
        this.#store[name] = $el;
        return $el;
    }

    /**
     * @param {string} name
     * @returns {boolean}
     */
    has(name)
    {
        return this.#store.hasOwnProperty(name);
    }

    /**
     * @param {string} name
     * @returns {jQuery|null}
     */
    get(name)
    {
        if (!this.has(name)) {
            return null;
        }
        return this.#store[name];
    }
}

class Controller
{
    /** @type {Model} */
    #model = null;

    /** @type {View} */
    #view = null;

    /**
     * @param {Model} model
     * @param {View} view
     */
    constructor(model, view)
    {
        this.#model = model;
        this.#view = view;
    }

    /**
     * @returns {Model}
     */
    get model()
    {
        return this.#model;
    }

    /**
     * @returns {View}
     */
    get view()
    {
        return this.#view;
    }
}

//#endregion MVC

//#region UI

class UI
{
    /**
     * @param {string} message
     * @param {string} [type]
     * @param {number} [timeout]
     */
    static notify(message, type = 'primary', timeout = 0)
    {
        const containerId = 'leuce-notifications';
        let $container = $('#' + containerId);
        if ($container.length === 0) {
            $container = $('<div>', { id: containerId });
            $(document.body).append($container);
        }
        const $item = $('<div>', {
            class: `leuce-notification alert alert-${type} alert-dismissible fade show`,
            role: 'alert'
        }).html(message);
        $item.append($('<button>', {
            type: 'button',
            class: 'btn-close',
            'data-bs-dismiss': 'alert',
            'aria-label': 'Close'
        }));
        $container.prepend($item);
        if (timeout > 0) {
            setTimeout(function() {
                $item.alert('close'); // via jQueryInterface
            }, timeout);
        }
    }

    /**
     * @param {string} message
     * @param {number} [timeout]
     */
    static notifySuccess(message, timeout = 0)
    {
        this.notify(message, 'success', timeout);
    }

    /**
     * @param {string} message
     * @param {number} [timeout]
     */
    static notifyError(message, timeout = 0)
    {
        this.notify(message, 'danger', timeout);
    }
}

class Button
{
    /** @type {jQuery} */
    #$button;

    /** @type {boolean} */
    #isLoading = false;

    /** @type {string|null} */
    #htmlBackup = null;

    /** @type {boolean} */
    #alreadyDisabled = false;

    /** @type {string} */
    #inlineWidth = '';

    /**
     * @param {jQuery} $button
     */
    constructor($button)
    {
        if (!$button.is('button')) {
            throw new Error('Leuce: Only button elements are supported.');
        }
        this.#$button = $button;
    }

    /**
     * @param {boolean} isLoading
     */
    setLoading(isLoading)
    {
        if (this.#isLoading === isLoading) {
            console.warn('Leuce: Button is already in the requested state.');
            return;
        }
        if (isLoading) {
            this.#htmlBackup = this.#$button.html();
            this.#alreadyDisabled = this.#$button.prop('disabled');
            this.#inlineWidth = this.#$button[0].style.width;
            this.#$button.css('width', this.#$button.outerWidth() + 'px');
            this.#$button.html(
                '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span>' +
                '<span class="visually-hidden" role="status">Loading...</span>'
            );
            if (!this.#alreadyDisabled) {
                this.#$button.prop('disabled', true);
            }
            this.#$button.attr('aria-busy', 'true');
            this.#isLoading = true;
        } else {
            if (this.#htmlBackup !== null) {
                this.#$button.html(this.#htmlBackup);
            }
            if (!this.#alreadyDisabled) {
                this.#$button.prop('disabled', false);
            }
            this.#$button.css('width', this.#inlineWidth || '');
            this.#$button.removeAttr('aria-busy');
            this.#isLoading = false;
            this.#htmlBackup = null;
            this.#alreadyDisabled = false;
            this.#inlineWidth = '';
        }
    }

    /**
     * @returns {boolean}
     */
    isLoading()
    {
        return this.#isLoading;
    }
}

class Table
{
    /** @type {jQuery} */
    #$table;

    /** @type {jQuery} */
    #$thead;

    /** @type {jQuery} */
    #$tbody;

    /**
     * @type {Array<{
     *   key: string | null,
     *   format: { name: string, arg?: string } | null
     * }>}
     */
    #columns;

    /** @type {Object.<string, function>} */
    #formatters;

    /**
     * @param {jQuery} $table
     */
    constructor($table)
    {
        if (!$table.is('table')) {
            throw new Error('Leuce: Only table elements are supported.');
        }
        this.#$table = $table;
        this.#$thead = $table.find('thead').first();
        this.#$tbody = $table.find('tbody').first();
        this.#columns = this.#parseColumns();
        this.#formatters = {};
    }

    /**
     * @param {Object.<string, function>} formatters
     * @returns {Leuce.UI.Table}
     */
    setFormatters(formatters)
    {
        this.#formatters = formatters;
        return this;
    }

    /**
     * @param {Array.<Object>} data
     * @returns {Leuce.UI.Table}
     */
    setData(data)
    {
        this.#$tbody.empty();
        for (const row of data) {
            const $tr = $('<tr>');
            if ('id' in row) {
                $tr.data('id', row.id);
            }
            for (const { key, format } of this.#columns) {
                let value = '';
                if (key !== null) {
                    if (!(key in row)) {
                        console.warn(`Leuce: Key "${key}" not found in row data.`);
                    }
                    value = row[key];
                    if (format !== null) {
                        value = this.#callFormatter(value, format);
                    }
                }
                $tr.append($('<td>').text(value));
            }
            this.#$tbody.append($tr);
        }
        return this;
    }

    /**
     * @returns {Array<{
     *   key: string | null,
     *   format: { name: string, arg?: string } | null
     * }>}
     */
    #parseColumns()
    {
        const result = [];
        for (const th of this.#$thead.find('th').get()) {
            const $th = $(th);
            const key = this.#readColumnData($th, 'key');
            let format = this.#readColumnData($th, 'format');
            if (format !== null) {
                format = this.#parseColumnFormat(format);
            }
            result.push({ key, format });
        }
        return result;
    }

    /**
     * @param {jQuery} $th
     * @param {string} name
     * @returns {string|null}
     */
    #readColumnData($th, name)
    {
        let value = $th.data(name);
        if (value === undefined) {
            return null;
        }
        if (typeof value !== 'string') {
            console.warn(`Leuce: Column attribute 'data-${name}' must be a string.`);
            return null;
        }
        value = value.trim();
        if (value === '') {
            console.warn(`Leuce: Column attribute 'data-${name}' must be a nonempty string.`);
            return null;
        }
        return value;
    }

    /**
     * @param {string} format
     * @returns {{ name: string, arg?: string }}
     */
    #parseColumnFormat(format)
    {
        let [name, arg] = format.split(':');
        name = name.trim();
        if (name === '') {
            console.warn("Leuce: Column attribute 'data-format' must have a nonempty name.");
            return null;
        }
        if (arg !== undefined) {
            arg = arg.trim();
            if (arg === '') {
                arg = undefined;
            }
        }
        return { name, arg };
    }

    /**
     * @param {*} value
     * @param {{ name: string, arg?: string }} format
     * @returns {*}
     */
    #callFormatter(value, format)
    {
        const fn = this.#formatters[format.name];
        if (typeof fn !== 'function') {
            console.warn(`Leuce: No formatter found for "${format.name}".`);
            return value;
        }
        return fn(value, format.arg);
    }
}

UI.Button = Button;
UI.Table = Table;

//#endregion UI

//#region Utility

class Utility
{
    /**
     * @param {string} name
     * @returns {string|null}
     */
    static metaContent(name)
    {
        const meta = document.querySelector(`meta[name="${name}"]`);
        if (meta === null) {
            return null;
        }
        return meta.getAttribute('content');
    }

    /**
     * @param {string} name
     * @param {string} [search]
     * @returns {string|null}
     */
    static queryParameter(name, search = window.location.search)
    {
        const params = new URLSearchParams(search);
        return params.get(name);
    }
}

//#endregion Utility

global.Leuce = global.Leuce || {};
global.Leuce.VERSION = '1.0.0';

global.Leuce.HTTP = global.Leuce.HTTP || {};
global.Leuce.HTTP.Request = Request;
global.Leuce.HTTP.Response = Response;
global.Leuce.HTTP.Client = Client;
global.Leuce.HTTP.RequestBuilder = RequestBuilder;

global.Leuce.MVC = global.Leuce.MVC || {};
global.Leuce.MVC.Model = Model;
global.Leuce.MVC.View = View;
global.Leuce.MVC.Controller = Controller;

global.Leuce.UI = UI;

global.Leuce.Utility = Utility;
})(window);

//#region jQuery Plugins

(function($) {
'use strict';

/**
 * @returns {Leuce.UI.Button}
 */
$.fn.leuceButton = function() {
    const $button = this.first();
    let instance = $button.data('leuce.button');
    if (!instance) {
        instance = new Leuce.UI.Button($button);
        $button.data('leuce.button', instance);
    }
    return instance;
};

/**
 * @returns {Leuce.UI.Table}
 */
$.fn.leuceTable = function() {
    const $table = this.first();
    let instance = $table.data('leuce.table');
    if (!instance) {
        instance = new Leuce.UI.Table($table);
        $table.data('leuce.table', instance);
    }
    return instance;
};

})(jQuery);

//#endregion jQuery Plugins
