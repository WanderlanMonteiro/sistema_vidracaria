<?php

declare(strict_types=1);

namespace App\Formula;

// Avalia a AST produzida pelo Parser. Nunca usa eval()/create_function/callables
// dinâmicos vindos da expressão — apenas números, as quatro operações e um
// dicionário fixo de funções autorizadas. Variáveis só resolvem se estiverem no
// mapa $variables fornecido pelo chamador (nunca superglobals, nunca getenv).
final class Evaluator
{
    /**
     * @param array<string, float> $variables Mapa de variáveis autorizadas (ex: ['L' => 1200.0, 'A' => 800.0]).
     */
    public function evaluate(array $ast, array $variables): float
    {
        return $this->visit($ast, $variables);
    }

    /** @param array<string, float> $variables */
    private function visit(array $node, array $variables): float
    {
        switch ($node['type']) {
            case 'Number':
                return $node['value'];

            case 'Variable':
                $name = $node['name'];
                if (!array_key_exists($name, $variables)) {
                    throw new SafeFormulaException(sprintf(
                        'Variável "%s" não está cadastrada/autorizada para esta fórmula.',
                        $name
                    ));
                }
                return $variables[$name];

            case 'UnaryMinus':
                return -$this->visit($node['operand'], $variables);

            case 'BinaryOp':
                $left = $this->visit($node['left'], $variables);
                $right = $this->visit($node['right'], $variables);
                return match ($node['op']) {
                    '+' => $left + $right,
                    '-' => $left - $right,
                    '*' => $left * $right,
                    '/' => $this->safeDivide($left, $right),
                    default => throw new SafeFormulaException('Operador desconhecido: ' . $node['op']),
                };

            case 'Call':
                return $this->callFunction($node['name'], $node['args'], $variables);

            default:
                throw new SafeFormulaException('Nó de expressão desconhecido.');
        }
    }

    private function safeDivide(float $left, float $right): float
    {
        if ($right === 0.0) {
            throw new SafeFormulaException('Divisão por zero na expressão da fórmula.');
        }
        return $left / $right;
    }

    /** @param list<array> $argNodes @param array<string, float> $variables */
    private function callFunction(string $name, array $argNodes, array $variables): float
    {
        $args = array_map(fn (array $n) => $this->visit($n, $variables), $argNodes);
        $upper = strtoupper($name);

        switch ($upper) {
            case 'ROUND':
                if (count($args) < 1 || count($args) > 2) {
                    throw new SafeFormulaException('Função ROUND() espera 1 ou 2 argumentos.');
                }
                return round($args[0], (int) ($args[1] ?? 0));
            case 'FLOOR':
                return floor($this->requireOneArg($upper, $args));
            case 'CEIL':
                return ceil($this->requireOneArg($upper, $args));
            case 'ABS':
                return abs($this->requireOneArg($upper, $args));
            case 'MIN':
                $this->requireAtLeastOneArg($upper, $args);
                return min($args);
            case 'MAX':
                $this->requireAtLeastOneArg($upper, $args);
                return max($args);
            default:
                throw new SafeFormulaException(sprintf('Função "%s" não é autorizada.', $name));
        }
    }

    /** @param list<float> $args */
    private function requireOneArg(string $fn, array $args): float
    {
        if (count($args) !== 1) {
            throw new SafeFormulaException(sprintf('Função %s() espera exatamente 1 argumento.', $fn));
        }
        return $args[0];
    }

    /** @param list<float> $args */
    private function requireAtLeastOneArg(string $fn, array $args): bool
    {
        if (count($args) < 1) {
            throw new SafeFormulaException(sprintf('Função %s() espera ao menos 1 argumento.', $fn));
        }
        return true;
    }
}
