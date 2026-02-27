<?php declare(strict_types=1);
/**
 * footer.php
 *
 * (C) 2025 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

use \Charis\Generic;
use \Harmonia\Config;
use \Peneus\Systems\PageSystem\Page;

if (!isset($this) || !$this instanceof Page) {
	exit;
}
?>
	<?=new Generic('footer', ['class' => 'bg-light', 'style' => 'padding: 2rem 0;'], [
		new Generic('div', ['class' => 'text-center text-muted'], [
			'&copy; ' . \date('Y') . ' ' . Config::Instance()->Option('AppName')
		])
	])?>
