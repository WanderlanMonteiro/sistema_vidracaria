<?php

declare(strict_types=1);

namespace App\Services;

use PDO;

/**
 * Relatório de compras e de têmpera a partir dos itens de um orçamento.
 *
 * Perfis: só é calculado para itens com formula_version_id + largura/altura
 * preenchidas -- usa FormulaCalculationService em modo "estimativa"
 * (requireReleased=false), porque orçar não é a mesma coisa que autorizar
 * produção; cada perfil no retorno carrega o status da fórmula que gerou o
 * número, pra deixar claro quando é uma estimativa de fórmula ainda não
 * liberada (ver docs/GOVERNANCA_DE_DADOS.md).
 *
 * Vidro: não depende de fórmula (nenhuma fórmula cadastrada hoje decompõe
 * vidro em componente) -- vem direto de quote_items.glass_type_id + medidas.
 * Fora de esquadro: usa sempre a MAIOR largura e a MAIOR altura informadas
 * (regra pedida explicitamente pelo usuário), nunca a média nem a menor.
 *
 * Acessórios: lista avulsa (quote_accessories) somada por item -- não existe
 * vínculo automático fórmula/tipologia -> ferragens no sistema ainda.
 */
final class QuoteReportService
{
    private FormulaCalculationService $calculationService;

    public function __construct(private readonly PDO $db)
    {
        $this->calculationService = new FormulaCalculationService($db);
    }

    /** @return array{profiles: list<array<string, mixed>>, glass: list<array<string, mixed>>, accessories: list<array<string, mixed>>} */
    public function purchaseReport(int $quoteId): array
    {
        $items = $this->quoteItems($quoteId);

        $profileTotals = [];
        $glassTotals = [];

        foreach ($items as $item) {
            $width = $this->maxDimension($item['width_mm'], $item['width_mm_2']);
            $height = $this->maxDimension($item['height_mm'], $item['height_mm_2']);
            $quantity = (float) $item['quantity'];

            if ($item['formula_version_id'] !== null && $width !== null && $height !== null) {
                $this->accumulateProfiles($profileTotals, (int) $item['formula_version_id'], $width, $height, $quantity, $item['description']);
            }

            if ($item['glass_type_id'] !== null && $width !== null && $height !== null) {
                $this->accumulateGlass($glassTotals, (int) $item['glass_type_id'], $width, $height, $quantity);
            }
        }

        return [
            'profiles' => array_values($profileTotals),
            'glass' => array_values($glassTotals),
            'accessories' => $this->accessoriesReport($quoteId),
        ];
    }

    /** @return list<array<string, mixed>> */
    public function temperingReport(int $quoteId): array
    {
        $items = $this->quoteItems($quoteId);
        $pieces = [];

        foreach ($items as $item) {
            if ($item['glass_type_id'] === null) {
                continue;
            }
            $glassStmt = $this->db->prepare('SELECT * FROM glass_types WHERE id = ?');
            $glassStmt->execute([$item['glass_type_id']]);
            $glass = $glassStmt->fetch();
            if ($glass === false || $glass['glass_category'] !== 'TEMPERADO') {
                continue;
            }

            $width = $this->maxDimension($item['width_mm'], $item['width_mm_2']);
            $height = $this->maxDimension($item['height_mm'], $item['height_mm_2']);
            if ($width === null || $height === null) {
                continue;
            }

            $pieces[] = [
                'quote_item_id' => $item['id'],
                'description' => $item['description'],
                'glass_type_id' => (int) $item['glass_type_id'],
                'glass_type' => $glass['name'],
                'thickness_mm' => $glass['thickness_mm'],
                'width_mm' => $width,
                'height_mm' => $height,
                'quantity' => (float) $item['quantity'],
            ];
        }

        return $pieces;
    }

    /** @return list<array<string, mixed>> */
    private function quoteItems(int $quoteId): array
    {
        $stmt = $this->db->prepare('SELECT * FROM quote_items WHERE quote_id = ? ORDER BY id');
        $stmt->execute([$quoteId]);
        return $stmt->fetchAll();
    }

    /** @param array<int, array<string, mixed>> $totals */
    private function accumulateProfiles(array &$totals, int $formulaVersionId, float $width, float $height, float $quantity, string $itemDescription): void
    {
        $versionStmt = $this->db->prepare('SELECT status_code FROM formula_versions WHERE id = ?');
        $versionStmt->execute([$formulaVersionId]);
        $versionStatus = $versionStmt->fetchColumn();

        $result = $this->calculationService->calculate($formulaVersionId, [
            'L' => $width, 'A' => $height, 'N' => $quantity, 'E' => 0, 'P' => 0,
        ], false);

        $componentsStmt = $this->db->prepare('SELECT profile_id, quantity FROM formula_components WHERE formula_version_id = ? ORDER BY id');
        $componentsStmt->execute([$formulaVersionId]);
        $componentRows = $componentsStmt->fetchAll();

        foreach ($result['components'] as $i => $computed) {
            if ($computed['result_mm'] === null || !isset($componentRows[$i]['profile_id']) || $componentRows[$i]['profile_id'] === null) {
                continue;
            }
            $profileId = (int) $componentRows[$i]['profile_id'];
            $lengthMm = (float) $computed['result_mm'] * (float) $componentRows[$i]['quantity'] * $quantity;

            if (!isset($totals[$profileId])) {
                $profileStmt = $this->db->prepare('SELECT code, name FROM profiles WHERE id = ?');
                $profileStmt->execute([$profileId]);
                $profile = $profileStmt->fetch();
                $totals[$profileId] = [
                    'profile_id' => $profileId,
                    'profile_code' => $profile['code'] ?? null,
                    'profile_name' => $profile['name'] ?? null,
                    'total_length_mm' => 0.0,
                    'total_length_m' => 0.0,
                    'estimativa_formula_nao_liberada' => false,
                    'itens' => [],
                ];
            }
            $totals[$profileId]['total_length_mm'] += $lengthMm;
            $totals[$profileId]['total_length_m'] = round($totals[$profileId]['total_length_mm'] / 1000, 2);
            if ($versionStatus !== 'LIBERADO_PRODUCAO') {
                $totals[$profileId]['estimativa_formula_nao_liberada'] = true;
            }
            $totals[$profileId]['itens'][] = $itemDescription;
        }
    }

    /** @param array<int, array<string, mixed>> $totals */
    private function accumulateGlass(array &$totals, int $glassTypeId, float $width, float $height, float $quantity): void
    {
        $areaM2 = ($width / 1000) * ($height / 1000) * $quantity;

        if (!isset($totals[$glassTypeId])) {
            $glassStmt = $this->db->prepare('SELECT name, thickness_mm, glass_category FROM glass_types WHERE id = ?');
            $glassStmt->execute([$glassTypeId]);
            $glass = $glassStmt->fetch();
            $totals[$glassTypeId] = [
                'glass_type_id' => $glassTypeId,
                'glass_type' => $glass['name'] ?? null,
                'thickness_mm' => $glass['thickness_mm'] ?? null,
                'glass_category' => $glass['glass_category'] ?? null,
                'total_area_m2' => 0.0,
            ];
        }
        $totals[$glassTypeId]['total_area_m2'] = round($totals[$glassTypeId]['total_area_m2'] + $areaM2, 3);
    }

    /** @return list<array<string, mixed>> */
    private function accessoriesReport(int $quoteId): array
    {
        $stmt = $this->db->prepare(
            'SELECT qa.description, qa.accessory_id, a.code AS accessory_code, SUM(qa.quantity) AS total_quantity
             FROM quote_accessories qa
             LEFT JOIN accessories a ON a.id = qa.accessory_id
             WHERE qa.quote_id = ?
             GROUP BY qa.description, qa.accessory_id, a.code
             ORDER BY qa.description'
        );
        $stmt->execute([$quoteId]);
        return $stmt->fetchAll();
    }

    private function maxDimension(mixed $a, mixed $b): ?float
    {
        $values = array_filter([$a, $b], static fn ($v) => $v !== null && $v !== '');
        if ($values === []) {
            return null;
        }
        return (float) max(array_map('floatval', $values));
    }
}
