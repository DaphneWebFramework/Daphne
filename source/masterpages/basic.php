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
?>
	<!-- Header -->
<?php include 'header.php'?>
	<!-- End Header -->

	<!-- Content -->
<?=$this->Content()?>
	<!-- End Content -->

	<!-- Footer -->
<?php include 'footer.php'?>
	<!-- End Footer -->
