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
use \Charis\FormComposites\FormTextFL;
use \Charis\FormControls\FormHiddenInput;
use \Charis\Generic;
use \Harmonia\Config;
use \Peneus\Resource;
use \Peneus\Systems\PageSystem\Page;

$page = (new Page(__DIR__))
	->SetTitle("Register Account")
	->SetMasterPage('basic')
	->SetMeta('app:google-auth-client-id',
		Config::Instance()->OptionOrDefault('Google.Auth.ClientID', ''))
	->AddLibrary('gsi');
?>
<?php $page->Begin()?>
	<?=new Generic('main', ['role' => 'main', 'class' => 'container mt-5'], [
		new Generic('div', ['class' => 'd-flex justify-content-center'], [
			new Generic('div', ['class' => 'card'], [
				new Generic('h5', ['class' => 'card-header'],
					"Create your account"
				),
				new Generic('div', ['class' => 'card-body'], [
					new Generic('div', [
						'id' => 'googleSignInButton',
						'class' => 'gsi-button'
					]),
					new Generic('div', ['class' => 'gsi-or-separator'], 'OR'),
					new Form(null, [
						new FormHiddenInput([
							'name' => $page->CsrfTokenName(),
							'value' => $page->CsrfTokenValue()
						]),
						new FormEmailFL([
							':label' => "Email address",
							':input:name' => 'email',
							':input:autocomplete' => 'off',
							':input:required' => true
						]),
						new FormPasswordFL([
							':label' => "Password",
							':input:name' => 'password',
							':input:autocomplete' => 'new-password',
							':input:required' => true
						]),
						new FormTextFL([
							':label' => "Display name",
							':input:name' => 'displayName',
							':input:required' => true
						]),
						new Generic('div', ['class' => 'd-flex justify-content-end'], [
							new Button([
								'type' => 'submit'
							], "Register")
						])
					])
				]),
				new Generic('div', ['class' => 'card-footer text-center'], [
					"Already have an account?",
					' ',
					new Generic('a', [
						'href' => Resource::Instance()->LoginPageUrl('home')
					], "Log in")
				])
			])
		])
	])?>
<?php $page->End()?>
