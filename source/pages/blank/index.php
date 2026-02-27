<?php declare(strict_types=1);
/**
 * index.php
 *
 * (C) 2026 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

require '../../autoload.php';

use \Peneus\Systems\PageSystem\Page;

$page = (new Page(__DIR__))
	->SetMasterPage('basic');
?>
<?php $page->Begin()?>

<?php $page->End()?>
