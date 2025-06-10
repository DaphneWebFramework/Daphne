<?php declare(strict_types=1);
/**
 * header.standard.php
 *
 * (C) 2025 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

if (!isset($this) || !$this instanceof \Peneus\Systems\PageSystem\Page) {
	exit;
}

use \Charis\Container;
use \Charis\Navbar;
use \Charis\NavbarBrand;
use \Charis\NavbarCollapse;
use \Charis\NavbarDropdown;
use \Charis\NavbarDropdownDivider;
use \Charis\NavbarDropdownItem;
use \Charis\NavbarItem;
use \Charis\NavbarNav;
use \Charis\NavbarToggler;
use \Harmonia\Config;
use \Peneus\Model\Role;
use \Peneus\Resource;

$config = Config::Instance();
$resource = Resource::Instance();
$account = $this->LoggedInAccount();
$role = $this->LoggedInAccountRole();
$navItems = [];
$wideLayout = $this->Property('wideLayout', false);

if ($account === null) {
	$navItems[] = new NavbarItem([
		':label' => _T('register'),
		':href' => $resource->PageUrl('register-account')
	]);
	$navItems[] = new NavbarItem([
		':label' => _T('log_in'),
		':href' => $resource->LoginPageUrl()
	]);
} else {
	$dropdownItems = [
		new NavbarDropdownItem([
			':label' => _T('settings'),
			':href' => $resource->PageUrl('settings')
		])
	];
	if ($role->value >= Role::Editor->value) {
		$dropdownItems[] = new NavbarDropdownDivider();
		$dropdownItems[] = new NavbarDropdownItem([
			':label' => _T('editor'),
			':href' => $resource->PageUrl('editor')
		]);
	}
	if ($role->value >= Role::Admin->value) {
		$dropdownItems[] = new NavbarDropdownItem([
			':label' => _T('admin'),
			':href' => $resource->PageUrl('admin')
		]);
	}
	$dropdownItems[] = new NavbarDropdownDivider();
	$dropdownItems[] = new NavbarDropdownItem([
		':label' => _T('log_out'),
		':id' => 'navbarLogout'
	]);
	$navItems[] = new NavbarDropdown([
		':label' => \htmlspecialchars($account->displayName,
			\ENT_QUOTES | \ENT_SUBSTITUTE | \ENT_HTML5, 'UTF-8'),
		':id' => 'navbarDisplayName',
		':alignRight' => $wideLayout ? true : false,
	], $dropdownItems);
}
?>
	<?=new Navbar(['class' => 'bg-dark navbar-expand-sm', 'data-bs-theme' => 'dark'], [
		new Container(['class' => $wideLayout ? 'container-fluid' : 'container'], [
			new NavbarBrand(['href' => $resource->AppUrl()], $config->Option('AppName')),
			new NavbarToggler([
				'data-bs-target' => '#navbarTogglerTarget',
				'aria-controls' => 'navbarTogglerTarget'
			]),
			new NavbarCollapse(['id' => 'navbarTogglerTarget'], [
				new NavbarNav(['class' => 'ms-auto'], $navItems)
			])
		])
	])?>
