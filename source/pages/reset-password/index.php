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
use \Charis\FormComposites\FormPasswordFL;
use \Charis\FormControls\FormEmailInput;
use \Charis\FormControls\FormHiddenInput;
use \Harmonia\Http\Request;
use \Harmonia\Http\Response;
use \Harmonia\Http\StatusCode;
use \Harmonia\Services\SecurityService;
use \Peneus\Model\Account;
use \Peneus\Model\PasswordReset;
use \Peneus\Resource;
use \Peneus\Systems\PageSystem\Page;

$page = (new Page(__DIR__))
	->SetTitle('Reset Password')
	->SetMasterPage('basic');

function redirectToErrorPage(StatusCode $statusCode): never {
	(new Response)->Redirect(Resource::Instance()->ErrorPageUrl($statusCode));
}

function resolveResetCode(): string {
	$resetCode = Request::Instance()->QueryParams()->GetOrDefault('code', '');
	if (!SecurityService::Instance()->IsValidToken($resetCode)) {
		redirectToErrorPage(StatusCode::NotFound);
	}
	return $resetCode;
}

function resolveEmail(string $resetCode): string {
	$passwordReset = PasswordReset::FindFirst(
		'resetCode = :resetCode',
		['resetCode' => $resetCode]
	);
	if ($passwordReset === null) {
		redirectToErrorPage(StatusCode::NotFound);
	}
	$account = Account::FindById($passwordReset->accountId);
	if ($account === null) {
		redirectToErrorPage(StatusCode::NotFound);
	}
	return $account->email;
}

$resetCode = resolveResetCode();
$email = resolveEmail($resetCode);
?>
<?php $page->Begin()?>
	<main role="main" class="container">
		<div class="d-flex justify-content-center mt-5">
			<div class="card">
				<div class="card-header">
					<h5 class="card-title">Choose a new password</h5>
				</div>
				<div class="card-body">
					<form spellcheck="false">
						<?=new FormHiddenInput([
							'name' => $page->CsrfTokenName(),
							'value' => $page->CsrfTokenValue()
						])?>
						<?=new FormHiddenInput([
							'name' => 'resetCode',
							'value' => $resetCode
						])?>
						<?=new FormEmailInput([
							'class' => 'd-none',
							'value' => $email,
							'autocomplete' => 'username'
						])?>
						<?=new FormPasswordFL([
							':label' => 'New password',
							':name' => 'newPassword',
							':autocomplete' => 'new-password',
							':required' => true
						])?>
						<div class="d-flex justify-content-end">
							<?=new Button([
								'type' => 'submit'
							], 'Reset Password')?>
						</div>
					</form>
				</div><!-- .card-body -->
			</div><!-- .card -->
		</div><!-- .d-flex -->
	</main>
<?php $page->End()?>
