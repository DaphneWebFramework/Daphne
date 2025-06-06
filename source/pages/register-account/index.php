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
use \Charis\FormComposites\FormTextFL;
use \Charis\FormControls\FormHiddenInput;
use \Charis\Generic;
use \Peneus\Resource;
use \Peneus\Systems\PageSystem\Page;

$page = (new Page(__DIR__))
	->SetTitle('Register Account')
	->SetMasterPage('basic');

$resource = Resource::Instance();
?>
<?php $page->Begin()?>
	<main role="main" class="container">
		<div class="d-flex justify-content-center mt-5">
			<div class="card">
				<div class="card-header">
					<h5 class="card-title">Create your account</h5>
				</div>
				<div class="card-body">
					<?=new Form(null, [
						new FormHiddenInput([
							'name' => $page->CsrfTokenName(),
							'value' => $page->CsrfTokenValue()
						]),
						new FormEmailFL([
							':label' => 'Email address',
							':name' => 'email',
							':autocomplete' => 'off',
							':required' => true
						]),
						new FormPasswordFL([
							':label' => 'Password',
							':name' => 'password',
							':autocomplete' => 'new-password',
							':required' => true
						]),
						new FormTextFL([
							':label' => 'Display name',
							':name' => 'displayName',
							':required' => true
						]),
						new Generic('div', ['class' => 'd-flex justify-content-end'], [
							new Button([
								'type' => 'submit'
							], 'Register')
						])
					])?>
				</div><!-- .card-body -->
				<div class="card-footer text-center">
					Already have an account?
					<a href="<?=$resource->LoginPageUrl('home')?>">
						Log in
					</a>
				</div><!-- .card-footer -->
			</div><!-- .card -->
		</div><!-- .d-flex -->
	</main>
<?php $page->End()?>
