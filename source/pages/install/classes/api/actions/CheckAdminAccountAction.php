<?php declare(strict_types=1);
/**
 * CheckAdminAccountAction.php
 *
 * (C) 2025 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

namespace classes\api\actions;

use \Peneus\Api\Actions\Action;

use \Peneus\Model\Account;
use \Peneus\Model\AccountRole;
use \Peneus\Model\Role;

class CheckAdminAccountAction extends Action
{
    protected function onExecute(): mixed
    {
        // 1
        $accountRole = AccountRole::FindFirst(
            condition: 'role = :role',
            bindings: ['role' => Role::Admin->value]
        );
        // 2
        if ($accountRole === null) {
            return ['result' => false];
        }
        // 3
        return ['result' => Account::Count(
            condition: 'id = :id',
            bindings: ['id' => $accountRole->accountId]
        ) > 0];
    }
}
