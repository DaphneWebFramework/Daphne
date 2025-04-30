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

use \Harmonia\Config;
use \Peneus\Resource;
use \Peneus\Model\Role;
use \Charis\{
	Container,
	Navbar,
	NavbarBrand,
	NavbarToggler,
	NavbarCollapse,
	NavbarNav,
	NavbarItem,
	NavbarDropdown,
	NavbarDropdownItem,
	NavbarDropdownDivider
};

$config = Config::Instance();
$resource = Resource::Instance();
$account = $this->LoggedInAccount();
$role = $this->LoggedInAccountRole();
$navItems = [];

if ($account === null) {
	$navItems[] = new NavbarItem([
		':label' => 'Register',
		':href' => $resource->PageUrl('register-account')
	]);
	$navItems[] = new NavbarItem([
		':label' => 'Login',
		':href' => $resource->LoginPageUrl()
	]);
} else {
	$dropdownItems = [
		new NavbarDropdownItem([
			':label' => 'Settings',
			':href' => $resource->PageUrl('settings')
		])
	];
	if ($role->value >= Role::Editor->value) {
		$dropdownItems[] = new NavbarDropdownDivider();
		$dropdownItems[] = new NavbarDropdownItem([
			':label' => 'Editor',
			':href' => $resource->PageUrl('editor')
		]);
	}
	if ($role->value >= Role::Admin->value) {
		$dropdownItems[] = new NavbarDropdownItem([
			':label' => 'Admin',
			':href' => $resource->PageUrl('admin')
		]);
	}
	$dropdownItems[] = new NavbarDropdownDivider();
	$dropdownItems[] = new NavbarDropdownItem([
		':label' => 'Log out',
		':id' => 'logout'
	]);
	$navItems[] = new NavbarDropdown([
		':label' => \htmlspecialchars($account->displayName,
			\ENT_QUOTES | \ENT_SUBSTITUTE | \ENT_HTML5, 'UTF-8')
	], $dropdownItems);
}
?>
	<?=new Navbar(['class' => 'bg-dark navbar-expand-sm', 'data-bs-theme' => 'dark'], [
		new Container(null, [
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
