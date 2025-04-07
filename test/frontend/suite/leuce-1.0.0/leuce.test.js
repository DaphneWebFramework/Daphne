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
  QUnit.module('HttpRequest', function()
  {
    QUnit.test('Default state', function(assert) {
      const request = new Leuce.HttpRequest();
      assert.strictEqual(request.method, '');
      assert.strictEqual(request.url, '');
      assert.deepEqual(request.headers, {});
      assert.strictEqual(request.body, '');
      assert.strictEqual(request.isMultipart, false);
    });
  }); // HttpRequest

  QUnit.module('HttpResponse', function()
  {
    QUnit.test('FromJqXHR parses response correctly', function(assert) {
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
      const response = Leuce.HttpResponse.FromJqXHR(jqXHR);
      assert.strictEqual(response.statusCode, 200);
      assert.deepEqual(response.headers['content-length'], '728');
      assert.deepEqual(response.headers['content-type'], 'application/json');
      assert.strictEqual(response.body.length, 2);
      assert.strictEqual(response.body[0].ID, 1);
      assert.strictEqual(response.body[0].Name, "90'lar");
      assert.strictEqual(response.body[1].ID, 4);
      assert.strictEqual(response.body[1].Name, "Arabesk/Fantezi");
    });

    QUnit.test('FromJqXHR falls back to responseText', function(assert) {
      const jqXHR = {
        status: 0,
        getAllResponseHeaders: () => '',
        responseText: 'Hello, world!'
      };
      const response = Leuce.HttpResponse.FromJqXHR(jqXHR);
      assert.strictEqual(response.body, 'Hello, world!');
    });

    QUnit.test('IsSuccess returns correct result', function(assert) {
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
        const response = new Leuce.HttpResponse();
        response.statusCode = code;
        assert.strictEqual(response.IsSuccess(), expected);
      });
    });
  }); // HttpResponse

  QUnit.module('HttpClient', function(hooks)
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

    QUnit.test('Send calls callback with HttpResponse', function(assert) {
      assert.expect(3);
      const client = new Leuce.HttpClient();
      const request = new Leuce.HttpRequest();
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
      client.Send(request, (response) => {
        assert.ok(response instanceof Leuce.HttpResponse);
        assert.strictEqual(response.statusCode, 200);
        assert.strictEqual(response.body.message, 'hello');
      });
    });

    QUnit.test('Send resolves with HttpResponse when used as Promise', function(assert) {
      assert.expect(3);
      const done = assert.async();
      const client = new Leuce.HttpClient();
      const request = new Leuce.HttpRequest();
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
      client.Send(request).then(response => {
        assert.ok(response instanceof Leuce.HttpResponse);
        assert.strictEqual(response.statusCode, 200);
        assert.strictEqual(response.body.message, 'hello');
        done();
      });
    });

    QUnit.test('Send triggers onProgress callback', function(assert) {
      assert.expect(1);
      const done = assert.async();
      const client = new Leuce.HttpClient();
      const request = new Leuce.HttpRequest();
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
      client.Send(request, function(){}, function(percentage) {
        assert.strictEqual(percentage, 75);
        done();
      });
    });
  }); // HttpClient

  QUnit.module('HttpRequestBuilder', function()
  {
    QUnit.test('Builds GET request without a body', function(assert) {
      var capturedRequest = null;
      var fakeClient = {
        Send: function(request) {
          capturedRequest = request;
        }
      };
      var builder = new Leuce.HttpRequestBuilder(fakeClient);
      builder
        .Get()
        .Handler('genres')
        .Action('list')
        .Send();

      assert.strictEqual(capturedRequest.method, 'GET');
      assert.strictEqual(capturedRequest.url, 'api/genres/list');
      assert.strictEqual(capturedRequest.body, '');
    });

    QUnit.test('Builds POST request with raw body', function(assert) {
      var capturedRequest = null;
      var fakeClient = {
        Send: function(request) {
          capturedRequest = request;
        }
      };
      var builder = new Leuce.HttpRequestBuilder(fakeClient);
      builder
        .Post()
        .Handler('files')
        .Action('upload')
        .Body('raw-body-here')
        .Send();
      assert.strictEqual(capturedRequest.method, 'POST');
      assert.strictEqual(capturedRequest.url, 'api/files/upload');
      assert.strictEqual(capturedRequest.body, 'raw-body-here');
      assert.strictEqual(capturedRequest.isMultipart, false);
    });

    QUnit.test('Builds POST request with JSON body', function(assert) {
      var capturedRequest = null;
      var fakeClient = {
        Send: function(request) {
          capturedRequest = request;
        }
      };
      var builder = new Leuce.HttpRequestBuilder(fakeClient);
      builder
        .Post()
        .Handler('account')
        .Action('login')
        .JsonBody({ username: 'admin', password: '1234' })
        .Send();
      assert.strictEqual(capturedRequest.method, 'POST');
      assert.strictEqual(capturedRequest.url, 'api/account/login');
      assert.strictEqual(capturedRequest.headers['Content-Type'], 'application/json');
      assert.strictEqual(capturedRequest.body, JSON.stringify({ username: 'admin', password: '1234' }));
      assert.strictEqual(capturedRequest.isMultipart, false);
    });

    QUnit.test('Builds POST request with multipart body', function(assert) {
      var capturedRequest = null;
      var fakeClient = {
        Send: function(request) {
          capturedRequest = request;
        }
      };
      var formData = new FormData();
      formData.append('file', new Blob(['abc'], { type: 'text/plain' }));
      var builder = new Leuce.HttpRequestBuilder(fakeClient);
      builder
        .Post()
        .Handler('upload')
        .Action('file')
        .MultipartBody(formData)
        .Send();
      assert.strictEqual(capturedRequest.method, 'POST');
      assert.strictEqual(capturedRequest.url, 'api/upload/file');
      assert.strictEqual(capturedRequest.body, formData);
      assert.strictEqual(capturedRequest.isMultipart, true);
    });

    QUnit.test('Encodes handler and action in URL', function(assert) {
      var capturedRequest = null;
      var fakeClient = {
        Send: function(request) {
          capturedRequest = request;
        }
      };
      var builder = new Leuce.HttpRequestBuilder(fakeClient);
      builder
        .Post()
        .Handler("user login")
        .Action("reset/password")
        .Send();
      assert.strictEqual(capturedRequest.url, 'api/user%20login/reset%2Fpassword');
    });
  }); // HttpRequestBuilder

}); // Leuce
