/**
 * Model.js
 *
 * (C) 2025 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

class Model extends App.Model
{
    /**
     * @param {string} installKey
     * @returns {Promise<Leuce.HTTP.Response>}
     */
    checkDatabase(installKey)
    {
        return this.get()
            .handler('install')
            .action('check-database')
            .query({ key: installKey })
            .send();
    }

    /**
     * @param {string} installKey
     * @returns {Promise<Leuce.HTTP.Response>}
     */
    createDatabase(installKey)
    {
        return this.get()
            .handler('install')
            .action('create-database')
            .query({ key: installKey })
            .send();
    }

    /**
     * @param {string} installKey
     * @param {string} tableName
     * @returns {Promise<Leuce.HTTP.Response>}
     */
    checkTable(installKey, tableName)
    {
        return this.get()
            .handler('install')
            .action('check-table')
            .query({ key: installKey, table: tableName })
            .send();
    }

    /**
     * @param {string} installKey
     * @param {string} tableName
     * @returns {Promise<Leuce.HTTP.Response>}
     */
    createTable(installKey, tableName)
    {
        return this.get()
            .handler('install')
            .action('create-table')
            .query({ key: installKey, table: tableName })
            .send();
    }

    /**
     * @param {string} installKey
     * @returns {Promise<Leuce.HTTP.Response>}
     */
    checkAdminAccount(installKey)
    {
        return this.get()
            .handler('install')
            .action('check-admin-account')
            .query({ key: installKey })
            .send();
    }

    /**
     * @param {string} installKey
     * @returns {Promise<Leuce.HTTP.Response>}
     */
    createAdminAccount(installKey)
    {
        return this.get()
            .handler('install')
            .action('create-admin-account')
            .query({ key: installKey })
            .send();
    }
}
