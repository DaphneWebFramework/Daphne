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

use \Peneus\Systems\PageSystem\Page;

if (!isset($this) || !$this instanceof Page) {
	exit;
}
?>
	<!-- Header -->
<?php include 'header.basic.php'?>
	<!-- End Header -->

	<!-- Content -->
<?=$this->Content()?>
	<!-- End Content -->
