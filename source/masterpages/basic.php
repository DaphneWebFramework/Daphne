<?php declare(strict_types=1);
/**
 * basic.php
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
use \Harmonia\Config;
use \Peneus\Resource;

$config = Config::Instance();
$resource = Resource::Instance();
?>
	<?=new Navbar(['class'=>'bg-dark mb-4', 'data-bs-theme'=>'dark'], [
		new Container(null, [
			new NavbarBrand(['href'=>$resource->AppUrl()], $config->Option('AppName'))
		])
	])?>

<?=$this->Contents()?>
<?php include 'footer.php'?>