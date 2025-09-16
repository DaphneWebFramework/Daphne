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
use \Charis\Spinner;
use \Harmonia\Http\Request;
use \Harmonia\Http\Response;
use \Harmonia\Http\StatusCode;
use \Harmonia\Services\SecurityService;
use \Peneus\Resource;
use \Peneus\Systems\PageSystem\Page;

$page = (new Page(__DIR__))
	->SetTitle("Activate Account")
	->SetMasterPage('basic');

function getCode(): string {
	$code = Request::Instance()->QueryParams()->GetOrDefault('code', '');
	if (1 !== \preg_match(SecurityService::TOKEN_PATTERN, $code)) {
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
						"Activating account"
					),
					new Spinner([
						'id' => 'spinner',
						':size' => 'sm'
					])
				]),
				new Generic('div', ['class' => 'card-body'], [
					"Please wait while we activate your account.",
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
