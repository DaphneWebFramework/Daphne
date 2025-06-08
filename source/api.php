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

use \Peneus\Api\Dispatcher;
use \Peneus\Api\HandlerRegistry;
use \Peneus\Api\Handlers\AccountHandler;
use \Peneus\Api\Hooks\AccountRoleDeletionHook;
use \Peneus\Services\AccountService;

// Must be initialized first to catch fatal errors via shutdown handler
$dispatcher = new Dispatcher();

// Register account deletion hooks
$accountService = AccountService::Instance();
$accountService->RegisterDeletionHook(new AccountRoleDeletionHook());

// Register API handlers
$handlerRegistry = HandlerRegistry::Instance();
$handlerRegistry->RegisterHandler('account', AccountHandler::class);

// Dispatch incoming request
$dispatcher->DispatchRequest();
