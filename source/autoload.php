<?php declare(strict_types=1);
/**
 * autoload.php
 *
 * (C) 2025 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

use \App\Translation;
use \Harmonia\Config;
use \Harmonia\Core\CPath;
use \Harmonia\Resource;
use \Peneus\Services\LanguageService;

// Register autoloader for loading classes from the backend directory
\spl_autoload_register(function(string $className): void {
    $classPath = \rtrim(__DIR__, '/\\')
        . '/backend/'
        . \str_replace('\\', '/', $className)
        . '.php';
    if (!\is_file($classPath)) {
        return;
    }
    require $classPath;
});

// Load configuration options from the application root directory
Config::Instance()->Load(CPath::Join(__DIR__, 'config.inc.php'));

// Override default language with value from the language cookie
LanguageService::Instance()->ReadFromCookie(function(string $languageCode): void {
    Config::Instance()->SetOption('Language', $languageCode);
});

// Initialize resource with the application root directory
Resource::Instance()->Initialize(__DIR__);

// Define a global shorthand function for retrieving translations
function _T(string $key, mixed ...$args): string {
    static $translation = null;
    if ($translation === null) {
        $translation = Translation::Instance();
    }
    return $translation->Get($key, ...$args);
}
