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

use \Charis\Generic;
use \classes\api\actions\CreateAdminAccountAction;
use \classes\ui\InstallStep;
use \Harmonia\Config;
use \Harmonia\Http\Request;
use \Harmonia\Http\Response;
use \Harmonia\Http\StatusCode;
use \Peneus\Resource;
use \Peneus\Systems\PageSystem\Page;

function installKey(): string {
	$key = Request::Instance()->QueryParams()->Get('key');
	if (!\is_string($key) || $key === '') {
		Response::Redirect(Resource::Instance()->ErrorPageUrl(StatusCode::BadRequest));
	}
	if ($key !== Config::Instance()->Option('InstallKey')) {
		Response::Redirect(Resource::Instance()->ErrorPageUrl(StatusCode::Forbidden));
	}
	return $key;
}

$page = (new Page(__DIR__))
	->SetTitle('Install')
	->SetMasterPage('basic')
	->AddLibrary('bootstrap-icons')
	->SetMeta('app:api-url', 'api')
	->SetMeta('app:install-key', installKey());
?>
<?php $page->Begin()?>
	<?=new Generic('main', ['role' => 'main', 'class' => 'container my-5'], [
		new Generic('h2', ['class' => 'mb-4'], 'Installation'),
		new InstallStep('install-step-database'),
		new InstallStep('install-step-table-account'),
		new InstallStep('install-step-table-accountrole'),
		new InstallStep('install-step-table-accountview'),
		new InstallStep('install-step-table-pendingaccount'),
		new InstallStep('install-step-table-passwordreset'),
		new InstallStep('install-step-table-persistentlogin'),
		new InstallStep('install-step-admin-account'),
		new Generic('div', [
			'id' => 'install-summary',
			'class' => 'alert alert-success mb-0 d-none',
			'role' => 'alert'
		], [
			new Generic('h5', null, 'Installation Complete'),
			new Generic('p', null,
				"The application's database structure is now fully set up. " .
				"Any missing components have been created as needed."
			),
			new Generic('p', null,
				"If no administrator account existed, a default one has been " .
				"created with the following credentials:"
			),
			new Generic('p', null, [
				new Generic('strong', null, 'Email: '),
				CreateAdminAccountAction::ADMIN_EMAIL,
				'<br>',
				new Generic('strong', null, 'Password: '),
				new Generic('em', null, 'Your installation key'),
			]),
			new Generic('p', null, [
				"You can update the administrator account's email address on the ",
				new Generic('a', [
					'href' => Resource::Instance()->PageUrl('management'),
					'class' => 'alert-link'
				], "management"),
				" page, and change its display name and password on the ",
				new Generic('a', [
					'href' => Resource::Instance()->PageUrl('settings'),
					'class' => 'alert-link'
				], "settings"),
				" page."
			]),
			new Generic('p', null,
				"In addition to the standard framework tables created here, " .
				"any custom application tables can be managed from the Entity " .
				"Mappings panel on the management page."
			),
		])
	])?>
<?php $page->End()?>
