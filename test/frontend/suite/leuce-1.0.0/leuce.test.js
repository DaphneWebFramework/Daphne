/**
 * leuce.test.js
 *
 * (C) 2025 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

QUnit.module('Leuce', function()
{
  QUnit.module('HTTP', function()
  {
    QUnit.module('Request', function()
    {
      QUnit.test('Default state', function(assert) {
        const request = new Leuce.HTTP.Request();
        assert.strictEqual(request.method, '');
        assert.strictEqual(request.url, '');
        assert.deepEqual(request.headers, {});
        assert.strictEqual(request.body, '');
        assert.strictEqual(request.isMultipart, false);
      });
    }); // Request

    QUnit.module('Response', function()
    {
      QUnit.test('fromJqXHR parses response correctly', function(assert) {
        const jqXHR = {
          status: 200,
          getAllResponseHeaders: () =>
            'content-length: 728\r\n' +
            'content-type: application/json\r\n',
          responseJSON: [
            { ID: 1, Name: "90'lar" },
            { ID: 4, Name: "Arabesk/Fantezi" },
          ]
        };
        const response = Leuce.HTTP.Response.fromJqXHR(jqXHR);
        assert.strictEqual(response.statusCode, 200);
        assert.deepEqual(response.headers['content-length'], '728');
        assert.deepEqual(response.headers['content-type'], 'application/json');
        assert.strictEqual(response.body.length, 2);
        assert.strictEqual(response.body[0].ID, 1);
        assert.strictEqual(response.body[0].Name, "90'lar");
        assert.strictEqual(response.body[1].ID, 4);
        assert.strictEqual(response.body[1].Name, "Arabesk/Fantezi");
      });

      QUnit.test('fromJqXHR falls back to responseText', function(assert) {
        const jqXHR = {
          status: 0,
          getAllResponseHeaders: () => '',
          responseText: 'Hello, world!'
        };
        const response = Leuce.HTTP.Response.fromJqXHR(jqXHR);
        assert.strictEqual(response.body, 'Hello, world!');
      });

      QUnit.test('isSuccess returns correct result', function(assert) {
        const testCases = [
          { code: 0, expected: false },
          { code: 199, expected: false },
          { code: 200, expected: true },
          { code: 201, expected: true },
          { code: 299, expected: true },
          { code: 300, expected: false },
          { code: 303, expected: false },
          { code: 304, expected: true },
          { code: 305, expected: false },
          { code: 404, expected: false },
          { code: 500, expected: false }
        ];
        testCases.forEach(({ code, expected }) => {
          const response = new Leuce.HTTP.Response();
          response.statusCode = code;
          assert.strictEqual(response.isSuccess(), expected);
        });
      });
    }); // Response

    QUnit.module('Client', function(hooks)
    {
      let originalAjax;
      let originalXhr;

      hooks.beforeEach(function() {
        originalAjax = $.ajax;
        originalXhr = $.ajaxSettings.xhr;
      });

      hooks.afterEach(function() {
        $.ajax = originalAjax;
        $.ajaxSettings.xhr = originalXhr;
      });

      QUnit.test('send calls callback with Response', function(assert) {
        assert.expect(3);
        const client = new Leuce.HTTP.Client();
        const request = new Leuce.HTTP.Request();
        request.method = 'GET';
        request.url = '/api/example';
        $.ajax = function(settings) {
          settings.complete({
            status: 200,
            getAllResponseHeaders: () => 'content-type: application/json\r\n',
            responseJSON: { message: 'hello' },
            responseText: '{"message":"hello"}'
          });
        };
        client.send(request, (response) => {
          assert.ok(response instanceof Leuce.HTTP.Response);
          assert.strictEqual(response.statusCode, 200);
          assert.strictEqual(response.body.message, 'hello');
        });
      });

      QUnit.test('send resolves with Response when used as Promise', function(assert) {
        assert.expect(3);
        const done = assert.async();
        const client = new Leuce.HTTP.Client();
        const request = new Leuce.HTTP.Request();
        request.method = 'GET';
        request.url = '/api/example';
        $.ajax = function(settings) {
          settings.complete({
            status: 200,
            getAllResponseHeaders: () => 'content-type: application/json\r\n',
            responseJSON: { message: 'hello' },
            responseText: '{"message":"hello"}'
          });
        };
        client.send(request).then(response => {
          assert.ok(response instanceof Leuce.HTTP.Response);
          assert.strictEqual(response.statusCode, 200);
          assert.strictEqual(response.body.message, 'hello');
          done();
        });
      });

      QUnit.test('send triggers onProgress callback', function(assert) {
        assert.expect(1);
        const done = assert.async();
        const client = new Leuce.HTTP.Client();
        const request = new Leuce.HTTP.Request();
        request.method = 'POST';
        request.url = '/upload';
        $.ajaxSettings.xhr = function() {
          return {
            upload: {
              addEventListener: function(event, callback) {
                if (event === 'progress') {
                  const fakeProgressEvent = {
                    lengthComputable: true,
                    loaded: 75,
                    total: 100
                  };
                  callback(fakeProgressEvent);
                }
              }
            }
          };
        };
        $.ajax = function(settings) {
          settings.xhr(); // simulate jQuery calling xhr()
        };
        client.send(request, function(){}, function(percentage) {
          assert.strictEqual(percentage, 75);
          done();
        });
      });
    }); // Client

    QUnit.module('RequestBuilder', function()
    {
      QUnit.test('Builds GET request without a body', function(assert) {
        var capturedRequest = null;
        var fakeClient = {
          send: function(request) {
            capturedRequest = request;
          }
        };
        var builder = new Leuce.HTTP.RequestBuilder(fakeClient);
        builder
          .get()
          .handler('genres')
          .action('list')
          .send();
        assert.strictEqual(capturedRequest.method, 'GET');
        assert.strictEqual(capturedRequest.url, 'api/genres/list');
        assert.strictEqual(capturedRequest.body, '');
      });

      QUnit.test('Builds POST request with raw body', function(assert) {
        var capturedRequest = null;
        var fakeClient = {
          send: function(request) {
            capturedRequest = request;
          }
        };
        var builder = new Leuce.HTTP.RequestBuilder(fakeClient);
        builder
          .post()
          .handler('files')
          .action('upload')
          .body('raw-body-here')
          .send();
        assert.strictEqual(capturedRequest.method, 'POST');
        assert.strictEqual(capturedRequest.url, 'api/files/upload');
        assert.strictEqual(capturedRequest.body, 'raw-body-here');
        assert.strictEqual(capturedRequest.isMultipart, false);
      });

      QUnit.test('Builds POST request with JSON body', function(assert) {
        var capturedRequest = null;
        var fakeClient = {
          send: function(request) {
            capturedRequest = request;
          }
        };
        var builder = new Leuce.HTTP.RequestBuilder(fakeClient);
        builder
          .post()
          .handler('account')
          .action('login')
          .jsonBody({ username: 'admin', password: '1234' })
          .send();
        assert.strictEqual(capturedRequest.method, 'POST');
        assert.strictEqual(capturedRequest.url, 'api/account/login');
        assert.strictEqual(capturedRequest.headers['Content-Type'], 'application/json');
        assert.strictEqual(capturedRequest.body, JSON.stringify({ username: 'admin', password: '1234' }));
        assert.strictEqual(capturedRequest.isMultipart, false);
      });

      QUnit.test('Builds POST request with multipart body', function(assert) {
        var capturedRequest = null;
        var fakeClient = {
          send: function(request) {
            capturedRequest = request;
          }
        };
        var formData = new FormData();
        formData.append('file', new Blob(['abc'], { type: 'text/plain' }));
        var builder = new Leuce.HTTP.RequestBuilder(fakeClient);
        builder
          .post()
          .handler('upload')
          .action('file')
          .multipartBody(formData)
          .send();
        assert.strictEqual(capturedRequest.method, 'POST');
        assert.strictEqual(capturedRequest.url, 'api/upload/file');
        assert.strictEqual(capturedRequest.body, formData);
        assert.strictEqual(capturedRequest.isMultipart, true);
      });

      QUnit.test('Encodes handler and action in URL', function(assert) {
        var capturedRequest = null;
        var fakeClient = {
          send: function(request) {
            capturedRequest = request;
          }
        };
        var builder = new Leuce.HTTP.RequestBuilder(fakeClient);
        builder
          .post()
          .handler("user login")
          .action("reset/password")
          .send();
        assert.strictEqual(capturedRequest.url, 'api/user%20login/reset%2Fpassword');
      });
    }); // RequestBuilder
  }); // HTTP

  QUnit.module('MVC', function()
  {
    QUnit.module('Model', function()
    {
      QUnit.test('get builds request', function(assert) {
        var capturedRequest = null;
        var fakeClient = {
          send: function(request) {
            capturedRequest = request;
          }
        };
        var model = new Leuce.MVC.Model(fakeClient);
        model.get().handler('songs').action('list').send();
        assert.strictEqual(capturedRequest.method, 'GET');
        assert.strictEqual(capturedRequest.url, 'api/songs/list');
      });

      QUnit.test('post builds request', function(assert) {
        var capturedRequest = null;
        var fakeClient = {
          send: function(request) {
            capturedRequest = request;
          }
        };
        var model = new Leuce.MVC.Model(fakeClient);
        model.post().handler('abc').action('def').send();
        assert.strictEqual(capturedRequest.method, 'POST');
        assert.strictEqual(capturedRequest.url, 'api/abc/def');
      });
    }); // Model

    QUnit.module('View', function()
    {
      QUnit.test('Can bind and retrieve single element', function(assert) {
        $('#qunit-fixture').html('<input id="username">');
        var view = new Leuce.MVC.View();
        view.bind('Username', '#username');
        var $username = view.get('Username');
        assert.ok($username instanceof jQuery);
        assert.strictEqual($username.attr('id'), 'username');
      });

      QUnit.test('Can bind and retrieve multiple elements', function(assert) {
        $('#qunit-fixture').html('<input id="email"><button id="submit"></button>');
        var view = new Leuce.MVC.View();
        view.bind('Email', '#email')
            .bind('Submit', '#submit');
        var $email = view.get('Email');
        var $submit = view.get('Submit');
        assert.strictEqual($email.attr('id'), 'email');
        assert.strictEqual($submit.prop('tagName'), 'BUTTON');
      });
    }); // View

    QUnit.module('Controller', function()
    {
      QUnit.test('Stores model and view', function(assert) {
        var fakeModel = {};
        var fakeView = {};
        var controller = new Leuce.MVC.Controller(fakeModel, fakeView);
        assert.strictEqual(controller.model, fakeModel);
        assert.strictEqual(controller.view, fakeView);
      });
    }); // Controller
  }); // MVC
}); // Leuce
