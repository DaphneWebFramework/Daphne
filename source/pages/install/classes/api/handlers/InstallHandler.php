<?php declare(strict_types=1);
/**
 * InstallHandler.php
 *
 * (C) 2025 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

namespace classes\api\handlers;

use \Peneus\Api\Handlers\Handler;

use \classes\api\actions\CheckAdminAccountAction;
use \classes\api\actions\CheckDatabaseAction;
use \classes\api\actions\CheckTableAction;
use \classes\api\actions\CreateAdminAccountAction;
use \classes\api\actions\CreateDatabaseAction;
use \classes\api\actions\CreateTableAction;
use \classes\api\guards\InstallKeyGuard;
use \Peneus\Api\Actions\Action;

class InstallHandler extends Handler
{
    protected function createAction(string $actionName): ?Action
    {
        $action = match ($actionName) {
            'check-database' => new CheckDatabaseAction(),
            'create-database' => new CreateDatabaseAction(),
            'check-table' => new CheckTableAction(),
            'create-table' => new CreateTableAction(),
            'check-admin-account' => new CheckAdminAccountAction(),
            'create-admin-account' => new CreateAdminAccountAction(),
            default => null,
        };
        return $action?->AddGuard(new InstallKeyGuard());
    }
}
