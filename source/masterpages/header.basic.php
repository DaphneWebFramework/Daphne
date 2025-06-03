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

if (!isset($this) || !$this instanceof \Peneus\Systems\PageSystem\Page) {
	exit;
}

use \Harmonia\Config;
use \Peneus\Resource;
use \Charis\{
	Container,
	Navbar,
	NavbarBrand
};

$config = Config::Instance();
$resource = Resource::Instance();
$wideLayout = $this->Property('wideLayout', false);
?>
	<?=new Navbar(['class' => 'bg-dark', 'data-bs-theme' => 'dark'], [
		new Container(['class' => $wideLayout ? 'container-fluid' : 'container'], [
			new NavbarBrand(['href' => $resource->AppUrl()],
				$config->Option('AppName')
			)
		])
	])?>
