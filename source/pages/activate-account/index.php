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

use \Charis\Form;
use \Charis\FormControls\FormHiddenInput;
use \Charis\Generic;
use \Harmonia\Http\Request;
use \Harmonia\Http\Response;
use \Harmonia\Http\StatusCode;
use \Harmonia\Services\SecurityService;
use \Peneus\Resource;
use \Peneus\Systems\PageSystem\Page;

$page = (new Page(__DIR__))
	->SetTitle(_T('activate_account.page_title'))
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
				new Generic('div', ['class' => 'card-header d-flex align-items-baseline justify-content-between'], [
					new Generic('h5', ['class' => 'mb-0'],
						_T('activate_account.card_header')
					),
					new Generic('div', [
						'id' => 'spinner',
						'class' => 'spinner-border spinner-border-sm',
						'role' => 'status'
					], new Generic('span', ['class' => 'visually-hidden'], _T('loading')))
				]),
				new Generic('div', ['class' => 'card-body'], [
					_T('activate_account.card_body'),
					new Form(['class' => 'd-none'], [
						new FormHiddenInput([
							'name' => $page->CsrfTokenName(),
							'value' => $page->CsrfTokenValue()
						]),
						new FormHiddenInput([
							'name' => 'activationCode',
							'value' => getCode()
						])
					])
				])
			])
		])
	])?>
<?php $page->End()?>
