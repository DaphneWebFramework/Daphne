<?php declare(strict_types=1);
/**
 * CheckTableAction.php
 *
 * (C) 2025 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

namespace classes\api\actions;

use \Peneus\Api\Actions\Action;

use \Harmonia\Http\Request;
use \Harmonia\Systems\DatabaseSystem\Database;
use \Harmonia\Systems\DatabaseSystem\Queries\RawQuery;
use \Harmonia\Systems\ValidationSystem\Validator;

class CheckTableAction extends Action
{
    protected function onExecute(): mixed
    {
        // 1
        $validator = new Validator([
            'table' => [
                'required',
                'string',
                'regex:/^[a-zA-Z_][a-zA-Z0-9_]{0,63}$/'
            ]
        ]);
        $dataAccessor = $validator->Validate(Request::Instance()->QueryParams());
        $table = $dataAccessor->GetField('table');
        // 2
        $database = Database::Instance();
        $query = (new RawQuery)
            ->Sql("SHOW TABLES LIKE '{$database->EscapeString($table)}'");
        // 3
        $resultSet = $database->Execute($query);
        return ['result' => $resultSet !== null && $resultSet->RowCount() > 0];
    }
}
