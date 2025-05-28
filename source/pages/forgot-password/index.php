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
use \Charis\FormComposites\FormEmailFL;
use \Charis\FormControls\FormHiddenInput;
use \Peneus\Systems\PageSystem\Page;

$page = (new Page(__DIR__))
	->SetTitle('Forgot Password')
	->SetMasterPage('basic');
?>
<?php $page->Begin()?>
	<main role="main" class="container">
		<div class="d-flex justify-content-center mt-5">
			<div class="card">
				<div class="card-header">
					<h5 class="card-title">Forgot your password?</h5>
				</div>
				<div class="card-body">
					<form spellcheck="false">
						<?=new FormHiddenInput([
							'name' => $page->CsrfTokenName(),
							'value' => $page->CsrfTokenValue()
						])?>
						<?=new FormEmailFL([
							':label' => 'Email address',
							':name' => 'email',
							':autocomplete' => 'off',
							':required' => true,
							':help' => "We'll send a password reset link to this address if it's registered."
						])?>
						<div class="d-flex justify-content-end">
							<?=new Button([
								'type' => 'submit'
							], 'Send')?>
						</div>
					</form>
				</div><!-- .card-body -->
			</div><!-- .card -->
		</div><!-- .d-flex -->
	</main>
<?php $page->End()?>
