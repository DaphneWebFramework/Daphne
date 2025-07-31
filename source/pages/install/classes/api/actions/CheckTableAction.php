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
use \Harmonia\Systems\ValidationSystem\Validator;
use \Peneus\Api\Actions\Management\ModelClassResolver;

class CheckTableAction extends Action
{
    use ModelClassResolver;

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
        $modelClass = $this->resolveModelClass($table);
        // 3
        return ['result' => $modelClass::TableExists()];
    }
}
