<?php

declare(strict_types=1);

namespace App\Formula;

// Parser recursivo descendente clássico (precedência: + - abaixo de * /, unário
// depois, parênteses e chamadas de função no nível mais interno). Produz uma AST
// em array associativo — nunca gera nem executa código PHP a partir da expressão.
final class Parser
{
    /** @var list<array{type: string, value: string}> */
    private array $tokens;
    private int $position = 0;

    /** @param list<array{type: string, value: string}> $tokens */
    public function parse(array $tokens): array
    {
        $this->tokens = $tokens;
        $this->position = 0;

        $node = $this->parseExpression();
        $this->expect('EOF');
        return $node;
    }

    private function parseExpression(): array
    {
        $node = $this->parseTerm();
        while (in_array($this->current()['type'], ['PLUS', 'MINUS'], true)) {
            $op = $this->advance()['type'] === 'PLUS' ? '+' : '-';
            $node = ['type' => 'BinaryOp', 'op' => $op, 'left' => $node, 'right' => $this->parseTerm()];
        }
        return $node;
    }

    private function parseTerm(): array
    {
        $node = $this->parseUnary();
        while (in_array($this->current()['type'], ['STAR', 'SLASH'], true)) {
            $op = $this->advance()['type'] === 'STAR' ? '*' : '/';
            $node = ['type' => 'BinaryOp', 'op' => $op, 'left' => $node, 'right' => $this->parseUnary()];
        }
        return $node;
    }

    private function parseUnary(): array
    {
        if ($this->current()['type'] === 'MINUS') {
            $this->advance();
            return ['type' => 'UnaryMinus', 'operand' => $this->parseUnary()];
        }
        if ($this->current()['type'] === 'PLUS') {
            $this->advance();
            return $this->parseUnary();
        }
        return $this->parsePrimary();
    }

    private function parsePrimary(): array
    {
        $token = $this->current();

        if ($token['type'] === 'NUMBER') {
            $this->advance();
            return ['type' => 'Number', 'value' => (float) $token['value']];
        }

        if ($token['type'] === 'LPAREN') {
            $this->advance();
            $node = $this->parseExpression();
            $this->expect('RPAREN');
            return $node;
        }

        if ($token['type'] === 'IDENT') {
            $this->advance();
            if ($this->current()['type'] === 'LPAREN') {
                $this->advance();
                $args = [];
                if ($this->current()['type'] !== 'RPAREN') {
                    $args[] = $this->parseExpression();
                    while ($this->current()['type'] === 'COMMA') {
                        $this->advance();
                        $args[] = $this->parseExpression();
                    }
                }
                $this->expect('RPAREN');
                return ['type' => 'Call', 'name' => $token['value'], 'args' => $args];
            }
            return ['type' => 'Variable', 'name' => $token['value']];
        }

        throw new SafeFormulaException(sprintf('Token inesperado "%s" na expressão.', $token['value']));
    }

    private function current(): array
    {
        return $this->tokens[$this->position];
    }

    private function advance(): array
    {
        return $this->tokens[$this->position++];
    }

    private function expect(string $type): array
    {
        if ($this->current()['type'] !== $type) {
            throw new SafeFormulaException(sprintf('Esperado "%s", encontrado "%s".', $type, $this->current()['value']));
        }
        return $this->advance();
    }
}
