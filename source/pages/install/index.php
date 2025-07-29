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

require 'autoload.php';

use \Charis\Button;
use \Charis\Generic;
use \Charis\Spinner;
use \classes\api\actions\CreateAdminAccountAction;
use \classes\ui\InstallStep;
use \Harmonia\Config;
use \Harmonia\Http\Request;
use \Harmonia\Http\Response;
use \Harmonia\Http\StatusCode;
use \Peneus\Resource;
use \Peneus\Systems\PageSystem\Page;

$resource = Resource::Instance();

$installKey = Request::Instance()->QueryParams()->GetOrDefault('key', '');
if ($installKey === '') {
	(new Response)->Redirect($resource->ErrorPageUrl(StatusCode::BadRequest));
}
if ($installKey !== Config::Instance()->Option('InstallKey')) {
	(new Response)->Redirect($resource->ErrorPageUrl(StatusCode::Forbidden));
}

$page = (new Page(__DIR__))
	->SetTitle('Install')
	->SetMasterPage('basic')
	->AddLibrary('bootstrap-icons')
	->SetMeta('app:api-url', 'api')
	->SetMeta('app:install-key', $installKey);
?>
<?php $page->Begin()?>
	<?=new Generic('main', ['role' => 'main', 'class' => 'container my-5'], [
		new Generic('h2', ['class' => 'mb-4'], 'Installation'),
		new InstallStep('install-step-database'),
		new InstallStep('install-step-table-account'),
		new InstallStep('install-step-table-accountrole'),
		new InstallStep('install-step-table-pendingaccount'),
		new InstallStep('install-step-table-passwordreset'),
		new InstallStep('install-step-admin-account'),
		new Generic('div', [
			'id' => 'install-summary',
			'class' => 'alert alert-success d-none',
			'role' => 'alert'
		], [
			new Generic('h5', null, 'Installation Complete'),
			new Generic('p', null,
				"The application's database structure is complete. Missing " .
				"components have been created if necessary."
			),
			new Generic('p', null,
				"If no administrator account was present, a default one has " .
				"been created with the following credentials:"
			),
			new Generic('p', null, [
				new Generic('strong', null, 'Email: '),
				CreateAdminAccountAction::ADMIN_EMAIL,
				'<br>',
				new Generic('strong', null, 'Password: '),
				new Generic('em', null, 'Your install key'),
			]),
			new Generic('p', ['class' => 'mb-0'], [
				'You can change your email address later from the ',
				new Generic('a', [
					'href' => $resource->PageUrl('management'),
					'class' => 'alert-link'
				], 'management'),
				' page, and change your display name and password from the ',
				new Generic('a', [
					'href' => $resource->PageUrl('settings'),
					'class' => 'alert-link'],
				'settings'),
				' page.'
			]),
		])
	])?>
<?php $page->End()?>
