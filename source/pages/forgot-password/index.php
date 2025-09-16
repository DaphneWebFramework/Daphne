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

use \Charis\Button;
use \Charis\Form;
use \Charis\FormComposites\FormEmailFL;
use \Charis\FormControls\FormHiddenInput;
use \Charis\Generic;
use \Peneus\Systems\PageSystem\Page;

$page = (new Page(__DIR__))
	->SetTitle("Forgot Password")
	->SetMasterPage('basic');
?>
<?php $page->Begin()?>
	<?=new Generic('main', ['role' => 'main', 'class' => 'container mt-5'], [
		new Generic('div', ['class' => 'd-flex justify-content-center'], [
			new Generic('div', ['class' => 'card'], [
				new Generic('h5', ['class' => 'card-header'],
					"Forgot your password?"
				),
				new Generic('div', ['class' => 'card-body'], [
					new Form(null, [
						new FormHiddenInput([
							'name' => $page->CsrfTokenName(),
							'value' => $page->CsrfTokenValue()
						]),
						new FormEmailFL([
							':label' => "Email address",
							':input:name' => 'email',
							':input:autocomplete' => 'off',
							':input:required' => true,
							':help' => "We'll send a password reset link to this address if it's registered."
						]),
						new Generic('div', ['class' => 'd-flex justify-content-end'], [
							new Button([
								'type' => 'submit'
							], "Send")
						])
					])
				])
			])
		])
	])?>
<?php $page->End()?>
