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

use \Charis\Container;
use \Charis\Generic;
use \Peneus\Systems\PageSystem\Page;

$page = (new Page)
	->SetMasterPage('basic');
?>
<?php $page->Begin()?>
	<?=new Container(null, [
		new Generic('h2', null, 'Welcome to Daphne'),
		new Generic('p', null, 'A full-stack web framework for building database-driven web applications with ease.'),
	])?>

<?php $page->End()?>