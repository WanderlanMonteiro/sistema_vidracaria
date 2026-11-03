<?php

declare(strict_types=1);

require __DIR__ . '/TestRunner.php';

use App\Formula\FormulaInterpreter;
use App\Formula\SafeFormulaException;

$interpreter = new FormulaInterpreter();

test('operações básicas com parênteses e precedência', function () use ($interpreter) {
    $r = $interpreter->evaluate('(2 + 3) * 4 - 1', []);
    assertEqualsFloat(19.0, $r['result']);
});

test('fórmula real Asa Flex: folha largura (L + 9) / 2', function () use ($interpreter) {
    // Tabela da p.16 do Livro 5 de Serralheria: vão de 1200mm de largura.
    $r = $interpreter->evaluate('(L + 9) / 2', ['L' => 1200.0]);
    assertEqualsFloat(604.5, $r['result']);
});

test('fórmula real Asa Flex: folha altura A - 38', function () use ($interpreter) {
    $r = $interpreter->evaluate('A - 38', ['A' => 1000.0]);
    assertEqualsFloat(962.0, $r['result']);
});

test('fórmula real Asa Flex: baguete largura (L - 129) / 2', function () use ($interpreter) {
    $r = $interpreter->evaluate('(L - 129) / 2', ['L' => 1200.0]);
    assertEqualsFloat(535.5, $r['result']);
});

test('função ROUND autorizada', function () use ($interpreter) {
    $r = $interpreter->evaluate('ROUND(L / 3, 2)', ['L' => 10.0]);
    assertEqualsFloat(3.33, $r['result']);
});

test('divisão por zero lança SafeFormulaException', function () use ($interpreter) {
    assertThrows(SafeFormulaException::class, fn () => $interpreter->evaluate('L / 0', ['L' => 10.0]));
});

test('variável não cadastrada lança SafeFormulaException', function () use ($interpreter) {
    assertThrows(SafeFormulaException::class, fn () => $interpreter->evaluate('L + X', ['L' => 10.0]));
});

test('função não autorizada (ex: tentativa de escape) lança SafeFormulaException', function () use ($interpreter) {
    assertThrows(SafeFormulaException::class, fn () => $interpreter->evaluate('SYSTEM(L)', ['L' => 10.0]));
});

test('caractere não permitido (tentativa de injeção) lança SafeFormulaException', function () use ($interpreter) {
    assertThrows(SafeFormulaException::class, fn () => $interpreter->evaluate('L; DROP TABLE profiles', ['L' => 10.0]));
});

test('resultado negativo é rejeitado por padrão', function () use ($interpreter) {
    assertThrows(SafeFormulaException::class, fn () => $interpreter->evaluate('L - 100', ['L' => 10.0]));
});

test('resultado negativo permitido explicitamente quando allowNegative=true', function () use ($interpreter) {
    $r = $interpreter->evaluate('L - 100', ['L' => 10.0], true);
    assertEqualsFloat(-90.0, $r['result']);
});

test('unário e múltiplos operadores', function () use ($interpreter) {
    $r = $interpreter->evaluate('-(-L)', ['L' => 5.0]);
    assertEqualsFloat(5.0, $r['result']);
});

exit(runRegisteredTests('FormulaInterpreterTest') > 0 ? 1 : 0);
