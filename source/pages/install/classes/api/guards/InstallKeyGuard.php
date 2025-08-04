<?php declare(strict_types=1);
/**
 * InstallKeyGuard.php
 *
 * (C) 2025 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

namespace classes\api\guards;

use \Peneus\Api\Guards\IGuard;

use \Harmonia\Config;
use \Harmonia\Http\Request;

class InstallKeyGuard implements IGuard
{
    public function Verify(): bool
    {
        $installKey = Config::Instance()->Option('InstallKey');
        if (!\is_string($installKey) || $installKey === '') {
            return false;
        }
        return $installKey === Request::Instance()->QueryParams()->Get('key');
    }
}
