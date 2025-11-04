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
use \Charis\FormComposites\FormSwitch;
use \Charis\FormControls\FormHiddenInput;
use \Charis\Generic;
use \Harmonia\Config;
use \Peneus\Resource;
use \Peneus\Systems\PageSystem\Page;

$page = (new Page(__DIR__))
	->SetTitle("Login")
	->SetMasterPage('basic')
	->SetMeta('app:google-oauth2-client-id',
		Config::Instance()->OptionOrDefault('Google.OAuth2.ClientID', ''))
	->AddLibrary('gsi');

$resource = Resource::Instance();
?>
<?php $page->Begin()?>
	<?=new Generic('main', ['role' => 'main', 'class' => 'container mt-5'], [
		new Generic('div', ['class' => 'd-flex justify-content-center'], [
			$page->SessionAccount() === null
			? // Not logged in:
			new Generic('div', ['class' => 'card'], [
				new Generic('h5', ['class' => 'card-header'],
					"Welcome back"
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
							':input:autocomplete' => 'username',
							':input:required' => true
						]),
						new FormPasswordFL([
							':label' => "Password",
							':input:name' => 'password',
							':input:autocomplete' => 'current-password',
							':input:required' => true
						]),
						new FormSwitch([
							':label' => 'Keep me logged in',
							':input:name' => 'keepLoggedIn',
							'class' => 'mb-3'
						]),
						new Generic('div', ['class' => 'd-flex justify-content-between align-items-center'], [
							new Generic('a', [
								'href' => $resource->PageUrl('forgot-password')
							], "Forgot your password?"),
							new Button([
								'type' => 'submit'
							], "Log in")
						])
					])
				]),
				new Generic('div', ['class' => 'card-footer text-center'], [
					"Don't have an account?",
					' ',
					new Generic('a', [
						'href' => $resource->PageUrl('register-account')
					], "Register")
				])
			])
			: // Already logged in:
			new Generic('div', ['class' => 'card'], [
				new Generic('h5', ['class' => 'card-header'],
					"You've successfully logged in"
				),
				new Generic('div', ['class' => 'card-body'], [
					new Generic('p', null,
						"You can return to the home page or log out to use a different account."
					),
					new Generic('div', ['class' => 'd-flex justify-content-between align-items-center'], [
						new Generic('a', [
							'href' => $resource->PageUrl('home')
						], "Home page"),
						new Button([
							'id' => 'logoutButton',
							'class' => 'btn-secondary'
						], "Log out")
					])
				])
			])
		])
	])?>
<?php $page->End()?>
