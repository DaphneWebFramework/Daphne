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

// General purpose function to join paths
function joinPath(string ...$segments): string {
    $slashes = \DIRECTORY_SEPARATOR === '/' ? '/' : '/\\';
    $filtered = [];
    foreach ($segments as $segment) {
        if (\trim($segment, $slashes) !== '') {
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

// Register autoloader for loading classes from the local directory
\spl_autoload_register(function (string $className): void {
    if (!\str_starts_with($className, 'classes\\')) {
        return;
    }
    $className = \str_replace('\\', '/', $className);
    $classPath = joinPath(__DIR__, $className . '.php');
    if (!\is_file($classPath)) {
        return;
    }
    require $classPath;
});

// Include the main autoload file for standard wiring
require joinPath(__DIR__, '..', '..', 'autoload.php');
