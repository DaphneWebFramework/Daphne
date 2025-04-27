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
            QUnit.test('Default state', function(assert)
            {
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
            QUnit.test('fromJqXHR() parses response correctly', function(assert)
            {
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

            QUnit.test('fromJqXHR() falls back to responseText', function(assert)
            {
                const jqXHR = {
                    status: 0,
                    getAllResponseHeaders: () => '',
                    responseText: 'Hello, world!'
                };
                const response = Leuce.HTTP.Response.fromJqXHR(jqXHR);
                assert.strictEqual(response.body, 'Hello, world!');
            });

            QUnit.test('isSuccess() returns correct result', function(assert)
            {
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

            hooks.beforeEach(function()
            {
                originalAjax = $.ajax;
                originalXhr = $.ajaxSettings.xhr;
            });

            hooks.afterEach(function()
            {
                $.ajax = originalAjax;
                $.ajaxSettings.xhr = originalXhr;
            });

            QUnit.test('send() calls callback with Response', function(assert)
            {
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

            QUnit.test('send() resolves with Response when used as Promise', function(assert)
            {
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

            QUnit.test('send() triggers onProgress callback', function(assert)
            {
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
                    settings.xhr(); // simulate the AJAX call
                };
                client.send(request, function(){}, function(percentage) {
                    assert.strictEqual(percentage, 75);
                    done();
                });
            });
        }); // Client

        QUnit.module('RequestBuilder', function(hooks)
        {
            hooks.beforeEach(function()
            {
                leuceTestHelper_insertMeta('app:api-url', 'api/');
            });

            hooks.afterEach(function()
            {
                leuceTestHelper_removeMeta('app:api-url');
            });

            QUnit.test('Builds GET request without a body', function(assert)
            {
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

            QUnit.test('Builds POST request with raw body', function(assert)
            {
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

            QUnit.test('Builds POST request with JSON body', function(assert)
            {
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

            QUnit.test('Builds POST request with multipart body', function(assert)
            {
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

            QUnit.test('Encodes handler and action in URL', function(assert)
            {
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

    QUnit.module('MVC', function(hooks)
    {
        hooks.beforeEach(function()
        {
            leuceTestHelper_insertMeta('app:api-url', 'api');
        });

        hooks.afterEach(function()
        {
            leuceTestHelper_removeMeta('app:api-url');
        });

        QUnit.module('Model', function()
        {
            QUnit.test('get() builds request', function(assert)
            {
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

            QUnit.test('post() builds request', function(assert)
            {
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
            QUnit.test('Can set and retrieve single element', function(assert)
            {
                $('#qunit-fixture').html('<input id="username">');
                var view = new Leuce.MVC.View();
                view.set('Username', '#username');
                var $username = view.get('Username');
                assert.ok($username instanceof jQuery);
                assert.strictEqual($username.attr('id'), 'username');
            });

            QUnit.test('Can set and retrieve multiple elements', function(assert)
            {
                $('#qunit-fixture').html('<input id="email"><button id="submit"></button>');
                var view = new Leuce.MVC.View();
                view.set('Email', '#email')
                        .set('Submit', '#submit');
                var $email = view.get('Email');
                var $submit = view.get('Submit');
                assert.strictEqual($email.attr('id'), 'email');
                assert.strictEqual($submit.prop('tagName'), 'BUTTON');
            });

            QUnit.test('Returns null when selector does not match any elements', function(assert)
            {
                $('#qunit-fixture').html('');
                var view = new Leuce.MVC.View();
                view.set('nonExistent', '#nonExistent');
                var result = view.get('nonExistent');
                assert.strictEqual(result, null);
            });
        }); // View

        QUnit.module('Controller', function()
        {
            QUnit.test('Stores model and view', function(assert)
            {
                var fakeModel = {};
                var fakeView = {};
                var controller = new Leuce.MVC.Controller(fakeModel, fakeView);
                assert.strictEqual(controller.model, fakeModel);
                assert.strictEqual(controller.view, fakeView);
            });
        }); // Controller
    }); // MVC

    QUnit.module('UI', function()
    {
        QUnit.module('setButtonLoading', function()
        {
            const dataKey = name => `Leuce.UI.setButtonLoading.${name}`;

            QUnit.test('Activates loading state', function(assert)
            {
                $('#qunit-fixture').html('<button id="btn">Submit</button>');
                const $btn = $('#btn');
                const originalHtml = $btn.html();
                Leuce.UI.setButtonLoading($btn, true);
                assert.true($btn.data(dataKey('isLoading')));
                assert.strictEqual($btn.data(dataKey('htmlBackup')), originalHtml);
                assert.ok($btn.html().includes('spinner-border'));
                assert.strictEqual($btn.css('width'), $btn.css('width')); // width is set
                assert.true($btn.prop('disabled'));
                assert.strictEqual($btn.attr('aria-busy'), 'true');
            });

            QUnit.test('Restores original state', function(assert)
            {
                $('#qunit-fixture').html('<button id="btn">Submit</button>');
                const $btn = $('#btn');
                const originalHtml = $btn.html();
                Leuce.UI.setButtonLoading($btn, true);
                Leuce.UI.setButtonLoading($btn, false);
                assert.strictEqual($btn.html(), originalHtml);
                assert.false($btn.prop('disabled'));
                assert.strictEqual($btn[0].style.width, '');
                assert.notOk($btn.data(dataKey('isLoading')));
                assert.strictEqual($btn.attr('aria-busy'), undefined);
            });

            QUnit.test('Preserves inline width style', function(assert)
            {
                $('#qunit-fixture').html('<button id="btn" style="width: 250px">Submit</button>');
                const $btn = $('#btn');
                Leuce.UI.setButtonLoading($btn, true);
                Leuce.UI.setButtonLoading($btn, false);
                assert.strictEqual($btn[0].style.width, '250px');
            });

            QUnit.test('Does not enable a button that was originally disabled', function(assert)
            {
                $('#qunit-fixture').html('<button id="btn" disabled>Submit</button>');
                const $btn = $('#btn');
                Leuce.UI.setButtonLoading($btn, true);
                Leuce.UI.setButtonLoading($btn, false);
                assert.true($btn.prop('disabled')); // stays disabled
            });

            QUnit.test('Calling with the same state twice does nothing', function(assert)
            {
                $('#qunit-fixture').html('<button id="btn">Submit</button>');
                const $btn = $('#btn');
                Leuce.UI.setButtonLoading($btn, true);
                const htmlAfterFirst = $btn.html();
                Leuce.UI.setButtonLoading($btn, true); // Second call should not alter state
                const htmlAfterSecond = $btn.html();
                assert.strictEqual(htmlAfterFirst, htmlAfterSecond);
            });

            QUnit.test('Calling with false initially has no effect', function(assert)
            {
                $('#qunit-fixture').html('<button id="btn">Submit</button>');
                const $btn = $('#btn');
                const originalHtml = $btn.html();
                Leuce.UI.setButtonLoading($btn, false); // Should be a no-op
                assert.strictEqual($btn.html(), originalHtml);
                assert.strictEqual($btn.prop('disabled'), false);
                assert.strictEqual($btn.attr('aria-busy'), undefined);
            });

            QUnit.test('Skips unsupported elements', function(assert)
            {
                $('#qunit-fixture').html('<div id="not-a-button">Text</div>');
                const $div = $('#not-a-button');
                const originalHtml = $div.html();
                Leuce.UI.setButtonLoading($div, true);
                assert.strictEqual($div.html(), originalHtml);
                assert.strictEqual($div.data(dataKey('isLoading')), undefined);
            });

            QUnit.test('Cleans up all data attributes', function(assert)
            {
                $('#qunit-fixture').html('<button id="btn">Submit</button>');
                const $btn = $('#btn');
                Leuce.UI.setButtonLoading($btn, true);
                Leuce.UI.setButtonLoading($btn, false);
                assert.strictEqual(Object.keys($btn.data()).filter(k =>
                    k.startsWith('Leuce.UI.setButtonLoading.')).length, 0);
            });
        }); // setButtonLoading
    }); // UI

    QUnit.module('Utility', function()
    {
        QUnit.module('metaContent', function()
        {
            QUnit.test('Returns correct value from meta tag', function(assert)
            {
                const metaName = 'app:api-url';
                const metaContent = 'https://example.com/api/';
                leuceTestHelper_insertMeta(metaName, metaContent);
                assert.strictEqual(Leuce.Utility.metaContent(metaName), metaContent);
                leuceTestHelper_removeMeta(metaName);
            });

            QUnit.test('Returns null if meta tag not found', function(assert)
            {
                leuceTestHelper_removeMeta('app:api-url'); // Ensure it does not exist
                assert.strictEqual(Leuce.Utility.metaContent('app:api-url'), null);
            });
        }); // metaContent

        QUnit.module('queryParameter', function()
        {
            const testSearch = '?foo=bar&baz=qux&empty=&encoded=hello%20world';

            QUnit.test('Returns null for non-existent parameter', function(assert)
            {
                assert.strictEqual(Leuce.Utility.queryParameter('missing', testSearch), null);
            });

            QUnit.test('Returns correct value for existing parameter', function(assert)
            {
                assert.strictEqual(Leuce.Utility.queryParameter('foo', testSearch), 'bar');
                assert.strictEqual(Leuce.Utility.queryParameter('baz', testSearch), 'qux');
            });

            QUnit.test('Returns empty string for parameter with no value', function(assert)
            {
                assert.strictEqual(Leuce.Utility.queryParameter('empty', testSearch), '');
            });

            QUnit.test('Decodes URL-encoded values', function(assert)
            {
                assert.strictEqual(Leuce.Utility.queryParameter('encoded', testSearch), 'hello world');
            });
        }); // queryParameter
    }); // Utility
}); // Leuce

//#region Test Helpers

function leuceTestHelper_insertMeta(name, value)
{
    const meta = document.createElement('meta');
    meta.setAttribute('name', name);
    meta.setAttribute('content', value);
    document.head.appendChild(meta);
}

function leuceTestHelper_removeMeta(name)
{
    const meta = document.querySelector(`meta[name="${name}"]`);
    if (meta !== null) {
        document.head.removeChild(meta);
    }
}

//#endregion Test Helpers
