<?php declare(strict_types=1);
/**
 * header.basic.php
 *
 * (C) 2025 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

use \Charis\Container;
use \Charis\Navbar;
use \Charis\NavbarBrand;
use \Charis\NavbarCollapse;
use \Charis\NavbarDropdown;
use \Charis\NavbarDropdownItem;
use \Charis\NavbarNav;
use \Charis\NavbarToggler;
use \Harmonia\Config;
use \Peneus\Resource;
use \Peneus\Services\LanguageService;
use \Peneus\Systems\PageSystem\Page;

if (!isset($this) || !$this instanceof Page) {
	exit;
}

function createLanguageNavItems(array &$navItems, Page $page): void {
	$languageService = LanguageService::Instance();
	$wideLayout = $page->Property('wideLayout', false);
	$dropdownItems = [];
	foreach ($languageService->Languages() as $label => $code) {
		$dropdownItems[] = new NavbarDropdownItem([
			':label' => $label,
			':link:data-language-code' => $code
		]);
	}
	$navItems[] = new NavbarDropdown([
		':label' => $languageService->CurrentLanguage(),
		':link:id' => 'navbarLanguage',
		':link:data-csrf-token' => $languageService->CsrfTokenValue(),
		':menu:class' => $wideLayout ? 'dropdown-menu-end' : 'dropdown-menu-start'
	], $dropdownItems);
}

function createNavItems(Page $page): array {
	$navItems = [];
	if ($page->Property('showLanguage', true)) {
		createLanguageNavItems($navItems, $page);
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
			new NavbarBrand(['href' => Resource::Instance()->AppUrl()],
				Config::Instance()->Option('AppName')
			),
			new NavbarToggler([
				'data-bs-target' => '#navbarTogglerTarget',
				'aria-controls' => 'navbarTogglerTarget'
			]),
			new NavbarCollapse(['id' => 'navbarTogglerTarget'], [
				new NavbarNav(['class' => 'ms-auto'], createNavItems($this))
			])
		])
	])?>
