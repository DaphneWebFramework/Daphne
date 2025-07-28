<?php declare(strict_types=1);
/**
 * InstallStep.php
 *
 * (C) 2025 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

namespace classes\ui;

use \Charis\Component;

use \Charis\Generic;
use \Charis\Spinner;

class InstallStep extends Component
{
    public function __construct(string $id)
    {
        $content = [
            new Generic('span', ['id' => "{$id}-icon"], [
                new Spinner([':size' => 'sm', 'class' => 'text-primary'])
            ]),
            new Generic('span', ['id' => "{$id}-text"])
        ];
        parent::__construct(['id' => $id], $content);
    }

    protected function getTagName(): string
    {
        return 'div';
    }

    protected function getDefaultAttributes(): array
    {
        return [
            'class' => 'install-step d-none'
        ];
    }
}
