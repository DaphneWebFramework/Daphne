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
    #id;
    #$icon;
    #$text;

    constructor(id)
    {
        this.#id = id;
        this.#$icon = $(`#${id}-icon`);
        this.#$text = $(`#${id}-text`);
    }

    show()
    {
        $(`#${this.#id}`).removeClass('d-none');
    }

    setSuccessIcon()
    {
        this.#$icon.html('<i class="bi bi-check-circle-fill text-success"></i>');
    }

    setErrorIcon()
    {
        this.#$icon.html('<i class="bi bi-x-circle-fill text-danger"></i>');
    }

    setText(text)
    {
        this.#$text.text(text);
    }
}
