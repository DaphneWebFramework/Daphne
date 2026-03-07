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
     * @returns {Promise<Leuce.HTTP.Response<
     *   {data: Array<{
     *     entityClass: string,
     *     tableName: string,
     *     tableType: "table" | "view",
     *     tableExists: boolean,
     *     isSync: boolean | null
     *   }>} | {message: string}
     * >>}
     */
    listEntityMappings()
    {
        return this.get()
            .handler('management')
            .action('list-entity-mappings')
            .send();
    }

    /**
     * @param {string} entityClass
     * @returns {Promise<Leuce.HTTP.Response<
     *   void | {message: string}
     * >>}
     */
    createTable(entityClass)
    {
        return this.post()
            .handler('management')
            .action('create-table')
            .body({ entityClass })
            .send();
    }

    /**
     * @param {string} entityClass
     * @returns {Promise<Leuce.HTTP.Response<
     *   void | {message: string}
     * >>}
     */
    dropTable(entityClass)
    {
        return this.post()
            .handler('management')
            .action('drop-table')
            .body({ entityClass })
            .send();
    }

    /**
     * @param {{
     *   table: string,
     *   page: number,
     *   pageSize: number,
     *   search?: string,
     *   sort?: {
     *     sortkey: string,
     *     sortdir: 'asc'|'desc'
     *   }
     * }} params
     * @returns {Promise<Leuce.HTTP.Response<
     *   {data: object[], total: number} | {message: string}
     * >>}
     */
    listRecords(params)
    {
        return this.get()
            .handler('management')
            .action('list-records')
            .query(params)
            .send();
    }

    /**
     * @param {string} tableName
     * @param {Object} payload
     * @returns {Promise<Leuce.HTTP.Response<
     *   {id: number} | {message: string}
     * >>}
     */
    createRecord(tableName, payload)
    {
        return this.post()
            .handler('management')
            .action('create-record')
            .query({ table: tableName })
            .jsonBody(payload)
            .send();
    }

    /**
     * @param {string} tableName
     * @param {Object} payload
     * @returns {Promise<Leuce.HTTP.Response<
     *   void | {message: string}
     * >>}
     */
    updateRecord(tableName, payload)
    {
        return this.post()
            .handler('management')
            .action('update-record')
            .query({ table: tableName })
            .jsonBody(payload)
            .send();
    }

    /**
     * @param {string} tableName
     * @param {number} id
     * @returns {Promise<Leuce.HTTP.Response<
     *   void | {message: string}
     * >>}
     */
    deleteRecord(tableName, id)
    {
        return this.post()
            .handler('management')
            .action('delete-record')
            .query({ table: tableName })
            .jsonBody({ id })
            .send();
    }
}
