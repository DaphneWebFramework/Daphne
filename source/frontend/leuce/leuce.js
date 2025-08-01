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

    /** @type {string|object|FormData|null} */
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

    /** @type {string|object|null} */
    body = null;

    /**
     * @param {object} jqXHR
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
     * @returns {object}
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
     * @param {object} settings
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
     * @param {object} settings
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
        if (!Utility.isSameOrigin(apiUrl)) {
            throw new Error(`Invalid API origin: ${apiUrl}`);
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
    /** @type {Object.<string, jQuery|object>} */
    #registry = {};

    /**
     * @param {string} key
     * @param {string|jQuery|object} value
     * @returns {jQuery|object|null}
     */
    set(key, value)
    {
        if (typeof value === 'string') {
            const $el = $(value);
            if (!$el.length) {
                return null;
            }
            this.#registry[key] = $el;
            return $el;
        }
        if (value instanceof jQuery) {
            if (!value.length) {
                return null;
            }
            this.#registry[key] = value;
            return value;
        }
        if (typeof value === 'object' && value !== null) {
            this.#registry[key] = value;
            return value;
        }
        return null;
    }

    /**
     * @param {string} key
     * @returns {boolean}
     */
    has(key)
    {
        return this.#registry.hasOwnProperty(key);
    }

    /**
     * @param {string} key
     * @returns {jQuery|object|null}
     */
    get(key)
    {
        if (!this.has(key)) {
            return null;
        }
        return this.#registry[key];
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
    /** @type {Object.<string, number>} */
    static MessageBoxButton = Object.freeze({
        OK: 1,
        CANCEL: 2,
        YES: 3,
        NO: 4
    });

    /** @type {Object.<string, Object.<string, string>>} */
    static #translations = Object.freeze({
        "add": {
            "en": "Add",
            "tr": "Ekle"
        },
        "are_you_sure_you_want_to_delete_this_record": {
            "en": "Are you sure you want to delete this record?",
            "tr": "Bu kaydı silmek istediğinizden emin misiniz?"
        },
        "cancel": {
            "en": "Cancel",
            "tr": "İptal"
        },
        "delete": {
            "en": "Delete",
            "tr": "Sil"
        },
        "edit": {
            "en": "Edit",
            "tr": "Düzenle"
        },
        "loading...": {
            "en": "Loading...",
            "tr": "Yükleniyor..."
        },
        "message": {
            "en": "Message",
            "tr": "Mesaj"
        },
        "no_matching_records_found": {
            "en": "No matching records found",
            "tr": "Eşleşen kayıt bulunamadı"
        },
        "no": {
            "en": "No",
            "tr": "Hayır"
        },
        "ok": {
            "en": "OK",
            "tr": "Tamam"
        },
        "reload": {
            "en": "Reload",
            "tr": "Yenile"
        },
        "save": {
            "en": "Save",
            "tr": "Kaydet"
        },
        "search...": {
            "en": "Search...",
            "tr": "Ara..."
        },
        "show_*_per_page": {
            "en": "Show %s per page",
            "tr": "Sayfada %s göster"
        },
        "yes": {
            "en": "Yes",
            "tr": "Evet"
        },
    });

    /**
     * @param {string} key
     * @param {...string} args
     * @returns {string}
     */
    static translate(key, ...args)
    {
        const unit = this.#translations[key];
        if (unit === undefined) {
            return key;
        }
        let value = unit[document.documentElement.lang];
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

    /**
     * @param {{
     *   title?: string|null,
     *   message: string|jQuery,
     *   primaryButtonLabel?: string|number|null,
     *   secondaryButtonLabel?: string|number|null
     *   beforeShow?: (() => void)|null,
     *   beforeConfirm?: (() => boolean)|null
     * }} options
     * @returns {Promise<boolean>}
     */
    static messageBox({
        title = null,
        message,
        primaryButtonLabel = null,
        secondaryButtonLabel = null,
        beforeShow = null,
        beforeConfirm = null
    } = {}) {
        const dataKey = 'leuce.messagebox';
        let $modal = $('#' + MessageBox.elementId());
        let instance;
        if ($modal.length === 0) {
            instance = new MessageBox();
            $modal = instance.root();
            $modal.data(dataKey, instance);
            $(document.body).append($modal);
        } else {
            instance = $modal.data(dataKey);
        }
        return instance.open(
            title,
            message,
            primaryButtonLabel,
            secondaryButtonLabel,
            beforeShow,
            beforeConfirm
        );
    }
}

class Deferred
{
    /** @type {Promise<any>} */
    #promise;

    /** @type {(value: any) => void} */
    #resolve;

    /** @type {(reason?: any) => void} */
    #reject;

    /** @type {boolean} */
    #settled = false;

    constructor()
    {
        this.#promise = new Promise((resolve, reject) => {
            this.#resolve = resolve;
            this.#reject = reject;
        });
    }

    /**
     * @returns {Promise<any>}
     */
    promise()
    {
        return this.#promise;
    }

    /**
     * @param {any} value
     * @returns {void}
     */
    resolve(value)
    {
        if (!this.#settled) {
            this.#settled = true;
            this.#resolve(value);
        }
    }

    /**
     * @param {any} reason
     * @returns {void}
     */
    reject(reason)
    {
        if (!this.#settled) {
            this.#settled = true;
            this.#reject(reason);
        }
    }
}

class MessageBox
{
    /** @type {Object.<number, string>} */
    static #buttonLabelTranslationKeys = Object.freeze({
        [UI.MessageBoxButton.OK]: 'ok',
        [UI.MessageBoxButton.CANCEL]: 'cancel',
        [UI.MessageBoxButton.YES]: 'yes',
        [UI.MessageBoxButton.NO]: 'no'
    });

    /** @type {jQuery} */
    #$root;

    /** @type {bootstrap.Modal} */
    #modal;

    /** @type {(() => boolean)|null} */
    #beforeConfirm;

    /** @type {Deferred<boolean>|null} */
    #result;

    constructor()
    {
        this.#$root = MessageBox.#createRoot();
        this.#modal = new bootstrap.Modal(this.#$root[0]);
        this.#beforeConfirm = null; // per-call state
        this.#result = null; // per-call state
        this.#bindEvents();
    }

    /**
     * @returns {string}
     */
    static elementId()
    {
        return 'leuce-messagebox';
    }

    /**
     * @returns {jQuery}
     */
    root()
    {
        return this.#$root;
    }

    /**
     * @param {string|null} title
     * @param {string|jQuery} message
     * @param {string|number|null} primaryButtonLabel
     * @param {string|number|null} secondaryButtonLabel
     * @param {(() => void)|null} beforeShow
     * @param {(() => boolean)|null} beforeConfirm
     * @returns {Promise<boolean>}
     */
    open(
        title,
        message,
        primaryButtonLabel,
        secondaryButtonLabel,
        beforeShow,
        beforeConfirm
    ) {
        // 1
        const $title = this.#$root.find('.modal-title');
        if (title === null) {
            $title.text(UI.translate('message'));
        } else if (typeof title === 'string') {
            $title.text(title);
        } else {
            throw new Error('Leuce: Title must be a string or null.');
        }
        // 2
        const $body = this.#$root.find('.modal-body');
        $body.empty();
        if (typeof message === 'string') {
            $body.html(message);
        } else if (message instanceof jQuery) {
            $body.append(message);
        } else {
            throw new Error('Leuce: Message must be a string or jQuery object.');
        }
        // 3
        const $primaryButton = this.#$root.find('.btn-primary');
        primaryButtonLabel = MessageBox.#translateButtonLabel(
            primaryButtonLabel, 'ok');
        $primaryButton.text(primaryButtonLabel);
        // 4
        const $secondaryButton = this.#$root.find('.btn-secondary');
        if (secondaryButtonLabel === null) {
            $secondaryButton.addClass('d-none');
        } else {
            secondaryButtonLabel = MessageBox.#translateButtonLabel(
                secondaryButtonLabel, 'cancel');
            $secondaryButton.removeClass('d-none').text(secondaryButtonLabel);
        }
        // 5
        if (typeof beforeShow === 'function') {
            beforeShow();
        }
        // 6
        this.#beforeConfirm = beforeConfirm;
        this.#result?.resolve(false); // settle previous result, if any
        this.#result = new Deferred();
        this.#modal.show();
        return this.#result.promise();
    }

    /**
     * @returns {void}
     */
    #bindEvents()
    {
        this.#$root.find('.btn-primary').on('click',
            this.#onPrimaryButtonClick.bind(this));
        this.#$root.on('hide.bs.modal',
            this.#onModalHide.bind(this));
        this.#$root.on('hidden.bs.modal',
            this.#onModalHidden.bind(this));
    }

    /**
     * returns {void}
     */
    #onPrimaryButtonClick()
    {
        if (typeof this.#beforeConfirm === 'function') {
            if (true !== this.#beforeConfirm()) {
                return;
            }
        }
        this.#result?.resolve(true);
        this.#modal.hide();
    }

    /**
     * returns {void}
     */
    #onModalHide()
    {
        // Fix: Avoid "aria-hidden + focus retained" warning when modal closes.
        // Blur the modal itself or any element inside it that still has focus.
        let $focused;
        if (this.#$root.is(':focus')) {
            $focused = this.#$root;
        } else {
            $focused = this.#$root.find(':focus');
        }
        $focused.trigger('blur');
    }

    /**
     * returns {void}
     */
    #onModalHidden()
    {
        this.#result?.resolve(false);
        this.#result = null;
    }

    /**
     * @param {string|number|null} label
     * @param {string} defaultTranslationKey
     * @returns {string}
     */
    static #translateButtonLabel(label, defaultTranslationKey)
    {
        if (label === null) {
            return UI.translate(defaultTranslationKey);
        }
        if (typeof label === 'number') {
            const translationKey = this.#buttonLabelTranslationKeys[label];
            if (!translationKey) {
                throw new Error(`Leuce: Unknown message box button: ${label}`);
            }
            return UI.translate(translationKey);
        }
        if (typeof label === 'string') {
            return label;
        }
        throw new Error('Leuce: Button label must be a string, number or null.');
    }

    /**
     * @returns {jQuery}
     *
     * @todo Make draggable via jQuery UI or similar.
     */
    static #createRoot()
    {
        return $('<div>', {
            id: this.elementId(),
            class: 'modal fade',
            tabIndex: -1
        }).append(
            $('<div>', { class: 'modal-dialog modal-dialog-centered' }).append(
                $('<div>', { class: 'modal-content' }).append(
                    $('<div>', { class: 'modal-header' }).append(
                        $('<h5>', { class: 'modal-title' }),
                        $('<button>', {
                            type: 'button',
                            class: 'btn-close',
                            'data-bs-dismiss': 'modal',
                            'aria-label': 'Close'
                        })
                    ),
                    $('<div>', { class: 'modal-body' }),
                    $('<div>', { class: 'modal-footer' }).append(
                        $('<button>', {
                            type: 'button',
                            class: 'btn btn-secondary',
                            'data-bs-dismiss': 'modal'
                        }),
                        $('<button>', {
                            type: 'button',
                            class: 'btn btn-primary'
                        })
                    )
                )
            )
        );
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
            this.#$button.empty().append(
                $('<span>', {
                    class: 'spinner-border spinner-border-sm',
                    'aria-hidden': 'true'
                }),
                $('<span>', {
                    class: 'visually-hidden',
                    role: 'status',
                    text: UI.translate('loading...')
                })
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

class TableEditor
{
    /**
     * @type {{
     *   key: string,
     *   inColumns: boolean,
     *   type?: string
     * }}
     */
    #primaryKey;

    /**
     * @type {Array<{
     *   key: string|null,
     *   type: string|null,
     *   nullable: boolean,
     *   format: { name: string, arg?: string }|null
     *   render: string|null,
     *   $th: jQuery
     * }>}
     */
    #columns;

    /** @type {jQuery} */
    #$form;

    /** @type {(action: string, payload?: *) => void}|null */
    #actionHandler;

    /**
     * @param {{
     *   key: string,
     *   inColumns: boolean,
     *   type?: string
     * }} primaryKey
     * @param {Array<{
     *   key: string|null,
     *   type: string|null,
     *   nullable: boolean,
     *   format: { name: string, arg?: string }|null,
     *   render: string|null,
     *   $th: jQuery
     * }>} columns
     */
    constructor(primaryKey, columns)
    {
        this.#primaryKey = primaryKey;
        this.#columns = columns;
        this.#$form = TableEditor.#createForm(primaryKey, columns);
        this.#actionHandler = null;
    }

    /**
     * @param {(action: string, payload?: *) => void}|null actionHandler
     * @returns {void}
     */
    setActionHandler(actionHandler)
    {
        this.#actionHandler = actionHandler;
    }

    /**
     * @returns {void}
     */
    showAdd()
    {
        UI.messageBox({
            title: UI.translate('add'),
            message: this.#$form,
            primaryButtonLabel: UI.translate('save'),
            secondaryButtonLabel: UI.translate('cancel'),
            beforeShow: () => {
                this.#showPrimaryKeyField(false);
                this.#resetNullableInputGroups();
                this.#clearForm();
            },
            beforeConfirm: () => this.#validateForm()
        }).then(confirmed => {
            if (confirmed) {
                this.#actionHandler?.('add', this.#extractFormData());
            }
        });
    }

    /**
     * @param {jQuery} $tr
     * @returns {void}
     */
    showEdit($tr)
    {
        UI.messageBox({
            title: UI.translate('edit'),
            message: this.#$form,
            primaryButtonLabel: UI.translate('save'),
            secondaryButtonLabel: UI.translate('cancel'),
            beforeShow: () => {
                this.#showPrimaryKeyField(true);
                this.#resetNullableInputGroups();
                this.#populateForm($tr);
            },
            beforeConfirm: () => this.#validateForm()
        }).then(confirmed => {
            if (confirmed) {
                this.#actionHandler?.('edit', this.#extractFormData());
            }
        });
    }

    /**
     * @param {jQuery} $tr
     * @returns {void}
     */
    showDelete($tr)
    {
        UI.messageBox({
            title: UI.translate('delete'),
            message: UI.translate('are_you_sure_you_want_to_delete_this_record'),
            primaryButtonLabel: UI.MessageBoxButton.YES,
            secondaryButtonLabel: UI.MessageBoxButton.NO
        }).then(confirmed => {
            if (confirmed) {
                const rowData = $tr.data('row');
                this.#actionHandler?.('delete', rowData[this.#primaryKey.key]);
            }
        });
    }

    /**
     * @param {boolean} show
     * @returns {void}
     */
    #showPrimaryKeyField(show)
    {
        const $field = this.#findInput(this.#primaryKey.key).closest('.row');
        if (show) {
            $field.show();
        } else {
            $field.hide();
        }
    }

    /**
     * @returns {void}
     */
    #resetNullableInputGroups()
    {
        const $checkboxes = this.#$form.find('.form-check-input[data-null-for]');
        for (const checkbox of $checkboxes.get()) {
            const $checkbox = $(checkbox);
            const inputId = $checkbox.data('null-for');
            const $input = $('#' + inputId);
            $input.prop('disabled', false);
            $checkbox.prop('checked', false);
            $checkbox.on('change', () => {
                $input.prop('disabled', $checkbox.prop('checked'));
            });
        }
    }

    /**
     * @returns {void}
     */
    #clearForm()
    {
        if (!this.#primaryKey.inColumns) {
            this.#findInput(this.#primaryKey.key).val('');
        }
        for (const column of this.#columns) {
            if (column.key === null) {
                continue;
            }
            this.#findInput(column.key).val('');
        }
    }

    /**
     * @param {jQuery} $tr
     * @returns {void}
     */
    #populateForm($tr)
    {
        const rowData = $tr.data('row');
        if (!this.#primaryKey.inColumns) {
            const $input = this.#findInput(this.#primaryKey.key);
            $input.val(rowData[this.#primaryKey.key]);
        }
        for (const column of this.#columns) {
            if (column.key === null) {
                continue;
            }
            const $input = this.#findInput(column.key);
            const value = rowData[column.key];
            if (column.type === 'datetime' && typeof value === 'string') {
                // Format datetime values to use 'T' separator required by
                // "datetime-local" inputs.
                $input.val(value.replace(' ', 'T'));
            } else {
                $input.val(value);
            }
            // If the value is null and the column is nullable, disable
            // the input and check the corresponding 'null' checkbox.
            if (column.nullable && value === null) {
                const inputId = $input.attr('id');
                const $checkbox = this.#$form.find(
                    `.form-check-input[data-null-for="${inputId}"]`);
                $input.prop('disabled', true);
                $checkbox.prop('checked', true);
            }
        }
    }

    /**
     * @returns {boolean}
     */
    #validateForm()
    {
        const form = this.#$form[0];
        if (!form.checkValidity()) {
            form.reportValidity();
            return false;
        }
        return true;
    }

    /**
     * @returns {object}
     */
    #extractFormData()
    {
        const data = {};
        const $inputs = this.#$form.find('input[name]:visible');
        for (const input of $inputs.get()) {
            const $input = $(input);
            const name = $input.attr('name');
            if ($input.prop('disabled')) {
                data[name] = null;
            } else {
                data[name] = TableEditor.#castInputValue($input);
            }
        }
        return data;
    }

    /**
     * @param {string} name
     * @returns {jQuery}
     */
    #findInput(name)
    {
        return this.#$form.find(`[name="${name}"]`);
    }

    /**
     * @param {{
     *   key: string,
     *   inColumns: boolean,
     *   type?: string
     * }} primaryKey
     * @param {Array<{
     *   key: string|null,
     *   type: string|null,
     *   nullable: boolean,
     *   format: { name: string, arg?: string }|null,
     *   render: string|null,
     *   $th: jQuery
     * }>} columns
     * @returns {jQuery}
     */
    static #createForm(primaryKey, columns)
    {
        const $form = $('<form>', {
            class: 'leuce-table-editor-form',
            spellcheck: false
        });
        if (!primaryKey.inColumns) {
            $form.append(
                this.#createFormField(
                    primaryKey.key,
                    primaryKey.key,
                    primaryKey.type,
                    true
                )
            );
        }
        for (const column of columns) {
            if (column.key === null) {
                continue;
            }
            $form.append(
                this.#createFormField(
                    column.$th.text().trim(),
                    column.key,
                    column.type,
                    column.key === primaryKey.key,
                    column.nullable
                )
            );
        }
        return $form;
    }

    /**
     * @param {string} label
     * @param {string} name
     * @param {string|null} type
     * @param {boolean} readonly
     * @param {boolean} [nullable=false]
     * @returns {jQuery}
     */
    static #createFormField(label, name, type, readonly, nullable = false)
    {
        const inputId = `form-input-${this.#uniqueId()}`;
        return $('<div>', { class: 'row mb-3' }).append(
            $('<label>', {
                for: inputId,
                class: 'col-sm-4 col-form-label',
                text: label
            }),
            $('<div>', { class: 'col-sm-8' }).append(
                nullable
                    ? this.#createNullableInputGroup(inputId, name, type)
                    : this.#createInput(inputId, name, type, readonly)
            )
        );
    }

    /**
     * @param {string} inputId
     * @param {string} inputName
     * @param {string|null} inputType
     * @returns {jQuery}
     */
    static #createNullableInputGroup(inputId, inputName, inputType)
    {
        const checkboxId = `form-input-${this.#uniqueId()}`;
        return $('<div>', { class: 'input-group' }).append(
            this.#createInput(inputId, inputName, inputType),
            $('<div>', { class: 'input-group-text' }).append(
                $('<div>', { class: 'form-check' }).append(
                    $('<input>', {
                        type: 'checkbox',
                        class: 'form-check-input',
                        id: checkboxId,
                        'data-null-for': inputId
                    }),
                    $('<label>', {
                        for: checkboxId,
                        class: 'form-check-label',
                        text: 'null'
                    })
                )
            )
        );
    }

    /**
     * @param {string} id
     * @param {string} name
     * @param {string|null} type
     * @param {boolean} [required=false]
     * @param {boolean} [readonly=false]
     * @returns {jQuery}
     */
    static #createInput(id, name, type, readonly = false)
    {
        const $input = $('<input>', {
            ...this.#inputAttributesFor(type),
            class: 'form-control',
            id: id,
            name: name,
            // The `required` attribute is always set to true. If the field is
            // nullable, a separate checkbox is used to disable the input, which
            // bypasses validation.
            required: true,
            readonly: readonly
        });
        // Store type information using a data-* attribute for later use during
        // form data extraction. Do not use jQuery's .data() here, as its values
        // are lost when the form is detached and reattached to the DOM (i.e.,
        // by MessageBox).
        if (type != null) {
            $input.attr('data-type', type);
        }
        return $input;
    }

    /**
     * @param {string|null} type
     * @returns {{ type?: string, step?: string }}
     */
    static #inputAttributesFor(type)
    {
        switch (type) {
        case 'integer':
            return { type: 'number', step: '1' };
        case 'float':
            return { type: 'number', step: 'any' };
        case 'datetime':
            return { type: 'datetime-local', step: '1' };
        case 'string':
            return { type: 'text' };
        default:
            return {};
        }
    }

    /**
     * @param {jQuery} $input
     * @returns {*}
     */
    static #castInputValue($input)
    {
        const value = $input.val();
        switch ($input.data('type')) {
        case 'integer':
            return parseInt(value, 10);
        case 'float':
            return parseFloat(value);
        case 'datetime':
            return value.replace('T', ' ') + (value.length === 16 ? ':00' : '');
        case 'string':
            return value;
        default:
            return value;
        }
    }

    /**
     * @returns {string}
     */
    static #uniqueId()
    {
        return Math.random().toString(36).slice(2, 10);
    }
}

class TableToolbar
{
    /** @type {jQuery} */
    #$root;

    /** @type {TableEditor|null} */
    #editor;

    /** @type {(action: string, payload?: *) => void}|null */
    #actionHandler;

    /**
     * @param {TableEditor|null} editor
     */
    constructor(editor)
    {
        this.#$root = TableToolbar.#createRoot(editor !== null);
        this.#editor = editor;
        this.#actionHandler = null;
        this.#bindEvents();
    }

    /**
     * @returns {jQuery}
     */
    root()
    {
        return this.#$root;
    }

    /**
     * @param {(action: string, payload?: *) => void}|null actionHandler
     * @returns {void}
     */
    setActionHandler(actionHandler)
    {
        this.#actionHandler = actionHandler;
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
        if (this.#editor !== null) {
            this.#$root.find('[data-action="add"]').on('click', () => {
                this.#editor.showAdd();
            });
        }
        this.#$root.find('[data-action="reload"]').on('click', () => {
            this.#actionHandler?.('reload');
        });
    }

    /**
     * @param {boolean} hasAddButton
     * @returns {jQuery}
     */
    static #createRoot(hasAddButton)
    {
        return $('<div>', {
            class: 'leuce-table-controls'
        }).append(
            this.#createSearchBox(),
            this.#createActionButtons(hasAddButton)
        );
    }

    /**
     * @returns {jQuery}
     */
    static #createSearchBox()
    {
        const $inputGroup = $('<div>', {
            class: 'input-group flex-nowrap'
        }).append(
            $('<input>', {
                type: 'search',
                class: 'form-control form-control-sm',
                'data-action': 'search-input',
                placeholder: UI.translate('search...'),
                css: { minWidth: '100px', maxWidth: '150px' }
            }),
            this.#createButton('search', 'bi bi-search')
        );
        return $('<div>', {
            class: 'leuce-table-controls-group'
        }).append($inputGroup);
    }

    /**
     * @param {boolean} hasAddButton
     * @returns {jQuery}
     */
    static #createActionButtons(hasAddButton)
    {
        const $group = $('<div>', { class: 'leuce-table-controls-group' });
        if (hasAddButton) {
            $group.append(this.#createButton('add', 'bi bi-plus-lg',
                UI.translate('add')));
        }
        $group.append(this.#createButton('reload', 'bi bi-arrow-clockwise',
            UI.translate('reload')));
        return $group;
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
    static #pageSizeOptions = Object.freeze([5, 10, 25, 50, 100]);

    /** @type {number} */
    static #defaultPageSize = 5;

    /** @type {jQuery} */
    #$root;

    /** @type {(action: string, payload?: *) => void}|null */
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
        return this.#defaultPageSize;
    }

    /**
     * @returns {jQuery}
     */
    root()
    {
        return this.#$root;
    }

    /**
     * @param {(action: string, payload?: *) => void}|null actionHandler
     * @returns {void}
     */
    setActionHandler(actionHandler)
    {
        this.#actionHandler = actionHandler;
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
        for (const size of this.#pageSizeOptions) {
            const $option = $('<option>').val(size).text(size);
            if (size === this.#defaultPageSize) {
                $option.attr('selected', 'selected');
            }
            $select.append($option);
        }
        return $('<div>', {
            class: 'leuce-table-controls-group'
        }).append(UI.translate('show_*_per_page', $select.prop('outerHTML')));
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
    static #sortIconClasses = Object.freeze({
        'none': 'bi bi-chevron-expand',
        'asc':  'bi bi-chevron-down',
        'desc': 'bi bi-chevron-up'
    });

    /** @type {string} */
    static #inlineActionRendererName = 'inlineActions';

    /** @type {jQuery} */
    #$wrapper;

    /** @type {jQuery} */
    #$table;

    /** @type {jQuery} */
    #$thead;

    /** @type {jQuery} */
    #$tbody;

    /** @type {Object.<string, Function>} */
    #formatters;

    /** @type {Object.<string, Function>} */
    #renderers;

    /** @type {(action: string, payload?: *) => void}|null */
    #actionHandler;

    /**
     * @type {{
     *   key: string,
     *   inColumns: boolean,
     *   type?: string
     * } | null}
     */
    #primaryKey;

    /**
     * @type {Array<{
     *   key: string|null,
     *   type: string|null,
     *   nullable: boolean,
     *   format: { name: string, arg?: string }|null
     *   render: string|null,
     *   $th: jQuery
     * }>}
     */
    #columns;

    /** @type {TableEditor|null} */
    #editor;

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
        // 1
        if (!$table.is('table')) {
            throw new Error('Leuce: Only table elements are supported.');
        }
        // 2
        this.#$wrapper = Table.#createWrapper($table);
        this.#$table = $table;
        // 3
        this.#$thead = $table.find('thead').first();
        if (this.#$thead.length === 0) {
            throw new Error('Leuce: Table requires a `thead` element.');
        }
        this.#decorateHeaders();
        // 4
        this.#$tbody = $table.find('tbody').first();
        if (this.#$tbody.length === 0) {
            this.#$tbody = $('<tbody>');
            this.#$table.append(this.#$tbody);
        }
        // 5
        this.#formatters = {};
        this.#renderers = {};
        this.#actionHandler = null;
        // 6
        this.#primaryKey = this.#resolvePrimaryKey();
        if (this.#primaryKey !== null) {
            this.#setUpInlineActionsColumn();
        }
        this.#columns = this.#parseColumns();
        // 7
        if (this.#primaryKey !== null) {
            this.#editor = new TableEditor(this.#primaryKey, this.#columns);
        } else {
            this.#editor = null;
        }
        // 8
        this.#toolbar = new TableToolbar(this.#editor);
        this.#$wrapper.prepend(this.#toolbar.root().addClass('mb-3'));
        // 9
        this.#paginator = new TablePaginator();
        this.#$wrapper.append(this.#paginator.root().addClass('mt-3'));
        // 10
        this.#$overlay = Table.#createOverlay();
        this.#$wrapper.append(this.#$overlay);
        // 11
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
     * @param {(row: object, value: *, arg?: string) => *} formatter
     * @returns {Leuce.UI.Table}
     */
    setFormatter(name, formatter)
    {
        this.#formatters[name] = formatter;
        return this;
    }

    /**
     * @param {string} name
     * @param {(row: object) => string|jQuery} renderer
     * @returns {Leuce.UI.Table}
     */
    setRenderer(name, renderer)
    {
        this.#renderers[name] = renderer;
        return this;
    }

    /**
     * @param {(action: string, payload?: *) => void}|null actionHandler
     * @returns {Leuce.UI.Table}
     */
    setActionHandler(actionHandler)
    {
        this.#actionHandler = actionHandler;
        this.#editor?.setActionHandler(actionHandler);
        this.#toolbar.setActionHandler(actionHandler);
        this.#paginator.setActionHandler(actionHandler);
        return this;
    }

    /**
     * @param {boolean} isLoading
     */
    setLoading(isLoading)
    {
        if (isLoading) {
            this.#$overlay.removeClass('hidden');
        } else {
            this.#$overlay.addClass('hidden');
        }
    }

    /**
     * @param {Array.<object>} data
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
               .text(UI.translate('no_matching_records_found'));
            $tr.append($td);
            this.#$tbody.append($tr);
            return this;
        }
        for (const row of data) {
            const $tr = $('<tr>');
            if (this.#primaryKey !== null && !(this.#primaryKey.key in row)) {
                console.warn(`Leuce: Primary key "${this.#primaryKey.key}" not found in row data.`);
            }
            $tr.data('row', row);
            for (const { key, nullable, format, render } of this.#columns) {
                const $td = $('<td>');
                let value = '';
                if (key !== null) {
                    if (!(key in row)) {
                        console.warn(`Leuce: Key "${key}" not found in row data.`);
                    }
                    value = row[key];
                    if (nullable && value === null) {
                        $td.addClass('leuce-null');
                    } else if (format !== null) {
                        value = this.#callFormatter(format, row, value);
                    }
                } else if (render !== null) {
                    value = this.#callRenderer(render, row);
                }
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
        const ths = this.#$thead.find('th').get();
        // 1
        for (const th of ths) {
            $(th).addClass('leuce-table-header');
        }
        // 2
        if (!this.#$thead.is('[data-nosort]')) {
            for (const th of ths) {
                const $th = $(th);
                if ($th.is('[data-key]') && !$th.is('[data-nosort]')) {
                    const $span = $('<span>').append(
                        $th.text().trim(),
                        $('<i>').attr('class', Table.#sortIconClasses.none)
                    );
                    $th.addClass('leuce-table-header-sortable')
                       .empty()
                       .append($span);
                }
            }
        }
    }

    /**
     * @returns {{
     *   key: string,
     *   inColumns: boolean,
     *   type?: string
     * } | null}
     */
    #resolvePrimaryKey()
    {
        const $tr = this.#$thead.find('tr').first();
        const key = Table.#readDataAttribute($tr, 'primaryKey');
        if (key === null) {
            return null;
        }
        if (this.#$thead.find(`th[data-key="${key}"]`).length) {
            return {
                key: key,
                inColumns: true
            };
        }
        let type = Table.#readDataAttribute($tr, 'primaryKeyType');
        if (type === null) {
            console.warn(`Leuce: No \`data-primary-key-type\` specified for`
                + ` primary key "${key}"; defaulting to "integer".`);
            type = 'integer';
        }
        return {
            key: key,
            inColumns: false,
            type: type
        };
    }

    /**
     * @returns {void}
     */
    #setUpInlineActionsColumn()
    {
        this.#$thead.find('tr').first().append($('<th>', {
            scope: 'col',
            'data-render': Table.#inlineActionRendererName
        }));
        this.setRenderer(
            Table.#inlineActionRendererName,
            Table.#renderInlineActions.bind(Table)
        );
    }

    /**
     * @returns {Array<{
     *   key: string|null,
     *   type: string|null,
     *   nullable: boolean,
     *   format: { name: string, arg?: string }|null,
     *   render: string|null,
     *   $th: jQuery
     * }>}
     */
    #parseColumns()
    {
        const columns = [];
        for (const th of this.#$thead.find('th').get()) {
            const $th = $(th);
            const key = Table.#readDataAttribute($th, 'key');
            const type = Table.#readDataAttribute($th, 'type');
            const nullable = $th.is('[data-nullable]');
            let format = Table.#readDataAttribute($th, 'format');
            if (format !== null) {
                format = Table.#parseColumnFormat(format);
            }
            let render = null;
            if (key === null) {
                render = Table.#readDataAttribute($th, 'render');
            }
            columns.push({ key, type, nullable, format, render, $th });
        }
        return columns;
    }

    /**
     * @param {{ name: string, arg?: string }} format
     * @param {object} row
     * @param {*} value
     * @returns {*}
     */
    #callFormatter(format, row, value)
    {
        const formatter = this.#formatters[format.name];
        if (typeof formatter !== 'function') {
            console.warn(`Leuce: No formatter found for "${format.name}".`);
            return value;
        }
        return formatter(row, value, format.arg);
    }

    /**
     * @param {string} name
     * @param {object} row
     * @returns {*}
     */
    #callRenderer(name, row)
    {
        const renderer = this.#renderers[name];
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
        // Sortable headers
        if (!this.#$thead.is('[data-nosort]')) {
            const onHeaderClick = this.#onHeaderClick.bind(this);
            for (const column of this.#columns) {
                if (column.key !== null && !column.$th.is('[data-nosort]')) {
                    column.$th.on('click', onHeaderClick);
                }
            }
        }

        // Inline actions
        if (this.#editor !== null) {
            this.#$tbody.on('click', '[data-action="edit"]', event => {
                const $tr = $(event.currentTarget).closest('tr');
                this.#editor.showEdit($tr);
            });
            this.#$tbody.on('click', '[data-action="delete"]', event => {
                const $tr = $(event.currentTarget).closest('tr');
                this.#editor.showDelete($tr);
            });
        }
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
        for (const [direction, iconClass] of Object.entries(Table.#sortIconClasses)) {
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
        for (const column of this.#columns) {
            if (column.key === null) {
                continue;
            }
            let direction;
            if (clickedKey === column.key) {
                direction = newDirection;
            } else {
                direction = 'none';
            }
            column.$th.find('i').attr('class', Table.#sortIconClasses[direction]);
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
    static #createWrapper($table)
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
     * @returns {jQuery}
     */
    static #createOverlay()
    {
        return $('<div>', {
            class: 'leuce-table-overlay hidden'
        }).append(
            $('<span>', {
                class: 'spinner-border',
                'aria-hidden': 'true'
            }),
            $('<span>', {
                class: 'visually-hidden',
                role: 'status',
                text: UI.translate('loading...')
            })
        );
    }

    /**
     * @param {jQuery} $el
     * @param {string} name
     * @returns {string|null}
     */
    static #readDataAttribute($el, name)
    {
        let value = $el.data(name);
        if (value === undefined) {
            return null;
        }
        if (typeof value !== 'string') {
            console.warn(`Leuce: Attribute 'data-${name}' must be a string.`);
            return null;
        }
        value = value.trim();
        if (value === '') {
            console.warn(`Leuce: Attribute 'data-${name}' must be a nonempty string.`);
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
            console.warn("Leuce: Attribute 'data-format' must have a nonempty name.");
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
     * @param {object} row
     * @returns {jQuery}
     */
    static #renderInlineActions(/*row*/)
    {
        return $('<div>', {
            class: 'leuce-table-inline-actions btn-group btn-group-sm'
        }).append(
            this.#createButton('edit', 'bi bi-pencil'),
            this.#createButton('delete', 'bi bi-trash')
        );
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

class TableController
{
    /** @type {string} */
    #tableName;

    /** @type {jQuery} */
    #$table;

    /** @type {(params: object) => Promise<Leuce.HTTP.Response>} */
    #fnList;

    /** @type {((tableName: string, data: object) => Promise<Leuce.HTTP.Response>)|undefined} */
    #fnAdd;

    /** @type {((tableName: string, data: object) => Promise<Leuce.HTTP.Response>)|undefined} */
    #fnEdit;

    /** @type {((tableName: string, id: number) => Promise<Leuce.HTTP.Response>)|undefined} */
    #fnDelete;

    /** @type {string|null} */
    #search;

    /**
     * @type {{
     *   key: string,
     *   direction: 'asc' | 'desc'
     * } | null}
     */
    #sort;

    /** @type {number} */
    #page;

    /** @type {number} */
    #pageSize;

    /** @type {number} */
    #totalPages;

    /**
     * @param {{
     *   tableName: string,
     *   $table: jQuery,
     *   fnList: (params: object) => Promise<Leuce.HTTP.Response>
     *   fnAdd?: (tableName: string, data: object) => Promise<Leuce.HTTP.Response>,
     *   fnEdit?: (tableName: string, data: object) => Promise<Leuce.HTTP.Response>
     *   fnDelete?: (tableName: string, id: number) => Promise<Leuce.HTTP.Response>
     * }} options
     */
    constructor({ $table, tableName, fnList, fnAdd, fnEdit, fnDelete })
    {
        this.#$table = $table;
        this.#tableName = tableName;
        this.#fnList = fnList;
        this.#fnAdd = fnAdd;
        this.#fnEdit = fnEdit;
        this.#fnDelete = fnDelete;
        this.#search = null;
        this.#sort = null;
        this.#page = 1;
        this.#pageSize = Table.defaultPageSize();
        this.#totalPages = 0;
        this.#$table.leuceTable().setActionHandler(this.#onAction.bind(this));
    }

    /**
     * @returns {Promise<void>}
     */
    load()
    {
        const table = this.#$table.leuceTable();
        table.setLoading(true);
        const params = {
            table: this.#tableName,
            page: this.#page,
            pagesize: this.#pageSize
        };
        if (this.#search !== null) {
            params.search = this.#search;
        }
        if (this.#sort !== null) {
            params.sortkey = this.#sort.key;
            params.sortdir = this.#sort.direction;
        }
        return this.#fnList(params).then(response => {
            table.setLoading(false);
            if (response.isSuccess()) {
                table.setData(response.body.data);
                this.#totalPages = table.updatePaginator(
                    response.body.total,
                    this.#pageSize,
                    this.#page
                );
            } else {
                Leuce.UI.notifyError(response.body.message);
            }
        });
    }

    /**
     * @param {string} action
     * @param {*} [payload=null]
     */
    #onAction(action, payload = null)
    {
        switch (action) {
        case 'reload':       this.#onReload(); break;
        case 'search':       this.#onSearch(payload); break;
        case 'sort':         this.#onSort(payload); break;
        case 'add':          this.#onAdd(payload); break;
        case 'edit':         this.#onEdit(payload); break;
        case 'delete':       this.#onDelete(payload); break;
        case 'pageSize':     this.#onPageSize(payload); break;
        case 'firstPage':    this.#onFirstPage(); break;
        case 'previousPage': this.#onPreviousPage(); break;
        case 'currentPage':  this.#onCurrentPage(payload); break;
        case 'nextPage':     this.#onNextPage(); break;
        case 'lastPage':     this.#onLastPage(); break;
        default:
            console.warn('Unknown table action:', action);
            break;
        }
    }

    /**
     * @returns {void}
     */
    #onReload()
    {
        this.load();
    }

    /**
     * @param {string} search
     * @returns {void}
     */
    #onSearch(search)
    {
        if (search === '') {
            search = null;
        }
        if (search === this.#search) {
            return;
        }
        this.#search = search;
        this.#page = 1;
        this.load();
    }

    /**
     * @param {{key: string, direction: string}|null} sort
     * @returns {void}
     */
    #onSort(sort)
    {
        this.#sort = sort;
        this.#page = 1;
        this.load();
    }

    /**
     * @param {object} rowData
     * @returns {void}
     */
    #onAdd(rowData)
    {
        if (!this.#fnAdd) {
            return;
        }
        const table = this.#$table.leuceTable();
        table.setLoading(true);
        this.#fnAdd(this.#tableName, rowData).then(response => {
            table.setLoading(false);
            if (response.isSuccess()) {
                this.load();
            } else {
                Leuce.UI.notifyError(response.body.message);
            }
        });
    }

    /**
     * @param {object} rowData
     * @returns {void}
     */
    #onEdit(rowData)
    {
        if (!this.#fnEdit) {
            return;
        }
        const table = this.#$table.leuceTable();
        table.setLoading(true);
        this.#fnEdit(this.#tableName, rowData).then(response => {
            table.setLoading(false);
            if (response.isSuccess()) {
                this.load();
            } else {
                Leuce.UI.notifyError(response.body.message);
            }
        });
    }

    /**
     * @param {number} id
     * @returns {void}
     */
    #onDelete(id)
    {
        if (!this.#fnDelete) {
            return;
        }
        const table = this.#$table.leuceTable();
        table.setLoading(true);
        this.#fnDelete(this.#tableName, id).then(response => {
            table.setLoading(false);
            if (response.isSuccess()) {
                this.load().then(() => {
                    // Fix: If the current page becomes invalid after deletion
                    // (e.g., last record deleted), adjust the page number and
                    // reload to show the previous valid page.
                    if (this.#page > this.#totalPages) {
                        this.#page = this.#totalPages || 1;
                        this.load();
                    }
                });
            } else {
                Leuce.UI.notifyError(response.body.message);
            }
        });
    }

    /**
     * @param {number} pageSize
     * @returns {void}
     */
    #onPageSize(pageSize)
    {
        if (pageSize === this.#pageSize) {
            return;
        }
        this.#pageSize = pageSize;
        this.#page = 1;
        this.load();
    }

    /**
     * @returns {void}
     */
    #onFirstPage()
    {
        if (this.#page === 1) {
            return;
        }
        this.#page = 1;
        this.load();
    }

    /**
     * @returns {void}
     */
    #onPreviousPage()
    {
        if (this.#page === 1) {
            return;
        }
        this.#page -= 1;
        this.load();
    }

    /**
     * @param {number} page
     * @returns {void}
     */
    #onCurrentPage(page)
    {
        if (page === this.#page) {
            return;
        }
        this.#page = page;
        this.load();
    }

    /**
     * @returns {void}
     */
    #onNextPage()
    {
        if (this.#page === this.#totalPages) {
            return;
        }
        this.#page += 1;
        this.load();
    }

    /**
     * @returns {void}
     */
    #onLastPage()
    {
        if (this.#page === this.#totalPages) {
            return;
        }
        this.#page = this.#totalPages;
        this.load();
    }
}

//#endregion UI

//#region Utility

class Utility
{
    /**
     * @param {string} uri
     * @returns {boolean}
     */
    static isSameOrigin(uri)
    {
        try {
            const url = new URL(uri, window.location.href);
            return url.origin === window.location.origin;
        } catch {
            return false;
        }
    }

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

global.Leuce = {};
global.Leuce.VERSION = '1.0.0';

global.Leuce.HTTP = {};
global.Leuce.HTTP.Request = Request;
global.Leuce.HTTP.Response = Response;
global.Leuce.HTTP.Client = Client;
global.Leuce.HTTP.RequestBuilder = RequestBuilder;

global.Leuce.MVC = {};
global.Leuce.MVC.Model = Model;
global.Leuce.MVC.View = View;
global.Leuce.MVC.Controller = Controller;

global.Leuce.UI = UI;
global.Leuce.UI.Button = Button;
global.Leuce.UI.Table = Table;
global.Leuce.UI.TableController = TableController;

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
    const dataKey = 'leuce.button';
    let instance = $button.data(dataKey);
    if (!instance) {
        instance = new Leuce.UI.Button($button);
        $button.data(dataKey, instance);
    }
    return instance;
};

/**
 * @returns {Leuce.UI.Table}
 */
$.fn.leuceTable = function() {
    const $table = this.first();
    const dataKey = 'leuce.table';
    let instance = $table.data(dataKey);
    if (!instance) {
        instance = new Leuce.UI.Table($table);
        $table.data(dataKey, instance);
    }
    return instance;
};

})(jQuery);

//#endregion jQuery Plugins
