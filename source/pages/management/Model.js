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
     * @returns {Promise<Leuce.HTTP.Response>}
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
     * @param {Object} data
     * @returns {Promise<Leuce.HTTP.Response>}
     */
    addRecord(tableName, data)
    {
        return this.post()
            .handler('management')
            .action('add-record')
            .query({ table: tableName })
            .jsonBody(data)
            .send();
    }

    /**
     * @param {string} tableName
     * @param {Object} data
     * @returns {Promise<Leuce.HTTP.Response>}
     */
    editRecord(tableName, data)
    {
        return this.post()
            .handler('management')
            .action('edit-record')
            .query({ table: tableName })
            .jsonBody(data)
            .send();
    }

    /**
     * @param {string} tableName
     * @param {number} id
     * @returns {Promise<Leuce.HTTP.Response>}
     */
    deleteRecord(tableName, id)
    {
        return this.post()
            .handler('management')
            .action('delete-record')
            .query({ table: tableName })
            .body({ id })
            .send();
    }
}
