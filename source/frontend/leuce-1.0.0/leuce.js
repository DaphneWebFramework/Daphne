/**
 * Leuce: A HTTP and MVC micro-framework for Daphne
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
    method = '';
    url = '';
    headers = {};
    body = '';
    isMultipart = false;
  }

  class Response
  {
    statusCode = 0;
    headers = {};
    body = null;

    static fromJqXHR(jqXHR) {
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

    isSuccess() {
      return (this.statusCode >= 200 && this.statusCode < 300)
          || this.statusCode === 304;
    }
  }

  class Client
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
        callback(Response.fromJqXHR(jqXHR));
      };
      $.ajax(settings);
    }

    #sendWithPromise(settings) {
      return new Promise((resolve) => {
        settings.complete = (jqXHR) => {
          resolve(Response.fromJqXHR(jqXHR));
        };
        $.ajax(settings);
      });
    }
  }

  class RequestBuilder
  {
    #client = null;
    #request = null;
    #handler = '';
    #action = '';

    constructor(client) {
      this.#client = client;
      this.#request = new Request();
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
      return this.#client.send(this.#request, onResponse, onProgress);
    }
  }

  //#endregion HTTP

  //#region MVC

  class Model
  {
    #client = null;

    constructor(client) {
      this.#client = client ?? new Client();
    }

    get() {
      return this.#buildRequest().get();
    }

    post() {
      return this.#buildRequest().post();
    }

    #buildRequest() {
      return new RequestBuilder(this.#client);
    }
  }

  class View
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

  class Controller
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

  //#endregion MVC

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
})(window);
