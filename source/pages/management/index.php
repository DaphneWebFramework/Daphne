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

function pillTab(
	string $key,
	string $iconClass,
	string $label,
	bool $active = false
): PillTab
{
	$attributes = [':key' => $key];
	if ($active) {
		$attributes[':active'] = true;
	}
	return new PillTab($attributes, [
		new Generic('i', ['class' => $iconClass]),
		new Generic('span', ['class' => 'label'], $label)
	]);
}

function tabPane(
	string $key,
	string $title,
	string $tableId,
	array $columns,
	bool $active = false,
	array $options = []
): TabPane
{
	$paneAttributes = [':key' => $key];
	if ($active) {
		$paneAttributes[':active'] = true;
	}
	$tableAttributes = [
		'id' => $tableId,
		'class' => 'table table-hover'
	];
	if (\in_array('nosearch', $options, true)) {
		$tableAttributes['data-nosearch'] = true;
	}
	if (\in_array('nopaginate', $options, true)) {
		$tableAttributes['data-nopaginate'] = true;
	}
	$theadAttributes = ['class' => 'table-light'];
	if (\in_array('nosort', $options, true)) {
		$theadAttributes['data-nosort'] = true;
	}
	$trAttributes = ['data-primary-key' => 'id'];
	if (\in_array('nopk', $options, true)) {
		$trAttributes = null;
	}
	$thElements = \array_map(function(array $column) {
		$thAttributes = [];
		foreach ($column[1] as $k => $v) {
			$thAttributes["data-{$k}"] = $v;
		}
		return new Generic('th', $thAttributes, $column[0]);
	}, $columns);
	return new TabPane($paneAttributes, [
		new Generic('h3', null, $title),
		new Generic('table', $tableAttributes, [
			new Generic('thead', $theadAttributes, [
				new Generic('tr', $trAttributes, $thElements)
			])
		])
	]);
}

$page = (new Page(__DIR__))
	->SetTitle("Management")
	->SetMasterPage('standard')
	->RequireLogin(Role::Admin)
	->AddLibrary('bootstrap-icons')
	->SetProperty('wideLayout', true);
?>
<?php $page->Begin()?>
	<?=new Generic('main', ['role' => 'main'], [
		new VerticalPillTabNavigation(['class' => '-align-items-start'], [
			new VerticalPillTabs(['class' => '-me-3 bg-light'], [
				pillTab('entity-mappings', 'bi bi-database-fill', "Entity Mappings", active: true),
				pillTab('accounts', 'bi bi-people-fill', "Accounts"),
				pillTab('account-roles', 'bi bi-person-check-fill', "Account Roles"),
				pillTab('pending-accounts', 'bi bi-hourglass-split', "Pending Accounts"),
				pillTab('password-resets', 'bi bi-key', "Password Resets"),
				pillTab('persistent-logins', 'bi bi-box-arrow-in-right', "Persistent Logins"),
			]),
			new TabPanes([], [
				tabPane('entity-mappings', "Entity Mappings", 'entityMappingTable', [
					['Entity class', ['key' => 'entityClass', 'formatter' => 'codeFont']],
					['Table name', ['key' => 'tableName', 'formatter' => 'codeFont']],
					['Table type', ['key' => 'tableType', 'formatter' => 'tableType']],
					['Table exists', ['key' => 'tableExists', 'formatter' => 'boolean']],
					['Is sync', ['key' => 'isSync', 'nullable' => true, 'formatter' => 'boolean']],
					['', ['renderer' => 'inlineActions']],
				], active: true, options: ['nopk', 'nosearch', 'nopaginate', 'nosort']),
				tabPane('accounts', "Accounts", 'accountTable', [
					['ID', ['key' => 'id', 'type' => 'integer']],
					['Email', ['key' => 'email']],
					['Password hash', ['key' => 'passwordHash', 'formatter' => 'truncate']],
					['Display name', ['key' => 'displayName']],
					['Time activated', ['key' => 'timeActivated', 'type' => 'datetime']],
					['Time last login', ['key' => 'timeLastLogin', 'type' => 'datetime', 'nullable' => true]],
				]),
				tabPane('account-roles', "Account Roles", 'accountRoleTable', [
					['ID', ['key' => 'id', 'type' => 'integer']],
					['Account ID', ['key' => 'accountId', 'type' => 'integer']],
					['Role', ['key' => 'role', 'type' => 'integer']],
				]),
				tabPane('pending-accounts', "Pending Accounts", 'pendingAccountTable', [
					['ID', ['key' => 'id', 'type' => 'integer']],
					['Email', ['key' => 'email']],
					['Password hash', ['key' => 'passwordHash', 'formatter' => 'truncate']],
					['Display name', ['key' => 'displayName']],
					['Activation code', ['key' => 'activationCode', 'formatter' => 'truncate']],
					['Time registered', ['key' => 'timeRegistered', 'type' => 'datetime']],
				]),
				tabPane('password-resets', "Password Resets", 'passwordResetTable', [
					['ID', ['key' => 'id', 'type' => 'integer']],
					['Account ID', ['key' => 'accountId', 'type' => 'integer']],
					['Reset code', ['key' => 'resetCode', 'formatter' => 'truncate']],
					['Time requested', ['key' => 'timeRequested', 'type' => 'datetime']],
				]),
				tabPane('persistent-logins', "Persistent Logins", 'persistentLoginTable', [
					['ID', ['key' => 'id', 'type' => 'integer']],
					['Account ID', ['key' => 'accountId', 'type' => 'integer']],
					['Client signature', ['key' => 'clientSignature', 'formatter' => 'truncate:140px']],
					['Lookup key', ['key' => 'lookupKey', 'formatter' => 'truncate']],
					['Token hash', ['key' => 'tokenHash', 'formatter' => 'truncate']],
					['Time expires', ['key' => 'timeExpires', 'type' => 'datetime']],
				]),
			])
		])
	])?>
<?php $page->End()?>
