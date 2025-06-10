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
use \Charis\FormComposites\FormPasswordFL;
use \Charis\FormControls\FormHiddenInput;
use \Charis\Generic;
use \Peneus\Resource;
use \Peneus\Systems\PageSystem\Page;

$page = (new Page(__DIR__))
	->SetTitle(_T('login.page_title'))
	->SetMasterPage('basic');

$resource = Resource::Instance();
?>
<?php $page->Begin()?>
	<?=new Generic('main', ['role' => 'main', 'class' => 'container mt-5'], [
		new Generic('div', ['class' => 'd-flex justify-content-center'], [
			$page->LoggedInAccount() === null
			?
			new Generic('div', ['class' => 'card'], [
				new Generic('h5', ['class' => 'card-header'],
					_T('login.card_header')
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
							':autocomplete' => 'username',
							':required' => true
						]),
						new FormPasswordFL([
							':label' => _T('password'),
							':name' => 'password',
							':autocomplete' => 'current-password',
							':required' => true
						]),
						new Generic('div', ['class' => 'd-flex justify-content-between align-items-center'], [
							new Generic('a', [
								'href' => $resource->PageUrl('forgot-password')
							], _T('forgot_your_password')),
							new Button([
								'type' => 'submit'
							], _T('log_in'))
						])
					])
				]),
				new Generic('div', ['class' => 'card-footer text-center'], [
					_T('login.card_footer'),
					' ',
					new Generic('a', [
						'href' => $resource->PageUrl('register-account')
					], _T('register'))
				])
			])
			:
			new Generic('div', ['class' => 'card'], [
				new Generic('h5', ['class' => 'card-header'],
					_T('login.done.card_header')
				),
				new Generic('div', ['class' => 'card-body'], [
					new Generic('p', null, _T('login.done.card_body')),
					new Generic('div', ['class' => 'd-flex justify-content-between align-items-center'], [
						new Generic('a', [
							'href' => $resource->PageUrl('home')
						], _T('home_page')),
						new Button([
							'id' => 'logoutButton',
							'class' => 'btn-secondary'
						], _T('log_out'))
					])
				])
			])
		])
	])?>
<?php $page->End()?>
