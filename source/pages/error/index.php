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

use \Peneus\Systems\PageSystem\Page;
use \Harmonia\Http\Request;
use \Harmonia\Http\StatusCode;

$page = (new Page(__DIR__))
	->SetTitle('Error')
	->SetMasterPage('basic')
	->RemoveLibrary('jquery')
	->RemoveLibrary('leuce');

// Obtain the status code from the query parameter, defaulting to
// 400 if not provided.
$statusCode = StatusCode::tryFrom(
	(int)Request::Instance()->QueryParams()->Get('statusCode')
) ?? StatusCode::BadRequest;

// Ensure the actual HTTP response code reflects the displayed error.
if ($statusCode->value !== \http_response_code()) {
	\http_response_code($statusCode->value);
}

function mixedCaseToWords(string $mixedCase): string {
	// Converts a camelCase or PascalCase string (e.g., "NotFound") into
	// space-separated words (e.g., "Not Found").
	// See: http://stackoverflow.com/a/7599674/433790
	$words = \preg_split('/(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/',
		$mixedCase, -1, \PREG_SPLIT_NO_EMPTY);
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
