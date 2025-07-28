<?php declare(strict_types=1);
/**
 * CheckDatabaseAction.php
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

use \Harmonia\Config;
use \Harmonia\Systems\DatabaseSystem\Connection;
use \Harmonia\Systems\DatabaseSystem\Queries\RawQuery;

class CheckDatabaseAction extends Action
{
    protected function onExecute(): mixed
    {
        // 1
        $config = Config::Instance();
        $host = $config->OptionOrDefault('DatabaseHost', '');
        $username = $config->OptionOrDefault('DatabaseUsername', '');
        $password = $config->OptionOrDefault('DatabasePassword', '');
        $charset = $config->Option('DatabaseCharset');
        $name = $config->OptionOrDefault('DatabaseName', '');
        // 2
        $connection = new Connection($host, $username, $password, $charset);
        // 3
        $query = (new RawQuery)
            ->Sql("SHOW DATABASES LIKE '{$connection->EscapeString($name)}'");
        // 4
        $result = $connection->Execute($query); // returns `?MySQLiResult`
        return ['result' => $result !== null && $result->num_rows > 0];
    }
}
