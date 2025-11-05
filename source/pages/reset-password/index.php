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
use \Charis\FormComposites\FormPasswordFL;
use \Charis\FormControls\FormEmailInput;
use \Charis\FormControls\FormHiddenInput;
use \Charis\Generic;
use \Harmonia\Http\Request;
use \Harmonia\Http\Response;
use \Harmonia\Http\StatusCode;
use \Harmonia\Services\SecurityService;
use \Peneus\Resource;
use \Peneus\Systems\PageSystem\Page;

$page = (new Page(__DIR__))
	->SetTitle("Reset Password")
	->SetMasterPage('basic');

function getCode(): string {
	$code = Request::Instance()->QueryParams()->GetOrDefault('code', '');
	if (1 !== \preg_match(SecurityService::TOKEN_DEFAULT_PATTERN, $code)) {
		Response::Redirect(Resource::Instance()->ErrorPageUrl(StatusCode::BadRequest));
	}
	return $code;
}
?>
<?php $page->Begin()?>
	<?=new Generic('main', ['role' => 'main', 'class' => 'container mt-5'], [
		new Generic('div', ['class' => 'd-flex justify-content-center'], [
			new Generic('div', ['class' => 'card'], [
				new Generic('h5', ['class' => 'card-header'],
					"Choose a new password"
				),
				new Generic('div', ['class' => 'card-body'], [
					new Form(null, [
						new FormHiddenInput([
							'name' => $page->CsrfTokenName(),
							'value' => $page->CsrfTokenValue()
						]),
						new FormHiddenInput([
							'name' => 'resetCode',
							'value' => getCode()
						]),
						new FormEmailInput([
							'class' => 'd-none',
							'value' => '',
							'autocomplete' => 'username'
						]),
						new FormPasswordFL([
							':label' => "New password",
							':input:name' => 'newPassword',
							':input:autocomplete' => 'new-password',
							':input:required' => true
						]),
						new Generic('div', ['class' => 'd-flex justify-content-end'], [
							new Button([
								'type' => 'submit'
							], "Change")
						])
					])
				])
			])
		])
	])?>
<?php $page->End()?>
