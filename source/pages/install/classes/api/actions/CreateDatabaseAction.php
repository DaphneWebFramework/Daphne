<?php declare(strict_types=1);
/**
 * CreateDatabaseAction.php
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

class CreateDatabaseAction extends Action
{
    protected function onExecute(): mixed
    {
        // 1
        $config = Config::Instance();
        $host = $config->OptionOrDefault('DatabaseHost', '');
        $username = $config->OptionOrDefault('DatabaseUsername', '');
        $password = $config->OptionOrDefault('DatabasePassword', '');
        $charset = $config->Option('DatabaseCharset');
        $collation = $config->Option('DatabaseCollation');
        $name = $config->OptionOrDefault('DatabaseName', '');
        // 2
        $connection = new Connection($host, $username, $password, $charset);
        // 3
        $clauses = [];
        $clauses[] = "CREATE DATABASE `{$this->escapeBackticks($name)}`";
        if (!empty($charset)) {
            $clauses[] = "CHARACTER SET '{$connection->EscapeString($charset)}'";
        }
        if (!empty($collation)) {
            $clauses[] = "COLLATE '{$connection->EscapeString($collation)}'";
        }
        // 4
        $query = (new RawQuery)
            ->Sql(\implode(' ', $clauses));
        // 5
        $connection->Execute($query);
        return null;
    }

    protected function escapeBackticks(string $string): string
    {
        return \str_replace('`', '``', $string);
    }
}
