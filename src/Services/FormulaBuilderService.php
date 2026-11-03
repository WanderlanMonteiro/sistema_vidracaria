<?php

declare(strict_types=1);

namespace App\Services;

use App\Formula\Lexer;
use App\Formula\Parser;
use App\Formula\SafeFormulaException;
use InvalidArgumentException;
use PDO;

/**
 * Cria uma fórmula nova (formulas + formula_versions v1 + formula_components,
 * opcionalmente formula_deductions) em uma única transação. A fórmula nasce
 * sempre PENDENTE e com production_locked=1 -- criar pelo formulário não
 * libera nada para produção, é a mesma régua da seção 13 aplicada a qualquer
 * outra fórmula (ver ProductionReleaseValidator e docs/GOVERNANCA_DE_DADOS.md).
 * A expressão de cada componente só é validada sintaticamente aqui (o
 * interpretador seguro não executa, só confirma que o texto é uma expressão
 * válida) -- valores/variáveis reais só existem no momento do cálculo.
 */
final class FormulaBuilderService
{
    private Lexer $lexer;
    private Parser $parser;

    public function __construct(private readonly PDO $db)
    {
        $this->lexer = new Lexer();
        $this->parser = new Parser();
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed> a fórmula criada, no mesmo formato de FormulaController::show()
     */
    public function create(array $data): array
    {
        $name = trim((string) ($data['name'] ?? ''));
        if ($name === '') {
            throw new InvalidArgumentException('name é obrigatório.');
        }

        $components = $data['components'] ?? [];
        if (!is_array($components) || $components === []) {
            throw new InvalidArgumentException('Informe ao menos um componente em "components".');
        }
        foreach ($components as $i => $component) {
            $this->validateComponent($component, $i);
        }

        $deductions = $data['deductions'] ?? [];
        if (!is_array($deductions)) {
            throw new InvalidArgumentException('"deductions" precisa ser uma lista.');
        }

        $this->db->beginTransaction();
        try {
            $formulaId = $this->insertFormula($name, $data);
            $versionId = $this->insertVersion($formulaId, $data);

            $stmt = $this->db->prepare('UPDATE formulas SET current_version_id = ? WHERE id = ?');
            $stmt->execute([$versionId, $formulaId]);

            foreach ($components as $component) {
                $this->insertComponent($versionId, $component);
            }
            foreach ($deductions as $deduction) {
                $this->insertDeduction($versionId, $deduction);
            }

            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }

        return $this->load($formulaId);
    }

    /** @param mixed $component */
    private function validateComponent($component, int $index): void
    {
        if (!is_array($component)) {
            throw new InvalidArgumentException("components[{$index}] precisa ser um objeto.");
        }
        $role = trim((string) ($component['component_role'] ?? ''));
        if ($role === '') {
            throw new InvalidArgumentException("components[{$index}].component_role é obrigatório.");
        }
        $expression = $component['expression'] ?? null;
        if ($expression !== null && $expression !== '') {
            try {
                $this->parser->parse($this->lexer->tokenize((string) $expression));
            } catch (SafeFormulaException $e) {
                throw new InvalidArgumentException(
                    "components[{$index}].expression inválida (\"{$expression}\"): {$e->getMessage()}"
                );
            }
        }
    }

    /** @param array<string, mixed> $data */
    private function insertFormula(string $name, array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO formulas (name, typology_id, product_line_id, description, is_reference_only, status_code, source_reference_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $name,
            $this->intOrNull($data['typology_id'] ?? null),
            $this->intOrNull($data['product_line_id'] ?? null),
            $data['description'] ?? null,
            !empty($data['is_reference_only']) ? 1 : 0,
            'PENDENTE',
            $this->intOrNull($data['source_reference_id'] ?? null),
        ]);
        return (int) $this->db->lastInsertId();
    }

    /** @param array<string, mixed> $data */
    private function insertVersion(int $formulaId, array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO formula_versions (formula_id, version_number, notes, rounding_mode, rounding_decimals, status_code, production_locked, created_by)
             VALUES (?, 1, ?, ?, ?, ?, 1, ?)'
        );
        $stmt->execute([
            $formulaId,
            $data['notes'] ?? null,
            $data['rounding_mode'] ?? 'ROUND',
            (int) ($data['rounding_decimals'] ?? 1),
            'PENDENTE',
            $data['created_by'] ?? null,
        ]);
        return (int) $this->db->lastInsertId();
    }

    /** @param array<string, mixed> $component */
    private function insertComponent(int $versionId, array $component): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO formula_components (formula_version_id, component_role, profile_id, quantity, expression, cut_angle_deg, notes, source_reference_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $versionId,
            $component['component_role'],
            $this->intOrNull($component['profile_id'] ?? null),
            (int) ($component['quantity'] ?? 1),
            ($component['expression'] ?? null) !== '' ? ($component['expression'] ?? null) : null,
            isset($component['cut_angle_deg']) ? (float) $component['cut_angle_deg'] : null,
            $component['notes'] ?? null,
            $this->intOrNull($component['source_reference_id'] ?? null),
        ]);
    }

    /** @param mixed $deduction */
    private function insertDeduction(int $versionId, $deduction): void
    {
        if (!is_array($deduction)) {
            throw new InvalidArgumentException('Cada item de "deductions" precisa ser um objeto.');
        }
        $type = $deduction['deduction_type'] ?? null;
        if (!in_array($type, ['DESCONTO', 'FOLGA'], true)) {
            throw new InvalidArgumentException('deduction_type precisa ser DESCONTO ou FOLGA.');
        }
        $stmt = $this->db->prepare(
            'INSERT INTO formula_deductions (formula_version_id, formula_component_id, deduction_type, value_mm, description, status_code, source_reference_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $versionId,
            $this->intOrNull($deduction['formula_component_id'] ?? null),
            $type,
            isset($deduction['value_mm']) ? (float) $deduction['value_mm'] : null,
            $deduction['description'] ?? null,
            'PENDENTE',
            $this->intOrNull($deduction['source_reference_id'] ?? null),
        ]);
    }

    /** @return array<string, mixed> */
    private function load(int $formulaId): array
    {
        $stmt = $this->db->prepare('SELECT * FROM formulas WHERE id = ?');
        $stmt->execute([$formulaId]);
        $formula = $stmt->fetch();

        $componentsStmt = $this->db->prepare('SELECT * FROM formula_components WHERE formula_version_id = ? ORDER BY id');
        $componentsStmt->execute([$formula['current_version_id']]);
        $formula['components'] = $componentsStmt->fetchAll();

        $deductionsStmt = $this->db->prepare('SELECT * FROM formula_deductions WHERE formula_version_id = ?');
        $deductionsStmt->execute([$formula['current_version_id']]);
        $formula['deductions'] = $deductionsStmt->fetchAll();

        return $formula;
    }

    private function intOrNull(mixed $value): ?int
    {
        return ($value === null || $value === '') ? null : (int) $value;
    }
}
