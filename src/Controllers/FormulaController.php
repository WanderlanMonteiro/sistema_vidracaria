<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Formula\SafeFormulaException;
use App\Http\Request;
use App\Http\Response;
use App\Services\FormulaBuilderService;
use App\Services\FormulaCalculationService;
use App\Services\ProductionReleaseValidator;
use InvalidArgumentException;
use PDO;

final class FormulaController
{
    public function __construct(private readonly PDO $db)
    {
    }

    /** @param array<string, string> $params */
    public function index(Request $request, array $params): void
    {
        $sql = 'SELECT f.id, f.name, f.is_reference_only, f.status_code, t.name AS typology, pl.name AS product_line,
                       fv.id AS current_version_id, fv.version_number, fv.status_code AS version_status, fv.production_locked
                FROM formulas f
                LEFT JOIN typologies t ON t.id = f.typology_id
                LEFT JOIN product_lines pl ON pl.id = f.product_line_id
                LEFT JOIN formula_versions fv ON fv.id = f.current_version_id
                ORDER BY f.name';
        Response::json($this->db->query($sql)->fetchAll());
    }

    /** @param array<string, string> $params */
    public function show(Request $request, array $params): void
    {
        $formulaStmt = $this->db->prepare(
            'SELECT f.*, t.name AS typology, pl.name AS product_line
             FROM formulas f
             LEFT JOIN typologies t ON t.id = f.typology_id
             LEFT JOIN product_lines pl ON pl.id = f.product_line_id
             WHERE f.id = ?'
        );
        $formulaStmt->execute([$params['id']]);
        $formula = $formulaStmt->fetch();
        if ($formula === false) {
            Response::error('Fórmula não encontrada.', 404);
        }

        if ($formula['current_version_id'] !== null) {
            $componentsStmt = $this->db->prepare(
                'SELECT fc.*, p.code AS profile_code, p.name AS profile_name
                 FROM formula_components fc
                 LEFT JOIN profiles p ON p.id = fc.profile_id
                 WHERE fc.formula_version_id = ? ORDER BY fc.id'
            );
            $componentsStmt->execute([$formula['current_version_id']]);
            $formula['components'] = $componentsStmt->fetchAll();

            $deductionsStmt = $this->db->prepare('SELECT * FROM formula_deductions WHERE formula_version_id = ?');
            $deductionsStmt->execute([$formula['current_version_id']]);
            $formula['deductions'] = $deductionsStmt->fetchAll();
        }

        Response::json($formula);
    }

    /** @param array<string, string> $params */
    public function create(Request $request, array $params): void
    {
        try {
            $service = new FormulaBuilderService($this->db);
            $formula = $service->create($request->body());
            Response::json($formula, 201);
        } catch (InvalidArgumentException $e) {
            Response::error($e->getMessage(), 422);
        }
    }

    /** @param array<string, string> $params */
    public function checklist(Request $request, array $params): void
    {
        $formula = $this->currentVersionOrFail((int) $params['id']);
        $validator = new ProductionReleaseValidator($this->db);
        Response::json($validator->check((int) $formula['current_version_id']));
    }

    /** @param array<string, string> $params */
    public function calculate(Request $request, array $params): void
    {
        $formula = $this->currentVersionOrFail((int) $params['id']);
        $body = $request->body();

        $variables = [
            'L' => (float) ($body['L'] ?? 0),
            'A' => (float) ($body['A'] ?? 0),
            'N' => (float) ($body['N'] ?? 0),
            'E' => (float) ($body['E'] ?? 0),
            'P' => (float) ($body['P'] ?? 0),
        ];

        try {
            $service = new FormulaCalculationService($this->db);
            $result = $service->calculate((int) $formula['current_version_id'], $variables);
            Response::json($result);
        } catch (SafeFormulaException $e) {
            Response::error($e->getMessage(), 422);
        }
    }

    /** @return array<string, mixed> */
    private function currentVersionOrFail(int $formulaId): array
    {
        $stmt = $this->db->prepare('SELECT * FROM formulas WHERE id = ?');
        $stmt->execute([$formulaId]);
        $formula = $stmt->fetch();
        if ($formula === false) {
            Response::error('Fórmula não encontrada.', 404);
        }
        if ($formula['current_version_id'] === null) {
            Response::error('Fórmula sem versão atual definida.', 422);
        }
        return $formula;
    }
}
