<?php declare(strict_types=1);
/**
 * api.php
 *
 * (C) 2025 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

require 'autoload.php';

use \classes\api\handlers\InstallHandler;
use \Peneus\Api\Dispatcher;
use \Peneus\Api\HandlerRegistry;

// Must be initialized first to catch fatal errors via shutdown handler
$dispatcher = new Dispatcher();

// Register API handlers
$handlerRegistry = HandlerRegistry::Instance();
$handlerRegistry->RegisterHandler('install', InstallHandler::class);

// Dispatch incoming request
$dispatcher->DispatchRequest();
