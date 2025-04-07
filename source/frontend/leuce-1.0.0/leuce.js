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

    static FromJqXHR(jqXHR) {
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

    IsSuccess() {
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
    Send(request, onResponse, onProgress) {
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
        callback(HttpResponse.FromJqXHR(jqXHR));
      };
      $.ajax(settings);
    }

    #sendWithPromise(settings) {
      return new Promise((resolve) => {
        settings.complete = (jqXHR) => {
          resolve(HttpResponse.FromJqXHR(jqXHR));
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

    Get() {
      this.#request.method = 'GET';
      return this;
    }

    Post() {
      this.#request.method = 'POST';
      return this;
    }

    Handler(name) {
      this.#handler = name;
      return this;
    }

    Action(name) {
      this.#action = name;
      return this;
    }

    Body(body) {
      this.#request.body = body;
      this.#request.isMultipart = false;
      return this;
    }

    JsonBody(body) {
      this.#request.headers['Content-Type'] = 'application/json';
      this.#request.body = JSON.stringify(body);
      this.#request.isMultipart = false;
      return this;
    }

    MultipartBody(formData) {
      this.#request.body = formData;
      this.#request.isMultipart = true;
      return this;
    }

    Send(onResponse, onProgress) {
      const handler = encodeURIComponent(this.#handler);
      const action = encodeURIComponent(this.#action);
      this.#request.url = `api/${handler}/${action}`;
      return this.#httpClient.Send(this.#request, onResponse, onProgress);
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
      this.#httpClient = httpClient ?? new Leuce.HttpClient();
    }

    Get() {
      return this.#buildRequest().Get();
    }

    Post() {
      return this.#buildRequest().Post();
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

    Bind(name, selector) {
      this.#bindings[name] = $(selector);
      return this;
    }

    Get(name) {
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

    get Model() {
      return this.#model;
    }

    get View() {
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
