<?php

declare(strict_types=1);

namespace App\Services;

use App\Formula\FormulaInterpreter;
use App\Formula\SafeFormulaException;
use PDO;

/**
 * Carrega uma formula_version e seus formula_components do banco e avalia cada
 * expressão com o interpretador seguro, dado L/A/N/E/P de um vão real. Não decide
 * se a fórmula pode ser usada em produção — isso é papel do ProductionReleaseValidator.
 */
final class FormulaCalculationService
{
    private FormulaInterpreter $interpreter;

    public function __construct(private readonly PDO $db)
    {
        $this->interpreter = new FormulaInterpreter();
    }

    /**
     * @param array<string, float> $variables ex: ['L' => 1200.0, 'A' => 1000.0, 'N' => 2, 'E' => 6, 'P' => 0]
     * @param bool $requireReleased Se true (padrão -- usado pela calculadora de produção e por
     *        /formulas/{id}/calcular), recusa calcular fórmula bloqueada. Se false (usado só pelo
     *        relatório de compras do orçamento, que é uma estimativa de material, não uma ordem de
     *        corte), calcula mesmo fórmula ainda PENDENTE -- o chamador é responsável por deixar
     *        claro pro usuário que o número é uma estimativa não conferida.
     * @return array{formula_version_id: int, components: list<array<string, mixed>>}
     */
    public function calculate(int $formulaVersionId, array $variables, bool $requireReleased = true): array
    {
        $versionStmt = $this->db->prepare('SELECT * FROM formula_versions WHERE id = ?');
        $versionStmt->execute([$formulaVersionId]);
        $version = $versionStmt->fetch();
        if ($version === false) {
            throw new SafeFormulaException("formula_version {$formulaVersionId} não encontrada.");
        }

        if ($requireReleased && (bool) $version['production_locked'] && $version['status_code'] !== 'LIBERADO_PRODUCAO') {
            throw new SafeFormulaException(
                "Esta versão de fórmula está bloqueada para uso produtivo (status: {$version['status_code']}). " .
                'Complete o checklist da seção 13 antes de calcular para produção.'
            );
        }

        $componentsStmt = $this->db->prepare(
            'SELECT * FROM formula_components WHERE formula_version_id = ? ORDER BY id'
        );
        $componentsStmt->execute([$formulaVersionId]);
        $components = $componentsStmt->fetchAll();

        $decimals = (int) $version['rounding_decimals'];
        $roundingMode = $version['rounding_mode'];

        $results = [];
        foreach ($components as $component) {
            if ($component['expression'] === null) {
                $results[] = [
                    'component_role' => $component['component_role'],
                    'profile_id' => $component['profile_id'],
                    'quantity' => (int) $component['quantity'],
                    'expression' => null,
                    'result_mm' => null,
                    'notes' => $component['notes'],
                ];
                continue;
            }

            $evaluated = $this->interpreter->evaluate($component['expression'], $variables);
            $results[] = [
                'component_role' => $component['component_role'],
                'profile_id' => $component['profile_id'],
                'quantity' => (int) $component['quantity'],
                'expression' => $evaluated['expression'],
                'result_mm' => $this->applyRounding($evaluated['result'], $roundingMode, $decimals),
                'notes' => $component['notes'],
            ];
        }

        return ['formula_version_id' => $formulaVersionId, 'components' => $results];
    }

    private function applyRounding(float $value, string $mode, int $decimals): float
    {
        return match ($mode) {
            'FLOOR' => floor($value * 10 ** $decimals) / 10 ** $decimals,
            'CEIL' => ceil($value * 10 ** $decimals) / 10 ** $decimals,
            'ROUND' => round($value, $decimals),
            default => $value,
        };
    }
}
