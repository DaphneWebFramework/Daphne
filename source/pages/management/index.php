<?php declare(strict_types=1);
/**
 * index.php
 *
 * (C) 2025 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

require '../../autoload.php';

use \Charis\Generic;
use \Charis\PillTab;
use \Charis\TabPane;
use \Charis\TabPanes;
use \Charis\VerticalPillTabNavigation;
use \Charis\VerticalPillTabs;
use \Peneus\Model\Role;
use \Peneus\Systems\PageSystem\Page;

$page = (new Page(__DIR__))
	->SetTitle(_T('management.page_title'))
	->SetMasterPage('standard')
	->RequireLogin(Role::Admin)
	->AddLibrary('bootstrap-icons')
	->SetProperty('wideLayout', true);
?>
<?php $page->Begin()?>
	<?=new Generic('main', ['role' => 'main'], [
		new VerticalPillTabNavigation(['class' => '-align-items-start'], [
			new VerticalPillTabs(['class' => '-me-3 bg-light'], [
				new PillTab([':key' => 'accounts', ':active' => true], [
					new Generic('i', ['class' => 'bi bi-people-fill']),
					new Generic('span', ['class' => 'label'], _T('management.accounts'))
				]),
				new PillTab([':key' => 'account-roles'], [
					new Generic('i', ['class' => 'bi bi-person-check-fill']),
					new Generic('span', ['class' => 'label'], _T('management.account_roles'))
				]),
				new PillTab([':key' => 'pending-accounts'], [
					new Generic('i', ['class' => 'bi bi-hourglass-split']),
					new Generic('span', ['class' => 'label'], _T('management.pending_accounts'))
				]),
				new PillTab([':key' => 'password-resets'], [
					new Generic('i', ['class' => 'bi bi-key']),
					new Generic('span', ['class' => 'label'], _T('management.password_resets'))
				]),
			]),
			new TabPanes([], [
				new TabPane([':key' => 'accounts', ':active' => true], [
					new Generic('h3', null, _T('management.accounts')),
					new Generic('table', ['id' => 'accountTable', 'class' => 'table table-hover'], [
						new Generic('thead', ['class' => 'table-light'], [
							new Generic('tr', ['data-primary-key' => 'id'], [
								new Generic('th', [
									'data-key' => 'id',
									'data-type' => 'integer'
								], 'ID'),
								new Generic('th', [
									'data-key' => 'email'
								], 'Email'),
								new Generic('th', [
									'data-key' => 'passwordHash',
									'data-format' => 'truncate:100px'
								], 'Password hash'),
								new Generic('th', [
									'data-key' => 'displayName'
								], 'Display name'),
								new Generic('th', [
									'data-key' => 'timeActivated',
									'data-type' => 'datetime'
								], 'Time activated'),
								new Generic('th', [
									'data-key' => 'timeLastLogin',
									'data-type' => 'datetime',
									'data-nullable' => true
								], 'Time last login')
							])
						])
					])
				]),
				new TabPane([':key' => 'account-roles'], [
					new Generic('h3', null, _T('management.account_roles')),
					new Generic('table', ['id' => 'accountRoleTable', 'class' => 'table table-hover'], [
						new Generic('thead', ['class' => 'table-light'], [
							new Generic('tr', ['data-primary-key' => 'id'], [
								new Generic('th', [
									'data-key' => 'id',
									'data-type' => 'integer'
								], 'ID'),
								new Generic('th', [
									'data-key' => 'accountId',
									'data-type' => 'integer'
								], 'Account ID'),
								new Generic('th', [
									'data-key' => 'role',
									'data-type' => 'integer'
								], 'Role')
							])
						])
					])
				]),
				new TabPane([':key' => 'pending-accounts'], [
					new Generic('h3', null, _T('management.pending_accounts')),
					new Generic('table', ['id' => 'pendingAccountTable', 'class' => 'table table-hover'], [
						new Generic('thead', ['class' => 'table-light'], [
							new Generic('tr', ['data-primary-key' => 'id'], [
								new Generic('th', [
									'data-key' => 'id',
									'data-type' => 'integer'
								], 'ID'),
								new Generic('th', [
									'data-key' => 'email'
								], 'Email'),
								new Generic('th', [
									'data-key' => 'passwordHash',
									'data-format' => 'truncate:100px'
								], 'Password hash'),
								new Generic('th', [
									'data-key' => 'displayName'
								], 'Display name'),
								new Generic('th', [
									'data-key' => 'activationCode',
									'data-format' => 'truncate:100px'
								], 'Activation code'),
								new Generic('th', [
									'data-key' => 'timeRegistered',
									'data-type' => 'datetime'
								], 'Time registered')
							])
						])
					])
				]),
				new TabPane([':key' => 'password-resets'], [
					new Generic('h3', null, _T('management.password_resets')),
					new Generic('table', ['id' => 'passwordResetTable', 'class' => 'table table-hover'], [
						new Generic('thead', ['class' => 'table-light'], [
							new Generic('tr', ['data-primary-key' => 'id'], [
								new Generic('th', [
									'data-key' => 'id',
									'data-type' => 'integer'
								], 'ID'),
								new Generic('th', [
									'data-key' => 'accountId',
									'data-type' => 'integer'
								], 'Account ID'),
								new Generic('th', [
									'data-key' => 'resetCode',
									'data-format' => 'truncate:100px'
								], 'Reset code'),
								new Generic('th', [
									'data-key' => 'timeRequested',
									'data-type' => 'datetime'
								], 'Time requested')
							])
						])
					])
				]),
			])
		])
	])?>
<?php $page->End()?>
