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
	->SetTitle(_T('reset_password.page_title'))
	->SetMasterPage('basic');

function getCode(): string {
	$code = Request::Instance()->QueryParams()->GetOrDefault('code', '');
	if (!SecurityService::Instance()->IsValidToken($code)) {
		(new Response)->Redirect(Resource::Instance()->ErrorPageUrl(
			StatusCode::BadRequest));
	}
	return $code;
}
?>
<?php $page->Begin()?>
	<?=new Generic('main', ['role' => 'main', 'class' => 'container mt-5'], [
		new Generic('div', ['class' => 'd-flex justify-content-center'], [
			new Generic('div', ['class' => 'card'], [
				new Generic('h5', ['class' => 'card-header'],
					_T('reset_password.card_header')
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
							':label' => _T('new_password'),
							':name' => 'newPassword',
							':autocomplete' => 'new-password',
							':required' => true
						]),
						new Generic('div', ['class' => 'd-flex justify-content-end'], [
							new Button([
								'type' => 'submit'
							], _T('change'))
						])
					])
				])
			])
		])
	])?>
<?php $page->End()?>
