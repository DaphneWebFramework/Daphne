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

use \Harmonia\Config;
use \Harmonia\Resource;

// General purpose function to join paths
function joinPath(string ...$segments): string {
    $slashes = \DIRECTORY_SEPARATOR === '/' ? '/' : '/\\';
    $filtered = [];
    foreach ($segments as $index => $segment) {
        if (($index === 0 && $segment !== '') ||
            \trim($segment, $slashes) !== ''
        ) {
            $filtered[] = $segment;
        }
    }
    if (empty($filtered)) {
        return '';
    }
    $joined = '';
    $lastIndex = \count($filtered) - 1;
    foreach ($filtered as $index => $segment) {
        if ($index > 0) {
            $segment = \ltrim($segment, $slashes);
        }
        if ($index < $lastIndex) {
            $lastChar = $segment[-1];
            if ($lastChar !== '/' && $lastChar !== \DIRECTORY_SEPARATOR) {
                $segment .= \DIRECTORY_SEPARATOR;
            }
        }
        $joined .= $segment;
    }
    return $joined;
}

// Register autoloader for loading classes from the backend directory
\spl_autoload_register(function(string $className): void {
    $className = \str_replace('\\', '/', $className);
    $classPath = joinPath(__DIR__, 'backend', "{$className}.php");
    if (!\is_file($classPath)) {
        return;
    }
    require $classPath;
});

// Load configuration options from the application root directory
Config::Instance()->Load(joinPath(__DIR__, 'config.php'));

// Initialize resource with the application root directory
Resource::Instance()->Initialize(__DIR__);
