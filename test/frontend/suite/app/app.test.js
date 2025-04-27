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

        QUnit.test('logout() sends a POST request to "account/logout"', function(assert)
        {
            let capturedRequest = null;
            const fakeClient = {
                send(request) {
                    capturedRequest = request;
                    return Promise.resolve({ isSuccess: () => true });
                }
            };
            const model = new App.Model(fakeClient);
            model.logout();
            assert.strictEqual(capturedRequest.method, 'POST');
            assert.strictEqual(capturedRequest.url, 'api/account/logout');
        });
    }); // Model

    QUnit.module('View', function()
    {
        QUnit.test('constructor() sets root and logout elements', function(assert)
        {
            $('#qunit-fixture').html('<a id="logout"></a>');
            const view = new App.View();
            assert.ok(view.get('logout') instanceof jQuery);
            assert.ok(view.get('root') instanceof jQuery);
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

        hooks.before(function()
        {
            originalReloadPage = App.Controller.reloadPage;
            App.Controller.reloadPage = function() {}; // stub
        });

        hooks.after(function()
        {
            App.Controller.reloadPage = originalReloadPage;
        });

        QUnit.test('constructor() binds and calls logout logic', function(assert)
        {
            $('#qunit-fixture').html('<a id="logout"></a>');
            assert.expect(2);
            const model = new App.Model();
            const view = new App.View();
            const controller = new App.Controller(model, view);
            const done = assert.async();
            let logoutCalled = false;
            model.logout = function() {
                logoutCalled = true;
                return Promise.resolve({ isSuccess: () => true });
            };
            view.get('logout').trigger('click');
            Promise.resolve().then(function() {
                assert.true(logoutCalled);
                assert.strictEqual(view.get('root')[0].style.cursor, '');
                done();
            });
        });
    }); // Controller
});
