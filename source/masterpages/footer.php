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

use \Charis\Container;
use \Charis\Generic;
use \Harmonia\Config;
use \Peneus\Systems\PageSystem\Page;

if (!isset($this) || !$this instanceof Page) {
	exit;
}
?>
	<?=new Generic('footer', null, [
		new Container([
			'class' => $this->Property('wideLayout', false)
				? 'container-fluid'
				: 'container'
		], [
			new Generic('hr', ['class' => 'mb-2'], [], true),
			new Generic('span', ['class' => 'small text-muted'],
				'&copy; ' . \date('Y') . ' ' . Config::Instance()->Option('AppName')
			)
		])
	])?>
