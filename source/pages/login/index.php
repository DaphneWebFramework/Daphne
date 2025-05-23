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
use \Charis\FormComposites\FormPasswordFL;
use \Charis\FormControls\FormHiddenInput;
use \Peneus\Resource;
use \Peneus\Systems\PageSystem\Page;

$page = (new Page(__DIR__))
	->SetTitle('Login')
	->SetMasterPage('basic');
?>
<?php $page->Begin()?>
	<main role="main" class="container">
		<div class="d-flex justify-content-center mt-5">
<?php if ($page->LoggedInAccount() !== null):?>
			<div class="card">
				<div class="card-header">
					<h5 class="card-title">You've successfully logged in</h5>
				</div>
				<div class="card-body">
					<p>You can return to the home page or log out to use a different account.</p>
					<div class="d-flex justify-content-end gap-2">
						<?=new Button([
							'id' => 'homeButton',
							'data-href' => Resource::Instance()->PageUrl('home')
						], 'Home')?>
						<?=new Button([
							'id' => 'logoutButton',
							'class' => 'btn-secondary'
						], 'Log out')?>
					</div>
				</div>
			</div>
<?php else:?>
			<div class="card">
				<div class="card-header">
					<h5 class="card-title">Log in</h5>
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
							':autocomplete' => 'username',
							':required' => true
						])?>
						<?=new FormPasswordFL([
							':label' => 'Password',
							':name' => 'password',
							':autocomplete' => 'current-password',
							':required' => true
						])?>
						<div class="d-flex justify-content-end">
							<?=new Button([
								'type' => 'submit'
							], 'Log in')?>
						</div>
					</form>
				</div><!-- .card-body -->
			</div><!-- .card -->
<?php endif?>
		</div><!-- .d-flex -->
	</main>
<?php $page->End()?>
