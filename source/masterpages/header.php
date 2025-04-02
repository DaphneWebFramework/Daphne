<?php declare(strict_types=1);
/**
 * header.php
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
use \Charis\{Container, Navbar, NavbarBrand};
use \Harmonia\Config;
use \Peneus\Resource;
?>
	<?=new Navbar(['class'=>'bg-dark mb-4', 'data-bs-theme'=>'dark'], [
		new Container(null, [
			new NavbarBrand(['href'=>Resource::Instance()->AppUrl()],
				Config::Instance()->Option('AppName')
			)
		])
	]).PHP_EOL?>
