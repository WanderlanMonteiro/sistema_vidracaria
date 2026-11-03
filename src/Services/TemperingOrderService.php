<?php

declare(strict_types=1);

namespace App\Services;

use InvalidArgumentException;
use PDO;

/**
 * Pedido de têmpera rastreável (status pendente/enviado/recebido). Pode nascer
 * a partir de um orçamento -- os itens vêm de QuoteReportService::temperingReport()
 * (só vidro TEMPERADO, medida final já resolvida pela regra de fora de esquadro)
 * -- ou ser lançado manualmente (createManual).
 */
final class TemperingOrderService
{
    public function __construct(private readonly PDO $db)
    {
    }

    /** @return array<string, mixed> */
    public function createFromQuote(int $quoteId, ?int $supplierId, ?string $notes): array
    {
        $reportService = new QuoteReportService($this->db);
        $pieces = $reportService->temperingReport($quoteId);
        if ($pieces === []) {
            throw new InvalidArgumentException('Este orçamento não tem nenhuma peça de vidro temperado com medida preenchida.');
        }

        $this->db->beginTransaction();
        try {
            $orderId = $this->insertOrder($quoteId, $supplierId, $notes);
            foreach ($pieces as $piece) {
                $this->insertItem(
                    $orderId,
                    $piece['description'],
                    $piece['glass_type_id'],
                    (float) $piece['width_mm'],
                    (float) $piece['height_mm'],
                    (float) $piece['quantity']
                );
            }
            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }

        return $this->load($orderId);
    }

    /**
     * @param list<array{description: string, glass_type_id?: int|null, width_mm: float, height_mm: float, quantity?: float}> $items
     * @return array<string, mixed>
     */
    public function createManual(?int $supplierId, ?string $notes, array $items): array
    {
        if ($items === []) {
            throw new InvalidArgumentException('Informe ao menos uma peça em "items".');
        }

        $this->db->beginTransaction();
        try {
            $orderId = $this->insertOrder(null, $supplierId, $notes);
            foreach ($items as $item) {
                $this->insertItem(
                    $orderId,
                    (string) ($item['description'] ?? ''),
                    isset($item['glass_type_id']) ? (int) $item['glass_type_id'] : null,
                    (float) ($item['width_mm'] ?? 0),
                    (float) ($item['height_mm'] ?? 0),
                    (float) ($item['quantity'] ?? 1)
                );
            }
            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }

        return $this->load($orderId);
    }

    private function insertOrder(?int $quoteId, ?int $supplierId, ?string $notes): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO tempering_orders (quote_id, supplier_id, status, notes) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$quoteId, $supplierId, 'PENDENTE', $notes]);
        return (int) $this->db->lastInsertId();
    }

    private function insertItem(int $orderId, string $description, ?int $glassTypeId, float $width, float $height, float $quantity): void
    {
        if ($description === '') {
            throw new InvalidArgumentException('Cada item precisa de description.');
        }
        $stmt = $this->db->prepare(
            'INSERT INTO tempering_order_items (tempering_order_id, description, glass_type_id, width_mm, height_mm, quantity)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$orderId, $description, $glassTypeId, $width, $height, $quantity]);
    }

    /** @return array<string, mixed> */
    private function load(int $orderId): array
    {
        $stmt = $this->db->prepare('SELECT * FROM tempering_orders WHERE id = ?');
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();

        $itemsStmt = $this->db->prepare('SELECT * FROM tempering_order_items WHERE tempering_order_id = ? ORDER BY id');
        $itemsStmt->execute([$orderId]);
        $order['items'] = $itemsStmt->fetchAll();

        return $order;
    }
}
