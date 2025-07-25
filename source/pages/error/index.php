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

use \Harmonia\Http\Request;
use \Harmonia\Http\StatusCode;
use \Peneus\Systems\PageSystem\Page;

$page = (new Page(__DIR__))
	->SetTitle(_T('error.page_title'))
	->SetMasterPage('basic')
	->RemoveLibrary('jquery')
	->RemoveLibrary('leuce')
	->RemoveLibrary('app');

$statusCode = StatusCode::tryFrom(
	(int)Request::Instance()->QueryParams()->Get('statusCode')
) ?? StatusCode::BadRequest;

if ($statusCode->value !== \http_response_code()) {
	\http_response_code($statusCode->value);
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
?>
<?php $page->Begin()?>
	<main role="main">
		<div class="text-center">
			<h1><?=$statusCode->value?></h1>
			<h2><?=mixedCaseToWords($statusCode->name)?></h2>
		</div>
	</main>
<?php $page->End()?>
