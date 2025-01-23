/**
 * run-frontend-tests.js
 *
 * (C) 2025 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

const puppeteer = require('puppeteer');
const URL = 'http://127.0.0.1:8080/test/frontend/index.html';

(async function() {
    let browser;
    try {
        console.log('[INFO] Launching the browser.');
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        console.log('[INFO] Navigating to URL:', URL);
        const page = await browser.newPage();
        await page.goto(URL, { waitUntil: 'domcontentloaded' });

        console.log('[INFO] Executing tests...');
        const result = await page.evaluate(function() {
            return new Promise(function(resolve) {
                QUnit.on('runEnd', function(runEnd) {
                    resolve(runEnd);
                });
            });
        });

        console.log('[INFO] Status  :', result.status);
        console.log('[INFO] Total   :', result.testCounts.total);
        console.log('[INFO] Passed  :', result.testCounts.passed);
        console.log('[INFO] Failed  :', result.testCounts.failed);
        console.log('[INFO] Skipped :', result.testCounts.skipped);
        console.log('[INFO] Todo    :', result.testCounts.todo);
        console.log('[INFO] Duration:', result.runtime);
        if (result.status === 'failed') {
            console.error('[ERROR] One or more tests failed.');
            process.exit(1);
        } else {
            console.log('[SUCCESS] All tests passed.');
        }
    } catch (error) {
        console.error('[ERROR]', error);
        process.exit(1);
    } finally {
        console.log('[INFO] Closing the browser.');
        if (browser) {
            await browser.close();
        }
    }
})();
