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

if (!isset($this) || !$this instanceof \Peneus\Systems\PageSystem\Page) {
	exit;
}
use \Charis\{Container, Generic};
use \Harmonia\Config;

$wideLayout = $this->Property('wideLayout', false);
?>
	<?=new Generic('footer', null, [
		new Container(['class' => $wideLayout ? 'container-fluid' : 'container'], [
			new Generic('hr', ['class'=>'mb-2'], [], true),
			new Generic('span', ['class'=>'small text-muted'],
				'&copy; '.\date('Y').' '.Config::Instance()->Option('AppName')
			)
		])
	])?>
