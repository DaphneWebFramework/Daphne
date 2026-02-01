/**
 * app.test.js
 *
 * (C) 2025 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

QUnit.module('App', function()
{
    QUnit.module('Model', function(hooks)
    {
        let meta = null;

        hooks.beforeEach(function()
        {
            meta = document.createElement('meta');
            meta.setAttribute('name', 'app:api-url');
            meta.setAttribute('content', 'api/');
            document.head.appendChild(meta);
        });

        hooks.afterEach(function()
        {
            document.head.removeChild(meta);
        });

        QUnit.test('logOut() sends a POST request to "account/log-out"', function(assert)
        {
            let capturedRequest = null;
            const fakeClient = {
                send(request) {
                    capturedRequest = request;
                    return Promise.resolve({ isSuccess: () => true });
                }
            };
            const model = new App.Model(fakeClient);
            model.logOut();
            assert.strictEqual(capturedRequest.method, 'POST');
            assert.strictEqual(capturedRequest.url, 'api/account/log-out');
        });
    }); // Model

    QUnit.module('View', function()
    {
        QUnit.test('constructor() sets all expected view elements', function(assert)
        {
            $('#qunit-fixture').html(`
                <a id="navbarLogout"></a>
            `);
            const view = new App.View();
            assert.ok(view.get('root') instanceof jQuery);
            assert.ok(view.get('logout') instanceof jQuery);
        });

        QUnit.test('setLoading() sets and restores cursor style', function(assert)
        {
            const view = new App.View();
            const root = view.get('root')[0];
            view.setLoading(true);
            assert.strictEqual(root.style.cursor, 'progress');
            view.setLoading(false);
            assert.strictEqual(root.style.cursor, '');
        });
    }); // View

    QUnit.module('Controller', function(hooks)
    {
        let originalReloadPage;
        let originalNotifyError;

        hooks.before(function()
        {
            originalReloadPage = App.Controller.reloadPage;
            App.Controller.reloadPage = function() {}; // stub
            originalNotifyError = Leuce.UI.notifyError;
        });

        hooks.after(function()
        {
            App.Controller.reloadPage = originalReloadPage;
            Leuce.UI.notifyError = originalNotifyError;
        });

        QUnit.test('logout click triggers logOut() and reloads on success', function(assert)
        {
            $('#qunit-fixture').html('<a id="navbarLogout"></a>');
            assert.expect(3);
            const model = new App.Model();
            const view = new App.View();
            const controller = new App.Controller(model, view);
            const done = assert.async();
            let called = false;
            model.logOut = function() {
                called = true;
                const response = {
                    isSuccess: () => true
                };
                return Promise.resolve(response);
            };
            App.Controller.reloadPage = function() {
                assert.ok(true);
            };
            view.get('logout').trigger('click');
            Promise.resolve().then(function() {
                assert.true(called);
                assert.strictEqual(view.get('root')[0].style.cursor, '');
                done();
            });
        });

        QUnit.test('logout click shows error on failure', function(assert)
        {
            $('#qunit-fixture').html('<a id="navbarLogout"></a>');
            assert.expect(3);
            const model = new App.Model();
            const view = new App.View();
            const controller = new App.Controller(model, view);
            const done = assert.async();
            let called = false;
            model.logOut = function() {
                called = true;
                const response = {
                    isSuccess: () => false,
                    body: { message: 'Session expired.' }
                };
                return Promise.resolve(response);
            };
            Leuce.UI.notifyError = function(message) {
                assert.strictEqual(message, 'Session expired.');
            };
            view.get('logout').trigger('click');
            Promise.resolve().then(function() {
                assert.true(called);
                assert.strictEqual(view.get('root')[0].style.cursor, '');
                done();
            });
        });
    }); // Controller
});
