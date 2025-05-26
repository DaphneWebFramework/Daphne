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

use \Charis\FormControls\FormHiddenInput;
use \Harmonia\Http\Request;
use \Peneus\Systems\PageSystem\Page;

$page = (new Page(__DIR__))
	->SetTitle('Activate Account')
	->SetMasterPage('basic');
?>
<?php $page->Begin()?>
	<main role="main" class="container">
		<div class="d-flex justify-content-center mt-5">
			<div class="card">
				<div class="card-header d-flex align-items-baseline justify-content-between">
					<h5 class="card-title">Activating account</h5>
					<div id="spinner" class="spinner-border spinner-border-sm" role="status">
						<span class="visually-hidden">Loading...</span>
					</div>
				</div>
				<div class="card-body">
					Please wait while we activate your account.
					<form class="d-none">
						<?=new FormHiddenInput([
							'name' => $page->CsrfTokenName(),
							'value' => $page->CsrfTokenValue()
						])?>
						<?=new FormHiddenInput([
							'name' => 'activationCode',
							'value' => Request::Instance()->QueryParams()->GetOrDefault('code', '')
						])?>
					</form>
				</div><!-- .card-body -->
			</div><!-- .card -->
		</div><!-- .d-flex -->
	</main>
<?php $page->End()?>
