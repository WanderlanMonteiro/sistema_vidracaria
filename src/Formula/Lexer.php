<?php

declare(strict_types=1);

namespace App\Formula;

// Tokeniza uma expressão de fórmula. Só reconhece: números, identificadores
// (variáveis/funções), operadores + - * /, parênteses e vírgula. Qualquer outro
// caractere é rejeitado — não existe modo "passthrough" para texto arbitrário.
final class Lexer
{
    /** @return list<array{type: string, value: string}> */
    public function tokenize(string $expression): array
    {
        $tokens = [];
        $length = strlen($expression);
        $i = 0;

        while ($i < $length) {
            $char = $expression[$i];

            if (ctype_space($char)) {
                $i++;
                continue;
            }

            if (ctype_digit($char) || ($char === '.' && $i + 1 < $length && ctype_digit($expression[$i + 1]))) {
                $start = $i;
                $seenDot = false;
                while ($i < $length && (ctype_digit($expression[$i]) || ($expression[$i] === '.' && !$seenDot))) {
                    if ($expression[$i] === '.') {
                        $seenDot = true;
                    }
                    $i++;
                }
                $tokens[] = ['type' => 'NUMBER', 'value' => substr($expression, $start, $i - $start)];
                continue;
            }

            if (ctype_alpha($char) || $char === '_') {
                $start = $i;
                while ($i < $length && (ctype_alnum($expression[$i]) || $expression[$i] === '_')) {
                    $i++;
                }
                $tokens[] = ['type' => 'IDENT', 'value' => substr($expression, $start, $i - $start)];
                continue;
            }

            $simple = ['+' => 'PLUS', '-' => 'MINUS', '*' => 'STAR', '/' => 'SLASH', '(' => 'LPAREN', ')' => 'RPAREN', ',' => 'COMMA'];
            if (isset($simple[$char])) {
                $tokens[] = ['type' => $simple[$char], 'value' => $char];
                $i++;
                continue;
            }

            throw new SafeFormulaException(sprintf('Caractere não permitido na expressão: "%s" (posição %d).', $char, $i));
        }

        $tokens[] = ['type' => 'EOF', 'value' => ''];
        return $tokens;
    }
}
