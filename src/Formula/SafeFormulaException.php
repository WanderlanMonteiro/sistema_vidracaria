<?php

declare(strict_types=1);

namespace App\Formula;

// Lançada para toda condição insegura ou inválida durante o parse/avaliação de uma
// expressão de fórmula: variável não cadastrada, função não autorizada, divisão por
// zero, resultado negativo não permitido, sintaxe inválida. Nunca é convertida
// silenciosamente — o chamador deve tratar/propagar.
final class SafeFormulaException extends \RuntimeException
{
}
