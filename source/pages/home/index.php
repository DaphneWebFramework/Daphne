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

use \Charis\Button;
use \Charis\Generic;
use \Peneus\Systems\PageSystem\Page;

$page = (new Page(__DIR__))
	->SetMasterPage('standard')
	->SetProperty('wideLayout', true);

function renderFeature(string $imageUrl, string $title, string $description): Generic {
	return new Generic('div', ['class' => 'item'], [
		new Generic('div', ['class' => 'visual'], [
			new Generic('img', ['src' => $imageUrl, 'alt' => $title], null, true)
		]),
		new Generic('div', ['class' => 'text'], [
			new Generic('h3', null, $title),
			new Generic('p', null, $description)
		])
	]);
}
?>
<?php $page->Begin()?>
	<?=new Generic('main', ['role' => 'main'], [
		// Section: Hero
		new Generic('section', ['class' => 'hero section'], [
			new Generic('div', ['class' => 'inner'], [
				new Generic('div', ['class' => 'text'], [
					new Generic('h1', null, "Lorem ipsum dolor sit amet"),
					new Generic('p', null, "Quisque tincidunt eros risus, in accumsan eros dictum in"),
					new Generic('div', ['class' => 'actions'], [
						new Button(['class' => 'btn-primary'], "Nunc finibus"),
						new Button(['class' => 'btn-outline-primary'], "Donec quam")
					])
				]),
				new Generic('div', ['class' => 'visual'], [
					new Generic('img', ['src' => 'assets/hero.png', 'alt' => 'Showcase image'], null, true)
				])
			])
		]),
		// Section: Features
		new Generic('section', ['class' => 'features section bg-light'], [
			new Generic('header', null, [
				new Generic('div', ['class' => 'inner'], [
					new Generic('h2', null, "Featurium"),
					new Generic('p', null, "Mauris libero erat, fringilla id dui eget, dapibus laoreet sapien")
				])
			]),
			new Generic('div', ['class' => 'inner'], [
				new Generic('div', ['class' => 'grid'], [
					renderFeature(
						'assets/feature.png',
						"Etiam semper",
						"Aenean accumsan sodales accumsan. Pellentesque vitae risus placerat, convallis orci non, rhoncus velit."
					),
					renderFeature(
						'assets/feature.png',
						"Aliquam mattis",
						"Curabitur sodales tempus turpis, tempus laoreet nisl efficitur a. Curabitur in venenatis nisi."
					),
					renderFeature(
						'assets/feature.png',
						"Maecenas non neque",
						"Etiam dignissim commodo interdum. Vivamus lacus libero, placerat eget massa nec, luctus vehicula turpis."
					),
					renderFeature(
						'assets/feature.png',
						"Ut rhoncus vehicula",
						"Nunc finibus eget risus a fringilla. Nullam ullamcorper mi mi, et auctor lacus tincidunt vitae."
					),
					renderFeature(
						'assets/feature.png',
						"Fusce gravida tristique",
						"Suspendisse quam augue, lacinia at blandit ac, lacinia fermentum dolor. Sed eget nisl ut nisi suscipit suscipit."
					),
					renderFeature(
						'assets/feature.png',
						"Gravida tristique",
						"Hac habitasse platea dictumst. Cras ultricies, nisi ut venenatis tincidunt, ipsum nibh aliquam dolor."
					),
				])
			])
		]),
		// Section: Call to Action
		new Generic('section', ['class' => 'cta section bg-dark'], [
			new Generic('div', ['class' => 'inner'], [
				new Generic('div', ['class' => 'text'], [
					new Generic('h3', null, "Proin justo tortor?"),
					new Generic('p', null, "Nullam euismod, nisi eu ultrices tincidunt")
				]),
				new Generic('div', ['class' => 'actions'], [
					new Button(['class' => 'btn-light'], "Orci varius")
				])
			])
		]),
	])?>
<?php $page->End()?>
