<?php declare(strict_types=1);
use \PHPUnit\Framework\TestCase;
use \PHPUnit\Framework\Attributes\CoversClass;

use \App\Translation;

use \Harmonia\Core\CPath;
use \TestToolkit\AccessHelper;

#[CoversClass(Translation::class)]
class TranslationTest extends TestCase
{
    private function systemUnderTest(string ...$mockedMethods): Translation
    {
        return $this->getMockBuilder(Translation::class)
            ->disableOriginalConstructor()
            ->onlyMethods($mockedMethods)
            ->getMock();
    }

    #region filePaths ----------------------------------------------------------

    function testFilePaths()
    {
        $sut = $this->systemUnderTest();

        $expected = [];
        // 1. Peneus translation file
        $reflectionClass = new \ReflectionClass(\Peneus\Translation::class);
        $expected[] = CPath::Join(
            \dirname($reflectionClass->getFileName()),
            'translations.json'
        );
        // 2. App translation file
        $reflectionClass = new \ReflectionClass(Translation::class);
        $expected[] = CPath::Join(
            \dirname($reflectionClass->getFileName()),
            'translations.json'
        );

        $actual = AccessHelper::CallMethod($sut, 'filePaths');

        $this->assertEquals($expected, $actual);
    }

    #endregion filePaths
}
