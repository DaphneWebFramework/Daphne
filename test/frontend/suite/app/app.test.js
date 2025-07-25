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

        QUnit.test('changeLanguage() sends a POST request to "language/change"', function(assert)
        {
            let capturedRequest = null;
            const fakeClient = {
                send(request) {
                    capturedRequest = request;
                    return Promise.resolve({ isSuccess: () => true });
                }
            };
            const model = new App.Model(fakeClient);
            const payload = { languageCode: 'fr', csrfToken: 'csrf123' };
            model.changeLanguage(payload);
            assert.strictEqual(capturedRequest.method, 'POST');
            assert.strictEqual(capturedRequest.url, 'api/language/change');
            assert.deepEqual(capturedRequest.body, payload);
        });
    }); // Model

    QUnit.module('View', function()
    {
        QUnit.test('constructor() sets all expected view elements', function(assert)
        {
            $('#qunit-fixture').html(`
                <a id="navbarLogout"></a>
                <span id="navbarLanguage" data-csrf-token="xyz"></span>
                <div class="dropdown-menu">
                    <a class="dropdown-item" data-language-code="fr">Français</a>
                </div>
            `);
            const view = new App.View();
            assert.ok(view.get('root') instanceof jQuery);
            assert.ok(view.get('logout') instanceof jQuery);
            assert.ok(view.get('language') instanceof jQuery);
            assert.ok(view.get('languageItems') instanceof jQuery);
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

        QUnit.test('logout click triggers logout and reloads on success', function(assert)
        {
            $('#qunit-fixture').html('<a id="navbarLogout"></a>');
            assert.expect(3);
            const model = new App.Model();
            const view = new App.View();
            const controller = new App.Controller(model, view);
            const done = assert.async();
            let called = false;
            model.logout = function() {
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
            model.logout = function() {
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

        QUnit.test('language click triggers changeLanguage and reloads on success', function(assert)
        {
            $('#qunit-fixture').html(`
                <span id="navbarLanguage" data-csrf-token="csrf123">en</span>
                <div class="dropdown-menu">
                    <a class="dropdown-item" data-language-code="fr">Français</a>
                </div>
            `);
            assert.expect(3);
            const model = new App.Model();
            const view = new App.View();
            const controller = new App.Controller(model, view);
            const done = assert.async();
            let calledWith = null;
            model.changeLanguage = function(data) {
                calledWith = data;
                const response = {
                    isSuccess: () => true
                };
                return Promise.resolve(response);
            };
            App.Controller.reloadPage = function() {
                assert.ok(true);
            };
            view.get('languageItems').trigger('click');
            Promise.resolve().then(function() {
                assert.deepEqual(calledWith, {
                    languageCode: 'fr',
                    csrfToken: 'csrf123'
                });
                assert.strictEqual(view.get('language').text(), 'fr');
                done();
            });
        });

        QUnit.test('language click restores text and shows error on failure', function(assert)
        {
            $('#qunit-fixture').html(`
                <span id="navbarLanguage" data-csrf-token="csrf123">en</span>
                <div class="dropdown-menu">
                    <a class="dropdown-item" data-language-code="fr">Français</a>
                </div>
            `);
            assert.expect(4);
            const model = new App.Model();
            const view = new App.View();
            const controller = new App.Controller(model, view);
            const done = assert.async();
            model.changeLanguage = function(data) {
                const response = {
                    isSuccess: () => false,
                    body: { message: 'Unsupported language.' }
                };
                return Promise.resolve(response);
            };
            Leuce.UI.notifyError = function(message) {
                assert.strictEqual(message, 'Unsupported language.');
            };
            const $language = view.get('language');
            assert.strictEqual($language.text(), 'en');
            view.get('languageItems').trigger('click');
            Promise.resolve().then(function() {
                assert.strictEqual($language.text(), 'en');
                assert.strictEqual(view.get('root')[0].style.cursor, '');
                done();
            });
        });

        QUnit.test('language click on current language does nothing', function(assert)
        {
            $('#qunit-fixture').html(`
                <span id="navbarLanguage" data-csrf-token="csrf123">en</span>
                <div class="dropdown-menu">
                    <a class="dropdown-item" data-language-code="en">English</a>
                </div>
            `);
            assert.expect(1);
            const model = new App.Model();
            const view = new App.View();
            const controller = new App.Controller(model, view);
            model.changeLanguage = function() {
                assert.ok(false, 'changeLanguage should not be called');
            };
            App.Controller.reloadPage = function() {
                assert.ok(false, 'reloadPage should not be called');
            };
            Leuce.UI.notifyError = function() {
                assert.ok(false, 'notifyError should not be called');
            };
            view.get('languageItems').trigger('click');
            assert.strictEqual(view.get('root')[0].style.cursor, '');
        });
    }); // Controller
});
