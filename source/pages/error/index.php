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

use \Charis\Generic;
use \Harmonia\Http\Request;
use \Harmonia\Http\StatusCode;
use \Peneus\Systems\PageSystem\Page;

function statusCode(): StatusCode {
	$code = (int)Request::Instance()->QueryParams()->Get('statusCode');
	return StatusCode::tryFrom($code) ?? StatusCode::BadRequest;
}

function mixedCaseToWords(string $mixedCase): string {
	// See: http://stackoverflow.com/a/7599674/433790
	$words = \preg_split(
		'/(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/',
		$mixedCase,
		-1,
		\PREG_SPLIT_NO_EMPTY
	);
	return $words === false ? $mixedCase : \implode(' ', $words);
}

$statusCode = statusCode();
\http_response_code($statusCode->value);

$page = (new Page(__DIR__))
	->SetTitle("Error")
	->SetMasterPage('basic')
	->SetCanonicalSuffix((string)$statusCode->value);
?>
<?php $page->Begin()?>
	<?=new Generic('main', ['role' => 'main'], [
		new Generic('div', ['class' => 'text-center'], [
			new Generic('h1', null, (string)$statusCode->value),
			new Generic('h2', null, mixedCaseToWords($statusCode->name))
		])
	])?>
<?php $page->End()?>
