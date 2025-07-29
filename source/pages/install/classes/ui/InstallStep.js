/**
 * InstallStep.js
 *
 * (C) 2025 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

class InstallStep
{
    /** @type {string} */
    #id;

    /** @type {JQuery} */
    #$icon;

    /** @type {JQuery} */
    #$text;

    /**
     * @param {string} id
     */
    constructor(id)
    {
        this.#id = id;
        this.#$icon = $(`#${id}-icon`);
        this.#$text = $(`#${id}-text`);
    }

    /**
     * @returns {void}
     */
    show()
    {
        $(`#${this.#id}`).removeClass('d-none');
    }

    /**
     * @param {boolean} [isCreated=false]
     * @returns {void}
     */
    setSuccessIcon(isCreated = false)
    {
        const iconClass = isCreated ? 'check-circle-fill' : 'check-circle';
        this.#$icon.html(InstallStep.#iconHtml(iconClass, 'success'));
    }

    /**
     * @returns {void}
     */
    setErrorIcon()
    {
        this.#$icon.html(InstallStep.#iconHtml('x-circle-fill', 'danger'));
    }

    /**
     * @param {string} text
     * @returns {void}
     */
    setText(text)
    {
        this.#$text.text(text);
    }

    /**
     * @param {string} iconClass
     * @param {string} textClass
     * @returns {string}
     */
    static #iconHtml(iconClass, textClass)
    {
        return `<i class="bi bi-${iconClass} text-${textClass}"></i>`;
    }
}
