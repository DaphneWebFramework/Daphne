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

// Include the main autoload file for standard wiring
require __DIR__ . '/../../autoload.php';

// Register autoloader for loading classes from the local directory
\spl_autoload_register(function (string $className): void {
    if (!\str_starts_with($className, 'classes\\')) {
        return;
    }
    $className = \str_replace('\\', '/', $className);
    $classPath = joinPath(__DIR__, "{$className}.php");
    if (!\is_file($classPath)) {
        return;
    }
    require $classPath;
});
