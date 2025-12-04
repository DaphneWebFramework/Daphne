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
use \Charis\FormComposites\FormCheck;
use \Charis\FormComposites\FormEmail;
use \Charis\FormComposites\FormPassword;
use \Charis\FormComposites\FormText;
use \Charis\FormControls\FormEmailInput;
use \Charis\Generic;
use \Charis\PillTab;
use \Charis\TabPane;
use \Charis\TabPanes;
use \Charis\VerticalPillTabNavigation;
use \Charis\VerticalPillTabs;
use \Harmonia\Http\Request;
use \Peneus\Resource;
use \Peneus\Systems\PageSystem\Page;

$page = (new Page(__DIR__))
	->SetTitle("Settings")
	->SetMasterPage('standard')
	->RequireLogin()
	->AddLibrary('bootstrap-icons')
	->SetProperty('wideLayout', true);

$resource = Resource::Instance();
$accountView = $page->SessionAccount();
$tabKey = Request::Instance()->QueryParams()->GetOrDefault('tab', 'account');
?>
<?php $page->Begin()?>
	<?=new Generic('main', ['role' => 'main'], [
		new VerticalPillTabNavigation(['class' => '-align-items-start'], [
			new VerticalPillTabs(['class' => '-me-3 bg-light'], [
				new PillTab([':key' => 'account', ':active' => $tabKey === 'account'], [
					new Generic('i', ['class' => 'bi bi-person-circle']),
					new Generic('span', ['class' => 'label'], "Account")
				]),
				new PillTab([':key' => 'preferences', ':active' => $tabKey === 'preferences', 'disabled' => true], [
					new Generic('i', ['class' => 'bi bi-sliders']),
					new Generic('span', ['class' => 'label'], "Preferences")
				])
			]),
			new TabPanes([], [
				new TabPane([':key' => 'account', ':active' => $tabKey === 'account'], [
					new Generic('h3', null, "Account"),
					new Generic('section', null, [
						new FormEmail([
							':label' => "Email address",
							':input:value' => $accountView->email,
							':input:readonly' => true
						]),
						new Form(['id' => 'displayNameChangeForm'], [
							new Generic('div', ['class' => 'd-flex align-items-end gap-2 mb-3'], [
								new FormText([
									':label' => "Display name",
									':input:name' => 'displayName',
									':input:value' => $accountView->displayName,
									':input:required' => true,
									'class' => '-mb-3 flex-grow-1'
								]),
								new Button([
									'type' => 'submit',
									'class' => 'btn-outline-secondary'
								], "Change")
							])
						])
					]),
					new Generic('section', null, [
						new Generic('h5', null, "Change password"),
						new Generic('div', [
							'class' => 'alert alert-light',
							'role' => 'alert',
							'hidden' => $accountView->isLocal
						], [
							new Generic('i', ['class' => 'bi bi-info-circle me-2']),
							"Password changes are disabled because this account does not have a local password."
						]),
						new Form(['id' => 'passwordChangeForm', 'disabled' => !$accountView->isLocal], [
							new FormEmailInput([
								'class' => 'd-none',
								'value' => '',
								'autocomplete' => 'username'
							]),
							new FormPassword([
								':label' => "Current password",
								':input:name' => 'currentPassword',
								':input:autocomplete' => 'off',
								':input:required' => true
							]),
							new FormPassword([
								':label' => "New password",
								':input:name' => 'newPassword',
								':input:autocomplete' => 'new-password',
								':input:required' => true
							]),
							new Generic('div', ['class' => 'd-flex justify-content-between align-items-center'], [
								new Generic('a', [
									'href' => $resource->PageUrl('forgot-password')
								], "Forgot your password?"),
								new Button([
									'type' => 'submit',
									'class' => 'btn-outline-secondary'
								], "Change")
							])
						])
					]),
					new Generic('section', null, [
						new Generic('h5', null, "Delete account"),
						new Generic('div', [
							'class' => 'alert alert-danger',
							'role' => 'alert'
						], [
							new Generic('i', ['class' => 'bi bi-exclamation-triangle me-2']),
							"Deleting your account will permanently erase all your data. This action cannot be undone."
						]),
						new Form(['id' => 'accountDeleteForm'], [
							new FormCheck([
								':label' => "I understand my account cannot be recovered after deletion.",
								':input:required' => true,
								'class' => 'mb-3'
							]),
							new Button([
								'type' => 'submit',
								'class' => 'btn-outline-danger',
								'disabled' => true
							], "Delete account")
						])
					])
				]),
				new TabPane([':key' => 'preferences', ':active' => $tabKey === 'preferences'], [
					new Generic('h3', null, "Preferences"),
					// Preference sections go here.
				])
			])
		])
	])?>
<?php $page->End()?>
