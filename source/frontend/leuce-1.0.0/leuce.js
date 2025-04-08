/**
 * Leuce — A HTTP and MVC micro-framework for Daphne
 *
 * (C) 2025 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

(function() {

  /**
   * An object representing an HTTP request, holding method, URL, headers, body,
   * and encoding flags.
   */
  class HttpRequest
  {
    method = '';
    url = '';
    headers = {};
    body = '';
    isMultipart = false;
  }

  /**
   * A normalized HTTP response wrapper, created from a jQuery jqXHR object for
   * consistent access.
   */
  class HttpResponse
  {
    statusCode = 0;
    headers = {};
    body = null;

    static fromJqXHR(jqXHR) {
      const response = new HttpResponse();
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

    isSuccess() {
      return (this.statusCode >= 200 && this.statusCode < 300)
          || this.statusCode === 304;
    }
  }

  /**
   * Executes HTTP requests using jQuery.ajax, handling both callback and
   * promise-based flows.
   */
  class HttpClient
  {
    send(request, onResponse = null, onProgress = null) {
      const settings = this.#buildSettings(request, onProgress);
      if (typeof onResponse === 'function') {
        this.#sendWithCallback(settings, onResponse);
      } else {
        return this.#sendWithPromise(settings);
      }
    }

    #buildSettings(request, onProgress) {
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
        settings.xhr = () => {
          const xhr = $.ajaxSettings.xhr();
          if (xhr.upload) {
            xhr.upload.addEventListener('progress', (e) => {
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

    #sendWithCallback(settings, callback) {
      settings.complete = (jqXHR) => {
        callback(HttpResponse.fromJqXHR(jqXHR));
      };
      $.ajax(settings);
    }

    #sendWithPromise(settings) {
      return new Promise((resolve) => {
        settings.complete = (jqXHR) => {
          resolve(HttpResponse.fromJqXHR(jqXHR));
        };
        $.ajax(settings);
      });
    }
  }

  /**
   * A fluent builder for composing and dispatching HttpRequest instances
   * through an HttpClient.
   */
  class HttpRequestBuilder
  {
    #httpClient = null;
    #request = null;
    #handler = '';
    #action = '';

    constructor(httpClient) {
      this.#httpClient = httpClient;
      this.#request = new HttpRequest();
    }

    get() {
      this.#request.method = 'GET';
      return this;
    }

    post() {
      this.#request.method = 'POST';
      return this;
    }

    handler(name) {
      this.#handler = name;
      return this;
    }

    action(name) {
      this.#action = name;
      return this;
    }

    body(body) {
      this.#request.body = body;
      this.#request.isMultipart = false;
      return this;
    }

    jsonBody(body) {
      this.#request.headers['Content-Type'] = 'application/json';
      this.#request.body = JSON.stringify(body);
      this.#request.isMultipart = false;
      return this;
    }

    multipartBody(formData) {
      this.#request.body = formData;
      this.#request.isMultipart = true;
      return this;
    }

    send(onResponse, onProgress) {
      const handler = encodeURIComponent(this.#handler);
      const action = encodeURIComponent(this.#action);
      this.#request.url = `api/${handler}/${action}`;
      return this.#httpClient.send(this.#request, onResponse, onProgress);
    }
  }

  /**
   * Base model class providing a consistent entry point for initiating HTTP
   * requests.
   */
  class MvcModel
  {
    #httpClient = null;

    constructor(httpClient) {
      this.#httpClient = httpClient ?? new HttpClient();
    }

    get() {
      return this.#buildRequest().get();
    }

    post() {
      return this.#buildRequest().post();
    }

    #buildRequest() {
      return new HttpRequestBuilder(this.#httpClient);
    }
  }

  /**
   * Base view class offering a structured mechanism for binding and accessing
   * UI elements.
   */
  class MvcView
  {
    #bindings = {};

    bind(name, selector) {
      this.#bindings[name] = $(selector);
      return this;
    }

    get(name) {
      return this.#bindings[name];
    }
  }

  /**
   * Base controller class designed to coordinate logic between a model and a
   * view.
   */
  class MvcController
  {
    #model = null;
    #view = null;

    constructor(model, view) {
      this.#model = model;
      this.#view = view;
    }

    get model() {
      return this.#model;
    }

    get view() {
      return this.#view;
    }
  }

  window.Leuce = {
    HttpRequest,
    HttpResponse,
    HttpClient,
    HttpRequestBuilder,
    MvcModel,
    MvcView,
    MvcController
  };

})();
