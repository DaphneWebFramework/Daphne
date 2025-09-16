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
use \Peneus\Systems\PageSystem\Page;

$page = (new Page(__DIR__))
	->SetMasterPage('standard');
?>
<?php $page->Begin()?>
	<?=new Generic('main', ['role' => 'main', 'class' => 'container my-5'], [
		new Generic('h2', null, "Welcome to Daphne"),
		new Generic('p', ['class'=>'lead'],
			"A full-stack framework for building database-driven web applications with ease."
		),
	])?>
<?php $page->End()?>
