<?php

declare(strict_types=1);

namespace App\Formula;

// Fachada pública do interpretador seguro (seção 12 do briefing): recebe a
// expressão original e as variáveis, devolve expressão + resultado, sem nunca
// executar código PHP arbitrário. Ponto único de entrada usado pelos serviços.
final class FormulaInterpreter
{
    private Lexer $lexer;
    private Parser $parser;
    private Evaluator $evaluator;

    public function __construct()
    {
        $this->lexer = new Lexer();
        $this->parser = new Parser();
        $this->evaluator = new Evaluator();
    }

    /**
     * @param array<string, float> $variables
     * @param bool $allowNegative Se falso (padrão), resultado negativo lança SafeFormulaException.
     * @return array{expression: string, result: float}
     */
    public function evaluate(string $expression, array $variables, bool $allowNegative = false): array
    {
        $tokens = $this->lexer->tokenize($expression);
        $ast = $this->parser->parse($tokens);
        $result = $this->evaluator->evaluate($ast, $variables);

        if (!$allowNegative && $result < 0) {
            throw new SafeFormulaException(sprintf(
                'Resultado negativo (%.3f) para a expressão "%s" — verifique variáveis/fórmula.',
                $result,
                $expression
            ));
        }

        return ['expression' => $expression, 'result' => $result];
    }
}
