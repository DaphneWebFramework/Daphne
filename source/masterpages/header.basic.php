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
use \Charis\Generic;
use \Charis\Navbar;
use \Charis\NavbarBrand;
use \Harmonia\Config;
use \Peneus\Resource;
use \Peneus\Systems\PageSystem\Page;

if (!isset($this) || !$this instanceof Page) {
	exit;
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
			])
		])
	])?>
