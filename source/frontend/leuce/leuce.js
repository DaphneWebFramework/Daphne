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
    /** @type {string} */
    static LANGUAGE = $('html').attr('lang');

    /** @type {Object.<string, Object<string, string>>} */
    static TRANSLATIONS = Object.freeze({
        "table.no_data": {
            "en": "No matching records found",
            "tr": "Eşleşen kayıt bulunamadı"
        },
        "table.search": {
            "en": "Search...",
            "tr": "Ara..."
        },
        "table.add": {
            "en": "Add",
            "tr": "Ekle"
        },
        "table.reload": {
            "en": "Reload",
            "tr": "Yenile"
        },
        "table.show_per_page": {
            "en": "Show %s per page",
            "tr": "Sayfada %s göster"
        }
    });

    /**
     * @param {string} key
     * @param {...string} args
     * @returns {string}
     */
    static translate(key, ...args)
    {
        const unit = this.TRANSLATIONS[key];
        if (unit === undefined) {
            return key;
        }
        let value = unit[this.LANGUAGE];
        if (value === undefined) {
            return key;
        }
        return value.replace(/%s/g, function() {
            return args.shift() ?? '';
        });
    }

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

class TableToolbar
{
    /** @type {jQuery} */
    #$root;

    /** @type {(action: string, payload?: *) => void} | null */
    #actionHandler;

    constructor()
    {
        this.#$root = TableToolbar.#createRoot();
        this.#actionHandler = null;
        this.#bindEvents();
    }

    /**
     * @param {(action: string, payload?: *) => void} | null actionHandler
     * @returns {void}
     */
    setActionHandler(actionHandler)
    {
        this.#actionHandler = actionHandler;
    }

    /**
     * @returns {jQuery}
     */
    root()
    {
        return this.#$root;
    }

    /**
     * @returns {void}
     */
    #bindEvents()
    {
        this.#$root.find('[data-action="search-input"]').on('keydown', (event) => {
            if (event.key === 'Enter') {
                this.#actionHandler?.('search', $(event.currentTarget).val().trim());
            }
        });
        this.#$root.find('[data-action="search"]').on('click', () => {
            const $input = this.#$root.find('[data-action="search-input"]');
            this.#actionHandler?.('search', $input.val().trim());
        });
        this.#$root.find('[data-action="add"]').on('click', () => {
            this.#actionHandler?.('add');
        });
        this.#$root.find('[data-action="reload"]').on('click', () => {
            this.#actionHandler?.('reload');
        });
    }

    /**
     * @returns {jQuery}
     */
    static #createRoot()
    {
        return $('<div>', {
            class: 'leuce-table-controls'
        }).append(
            this.#createSearchBox(),
            this.#createActionButtons()
        );
    }

    /**
     * @returns {jQuery}
     */
    static #createSearchBox()
    {
        const $input = $('<input>', {
            type: 'search',
            class: 'form-control form-control-sm',
            'data-action': 'search-input',
            placeholder: UI.translate('table.search'),
            css: { minWidth: '100px', maxWidth: '150px' }
        });
        const $inputGroup = $('<div>', {
            class: 'input-group flex-nowrap'
        }).append(
            $input,
            this.#createButton('search', 'bi bi-search')
        );
        return $('<div>', {
            class: 'leuce-table-controls-group'
        }).append($inputGroup);
    }

    /**
     * @returns {jQuery}
     */
    static #createActionButtons()
    {
        return $('<div>', {
            class: 'leuce-table-controls-group'
        }).append(
            this.#createButton('add', 'bi bi-plus-lg', UI.translate('table.add')),
            this.#createButton('reload', 'bi bi-arrow-clockwise', UI.translate('table.reload'))
        );
    }

    /**
     * @param {string} action
     * @param {string} iconClass
     * @param {string|null} [label=null]
     * @returns {jQuery}
     */
    static #createButton(action, iconClass, label = null)
    {
        const $button = $('<button>', {
            type: 'button',
            class: 'leuce-table-button btn btn-sm',
            'data-action': action
        }).append($('<i>', { class: iconClass }));
        if (label !== null) {
            $button.append(' ', label);
        }
        return $button;
    }
}

class TablePaginator
{
    /** @type {number[]} */
    static #PAGE_SIZE_OPTIONS = Object.freeze([5, 10, 25, 50, 100]);

    /** @type {number} */
    static #DEFAULT_PAGE_SIZE = 10;

    /** @type {jQuery} */
    #$root;

    /** @type {(action: string, payload?: *) => void} | null */
    #actionHandler;

    constructor()
    {
        this.#$root = TablePaginator.#createRoot();
        this.#actionHandler = null;
        this.#bindEvents();
    }

    /**
     * @returns {number}
     */
    static defaultPageSize()
    {
        return this.#DEFAULT_PAGE_SIZE;
    }

    /**
     * @param {(action: string, payload?: *) => void} | null actionHandler
     * @returns {void}
     */
    setActionHandler(actionHandler)
    {
        this.#actionHandler = actionHandler;
    }

    /**
     * @returns {jQuery}
     */
    root()
    {
        return this.#$root;
    }

    /**
     * @param {number} totalRecords
     * @param {number} pageSize
     * @param {number} currentPage
     * @returns {number} totalPages
     */
    update(totalRecords, pageSize, currentPage)
    {
        const totalPages = Math.ceil(totalRecords / pageSize);
        const $select = this.#$root.find('[data-action="currentPage"]');
        $select.empty();
        for (let i = 1; i <= totalPages; ++i) {
            const $option = $('<option>').val(i).text(i);
            if (i === currentPage) {
                $option.prop('selected', true);
            }
            $select.append($option);
        }
        const hasNoPages = totalPages === 0;
        const atFirstPage = currentPage === 1;
        const atLastPage = currentPage === totalPages || hasNoPages;
        this.#$root.find('[data-action="firstPage"]').prop('disabled', atFirstPage);
        this.#$root.find('[data-action="previousPage"]').prop('disabled', atFirstPage);
        this.#$root.find('[data-action="currentPage"]').prop('disabled', hasNoPages);
        this.#$root.find('[data-action="nextPage"]').prop('disabled', atLastPage);
        this.#$root.find('[data-action="lastPage"]').prop('disabled', atLastPage);
        return totalPages;
    }

    /**
     * @returns {void}
     */
    #bindEvents()
    {
        this.#$root.find('[data-action="pageSize"]').on('change', (event) => {
            this.#actionHandler?.('pageSize', parseInt(event.target.value, 10));
        });
        this.#$root.find('[data-action="firstPage"]').on('click', () => {
            this.#actionHandler?.('firstPage');
        });
        this.#$root.find('[data-action="previousPage"]').on('click', () => {
            this.#actionHandler?.('previousPage');
        });
        this.#$root.find('[data-action="currentPage"]').on('change', (event) => {
            this.#actionHandler?.('currentPage', parseInt(event.target.value, 10));
        });
        this.#$root.find('[data-action="nextPage"]').on('click', () => {
            this.#actionHandler?.('nextPage');
        });
        this.#$root.find('[data-action="lastPage"]').on('click', () => {
            this.#actionHandler?.('lastPage');
        });
    }

    /**
     * @returns {jQuery}
     */
    static #createRoot()
    {
        return $('<div>', {
            class: 'leuce-table-controls'
        }).append(
            this.#createSizeSelector(),
            this.#createNavigator()
        );
    }

    /**
     * @returns {jQuery}
     */
    static #createSizeSelector()
    {
        const $select = this.#createSelect('pageSize');
        for (const size of this.#PAGE_SIZE_OPTIONS) {
            const $option = $('<option>').val(size).text(size);
            if (size === this.#DEFAULT_PAGE_SIZE) {
                $option.attr('selected', 'selected');
            }
            $select.append($option);
        }
        return $('<div>', {
            class: 'leuce-table-controls-group'
        }).append(UI.translate('table.show_per_page', $select.prop('outerHTML')));
    }

    /**
     * @returns {jQuery}
     */
    static #createNavigator()
    {
        return $('<div>', {
            class: 'leuce-table-controls-group'
        }).append(
            this.#createButton('firstPage', 'bi bi-chevron-bar-left'),
            this.#createButton('previousPage', 'bi bi-chevron-left'),
            this.#createSelect('currentPage').append($('<option>').val(1).text('1')),
            this.#createButton('nextPage', 'bi bi-chevron-right'),
            this.#createButton('lastPage', 'bi bi-chevron-bar-right')
        );
    }

    /**
     * @param {string} action
     * @returns {jQuery}
     */
    static #createSelect(action)
    {
        return $('<select>', {
            class: 'form-select form-select-sm w-auto',
            'data-action': action
        });
    }

    /**
     * @param {string} action
     * @param {string} iconClass
     * @returns {jQuery}
     */
    static #createButton(action, iconClass)
    {
        return $('<button>', {
            type: 'button',
            class: 'leuce-table-button btn btn-sm',
            'data-action': action
        }).append($('<i>', { class: iconClass }));
    }
}

class Table
{
    /** @type {Object.<string, string>} */
    static #SORT_ICON_CLASSES = Object.freeze({
        'none': 'bi bi-chevron-expand',
        'asc':  'bi bi-chevron-down',
        'desc': 'bi bi-chevron-up'
    });

    /** @type {string} */
    static #INLINE_ACTIONS_RENDERER_NAME = 'inlineActions';

    /** @type {jQuery} */
    #$wrapper;

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
     *   render: string | null
     * }>}
     */
    #columns;

    /** @type {Object.<string, function>} | null */
    #formatters;

    /** @type {Object.<string, function> | null} */
    #renderers;

    /** @type {(action: string, payload?: *) => void} | null */
    #actionHandler;

    /** @type {TableToolbar} */
    #toolbar;

    /** @type {TablePaginator} */
    #paginator;

    /** @type {jQuery} */
    #$overlay;

    /**
     * @param {jQuery} $table
     */
    constructor($table)
    {
        if (!$table.is('table')) {
            throw new Error('Leuce: Only table elements are supported.');
        }

        this.#$wrapper = Table.#wrap($table);
        this.#$table = $table;
        this.#$thead = $table.find('thead').first();
        if (this.#$thead.length === 0) {
            throw new Error('Leuce: Table requires a `thead` element.');
        }
        this.#$tbody = $table.find('tbody').first();
        if (this.#$tbody.length === 0) {
            throw new Error('Leuce: Table requires a `tbody` element.');
        }

        this.#decorateHeaders();

        this.#columns = this.#parseColumns();
        this.#formatters = null;
        this.#renderers = null;
        this.#actionHandler = null;

        this.#toolbar = new TableToolbar();
        this.#$wrapper.prepend(this.#toolbar.root().addClass('mb-3'));

        this.#paginator = new TablePaginator();
        this.#$wrapper.append(this.#paginator.root().addClass('mt-3'));

        this.#$overlay = null;

        this.setRenderer(
            Table.#INLINE_ACTIONS_RENDERER_NAME,
            Table.#renderInlineActions.bind(Table)
        );

        this.#bindEvents();
    }

    /**
     * @returns {number}
     */
    static defaultPageSize()
    {
        return TablePaginator.defaultPageSize();
    }

    /**
     * @param {string} name
     * @param {(row: Object, value: *, arg?: string) => *} formatter
     * @returns {Leuce.UI.Table}
     */
    setFormatter(name, formatter)
    {
        if (!this.#formatters) {
            this.#formatters = {};
        }
        this.#formatters[name] = formatter;
        return this;
    }

    /**
     * @param {string} name
     * @param {(row: Object) => string|jQuery} renderer
     * @returns {Leuce.UI.Table}
     */
    setRenderer(name, renderer)
    {
        if (!this.#renderers) {
            this.#renderers = {};
        }
        this.#renderers[name] = renderer;
        return this;
    }

    /**
     * @param {(action: string, payload?: *) => void} | null actionHandler
     * @returns {Leuce.UI.Table}
     */
    setActionHandler(actionHandler)
    {
        this.#actionHandler = actionHandler;
        this.#toolbar?.setActionHandler(actionHandler);
        this.#paginator?.setActionHandler(actionHandler);
        return this;
    }

    /**
     * @param {boolean} isLoading
     */
    setLoading(isLoading)
    {
        if (isLoading) {
            if (this.#$overlay === null) {
                this.#$overlay = $(`
                    <div class="leuce-table-overlay hidden">
                        <span class="spinner-border" aria-hidden="true"></span>
                        <span class="visually-hidden" role="status">Loading...</span>
                    </div>
                `);
                this.#$wrapper.append(this.#$overlay);
            }
            this.#$overlay.removeClass('hidden');
        } else if (this.#$overlay) {
            this.#$overlay.addClass('hidden');
        }
    }

    /**
     * @param {Array.<Object>} data
     * @returns {Leuce.UI.Table}
     */
    setData(data)
    {
        this.#$tbody.empty();
        if (data.length === 0) {
            const $tr = $('<tr>');
            const $td = $('<td>');
            $td.attr('colspan', this.#columns.length)
               .addClass('text-center text-muted')
               .text(UI.translate('table.no_data'));
            $tr.append($td);
            this.#$tbody.append($tr);
            return this;
        }
        for (const row of data) {
            const $tr = $('<tr>');
            if ('id' in row) {
                $tr.data('id', row.id);
            }
            for (const { key, format, render } of this.#columns) {
                let value = '';
                if (key !== null) {
                    if (!(key in row)) {
                        console.warn(`Leuce: Key "${key}" not found in row data.`);
                    }
                    value = row[key];
                    if (format !== null) {
                        value = this.#callFormatter(format, row, value);
                    }
                } else if (render !== null) {
                    value = this.#callRenderer(render, row);
                }
                const $td = $('<td>');
                if (value instanceof jQuery) {
                    $td.append(value);
                } else {
                    $td.text(value);
                }
                $tr.append($td);
            }
            this.#$tbody.append($tr);
        }
        return this;
    }

    /**
     * @param {number} totalRecords
     * @param {number} pageSize
     * @param {number} currentPage
     * @returns {number} totalPages
     */
    updatePaginator(totalRecords, pageSize, currentPage)
    {
        return this.#paginator.update(totalRecords, pageSize, currentPage);
    }

    /**
     * @returns {void}
     */
    #decorateHeaders()
    {
        for (const th of this.#$thead.find('th').get()) {
            const $th = $(th);
            $th.addClass('leuce-table-header');
            if ($th.is('[data-key]')) {
                const $span = $('<span>').append(
                    $th.text().trim(),
                    $('<i>').attr('class', Table.#SORT_ICON_CLASSES.none)
                )
                $th.addClass('leuce-table-header-sortable')
                   .empty()
                   .append($span);
            }
        }
        this.#$thead.find('tr').append($('<th>', {
            scope: 'col',
            'data-render': Table.#INLINE_ACTIONS_RENDERER_NAME
        }));
    }

    /**
     * @returns {Array<{
     *   key: string | null,
     *   format: { name: string, arg?: string } | null,
     *   render: string | null
     * }>}
     */
    #parseColumns()
    {
        const result = [];
        for (const th of this.#$thead.find('th').get()) {
            const $th = $(th);
            const key = Table.#readColumnData($th, 'key');
            let format = Table.#readColumnData($th, 'format');
            if (format !== null) {
                format = Table.#parseColumnFormat(format);
            }
            let render = null;
            if (key === null) {
                render = Table.#readColumnData($th, 'render');
            }
            result.push({ key, format, render });
        }
        return result;
    }

    /**
     * @param {{ name: string, arg?: string }} format
     * @param {Object} row
     * @param {*} value
     * @returns {*}
     */
    #callFormatter(format, row, value)
    {
        const formatter = this.#formatters?.[format.name];
        if (typeof formatter !== 'function') {
            console.warn(`Leuce: No formatter found for "${format.name}".`);
            return value;
        }
        return formatter(row, value, format.arg);
    }

    /**
     * @param {string} name
     * @param {Object} row
     * @returns {*}
     */
    #callRenderer(name, row)
    {
        const renderer = this.#renderers?.[name];
        if (typeof renderer !== 'function') {
            console.warn(`Leuce: No renderer found for "${name}".`);
            return '';
        }
        return renderer(row);
    }

    /**
     * @returns {void}
     */
    #bindEvents()
    {
        // Headers
        this.#$thead.find('th[data-key]').on('click', this.#onHeaderClick.bind(this));

        // Rows
        this.#$tbody.on('click', '[data-action="edit"]', event => {
            const id = $(event.currentTarget).closest('tr').data('id');
            this.#actionHandler?.('edit', id);
        });
        this.#$tbody.on('click', '[data-action="delete"]', event => {
            const id = $(event.currentTarget).closest('tr').data('id');
            this.#actionHandler?.('delete', id);
        });
    }

    /**
     * @param {jQuery.Event} event
     * @returns {void}
     */
    #onHeaderClick(event)
    {
        const $clickedHeader = $(event.currentTarget);
        const clickedKey = $clickedHeader.data('key');
        const clickedIconClass = $clickedHeader.find('i').attr('class');
        let currentDirection;
        for (const [direction, iconClass] of Object.entries(Table.#SORT_ICON_CLASSES)) {
            if (clickedIconClass === iconClass) {
                currentDirection = direction;
                break;
            }
        }
        let newDirection;
        switch (currentDirection) {
        case 'asc':  newDirection = 'desc'; break;
        case 'desc': newDirection = 'none'; break;
        default:     newDirection = 'asc';
        }
        for (const th of this.#$thead.find('th[data-key]').get()) {
            const $th = $(th);
            let direction;
            if (clickedKey === $th.data('key')) {
                direction = newDirection;
            } else {
                direction = 'none';
            }
            $th.find('i').attr('class', Table.#SORT_ICON_CLASSES[direction]);
        }
        this.#actionHandler?.('sort',
            newDirection === 'none'
                ? null
                : { key: clickedKey, direction: newDirection }
        );
    }

    /**
     * @param {jQuery} $table
     * @returns {jQuery}
     */
    static #wrap($table)
    {
        let $responsive = $table.parent('.table-responsive');
        if ($responsive.length === 0) {
            $table.wrap($('<div>', { class: 'table-responsive' }));
            $responsive = $table.parent();
        }
        $responsive.wrap($('<div>', { class: 'leuce-table' }));
        return $responsive.parent();
    }

    /**
     * @param {jQuery} $th
     * @param {string} name
     * @returns {string|null}
     */
    static #readColumnData($th, name)
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
    static #parseColumnFormat(format)
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
     * @param {Object} row
     * @returns {jQuery}
     */
    static #renderInlineActions(row)
    {
        return $('<div>', {
            class: 'leuce-table-inline-actions btn-group btn-group-sm'
        }).append(this.#createButton('edit', 'bi bi-pencil'))
          .append(this.#createButton('delete', 'bi bi-trash'));
    }

    /**
     * @param {string} action
     * @param {string} iconClass
     * @returns {jQuery}
     */
    static #createButton(action, iconClass)
    {
        return $('<button>', {
            type: 'button',
            class: 'leuce-table-button btn btn-sm',
            'data-action': action
        }).append($('<i>', { class: iconClass }));
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
