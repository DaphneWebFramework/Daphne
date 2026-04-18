<?php declare(strict_types=1);
/**
 * CreateAdminAccountAction.php
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
use \Harmonia\Http\Request;
use \Harmonia\Services\SecurityService;

class CreateAdminAccountAction extends Action
{
    public const ADMIN_EMAIL = 'admin@example.com';
    private const ADMIN_DISPLAY_NAME = 'Admin';

    protected function onExecute(): mixed
    {
        // 1
        $installKey = Request::Instance()->QueryParams()->Get('key');
        // 2
        $account = Account::FindFirst(
            condition: 'email = :email',
            bindings: ['email' => self::ADMIN_EMAIL]
        ) ?? new Account();
        $account->email = self::ADMIN_EMAIL;
        $account->passwordHash = SecurityService::Instance()->HashPassword($installKey);
        $account->displayName = self::ADMIN_DISPLAY_NAME;
        $account->timeActivated = new \DateTime();
        $account->timeLastLogin = null;
        if (!$account->Save()) {
            throw new \RuntimeException("Failed to create admin account.");
        }
        // 3
        $accountRole = AccountRole::FindFirst(
            condition: 'accountId = :accountId',
            bindings: ['accountId' => $account->id]
        ) ?? new AccountRole();
        $accountRole->accountId = $account->id;
        $accountRole->role = Role::Admin;
        if (!$accountRole->Save()) {
            throw new \RuntimeException('Failed to create admin account role.');
        }
        return null;
    }
}
