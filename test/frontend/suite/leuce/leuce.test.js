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

            QUnit.test('Appends query parameters to URL', function(assert)
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
                    .handler('search')
                    .action('song')
                    .query({ title: 'test', page: 2 })
                    .send();
                assert.strictEqual(capturedRequest.url, 'api/search/song?title=test&page=2');
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
            QUnit.test('set() stores and returns jQuery for single-matching selector',
            function(assert) {
                $('#qunit-fixture').html('<input id="username">');
                var view = new Leuce.MVC.View();
                var $stored = view.set('Username', '#username');
                assert.ok($stored instanceof jQuery);
                assert.strictEqual($stored.attr('id'), 'username');
            });

            QUnit.test('set() stores and returns jQuery for multiple-matching selector',
            function(assert) {
                $('#qunit-fixture').html('<input class="username"><input class="username">');
                var view = new Leuce.MVC.View();
                var $stored = view.set('Username', '.username');
                assert.ok($stored instanceof jQuery);
                assert.strictEqual($stored.length, 2);
                assert.strictEqual($stored[0].className, 'username');
                assert.strictEqual($stored[1].className, 'username');
            });

            QUnit.test('set() rejects and returns null for non-matching selector',
            function(assert) {
                var view = new Leuce.MVC.View();
                assert.strictEqual(view.set('NonExistent', '#nonexistent'), null);
            });

            QUnit.test('set() stores and returns non-empty jQuery instance',
            function(assert) {
                $('#qunit-fixture').html('<input id="username">');
                var view = new Leuce.MVC.View();
                var $el = $('#username');
                var $stored = view.set('Username', $el);
                assert.strictEqual($stored, $el);
            });

            QUnit.test('set() rejects and returns null for empty jQuery instance',
            function(assert) {
                var view = new Leuce.MVC.View();
                var $el = $('#nonexistent');
                assert.strictEqual(view.set('NonExistent', $el), null);
            });

            QUnit.test('set() stores and returns plain object',
            function(assert) {
                var view = new Leuce.MVC.View();
                var obj = { foo: 'bar' };
                var stored = view.set('Obj', obj);
                assert.strictEqual(stored, obj);
            });

            QUnit.test('set() rejects and returns null for unsupported types',
            function(assert) {
                var view = new Leuce.MVC.View();
                assert.strictEqual(view.set('fn', function() {}), null);
                assert.strictEqual(view.set('number', 42), null);
                assert.strictEqual(view.set('null', null), null);
                assert.strictEqual(view.set('bool', true), null);
            });

            QUnit.test('has() returns true for stored element',
            function(assert) {
                $('#qunit-fixture').html('<input id="username">');
                var view = new Leuce.MVC.View();
                view.set('Username', '#username');
                assert.ok(view.has('Username'));
            });

            QUnit.test('has() returns false for non-existent element',
            function(assert) {
                var view = new Leuce.MVC.View();
                view.set('NonExistent', '#nonexistent');
                assert.notOk(view.has('NonExistent'));
            });

            QUnit.test('has() returns false for empty jQuery instance',
            function(assert) {
                var view = new Leuce.MVC.View();
                var $el = $('#nonexistent');
                view.set('NonExistent', $el);
                assert.notOk(view.has('NonExistent'));
            });

            QUnit.test('get() returns jQuery for stored element',
            function(assert) {
                $('#qunit-fixture').html('<input id="username">');
                var view = new Leuce.MVC.View();
                view.set('Username', '#username');
                var $got = view.get('Username');
                assert.ok($got instanceof jQuery);
                assert.strictEqual($got.attr('id'), 'username');
            });

            QUnit.test('get() returns plain object for stored object',
            function(assert) {
                var view = new Leuce.MVC.View();
                var obj = { foo: 'bar' };
                view.set('Obj', obj);
                var got = view.get('Obj');
                assert.strictEqual(typeof got, 'object');
                assert.strictEqual(got, obj);
            });

            QUnit.test('get() returns null for non-existent element',
            function(assert) {
                var view = new Leuce.MVC.View();
                view.set('NonExistent', '#nonexistent');
                var $result = view.get('NonExistent');
                assert.strictEqual($result, null);
            });

            QUnit.test('get() returns null for empty jQuery instance',
            function(assert) {
                var view = new Leuce.MVC.View();
                var $el = $('#nonexistent');
                view.set('NonExistent', $el);
                assert.strictEqual(view.get('NonExistent'), null);
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
        QUnit.module('translate', function(hooks)
        {
            let originalLanguage;

            hooks.beforeEach(function() {
                originalLanguage = document.documentElement.lang;
            });

            hooks.afterEach(function() {
                document.documentElement.lang = originalLanguage;
            });

            QUnit.test('Returns translation based on current language',
            function(assert) {
                document.documentElement.lang = 'en';
                assert.strictEqual(
                    Leuce.UI.translate('no_matching_records_found'),
                    'No matching records found'
                );

                document.documentElement.lang = 'tr';
                assert.strictEqual(
                    Leuce.UI.translate('no_matching_records_found'),
                    'Eşleşen kayıt bulunamadı'
                );
            });

            QUnit.test('Returns key if translation unit is missing',
            function(assert) {
                assert.strictEqual(
                    Leuce.UI.translate('nonexistent.key'),
                    'nonexistent.key'
                );
            });

            QUnit.test('Returns key if language is not available in unit',
            function(assert) {
                document.documentElement.lang = 'eo'; // Esperanto (unsupported)
                assert.strictEqual(
                    Leuce.UI.translate('no_matching_records_found'),
                    'no_matching_records_found'
                );
            });

            QUnit.test('Replaces placeholder with argument',
            function(assert) {
                document.documentElement.lang = 'en';
                assert.strictEqual(
                    Leuce.UI.translate('show_*_per_page', 25),
                    'Show 25 per page'
                );
            });

            QUnit.test('Replaces placeholder with empty string if no argument provided',
            function(assert) {
                document.documentElement.lang = 'en';
                assert.strictEqual(
                    Leuce.UI.translate('show_*_per_page'),
                    'Show  per page'
                );
            });
        }); // translate

        QUnit.module('notify', function(hooks)
        {
            hooks.beforeEach(function()
            {
                $('#leuce-notifications').remove();
            });

            QUnit.test('Creates container if not present', function(assert)
            {
                Leuce.UI.notify('Test message');
                assert.strictEqual($('#leuce-notifications').length, 1);
            });

            QUnit.test('Appends notification with correct message and type', function(assert)
            {
                Leuce.UI.notify('Hello world', 'info');
                const $item = $('#leuce-notifications').children().first();
                assert.true($item.hasClass('alert-info'));
                assert.ok($item.html().includes('Hello world'));
            });

            QUnit.test('Appends close button', function(assert)
            {
                Leuce.UI.notify('Close test');
                const $btn = $('#leuce-notifications').find('button.btn-close');
                assert.strictEqual($btn.length, 1);
                assert.strictEqual($btn.attr('data-bs-dismiss'), 'alert');
            });

            QUnit.test('Does not auto-close if timeout is zero', function(assert)
            {
                const done = assert.async();
                Leuce.UI.notify('Persistent', 'warning', 0);
                const $item = $('#leuce-notifications').children().first();
                setTimeout(function() {
                    assert.ok($item.is(':visible')); // Still visible after timeout
                    done();
                }, 500);
            });

            QUnit.test('Auto-closes after timeout', function(assert)
            {
                const done = assert.async();
                Leuce.UI.notify('Timed', 'primary', 300);
                const $item = $('#leuce-notifications').children().first();
                $item.on('closed.bs.alert', function() {
                    assert.ok(true); // Closed via Bootstrap event
                    done();
                });
            });

            QUnit.test('Stacks multiple notifications', function(assert)
            {
                Leuce.UI.notify('One');
                Leuce.UI.notify('Two');
                Leuce.UI.notify('Three');
                const $items = $('#leuce-notifications').children();
                assert.strictEqual($items.length, 3);
                assert.ok($items.eq(0).html().includes('Three')); // Newest is on top
                assert.ok($items.eq(2).html().includes('One')); // Oldest is at bottom
            });
        }); // notify

        QUnit.module('notifySuccess', function()
        {
            QUnit.test('Uses success class', function(assert)
            {
                $('#leuce-notifications').remove();
                Leuce.UI.notifySuccess('Success message');
                const $item = $('#leuce-notifications').children().first();
                assert.true($item.hasClass('alert-success'));
            });
        }); // notifySuccess

        QUnit.module('notifyError', function()
        {
            QUnit.test('Uses danger class', function(assert)
            {
                $('#leuce-notifications').remove();
                Leuce.UI.notifyError('Error message');
                const $item = $('#leuce-notifications').children().first();
                assert.true($item.hasClass('alert-danger'));
            });
        }); // notifyError

        QUnit.module('Button', function()
        {
            QUnit.test('Throws error on unsupported elements', function(assert) {
                $('#qunit-fixture').html('<div id="not-a-button">Text</div>');
                const $div = $('#not-a-button');
                assert.throws(
                    () => new Leuce.UI.Button($div),
                    'Leuce: Only button elements are supported.'
                );
            });

            QUnit.test('setLoading(true) applies loading state', function(assert) {
                $('#qunit-fixture').html('<button id="btn">Submit</button>');
                const btn = $('#btn').leuceButton();
                const originalHtml = $('#btn').html();
                btn.setLoading(true);
                const $btn = $('#btn');
                assert.true(btn.isLoading());
                assert.notEqual($btn.html(), originalHtml);
                assert.ok($btn.html().includes('spinner-border'));
                assert.strictEqual($btn.css('width'), $btn.css('width'));
                assert.true($btn.prop('disabled'));
                assert.strictEqual($btn.attr('aria-busy'), 'true');
            });

            QUnit.test('setLoading(false) restores original state', function(assert) {
                $('#qunit-fixture').html('<button id="btn">Submit</button>');
                const btn = $('#btn').leuceButton();
                const $btn = $('#btn');
                const originalHtml = $btn.html();
                btn.setLoading(true);
                btn.setLoading(false);
                assert.strictEqual($btn.html(), originalHtml);
                assert.false($btn.prop('disabled'));
                assert.strictEqual($btn[0].style.width, '');
                assert.false(btn.isLoading());
                assert.strictEqual($btn.attr('aria-busy'), undefined);
            });

            QUnit.test('setLoading preserves inline width style', function(assert) {
                $('#qunit-fixture').html('<button id="btn" style="width: 250px">Submit</button>');
                const btn = $('#btn').leuceButton();
                btn.setLoading(true);
                btn.setLoading(false);
                assert.strictEqual($('#btn')[0].style.width, '250px');
            });

            QUnit.test('setLoading does not re-enable originally disabled buttons', function(assert) {
                $('#qunit-fixture').html('<button id="btn" disabled>Submit</button>');
                const btn = $('#btn').leuceButton();
                btn.setLoading(true);
                btn.setLoading(false);
                assert.true($('#btn').prop('disabled'));
            });

            QUnit.test('setLoading is idempotent on repeated calls', function(assert) {
                $('#qunit-fixture').html('<button id="btn">Submit</button>');
                const btn = $('#btn').leuceButton();
                btn.setLoading(true);
                const htmlAfterFirst = $('#btn').html();
                btn.setLoading(true);
                const htmlAfterSecond = $('#btn').html();
                assert.strictEqual(htmlAfterFirst, htmlAfterSecond);
            });

            QUnit.test('setLoading(false) initially is a no-op', function(assert) {
                $('#qunit-fixture').html('<button id="btn">Submit</button>');
                const btn = $('#btn').leuceButton();
                const originalHtml = $('#btn').html();
                btn.setLoading(false);
                assert.strictEqual($('#btn').html(), originalHtml);
                assert.strictEqual($('#btn').prop('disabled'), false);
                assert.strictEqual($('#btn').attr('aria-busy'), undefined);
            });
        }); // Button

        QUnit.module('Table', function(hooks)
        {
            let warnMessages;
            let originalWarn;
            let originalLanguage;

            hooks.beforeEach(function() {
                warnMessages = [];
                originalWarn = console.warn;
                console.warn = msg => warnMessages.push(msg);
                originalLanguage = document.documentElement.lang;
            });

            hooks.afterEach(function() {
                console.warn = originalWarn;
                document.documentElement.lang = originalLanguage;
            });

            QUnit.test('Throws error on unsupported elements',
            function(assert) {
                $('#qunit-fixture').html('<div id="not-a-table"></div>');
                const $div = $('#not-a-table');
                assert.throws(
                    () => new Leuce.UI.Table($div),
                    'Leuce: Only table elements are supported.'
                );
            });

            QUnit.test('Throws error if table header is missing',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <tbody><tr><td>Row</td></tr></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                assert.throws(
                    () => new Leuce.UI.Table($tbl),
                    'Leuce: Table requires a `thead` element.'
                );
            });

            QUnit.test('Creates table body if missing',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead><tr><th>Col</th></tr></thead>
                    </table>
                `);
                const $tbl = $('#tbl');
                const table = new Leuce.UI.Table($tbl);
                assert.strictEqual($tbl.find('tbody').length, 1);
            });

            QUnit.test('Initializes table instance',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead><tr><th>Col</th></tr></thead>
                        <tbody><tr><td>Row</td></tr></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                const tbl = $tbl.leuceTable();
                assert.ok(tbl instanceof Leuce.UI.Table);
            });

            QUnit.test('Decorates sortable headers when data-key is present',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead>
                            <tr>
                                <th data-key="name">Name</th>
                                <th>Not sortable</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                $tbl.leuceTable();
                const $th = $tbl.find('th[data-key]');
                assert.ok($th.hasClass('leuce-table-header-sortable'));
                const $span = $th.children('span');
                assert.strictEqual($span.length, 1);
                assert.strictEqual($span.contents().first().text(), 'Name');
                const $icon = $span.find('i.bi.bi-chevron-expand');
                assert.strictEqual($icon.length, 1);
            });

            QUnit.test('Does not decorate sortable headers when thead has data-nosort',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead data-nosort>
                            <tr>
                                <th data-key="name">Name</th>
                                <th data-key="email">Email</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                $tbl.leuceTable();
                const $sortableHeaders = $tbl.find('th.leuce-table-header-sortable');
                assert.strictEqual($sortableHeaders.length, 0);
            });

            QUnit.test('Does not decorate header when th has data-nosort',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead>
                            <tr>
                                <th data-key="name">Name</th>
                                <th data-key="email" data-nosort>Email</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                $tbl.leuceTable();
                const $ths = $tbl.find('th');
                assert.ok($ths.eq(0).hasClass('leuce-table-header-sortable'));
                assert.notOk($ths.eq(1).hasClass('leuce-table-header-sortable'));
            });

            QUnit.test('Responds to header click when th is sortable',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead>
                            <tr>
                                <th data-key="name">Name</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                $tbl.leuceTable();
                const $icon = $tbl.find('th[data-key="name"] i');
                const initialClass = $icon.attr('class');
                $tbl.find('th[data-key="name"]').trigger('click');
                const finalClass = $icon.attr('class');
                assert.notStrictEqual(finalClass, initialClass);
            });

            QUnit.test('Does not respond to header click when th has data-nosort',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead>
                            <tr>
                                <th data-key="name" data-nosort>Name</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                $tbl.leuceTable();
                const $icon = $tbl.find('th[data-key="name"] i');
                const initialClass = $icon.attr('class');
                $tbl.find('th[data-key="name"]').trigger('click');
                const finalClass = $icon.attr('class');
                assert.strictEqual(finalClass, initialClass);
            });

            QUnit.test('Cycles sort icon class on repeated header clicks',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead>
                            <tr>
                                <th data-key="name">Name</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                $tbl.leuceTable();
                const $icon = $tbl.find('th[data-key="name"] i');
                const class1 = $icon.attr('class');
                $tbl.find('th[data-key="name"]').trigger('click');
                const class2 = $icon.attr('class');
                $tbl.find('th[data-key="name"]').trigger('click');
                const class3 = $icon.attr('class');
                $tbl.find('th[data-key="name"]').trigger('click');
                const class4 = $icon.attr('class');
                assert.strictEqual(class1, 'bi bi-chevron-expand');
                assert.strictEqual(class2, 'bi bi-chevron-down');
                assert.strictEqual(class3, 'bi bi-chevron-up');
                assert.strictEqual(class4, 'bi bi-chevron-expand');
            });

            QUnit.test('Stores entire row in row data',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead>
                            <tr data-primary-key="id">
                                <th data-key="name"></th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                const tbl = $tbl.leuceTable();
                tbl.setData([{ id: 123, name: 'Alice' }]);
                const $row = $tbl.find('tbody tr').first();
                assert.deepEqual($row.data('row'), { id: 123, name: 'Alice' });
            });

            QUnit.test('Warns when pk type attribute is missing and pk is not in columns',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead>
                            <tr data-primary-key="id">
                                <th data-key="name"></th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                const tbl = $tbl.leuceTable();
                tbl.setData([{ id: 1, name: 'Alice' }]);
                assert.strictEqual(warnMessages.length, 1);
                assert.strictEqual(
                    warnMessages[0],
                    'Leuce: No `data-primary-key-type` specified for primary key "id"; defaulting to "integer".'
                );
            });

            QUnit.test('Does not warn when pk type attribute is missing and pk is in columns',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead>
                            <tr data-primary-key="id">
                                <th data-key="id"></th>
                                <th data-key="name"></th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                const tbl = $tbl.leuceTable();
                tbl.setData([{ id: 1, name: 'Alice' }]);
                assert.strictEqual(warnMessages.length, 0);
            });

            QUnit.test('Warns when primary key is missing in row data',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead>
                            <tr data-primary-key="id" data-primary-key-type="integer">
                                <th data-key="name"></th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                const tbl = $tbl.leuceTable();
                tbl.setData([{ name: 'Alice' }]); // intentionally missing "id"
                assert.strictEqual(warnMessages.length, 1);
                assert.strictEqual(
                    warnMessages[0],
                    'Leuce: Primary key "id" not found in row data.'
                );
            });

            QUnit.test('Renders row without id field',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead>
                            <tr>
                                <th data-key="name"></th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                const tbl = $tbl.leuceTable();
                tbl.setData([{ name: 'Bob' }]);
                const $row = $tbl.find('tbody tr').first();
                assert.ok($row.length === 1);
                assert.strictEqual($row.data('id'), undefined);
            });

            QUnit.test('Renders one row per data item',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead>
                            <tr>
                                <th data-key="name"></th>
                                <th data-key="age"></th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                const tbl = $tbl.leuceTable();
                const data = [
                    { id: 1, name: 'Alice', age: 30 },
                    { id: 2, name: 'Bob', age: 25 },
                    { id: 3, name: 'Charlie', age: 40 }
                ];
                tbl.setData(data);
                const $rows = $tbl.find('tbody tr');
                assert.strictEqual($rows.length, 3);
            });

            QUnit.test('Renders bound fields in correct cells',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead>
                            <tr>
                                <th data-key="name"></th>
                                <th data-key="age"></th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                const tbl = $tbl.leuceTable();
                const data = [
                    { id: 1, name: 'Alice', age: 30 }
                ];
                tbl.setData(data);
                const $cells = $tbl.find('tbody tr').first().children('td');
                assert.strictEqual($cells.eq(0).text(), 'Alice');
                assert.strictEqual($cells.eq(1).text(), '30');
            });

            QUnit.test('Renders empty cell for unbound column',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead>
                            <tr>
                                <th>Unbound</th>
                                <th data-key="name"></th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                const tbl = $tbl.leuceTable();
                tbl.setData([{ id: 1, name: 'Alice' }]);
                const $cells = $tbl.find('tbody tr').first().children('td');
                assert.strictEqual($cells.eq(0).text(), '');
                assert.strictEqual($cells.eq(1).text(), 'Alice');
            });

            QUnit.test('Renders correctly with mixed column order',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead>
                            <tr>
                                <th>Unbound 1</th>
                                <th data-key="age"></th>
                                <th>Unbound 2</th>
                                <th data-key="name"></th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                const tbl = $tbl.leuceTable();
                tbl.setData([{ id: 1, name: 'Alice', age: 30 }]);
                const $cells = $tbl.find('tbody tr').first().children('td');
                assert.strictEqual($cells.length, 4);
                assert.strictEqual($cells.eq(0).text(), '');
                assert.strictEqual($cells.eq(1).text(), '30');
                assert.strictEqual($cells.eq(2).text(), '');
                assert.strictEqual($cells.eq(3).text(), 'Alice');
            });

            QUnit.test('Parses and applies various formats',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead>
                            <tr>
                                <th data-key="a" data-formatter="plain"></th>
                                <th data-key="b" data-formatter="plain:"></th>
                                <th data-key="c" data-formatter="  plain  "></th>
                                <th data-key="d" data-formatter="plain:42"></th>
                                <th data-key="e" data-formatter="plain :42"></th>
                                <th data-key="f" data-formatter="plain: 42"></th>
                                <th data-key="g" data-formatter="plain :  42  "></th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const calls = [];
                const $tbl = $('#tbl');
                const tbl = $tbl.leuceTable();
                tbl.setFormatter('plain', (row, val, arg) => {
                    calls.push({ val, arg });
                    if (arg === undefined) {
                        return `PLAIN:${val}`;
                    } else {
                        return `PLAIN(${arg}):${val}`;
                    }
                });
                tbl.setData([{a: 'A', b: 'B', c: 'C', d: 'D', e: 'E', f: 'F', g: 'G'}]);
                const expectedFormat = [
                    { val: 'A', arg: undefined },
                    { val: 'B', arg: undefined },
                    { val: 'C', arg: undefined },
                    { val: 'D', arg: '42' },
                    { val: 'E', arg: '42' },
                    { val: 'F', arg: '42' },
                    { val: 'G', arg: '42' }
                ];
                assert.strictEqual(calls.length, expectedFormat.length);
                calls.forEach((entry, i) => {
                    assert.strictEqual(entry.val, expectedFormat[i].val);
                    assert.strictEqual(entry.arg, expectedFormat[i].arg);
                });
                const $cells = $tbl.find('tbody tr').first().children('td');
                const expectedText = [
                    'PLAIN:A',
                    'PLAIN:B',
                    'PLAIN:C',
                    'PLAIN(42):D',
                    'PLAIN(42):E',
                    'PLAIN(42):F',
                    'PLAIN(42):G'
                ];
                expectedText.forEach((text, i) => {
                    assert.strictEqual($cells.eq(i).text(), text);
                });
            });

            QUnit.test('Warns when column format is non-string',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead>
                            <tr>
                                <th data-key="a" data-formatter="true"></th>
                                <th data-key="b" data-formatter="false"></th>
                                <th data-key="c" data-formatter="123"></th>
                                <th data-key="d" data-formatter="null"></th>
                                <th data-key="e" data-formatter="{}"></th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                const tbl = $tbl.leuceTable();
                tbl.setData([{ a: 'A', b: 'B', c: 'C', d: 'D', e: 'E' }]);
                assert.strictEqual(warnMessages.length, 5);
                warnMessages.forEach(msg => {
                    assert.strictEqual(msg,
                        "Leuce: Attribute `data-formatter` must be a string.");
                });
                const $cells = $tbl.find('tbody tr').first().children('td');
                const expected = ['A', 'B', 'C', 'D', 'E'];
                expected.forEach((val, i) => {
                    assert.strictEqual($cells.eq(i).text(), val);
                });
            });

            QUnit.test('Warns when column format is empty or whitespace',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead>
                            <tr>
                                <th data-key="a" data-formatter=""></th>
                                <th data-key="b" data-formatter="  "></th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                const tbl = $tbl.leuceTable();
                tbl.setData([{ a: 'A', b: 'B' }]);
                assert.strictEqual(warnMessages.length, 2);
                warnMessages.forEach(msg => {
                    assert.strictEqual(msg,
                        "Leuce: Attribute `data-formatter` must be a nonempty string.");
                });
                const $cells = $tbl.find('tbody tr').first().children('td');
                const expected = ['A', 'B'];
                expected.forEach((val, i) => {
                    assert.strictEqual($cells.eq(i).text(), val);
                });
            });

            QUnit.test('Warns when column format has no name',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead>
                            <tr>
                                <th data-key="a" data-formatter=":"></th>
                                <th data-key="b" data-formatter="  :  "></th>
                                <th data-key="c" data-formatter=":arg"></th>
                                <th data-key="d" data-formatter="  :arg  "></th>
                                <th data-key="e" data-formatter="  :  arg  "></th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                const tbl = $tbl.leuceTable();
                tbl.setData([{ a: 'A', b: 'B', c: 'C', d: 'D', e: 'E' }]);
                assert.strictEqual(warnMessages.length, 5);
                warnMessages.forEach(msg => {
                    assert.strictEqual(msg,
                        "Leuce: Attribute `data-formatter` must have a nonempty name.");
                });
                const $cells = $tbl.find('tbody tr').first().children('td');
                const expected = ['A', 'B', 'C', 'D', 'E'];
                expected.forEach((val, i) => {
                    assert.strictEqual($cells.eq(i).text(), val);
                });
            });

            QUnit.test('Warns when formatter is missing',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead>
                            <tr>
                                <th data-key="value" data-formatter="missing"></th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                const tbl = $tbl.leuceTable();
                tbl.setData([{ value: 'Raw text' }]);
                assert.strictEqual(warnMessages.length, 1);
                assert.strictEqual(
                    warnMessages[0],
                    'Leuce: No formatter found for "missing".'
                );
                const cellText = $tbl.find('tbody td').first().text();
                assert.strictEqual(cellText, 'Raw text');
            });

            QUnit.test('Warns when column key is non-string',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead>
                            <tr>
                                <th data-key="null"></th>
                                <th data-key="42"></th>
                                <th data-key="true"></th>
                                <th data-key="{}"></th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                const tbl = $tbl.leuceTable();
                tbl.setData([{ null: 'A', 42: 'B', true: 'C', '{}': 'D' }]);
                assert.strictEqual(warnMessages.length, 4);
                warnMessages.forEach(msg => {
                    assert.strictEqual(msg,
                        "Leuce: Attribute `data-key` must be a string.");
                });
                const $cells = $tbl.find('tbody tr').first().children('td');
                $cells.each((i, cell) => {
                    assert.strictEqual($(cell).text(), '');
                });
            });

            QUnit.test('Warns when column key is empty or whitespace',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead>
                            <tr>
                                <th data-key=""></th>
                                <th data-key="  "></th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                const tbl = $tbl.leuceTable();
                tbl.setData([{ '': 'X', '  ': 'Y' }]);
                assert.strictEqual(warnMessages.length, 2);
                warnMessages.forEach(msg => {
                    assert.strictEqual(msg,
                        "Leuce: Attribute `data-key` must be a nonempty string.");
                });
                const $cells = $tbl.find('tbody tr').first().children('td');
                $cells.each((i, cell) => {
                    assert.strictEqual($(cell).text(), '');
                });
            });

            QUnit.test('Warns when key is missing in row data',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead>
                            <tr>
                                <th data-key="age"></th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                const tbl = $tbl.leuceTable();
                tbl.setData([{ name: 'Alice' }]);
                assert.strictEqual(warnMessages.length, 1);
                assert.strictEqual(
                    warnMessages[0],
                    'Leuce: Key "age" not found in row data.'
                );
            });

            QUnit.test('Column renderer outputs correctly',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead>
                            <tr>
                                <th data-renderer="textOnly"></th>
                                <th data-renderer="buttonGroup"></th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                const tbl = $tbl.leuceTable();
                tbl.setRenderer('textOnly', row => {
                    return 'Plain text';
                }).setRenderer('buttonGroup', row => {
                    return $('<div class="btn-group">')
                        .append('<button>Edit</button>');
                });
                tbl.setData([{ id: 1 }]);
                const $cells = $tbl.find('tbody tr').first().children('td');
                assert.strictEqual($cells.eq(0).text(), 'Plain text');
                assert.strictEqual($cells.eq(1).find('button').text(), 'Edit');
            });

            QUnit.test('Skips column renderer if column key is present',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead>
                            <tr>
                                <th data-key="name" data-renderer="ignoredRenderer"></th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                const tbl = $tbl.leuceTable();
                tbl.setRenderer('ignoredRenderer', row => {
                    return 'Should not render';
                });
                tbl.setData([{ name: 'Alice' }]);
                assert.strictEqual($tbl.find('tbody td').first().text(), 'Alice');
            });

            QUnit.test('Warns when renderer is missing',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead>
                            <tr>
                                <th data-renderer="missing"></th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                const tbl = $tbl.leuceTable();
                tbl.setData([{ id: 1 }]);
                assert.strictEqual(warnMessages.length, 1);
                assert.strictEqual(
                    warnMessages[0],
                    'Leuce: No renderer found for "missing".'
                );
            });

            QUnit.test('Displays no-data message in selected language',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead>
                            <tr>
                                <th data-key="name"></th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                const cases = {
                    en: 'No matching records found',
                    tr: 'Eşleşen kayıt bulunamadı'
                };
                for (const [language, message] of Object.entries(cases)) {
                    document.documentElement.lang = language;
                    $tbl.leuceTable().setData([]);
                    const $cell = $tbl.find('tbody td').first();
                    assert.strictEqual($cell.text(), message);
                }
            });

            QUnit.test('Renders inline actions column when primary key is present',
            function(assert) {
                $('#qunit-fixture').html(`
                    <table id="tbl">
                        <thead>
                            <tr data-primary-key="uuid">
                                <th data-key="name"></th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `);
                const $tbl = $('#tbl');
                const tbl = $tbl.leuceTable();
                tbl.setData([{ uuid: '1234', name: 'Alice' }]);
                assert.strictEqual($tbl.find('thead th').length, 2);
                const $td = $tbl.find('tbody td').last();
                assert.strictEqual($td.find('[data-action="edit"]').length, 1);
                assert.strictEqual($td.find('[data-action="delete"]').length, 1);
            });
        }); // Table
    }); // UI

    QUnit.module('Utility', function()
    {
        QUnit.module('isSameOrigin', function()
        {
            QUnit.test('Returns true for absolute same-origin URL',
            function(assert) {
                const uri = window.location.origin + '/some/path';
                assert.strictEqual(Leuce.Utility.isSameOrigin(uri), true);
            });

            QUnit.test('Returns true for relative URL',
            function(assert) {
                const uri = '/relative/path';
                assert.strictEqual(Leuce.Utility.isSameOrigin(uri), true);
            });

            QUnit.test('Returns false for different hostname',
            function(assert) {
                const uri = 'https://evil.com/';
                assert.strictEqual(Leuce.Utility.isSameOrigin(uri), false);
            });

            QUnit.test('Returns false for different port',
            function(assert) {
                const current = new URL(window.location.href);
                const otherPort = current.port === '8080' ? '9090' : '8080';
                const uri = `${current.protocol}//${current.hostname}:${otherPort}/`;
                assert.strictEqual(Leuce.Utility.isSameOrigin(uri), false);
            });

            QUnit.test('Returns false for different protocol',
            function(assert) {
                const altProtocol = window.location.protocol === 'https:'
                    ? 'http:' : 'https:';
                const uri = `${altProtocol}//${window.location.host}/`;
                assert.strictEqual(Leuce.Utility.isSameOrigin(uri), false);
            });

            QUnit.test('Returns false for invalid URL',
            function(assert) {
                const uri = 'http://';
                assert.strictEqual(Leuce.Utility.isSameOrigin(uri), false);
            });
        }); // isSameOrigin

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
