<?php declare(strict_types=1);
/**
 * bootstrap.php
 *
 * (C) 2025 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

use \Harmonia\Config;
use \Harmonia\Core\CPath;

\spl_autoload_register(function(string $className): void {
    $classFilePath = \rtrim(__DIR__, '/\\')
                   . '/backend/'
                   . \str_replace('\\', '/', $className)
                   . '.php';
    if (!\is_file($classFilePath)) {
        return;
    }
    require $classFilePath;
});

Config::Instance()->Load(CPath::Join(__DIR__, 'config.inc.php'));
