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
        if (response.statusCode === 0) {
            response.body = {
                message: "You're offline. Please check your connection and try again."
            };
        } else {
            jqXHR.getAllResponseHeaders().split(/[\r\n]+/).forEach(function(line) {
                const parts = line.split(': ');
                if (parts.length === 2) {
                    response.headers[parts[0]] = parts[1];
                }
            });
            response.body = jqXHR.responseJSON ?? jqXHR.responseText;
        }
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
     * @param {(function(Response))=} responseCallback
     * @param {(function(number))=} progressCallback
     * @returns {Promise<Response>|undefined}
     */
    send(request, responseCallback = null, progressCallback = null)
    {
        const settings = this.#buildSettings(request, progressCallback);
        if (typeof responseCallback === 'function') {
            this.#sendWithCallback(settings, responseCallback);
        } else {
            return this.#sendWithPromise(settings);
        }
    }

    /**
     * @param {Request} request
     * @param {(function(number))=} progressCallback
     * @returns {object}
     */
    #buildSettings(request, progressCallback = null)
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
        if (typeof progressCallback === 'function') {
            settings.xhr = function() {
                const xhr = $.ajaxSettings.xhr();
                if (xhr.upload) {
                    xhr.upload.addEventListener('progress', function(e) {
                        if (e.lengthComputable) {
                            progressCallback((e.loaded / e.total) * 100);
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
     * @param {function(Response)} responseCallback
     */
    #sendWithCallback(settings, responseCallback)
    {
        settings.complete = function(jqXHR) {
            responseCallback(Response.fromJqXHR(jqXHR));
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
    #client;

    /** @type {Request} */
    #request;

    /** @type {string} */
    #handler;

    /** @type {string} */
    #action;

    /** @type {Object.<string, string|number>|null} */
    #queryParams;

    /**
     * @param {Client} client
     */
    constructor(client)
    {
        this.#client = client;
        this.#request = new Request();
        this.#handler = '';
        this.#action = '';
        this.#queryParams = null;
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
     * @param {string} name
     * @param {string} value
     * @returns {RequestBuilder}
     */
    header(name, value)
    {
        this.#request.headers[name] = value;
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
     * @param {(function(Response))=} responseCallback
     * @param {(function(number))=} progressCallback
     * @returns {Promise<Response>|undefined}
     * @throws {Error}
     */
    send(responseCallback = null, progressCallback = null)
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
        return this.#client.send(this.#request, responseCallback, progressCallback);
    }
}

//#endregion HTTP

//#region MVC

class Model
{
    /** @type {Client} */
    #client;

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
        return this._buildRequest().get();
    }

    /**
     * @returns {RequestBuilder}
     */
    post()
    {
        return this._buildRequest().post();
    }

    /**
     * @returns {RequestBuilder}
     * @protected
     */
    _buildRequest()
    {
        return new RequestBuilder(this.#client);
    }
}

class View
{
    /** @type {Object.<string, jQuery|object>} */
    #registry;

    constructor()
    {
        this.#registry = {};
    }

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
    #model;

    /** @type {View} */
    #view;

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

    /**
     * @param {{
     *   title?: string|null,
     *   message: string|jQuery,
     *   theme?: string|null,
     *   primaryButtonLabel?: string|null,
     *   primaryButtonVariant?: string|null,
     *   secondaryButtonLabel?: string|null,
     *   secondaryButtonVariant?: string|null,
     *   beforeShow?: (() => void)|null,
     *   canConfirm?: (() => boolean|Promise<boolean>)|null
     * }} options
     * @returns {Promise<boolean>}
     */
    static messageBox({
        title = null,
        message,
        theme = null,
        primaryButtonLabel = null,
        primaryButtonVariant = null,
        secondaryButtonLabel = null,
        secondaryButtonVariant = null,
        beforeShow = null,
        canConfirm = null
    } = {}) {
        const dataKey = 'leuce.messagebox';
        let $modal = $('#' + MessageBox.elementId());
        let instance;
        if ($modal.length === 0) {
            instance = new MessageBox();
            $modal = instance.node();
            $modal.data(dataKey, instance);
            $(document.body).append($modal);
        } else {
            instance = $modal.data(dataKey);
        }
        return instance.show(
            title,
            message,
            theme,
            primaryButtonLabel,
            primaryButtonVariant,
            secondaryButtonLabel,
            secondaryButtonVariant,
            beforeShow,
            canConfirm
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
    #settled;

    constructor()
    {
        this.#promise = new Promise((resolve, reject) => {
            this.#resolve = resolve;
            this.#reject = reject;
        });
        this.#settled = false;
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

    /**
     * @returns {boolean}
     */
    isSettled()
    {
        return this.#settled;
    }
}

class Form
{
    /** @type {jQuery} */
    #$node;

    /** @type {string|null} */
    #snapshot;

    /**
     * @param {*} selector
     * @throws {Error}
     */
    constructor(selector)
    {
        this.#$node = $(selector);
        if (this.#$node.length !== 1 || !this.#$node.is('form')) {
            throw new Error(
                `Leuce: Selector must match a single form element: ${selector}`);
        }
        this.#snapshot = null;
        this.#bindEvents();
    }

    /**
     * @returns {jQuery}
     */
    node()
    {
        return this.#$node;
    }

    /**
     * @returns {boolean}
     */
    validate()
    {
        const form = this.#$node[0];
        if (!form.checkValidity()) {
            form.reportValidity();
            return false;
        }
        return true;
    }

    /**
     * @returns {string}
     */
    serialize()
    {
        return this.#$node.serialize();
    }

    /**
     * @returns {Object}
     */
    data()
    {
        const data = {};
        jQuery.map(this.#$node.serializeArray(), function(item) {
            if (item.name.endsWith('[]')) {
                const name = item.name.slice(0, -2);
                if (!Array.isArray(data[name])) {
                    data[name] = [];
                }
                data[name].push(item.value);
            } else {
                data[item.name] = item.value;
            }
        });
        return data;
    }

    /**
     * @param {Object} data
     * @returns {void}
     */
    populate(data)
    {
        for (const [key, value] of Object.entries(data)) {
            this.findInput(key).val(value);
        }
    }

    /**
     * @returns {void}
     *
     * @note This method does not clear hidden inputs, since those often carry
     *       structural state (e.g. CSRF tokens) that must persist across resets.
     *       To clear a hidden field explicitly, use a `findInput('<name>')`
     *       and `val('')` combination.
     */
    clear()
    {
        this.#$node[0].reset();
    }

    /**
     * @returns {void}
     */
    submit()
    {
        if (!this.validate()) {
            return;
        }
        this.#$node.submit();
    }

    /**
     * @returns {void}
     */
    takeSnapshot()
    {
        this.#snapshot = this.serialize();
    }

    /**
     * @returns {boolean}
     */
    isModified()
    {
        return this.#snapshot !== null &&
               this.#snapshot !== this.serialize();
    }

    /**
     * @param {string} name
     * @returns {jQuery}
     */
    findInput(name)
    {
        return this.#$node.find(`[name="${name}"]`);
    }

    /**
     * @returns {void}
     */
    #bindEvents()
    {
        this.#$node.on('submit', this.#handleSubmit.bind(this));
    }

    /**
     * @param {jQuery.Event} event
     * @returns {void}
     */
    #handleSubmit(event)
    {
        event.preventDefault();
        this.#$node.trigger('leuce:form:submit', [this.data()]);
    }
}

class Modal
{
    /** @type {jQuery} */
    #$node;

    /** @type {jQuery} */
    #$confirmButton;

    /** @type {bootstrap.Modal} */
    #modal;

    /** @type {(() => boolean|Promise<boolean>)|null} */
    #canConfirm;

    /** @type {(() => boolean|Promise<boolean>)|null} */
    #canCancel;

    /** @type {Deferred<boolean>|null} */
    #confirmation;

    /** @type {(event: JQuery.Event) => void} */
    #boundHandleHide;

    /**
     * @param {*} selector
     * @throws {Error}
     */
    constructor(selector)
    {
        this.#$node = $(selector);
        if (this.#$node.length === 0) {
            throw new Error(`Leuce: Modal element not found: ${selector}`);
        }
        this.#$confirmButton = this.#$node.find('[data-leuce-modal-confirm-button]');
        if (this.#$confirmButton.length === 0) {
            console.warn('Leuce: Modal confirm button not found.');
        }
        this.#modal = new bootstrap.Modal(this.#$node[0]);
        this.#canConfirm = null; // per-call state
        this.#canCancel = null; // per-call state
        this.#confirmation = null; // per-call state
        this.#boundHandleHide = this.#handleHide.bind(this);
        this.#bindEvents();
    }

    /**
     * @returns {jQuery}
     */
    node()
    {
        return this.#$node;
    }

    /**
     * @param {{
     *   canConfirm?: () => boolean|Promise<boolean>,
     *   canCancel?: () => boolean|Promise<boolean>
     * }} [options]
     * @returns {Promise<boolean>}
     */
    show({
        canConfirm = null,
        canCancel = null
    } = {}) {
        this.#canConfirm = canConfirm;
        this.#canCancel = canCancel;
        this.#confirmation?.resolve(false); // settle previous result, if any
        this.#confirmation = new Deferred();
        this.#resetDraggable();
        this.#modal.show();
        return this.#confirmation.promise();
    }

    /**
     * @returns {void}
     */
    hide()
    {
        this.#modal.hide();
    }

    /**
     * @param {boolean} isLoading
     * @returns {void}
     */
    setLoading(isLoading)
    {
        this.#$confirmButton.leuceButton().setLoading(isLoading);
    }

    /**
     * @returns {void}
     */
    #bindEvents()
    {
        this.#$node
            .on('shown.bs.modal', this.#handleShown.bind(this))
            .on('hide.bs.modal', this.#boundHandleHide)
            .on('hidden.bs.modal', this.#handleHidden.bind(this))
            .draggable({ cursor: 'move' }); // via jQuery UI
        this.#$confirmButton
            .on('click', this.#handleConfirmButtonClick.bind(this));
    }

    /**
     * @returns {void}
     */
    #resetDraggable()
    {
        this.#$node.css({ position: '', left: '', top: '' });
    }

    /**
     * Avoids "aria-hidden + focus retained" warning when modal closes.
     * Blurs the modal itself or any element inside it that still has focus.
     *
     * @returns {void}
     */
    #killFocus()
    {
        const $focused = this.#$node.is(':focus')
            ? this.#$node
            : this.#$node.find(':focus');
        if ($focused.length) {
            $focused.trigger('blur');
        }
    }

    /**
     * @param {jQuery.Event} event
     * @returns {void}
     */
    #handleShown(event)
    {
        const $autofocus = this.#$node.find('[autofocus]');
        if ($autofocus.length) {
            $autofocus.first().trigger('focus');
        }
    }

    /**
     * @param {jQuery.Event} event
     * @returns {void}
     */
    async #handleHide(event)
    {
        this.#killFocus();

        // If the modal was already confirmed, skip checking the cancel hook.
        // Note that the Deferred is resolved either in #handleConfirmButtonClick
        // (true) or, if not confirmed, later in #handleHidden (false). Because
        // "hide.bs.modal" always fires before "hidden.bs.modal", a settled
        // state at this point can only indicate confirm.
        if (this.#confirmation?.isSettled()) {
            return;
        }

        // If a cancel hook is set, intercept here. The "hide.bs.modal" event
        // is the single point that covers all dismissal paths (ESC, backdrop,
        // button, or programmatic). We call preventDefault() right away to
        // block the hide, then run the hook. If it approves, we detach this
        // handler to avoid an infinite loop, hide the modal, and then re-attach
        // the handler.
        if (typeof this.#canCancel === 'function') {
            // Important: preventDefault() must be called before awaiting the
            // hook. When #handleHide() reaches an `await`, it yields to the event
            // loop. Bootstrap then sees default is not prevented and proceeds
            // to hide the modal. By the time we resume the handler and call
            // preventDefault(), it's too late.
            event.preventDefault();
            if (true === await this.#canCancel()) {
                this.#$node.off('hide.bs.modal', this.#boundHandleHide);
                this.hide();
                this.#$node.on('hide.bs.modal', this.#boundHandleHide);
            }
        }
    }

    /**
     * @param {jQuery.Event} event
     * @returns {void}
     */
    #handleHidden(event)
    {
        this.#canConfirm = null;
        this.#canCancel = null;
        // When the modal closes, resolve as false by default. If the promise
        // was already settled earlier (i.e. via confirm button), the Deferred
        // object ignores this extra call.
        this.#confirmation?.resolve(false);
        this.#confirmation = null;
    }

    /**
     * @param {jQuery.Event} event
     * @returns {void}
     */
    async #handleConfirmButtonClick(event)
    {
        if (typeof this.#canConfirm === 'function') {
            if (true !== await this.#canConfirm()) {
                return;
            }
        }
        this.#confirmation?.resolve(true);
        this.hide();
    }
}

class MessageBox extends Modal
{
    constructor()
    {
        super(MessageBox.#createNode());
    }

    /**
     * @returns {string}
     */
    static elementId()
    {
        return 'leuce-messagebox';
    }

    /**
     * @param {string|null} title
     * @param {string|jQuery} message
     * @param {string|null} theme
     * @param {string|null} primaryButtonLabel
     * @param {string|null} primaryButtonVariant
     * @param {string|null} secondaryButtonLabel
     * @param {string|null} secondaryButtonVariant
     * @param {(() => void)|null} beforeShow
     * @param {(() => boolean|Promise<boolean>)|null} canConfirm
     * @returns {Promise<boolean>}
     */
    show(
        title,
        message,
        theme,
        primaryButtonLabel,
        primaryButtonVariant,
        secondaryButtonLabel,
        secondaryButtonVariant,
        beforeShow,
        canConfirm
    ) {
        // 1
        title = (typeof title === 'string')
            ? title : null;
        message = (typeof message === 'string' || message instanceof jQuery)
            ? message : '';
        theme = (typeof theme === 'string')
            ? theme : null;
        primaryButtonLabel = (typeof primaryButtonLabel === 'string')
            ? primaryButtonLabel : "OK";
        primaryButtonVariant = (typeof primaryButtonVariant === 'string')
            ? primaryButtonVariant : 'primary';
        secondaryButtonLabel = (typeof secondaryButtonLabel === 'string')
            ? secondaryButtonLabel : null;
        secondaryButtonVariant = (typeof secondaryButtonVariant === 'string')
            ? secondaryButtonVariant : 'secondary';
        beforeShow = (typeof beforeShow === 'function')
            ? beforeShow : null;
        canConfirm = (typeof canConfirm === 'function')
            ? canConfirm : null;
        // 2
        const $node = this.node();
        // 3
        const $title = $node.find('.modal-title');
        $title.text(title ?? "Message");
        // 4
        const $body = $node.find('.modal-body');
        $body.empty();
        if (typeof message === 'string') {
            $body.html(message);
        } else { // instanceof jQuery
            $body.append(message);
        }
        // 5
        if (theme !== null) {
            $node.attr('data-bs-theme', theme);
        } else {
            $node.removeAttr('data-bs-theme');
        }
        // 6
        const $primaryButton = $node
            .find('[data-leuce-modal-confirm-button]');
        $primaryButton
            .text(primaryButtonLabel)
            .attr('class', `btn btn-${primaryButtonVariant}`);
        // 7
        const $secondaryButton = $node
            .find('.modal-footer button')
            .not('[data-leuce-modal-confirm-button]');
        if (secondaryButtonLabel === null) {
            $secondaryButton.addClass('d-none');
        } else {
            $secondaryButton
                .removeClass('d-none')
                .text(secondaryButtonLabel)
                .attr('class', `btn btn-${secondaryButtonVariant}`);
        }
        // 8
        if (beforeShow !== null) {
            beforeShow();
        }
        // 9
        return super.show({ canConfirm });
    }

    /**
     * @returns {jQuery}
     */
    static #createNode()
    {
        const modalTitleId = `modal-title-${Utility.uniqueId()}`;
        return $('<div>', {
            id: this.elementId(),
            class: 'modal',
            'aria-hidden': 'true',
            'aria-labelledby': modalTitleId,
            tabIndex: -1
        }).append(
            $('<div>', { class: 'modal-dialog' }).append(
                $('<div>', { class: 'modal-content' }).append(
                    $('<div>', { class: 'modal-header' }).append(
                        $('<h5>', {
                            class: 'modal-title',
                            id: modalTitleId
                        }),
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
                            class: '',
                            'data-bs-dismiss': 'modal'
                        }),
                        $('<button>', {
                            type: 'button',
                            class: '',
                            'data-leuce-modal-confirm-button': ''
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
    #isLoading;

    /** @type {string|null} */
    #htmlBackup;

    /** @type {boolean} */
    #alreadyDisabled;

    /** @type {string} */
    #inlineWidth;

    /**
     * @param {jQuery} $button
     * @throws {Error}
     */
    constructor($button)
    {
        if (!$button.is('button')) {
            throw new Error('Leuce: Only button elements are supported.');
        }
        this.#$button = $button;
        this.#isLoading = false;
        this.#htmlBackup = null;
        this.#alreadyDisabled = false;
        this.#inlineWidth = '';
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
                    text: "Loading..."
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
     *   formatter: { name: string, arg?: string }|null
     *   renderer: string|null,
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
     *   formatter: { name: string, arg?: string }|null,
     *   renderer: string|null,
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
            title: "Add",
            message: this.#$form,
            primaryButtonLabel: "Save",
            secondaryButtonLabel: "Cancel",
            beforeShow: () => {
                this.#showPrimaryKeyField(false);
                this.#resetNullableInputGroups();
                this.#clearForm();
            },
            canConfirm: () => this.#validateForm()
        }).then(confirmed => {
            if (confirmed) {
                this.#actionHandler?.('add', this.#extractFormData(false));
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
            title: "Edit",
            message: this.#$form,
            primaryButtonLabel: "Save",
            secondaryButtonLabel: "Cancel",
            beforeShow: () => {
                this.#showPrimaryKeyField(true);
                this.#resetNullableInputGroups();
                this.#populateForm($tr);
            },
            canConfirm: () => this.#validateForm()
        }).then(confirmed => {
            if (confirmed) {
                this.#actionHandler?.('edit', this.#extractFormData(true));
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
            title: "Delete",
            message: "Are you sure you want to delete this record?",
            primaryButtonLabel: "Delete",
            secondaryButtonLabel: "Cancel"
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
        const $checkboxes = this.#$form.find(
            '.form-check-input[data-nullifier-for]');
        for (const checkbox of $checkboxes.get()) {
            const $checkbox = $(checkbox);
            const inputId = $checkbox.data('nullifier-for');
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
            const $input = this.#findInput(this.#primaryKey.key);
            $input.val('');
        }
        for (const column of this.#columns) {
            if (column.key === null) {
                continue;
            }
            const $input = this.#findInput(column.key);
            switch (column.type) {
            case 'boolean':
                $input.prop('checked', false);
                break;
            default:
                $input.val('');
            }
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
            switch (column.type) {
            case 'boolean':
                $input.prop('checked', Boolean(value));
                break;
            case 'datetime':
                if (typeof value === 'string') {
                    // Format datetime values to use 'T' separator required by
                    // "datetime-local" inputs.
                    $input.val(value.replace(' ', 'T'));
                }
                break;
            default:
                $input.val(value ?? '');
            }
            // If the value is null and the column is nullable, disable
            // the input and check the corresponding 'null' checkbox.
            if (column.nullable && value === null) {
                const inputId = $input.attr('id');
                const $checkbox = this.#$form.find(
                    `.form-check-input[data-nullifier-for="${inputId}"]`);
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
     * @param {boolean} includePrimaryKey
     * @returns {object}
     */
    #extractFormData(includePrimaryKey)
    {
        const data = {};
        const $inputs = this.#$form.find('input[name]');
        for (const input of $inputs.get()) {
            const $input = $(input);
            const name = $input.attr('name');
            if (!includePrimaryKey && name === this.#primaryKey.key) {
                continue;
            }
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
     *   formatter: { name: string, arg?: string }|null,
     *   renderer: string|null,
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
        const inputId = `form-input-${Utility.uniqueId()}`;
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
        // 1
        const $input = this.#createInput(inputId, inputName, inputType);
        const $nullifier = this.#createNullifierFor(inputId);
        // 2
        if (inputType === 'boolean') {
            return $('<div>', {
                class: 'leuce-nullable-boolean-input-group'
            }).append($input, $nullifier);
        }
        // 3
        return $('<div>', { class: 'input-group' }).append(
            $input,
            $('<div>', { class: 'input-group-text' }).append(
                $nullifier
            )
        );
    }

    /**
     * @param {string} inputId
     * @returns {jQuery}
     */
    static #createNullifierFor(inputId)
    {
        const checkboxId = `form-input-${Utility.uniqueId()}`;
        return $('<div>', { class: 'form-check' }).append(
            $('<input>', {
                type: 'checkbox',
                class: 'form-check-input',
                id: checkboxId,
                'data-nullifier-for': inputId
            }),
            $('<label>', {
                for: checkboxId,
                class: 'form-check-label leuce-no-user-select',
                text: 'null'
            })
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
            id: id,
            name: name,
            // The `required` attribute is always set to true. If the field is
            // nullable, a separate checkbox is used to disable the input, which
            // bypasses validation. For boolean fields, required is never set,
            // since `false` is also a valid value.
            required: type !== 'boolean',
            readonly: readonly
        });
        // Store type information using a data-* attribute for later use during
        // form data extraction. Do not use jQuery's .data() here, as its values
        // are lost when the form is detached and reattached to the DOM (i.e.,
        // by MessageBox).
        if (type != null) {
            $input.attr('data-type', type);
        }
        // Boolean fields are rendered as Bootstrap 5 switches.
        if (type === 'boolean') {
            return $('<div>', {
                class: 'form-check form-switch'
            }).append($input);
        }
        // All other types...
        return $input;
    }

    /**
     * @param {string|null} type
     * @returns {{ type?: string, step?: string }}
     */
    static #inputAttributesFor(type)
    {
        switch (type) {
        case 'boolean':
            return {
                type: 'checkbox',
                class: 'form-check-input',
                role: 'switch',
                switch: '' // Enables haptics on mobile Safari (iOS 17.4+)
            };
        case 'integer':
            return {
                type: 'number',
                class: 'form-control',
                step: '1'
            };
        case 'float':
            return {
                type: 'number',
                class: 'form-control',
                step: 'any'
            };
        case 'string':
            return {
                type: 'text',
                class: 'form-control'
            };
        case 'datetime':
            return {
                type: 'datetime-local',
                class: 'form-control',
                step: '1'
            };
        default:
            return { class: 'form-control' };
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
        case 'boolean':
            return $input.prop('checked');
        case 'integer':
            return parseInt(value, 10);
        case 'float':
            return parseFloat(value);
        case 'string':
            return value;
        case 'datetime':
            return value.replace('T', ' ') + (value.length === 16 ? ':00' : '');
        default:
            return value;
        }
    }
}

class TableToolbar
{
    /** @type {jQuery} */
    #$node;

    /** @type {TableEditor|null} */
    #editor;

    /** @type {(action: string, payload?: *) => void}|null */
    #actionHandler;

    /**
     * @param {TableEditor|null} editor
     * @param {boolean} noSearch
     */
    constructor(editor, noSearch)
    {
        this.#$node = TableToolbar.#createNode(editor !== null, noSearch);
        this.#editor = editor;
        this.#actionHandler = null;
        this.#bindEvents(noSearch);
    }

    /**
     * @returns {jQuery}
     */
    node()
    {
        return this.#$node;
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
     * @param {boolean} noSearch
     * @returns {void}
     */
    #bindEvents(noSearch)
    {
        // Search box
        if (!noSearch) {
            this.#$node.find('[data-action="search-input"]').on('keydown', (event) => {
                if (event.key === 'Enter') {
                    this.#actionHandler?.('search', $(event.currentTarget).val().trim());
                }
            });
            this.#$node.find('[data-action="search"]').on('click', () => {
                const $input = this.#$node.find('[data-action="search-input"]');
                this.#actionHandler?.('search', $input.val().trim());
            });
        }
        // Add button
        if (this.#editor !== null) {
            this.#$node.find('[data-action="add"]').on('click', () => {
                this.#editor.showAdd();
            });
        }
        // Reload button
        this.#$node.find('[data-action="reload"]').on('click', () => {
            this.#actionHandler?.('reload');
        });
    }

    /**
     * @param {boolean} hasAddButton
     * @param {boolean} noSearch
     * @returns {jQuery}
     */
    static #createNode(hasAddButton, noSearch)
    {
        return $('<div>', {
            class: 'leuce-table-controls'
        }).append(
            this.#createSearchBox(noSearch),
            this.#createActionButtons(hasAddButton)
        );
    }

    /**
     * @param {boolean} disabled
     * @returns {jQuery}
     */
    static #createSearchBox(disabled)
    {
        const $inputGroup = $('<div>', {
            class: 'input-group flex-nowrap'
        }).append(
            $('<input>', {
                type: 'search',
                class: 'form-control form-control-sm',
                'data-action': 'search-input',
                placeholder: "Search...",
                css: { minWidth: '100px', maxWidth: '150px' },
                disabled: disabled
            }),
            this.#createButton('search', 'bi bi-search')
                .prop('disabled', disabled)
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
            $group.append(this.#createButton('add', 'bi bi-plus-lg', "Add"));
        }
        $group.append(this.#createButton('reload', 'bi bi-arrow-clockwise', "Reload"));
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
            class: 'btn btn-sm leuce-button',
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
    #$node;

    /** @type {(action: string, payload?: *) => void}|null */
    #actionHandler;

    constructor()
    {
        this.#$node = TablePaginator.#createNode();
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
    node()
    {
        return this.#$node;
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
        const $select = this.#$node.find('[data-action="currentPage"]');
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
        this.#$node.find('[data-action="firstPage"]').prop('disabled', atFirstPage);
        this.#$node.find('[data-action="previousPage"]').prop('disabled', atFirstPage);
        this.#$node.find('[data-action="currentPage"]').prop('disabled', hasNoPages);
        this.#$node.find('[data-action="nextPage"]').prop('disabled', atLastPage);
        this.#$node.find('[data-action="lastPage"]').prop('disabled', atLastPage);
        return totalPages;
    }

    /**
     * @returns {void}
     */
    #bindEvents()
    {
        this.#$node.find('[data-action="pageSize"]').on('change', (event) => {
            this.#actionHandler?.('pageSize', parseInt(event.target.value, 10));
        });
        this.#$node.find('[data-action="firstPage"]').on('click', () => {
            this.#actionHandler?.('firstPage');
        });
        this.#$node.find('[data-action="previousPage"]').on('click', () => {
            this.#actionHandler?.('previousPage');
        });
        this.#$node.find('[data-action="currentPage"]').on('change', (event) => {
            this.#actionHandler?.('currentPage', parseInt(event.target.value, 10));
        });
        this.#$node.find('[data-action="nextPage"]').on('click', () => {
            this.#actionHandler?.('nextPage');
        });
        this.#$node.find('[data-action="lastPage"]').on('click', () => {
            this.#actionHandler?.('lastPage');
        });
    }

    /**
     * @returns {jQuery}
     */
    static #createNode()
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
        }).append("Show ", $select, " per page");
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
            class: 'btn btn-sm leuce-button',
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
    static #inlineActionsRendererName = 'inlineActions';

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
     *   formatter: { name: string, arg?: string }|null
     *   renderer: string|null,
     *   $th: jQuery
     * }>}
     */
    #columns;

    /** @type {TableEditor|null} */
    #editor;

    /** @type {TableToolbar} */
    #toolbar;

    /** @type {TablePaginator|null} */
    #paginator;

    /** @type {jQuery} */
    #$overlay;

    /**
     * @param {jQuery} $table
     * @throws {Error}
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
        this.#toolbar = new TableToolbar(this.#editor, $table.is('[data-nosearch]'));
        this.#$wrapper.prepend(this.#toolbar.node().addClass('mb-3'));
        // 9
        if ($table.is('[data-nopaginate]')) {
            this.#paginator = null;
        } else {
            this.#paginator = new TablePaginator();
            this.#$wrapper.append(this.#paginator.node().addClass('mt-3'));
        }
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
     * @param {(row: object, value: *, arg?: string) => *} fn
     * @returns {Leuce.UI.Table}
     */
    setFormatter(name, fn)
    {
        this.#formatters[name] = fn;
        return this;
    }

    /**
     * @param {string} name
     * @param {(row: object) => string|jQuery} fn
     * @returns {Leuce.UI.Table}
     */
    setRenderer(name, fn)
    {
        this.#renderers[name] = fn;
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
        this.#paginator?.setActionHandler(actionHandler);
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
               .text("No matching records found");
            $tr.append($td);
            this.#$tbody.append($tr);
            return this;
        }
        for (const row of data) {
            const $tr = $('<tr>');
            if (this.#primaryKey !== null && !(this.#primaryKey.key in row)) {
                console.warn(`Leuce: Primary key "${this.#primaryKey.key}" `
                           + `not found in row data.`);
            }
            $tr.data('row', row);
            for (const { key, nullable, formatter, renderer } of this.#columns) {
                const $td = $('<td>');
                let value = '';
                if (key !== null) {
                    if (!(key in row)) {
                        console.warn(`Leuce: Key "${key}" not found in row data.`);
                    }
                    value = row[key];
                    if (formatter !== null) {
                        value = this.#callFormatter(formatter, row, value);
                    } else if (nullable && value === null) {
                        $td.addClass('leuce-null');
                    }
                } else if (renderer !== null) {
                    value = this.#callRenderer(renderer, row);
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
        return this.#paginator?.update(totalRecords, pageSize, currentPage);
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
            console.warn(`Leuce: No \`data-primary-key-type\` specified for `
                       + `primary key "${key}"; defaulting to "integer".`);
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
            'data-renderer': Table.#inlineActionsRendererName
        }));
        this.setRenderer(
            Table.#inlineActionsRendererName,
            Table.#inlineActionsRenderer.bind(Table)
        );
    }

    /**
     * @returns {Array<{
     *   key: string|null,
     *   type: string|null,
     *   nullable: boolean,
     *   formatter: { name: string, arg?: string }|null,
     *   renderer: string|null,
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
            let formatter = Table.#readDataAttribute($th, 'formatter');
            if (formatter !== null) {
                formatter = Table.#parseColumnFormatter(formatter);
            }
            let renderer = null;
            if (key === null) {
                renderer = Table.#readDataAttribute($th, 'renderer');
            }
            columns.push({ key, type, nullable, formatter, renderer, $th });
        }
        return columns;
    }

    /**
     * @param {{ name: string, arg?: string }} formatter
     * @param {object} row
     * @param {*} value
     * @returns {*}
     */
    #callFormatter(formatter, row, value)
    {
        const fn = this.#formatters[formatter.name];
        if (typeof fn !== 'function') {
            console.warn(`Leuce: No formatter found for "${formatter.name}".`);
            return value;
        }
        return fn(row, value, formatter.arg);
    }

    /**
     * @param {string} name
     * @param {object} row
     * @returns {*}
     */
    #callRenderer(name, row)
    {
        const fn = this.#renderers[name];
        if (typeof fn !== 'function') {
            console.warn(`Leuce: No renderer found for "${name}".`);
            return '';
        }
        return fn(row);
    }

    /**
     * @returns {void}
     */
    #bindEvents()
    {
        // Sortable headers
        if (!this.#$thead.is('[data-nosort]')) {
            const boundHandleHeaderClick = this.#handleHeaderClick.bind(this);
            for (const column of this.#columns) {
                if (column.key !== null && !column.$th.is('[data-nosort]')) {
                    column.$th.on('click', boundHandleHeaderClick);
                }
            }
        }
        // Inline actions
        if (this.#editor !== null) {
            this.#$tbody
                .on('click', '[data-action="edit"]', this.#handleEditClick.bind(this))
                .on('click', '[data-action="delete"]', this.#handleDeleteClick.bind(this));
        }
    }

    /**
     * @param {jQuery.Event} event
     * @returns {void}
     */
    #handleHeaderClick(event)
    {
        const $th = $(event.currentTarget);
        const clickedKey = $th.data('key');
        const clickedIconClass = $th.find('i').attr('class');
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
     * @param {jQuery.Event} event
     * @returns {void}
     */
    #handleEditClick(event)
    {
        const $tr = $(event.currentTarget).closest('tr');
        this.#editor.showEdit($tr);
    }

    /**
     * @param {jQuery.Event} event
     * @returns {void}
     */
    #handleDeleteClick(event)
    {
        const $tr = $(event.currentTarget).closest('tr');
        this.#editor.showDelete($tr);
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
                text: "Loading..."
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
            console.warn(`Leuce: Attribute \`data-${name}\` must be a string.`);
            return null;
        }
        value = value.trim();
        if (value === '') {
            console.warn(`Leuce: Attribute \`data-${name}\` must be a nonempty string.`);
            return null;
        }
        return value;
    }

    /**
     * @param {string} formatter
     * @returns {{ name: string, arg?: string }|null}
     */
    static #parseColumnFormatter(formatter)
    {
        let [name, arg] = formatter.split(':');
        name = name.trim();
        if (name === '') {
            console.warn('Leuce: Attribute `data-formatter` must have a nonempty name.');
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
    static #inlineActionsRenderer(/*row*/)
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
            class: 'btn btn-sm leuce-button',
            'data-action': action
        }).append($('<i>', { class: iconClass }));
    }
}

class TableController
{
    /** @type {jQuery} */
    #$table;

    /** @type {string|null} */
    #tableName;

    /** @type {(params: object) => Promise<Leuce.HTTP.Response>} */
    #fnList;

    /** @type {((tableName: string, data: object) => Promise<Leuce.HTTP.Response>)|null} */
    #fnAdd;

    /** @type {((tableName: string, data: object) => Promise<Leuce.HTTP.Response>)|null} */
    #fnEdit;

    /** @type {((tableName: string, id: number) => Promise<Leuce.HTTP.Response>)|null} */
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
     *   $table: jQuery,
     *   tableName?: string,
     *   fnList: (params: object) => Promise<Leuce.HTTP.Response>
     *   fnAdd?: (tableName: string, data: object) => Promise<Leuce.HTTP.Response>,
     *   fnEdit?: (tableName: string, data: object) => Promise<Leuce.HTTP.Response>
     *   fnDelete?: (tableName: string, id: number) => Promise<Leuce.HTTP.Response>
     * }} options
     */
    constructor({ $table, tableName, fnList, fnAdd, fnEdit, fnDelete })
    {
        this.#$table = $table;
        this.#tableName = tableName ?? null;
        this.#fnList = fnList;
        this.#fnAdd = fnAdd ?? null;
        this.#fnEdit = fnEdit ?? null;
        this.#fnDelete = fnDelete ?? null;
        this.#search = null;
        this.#sort = null;
        this.#page = 1;
        this.#pageSize = Table.defaultPageSize();
        this.#totalPages = 0;
        this.#$table.leuceTable().setActionHandler(this.#handleAction.bind(this));
    }

    /**
     * @returns {Promise<void>}
     */
    load()
    {
        // 1
        const params = {};
        if (this.#tableName !== null) {
            params.table = this.#tableName;
        }
        params.page = this.#page;
        params.pagesize = this.#pageSize;
        if (this.#search !== null) {
            params.search = this.#search;
        }
        if (this.#sort !== null) {
            params.sortkey = this.#sort.key;
            params.sortdir = this.#sort.direction;
        }
        // 2
        const table = this.#$table.leuceTable();
        table.setLoading(true);
        return this.#fnList(params).then(response => {
            table.setLoading(false);
            if (response.isSuccess()) {
                // 2.1
                if (Array.isArray(response.body.data)) {
                    table.setData(response.body.data);
                } else {
                    table.setData([]);
                    console.warn('Leuce: No `data` array found in response body.');
                }
                // 2.2
                if (Number.isInteger(response.body.total)) {
                    this.#totalPages = table.updatePaginator(
                        response.body.total,
                        this.#pageSize,
                        this.#page
                    );
                }
            } else {
                Leuce.UI.notifyError(response.body.message);
            }
        });
    }

    /**
     * @param {string} action
     * @param {*} [payload=null]
     */
    #handleAction(action, payload = null)
    {
        switch (action) {
        case 'reload':       this.#handleReload(); break;
        case 'search':       this.#handleSearch(payload); break;
        case 'sort':         this.#handleSort(payload); break;
        case 'add':          this.#handleAdd(payload); break;
        case 'edit':         this.#handleEdit(payload); break;
        case 'delete':       this.#handleDelete(payload); break;
        case 'pageSize':     this.#handlePageSize(payload); break;
        case 'firstPage':    this.#handleFirstPage(); break;
        case 'previousPage': this.#handlePreviousPage(); break;
        case 'currentPage':  this.#handleCurrentPage(payload); break;
        case 'nextPage':     this.#handleNextPage(); break;
        case 'lastPage':     this.#handleLastPage(); break;
        default:
            console.warn('Leuce: Unknown table action:', action);
            break;
        }
    }

    /**
     * @returns {void}
     */
    #handleReload()
    {
        this.load();
    }

    /**
     * @param {string} search
     * @returns {void}
     */
    #handleSearch(search)
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
    #handleSort(sort)
    {
        this.#sort = sort;
        this.#page = 1;
        this.load();
    }

    /**
     * @param {object} rowData
     * @returns {void}
     */
    #handleAdd(rowData)
    {
        if (this.#fnAdd === null || this.#tableName === null) {
            console.warn('Leuce: Cannot perform add because '
                       + '`fnAdd` or `tableName` is not set.');
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
    #handleEdit(rowData)
    {
        if (this.#fnEdit === null || this.#tableName === null) {
            console.warn('Leuce: Cannot perform edit because '
                       + '`fnEdit` or `tableName` is not set.');
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
    #handleDelete(id)
    {
        if (this.#fnDelete === null || this.#tableName === null) {
            console.warn('Leuce: Cannot perform delete because '
                       + '`fnDelete` or `tableName` is not set.');
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
    #handlePageSize(pageSize)
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
    #handleFirstPage()
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
    #handlePreviousPage()
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
    #handleCurrentPage(page)
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
    #handleNextPage()
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
    #handleLastPage()
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

    /**
     * @returns {string}
     */
    static uniqueId()
    {
        return Math.random().toString(36).slice(2, 10);
    }

    /**
     * @returns {boolean}
     */
    static isTouchDevice()
    {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
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
global.Leuce.UI.Form = Form;
global.Leuce.UI.Modal = Modal;
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

/**
 * Swipe Detection (jQuery Special Event)
 *
 * Provides a unified 'swipe' event for touch and mouse input. Handlers receive
 * one of: 'left', 'right', 'up', or 'down'. Usage:
 *
 *   $element.on('swipe', function(event, direction) { ... });
 *
 * Implementation notes:
 *
 * Native `addEventListener`/`removeEventListener` are used instead of jQuery's
 * `on`/`off` because jQuery does not provide the `{ passive: true }` option.
 * Passive listeners are important on "touchstart" and "mousedown" since they
 * let the browser handle scrolling smoothly; without them, browsers may issue
 * warnings about potential scroll-blocking.
 *
 * Gesture recognition is endpoint-based: start and end positions are compared
 * to determine distance and velocity. A valid swipe requires at least 50px of
 * travel and 0.3 px/ms speed (300 px/s). The dominant axis selects horizontal
 * vs. vertical; the sign of the delta determines direction.
 *
 * Ghost click prevention is handled by a capture-phase click listener. After
 * a swipe interaction, browsers may emit a synthetic click event; this is
 * intercepted when a swipe has just been detected. The `stopPropagation` method
 * prevents the click from reaching other handlers, and `preventDefault` is
 * used to block default browser actions such as navigation on a swiped link.
 */
$.event.special.swipe = {
    setup: function() {
        const TIME_THRESHOLD = 500; // ms
        const DISTANCE_THRESHOLD = 50;  // px
        const VELOCITY_THRESHOLD = 0.3; // px/ms
        let startTime = 0;
        let startPoint = null;
        let isSwiped = false;

        const pointFromEvent = e => {
            const point = e.changedTouches ? e.changedTouches[0] : e;
            return {
                x: point.clientX,
                y: point.clientY
            };
        };

        const resetState = () => {
            startTime = 0;
            startPoint = null;
            isSwiped = false;
        };

        const isEditable = target => {
            if (target.disabled) {
                return false;
            }
            switch (target.tagName) {
            case 'INPUT':
                return [
                    'color', 'date', 'datetime-local', 'email', 'month',
                    'number', 'password', 'range', 'search', 'tel', 'text',
                    'time', 'url', 'week'
                ].includes(target.type || 'text');
            case 'SELECT':
            case 'TEXTAREA':
                return true;
            }
            if (target.isContentEditable) {
                return true;
            }
            return false;
        };

        this.handleStart = e => {
            if (isEditable(e.target)) {
                return;
            }
            startTime = Date.now();
            startPoint = pointFromEvent(e);
            isSwiped = false;
        };

        this.handleEnd = e => {
            if (startTime === 0 || startPoint === null) {
                return;
            }
            const dt = Date.now() - startTime;
            if (dt === 0 || dt > TIME_THRESHOLD) {
                resetState();
                return;
            }
            const endPoint = pointFromEvent(e);
            const dx = endPoint.x - startPoint.x;
            const dy = endPoint.y - startPoint.y;
            const adx = Math.abs(dx);
            const ady = Math.abs(dy);
            const vx = adx / dt;
            const vy = ady / dt;
            let direction = null;
            if (adx > ady) {
                if (adx > DISTANCE_THRESHOLD && vx > VELOCITY_THRESHOLD) {
                    direction = dx > 0 ? 'right' : 'left';
                }
            } else {
                if (ady > DISTANCE_THRESHOLD && vy > VELOCITY_THRESHOLD) {
                    direction = dy > 0 ? 'down' : 'up';
                }
            }
            if (direction !== null) {
                isSwiped = true;
                $(this).trigger('swipe', [direction]);
            } else {
                isSwiped = false;
            }
            startTime = 0;
            startPoint = null;
        };

        this.handleCancel = e => {
            resetState();
        }

        this.handleClick = e => {
            if (isSwiped) {
                e.preventDefault();
                e.stopPropagation();
                isSwiped = false;
            }
        };

        if (Leuce.Utility.isTouchDevice()) {
            this.addEventListener('touchstart', this.handleStart, { passive: true });
            this.addEventListener('touchend', this.handleEnd);
            this.addEventListener('touchcancel', this.handleCancel);
        } else {
            this.addEventListener('mousedown', this.handleStart, { passive: true });
            this.addEventListener('mouseup', this.handleEnd);
            this.addEventListener('mouseleave', this.handleCancel);
        }
        this.addEventListener('click', this.handleClick, true);
    },

    teardown: function() {
        if (Leuce.Utility.isTouchDevice()) {
            this.removeEventListener('touchstart', this.handleStart);
            this.removeEventListener('touchend', this.handleEnd);
            this.removeEventListener('touchcancel', this.handleCancel);
        } else {
            this.removeEventListener('mousedown', this.handleStart);
            this.removeEventListener('mouseup', this.handleEnd);
            this.removeEventListener('mouseleave', this.handleCancel);
        }
        this.removeEventListener('click', this.handleClick, true);
        delete this.handleStart;
        delete this.handleEnd;
        delete this.handleCancel;
        delete this.handleClick;
    }
};

})(jQuery);

//#endregion jQuery Plugins
