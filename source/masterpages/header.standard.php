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

use \Charis\Container;
use \Charis\Generic;
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
use \Peneus\Systems\PageSystem\Page;

if (!isset($this) || !$this instanceof Page) {
	exit;
}

function escapeLabel(string $label): string {
	return \htmlspecialchars(
		$label,
		\ENT_QUOTES | \ENT_SUBSTITUTE | \ENT_HTML5,
		'UTF-8'
	);
}

function createGuestNavItems(array &$navItems): void {
	$navItems[] = new NavbarItem([
		':label' => "Register",
		':href' => Resource::Instance()->PageUrl('register-account')
	]);
	$navItems[] = new NavbarItem([
		':label' => "Log in",
		':href' => Resource::Instance()->LoginPageUrl()
	]);
}

function createAccountNavItems(array &$navItems, Page $page): void {
	$dropdownItems = [
		new NavbarDropdownItem([
			':label' => "Settings",
			':href' => Resource::Instance()->PageUrl('settings')
		])
	];
	if (Role::Parse($page->SessionAccount()->role)->AtLeast(Role::Admin)) {
		$dropdownItems[] = new NavbarDropdownDivider();
		$dropdownItems[] = new NavbarDropdownItem([
			':label' => "Management",
			':href' => Resource::Instance()->PageUrl('management')
		]);
	}
	$dropdownItems[] = new NavbarDropdownDivider();
	$dropdownItems[] = new NavbarDropdownItem([
		':label' => "Log out",
		':link:id' => 'navbarLogout'
	]);
	$navItems[] = new NavbarDropdown([
		':label' => escapeLabel($page->SessionAccount()->displayName),
		':link:id' => 'navbarDisplayName',
		':menu:class' => $page->Property('wideLayout', false)
			? 'dropdown-menu-end' : 'dropdown-menu-start'
	], $dropdownItems);
}

function createNavItems(Page $page): array {
	$navItems = [];
	if ($page->SessionAccount() === null) {
		createGuestNavItems($navItems);
	} else {
		createAccountNavItems($navItems, $page);
	}
	return $navItems;
}
?>
	<?=new Navbar(['class' => 'bg-dark navbar-expand-sm', 'data-bs-theme' => 'dark'], [
		new Container([
			'class' => $this->Property('wideLayout', false)
				? 'container-fluid'
				: 'container'
		], [
			new NavbarBrand(['href' => Resource::Instance()->AppUrl()], [
				new Generic('img', [
					'class' => 'navbar-logo',
					'src' => Resource::Instance()->AppSubdirectoryUrl('assets')
						->Extend('image', 'logo.png'),
					'alt' => 'Logo'
				], null, true),
				Config::Instance()->Option('AppName')
			]),
			new NavbarToggler([
				'data-bs-target' => '#navbarTogglerTarget',
				'aria-controls' => 'navbarTogglerTarget'
			]),
			new NavbarCollapse(['id' => 'navbarTogglerTarget'], [
				new NavbarNav(['class' => 'ms-auto'], createNavItems($this))
			])
		])
	])?>
