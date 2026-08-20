<?php

declare(strict_types=1);

// Mini test runner sem dependências externas (sem PHPUnit/composer), para que os
// testes rodem em qualquer hospedagem só com `php`. Cada teste é uma função
// registrada via test(); rode um arquivo com `php tests/XxxTest.php` ou todos com
// `php tests/run-all.php`.

require __DIR__ . '/../src/autoload.php';

/** @var list<array{name: string, fn: callable}> $GLOBALS['__tests'] */
$GLOBALS['__tests'] = [];

function test(string $name, callable $fn): void
{
    $GLOBALS['__tests'][] = ['name' => $name, 'fn' => $fn];
}

function assertEqualsFloat(float $expected, float $actual, string $message = '', float $epsilon = 0.0001): void
{
    if (abs($expected - $actual) > $epsilon) {
        throw new \RuntimeException(sprintf(
            '%sEsperado %.4f, obtido %.4f',
            $message !== '' ? $message . ': ' : '',
            $expected,
            $actual
        ));
    }
}

function assertTrue(bool $condition, string $message = 'Esperado true'): void
{
    if (!$condition) {
        throw new \RuntimeException($message);
    }
}

function assertThrows(string $exceptionClass, callable $fn, string $message = ''): void
{
    try {
        $fn();
    } catch (\Throwable $e) {
        if ($e instanceof $exceptionClass) {
            return;
        }
        throw new \RuntimeException(sprintf(
            '%sEsperado %s, mas foi lançado %s: %s',
            $message !== '' ? $message . ': ' : '',
            $exceptionClass,
            get_class($e),
            $e->getMessage()
        ));
    }
    throw new \RuntimeException(sprintf(
        '%sEsperado que %s fosse lançada, mas nada foi lançado.',
        $message !== '' ? $message . ': ' : '',
        $exceptionClass
    ));
}

function runRegisteredTests(string $fileLabel): int
{
    $failures = 0;
    foreach ($GLOBALS['__tests'] as $t) {
        try {
            ($t['fn'])();
            echo "  ok  - {$t['name']}\n";
        } catch (\Throwable $e) {
            $failures++;
            echo "FAIL  - {$t['name']}: {$e->getMessage()}\n";
        }
    }
    echo "{$fileLabel}: " . count($GLOBALS['__tests']) . ' teste(s), ' . $failures . " falha(s)\n";
    return $failures;
}
