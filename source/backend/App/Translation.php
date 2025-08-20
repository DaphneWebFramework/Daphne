<?php declare(strict_types=1);
/**
 * Translation.php
 *
 * (C) 2025 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

namespace App;

use \Harmonia\Core\CPath;

/**
 * Manages translations specific to the main application.
 */
class Translation extends \Peneus\Translation
{
    /**
     * Specifies the JSON files containing translations.
     *
     * @return array<CPath>
     *   An array of paths to translation files, including both Peneus base
     *   translations and App-specific overrides.
     */
    protected function filePaths(): array
    {
        return \array_merge(parent::filePaths(), [
            CPath::Join(__DIR__, 'translations.json')
        ]);
    }
}
