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
	->SetTitle(_T('forgot_password.page_title'))
	->SetMasterPage('basic');
?>
<?php $page->Begin()?>
	<?=new Generic('main', ['role' => 'main', 'class' => 'container mt-5'], [
		new Generic('div', ['class' => 'd-flex justify-content-center'], [
			new Generic('div', ['class' => 'card'], [
				new Generic('h5', ['class' => 'card-header'],
					_T('forgot_password.card_header')
				),
				new Generic('div', ['class' => 'card-body'], [
					new Form(null, [
						new FormHiddenInput([
							'name' => $page->CsrfTokenName(),
							'value' => $page->CsrfTokenValue()
						]),
						new FormEmailFL([
							':label' => _T('email_address'),
							':name' => 'email',
							':autocomplete' => 'off',
							':required' => true,
							':help' => _T('forgot_password.email_help')
						]),
						new Generic('div', ['class' => 'd-flex justify-content-end'], [
							new Button([
								'type' => 'submit'
							], _T('send'))
						])
					])
				])
			])
		])
	])?>
<?php $page->End()?>
