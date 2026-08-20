<?php

declare(strict_types=1);

namespace App\Services;

use InvalidArgumentException;
use PDO;

/**
 * Recebimento de mercadoria contra um purchase_order: registra o goods_receipt,
 * gera as entradas de estoque (via StockMovementService) e recalcula o status
 * do pedido (RECEBIDO_PARCIAL/RECEBIDO_TOTAL) comparando recebido x pedido.
 */
final class GoodsReceiptService
{
    private readonly StockMovementService $stockMovements;

    public function __construct(private readonly PDO $db)
    {
        $this->stockMovements = new StockMovementService($db);
    }

    /**
     * @param list<array{purchase_order_item_id: int, quantity: float}> $items
     * @return array{goods_receipt: array<string, mixed>, purchase_order_status: string}
     */
    public function receive(
        int $purchaseOrderId,
        int $warehouseId,
        array $items,
        ?string $receivedBy = null,
        ?string $notes = null,
    ): array {
        if ($items === []) {
            throw new InvalidArgumentException('items não pode ser vazio.');
        }

        $orderStmt = $this->db->prepare('SELECT * FROM purchase_orders WHERE id = ?');
        $orderStmt->execute([$purchaseOrderId]);
        if ($orderStmt->fetch() === false) {
            throw new InvalidArgumentException('Pedido de compra não encontrado.');
        }

        $this->db->beginTransaction();
        try {
            $receiptStmt = $this->db->prepare(
                'INSERT INTO goods_receipts (purchase_order_id, received_by, notes) VALUES (?, ?, ?)'
            );
            $receiptStmt->execute([$purchaseOrderId, $receivedBy, $notes]);
            $receiptId = (int) $this->db->lastInsertId();

            $itemStmt = $this->db->prepare('SELECT * FROM purchase_order_items WHERE id = ? AND purchase_order_id = ?');

            foreach ($items as $item) {
                $poItemId = $item['purchase_order_item_id'] ?? null;
                $quantity = $item['quantity'] ?? null;
                if (!$poItemId || $quantity === null || (float) $quantity <= 0) {
                    throw new InvalidArgumentException('Cada item precisa de purchase_order_item_id e quantity > 0.');
                }

                $itemStmt->execute([$poItemId, $purchaseOrderId]);
                $poItem = $itemStmt->fetch();
                if ($poItem === false) {
                    throw new InvalidArgumentException("purchase_order_item_id {$poItemId} não pertence a este pedido.");
                }

                $this->stockMovements->apply(
                    (int) $poItem['material_id'],
                    $warehouseId,
                    'ENTRADA',
                    (float) $quantity,
                    'PURCHASE_ORDER_ITEM',
                    (int) $poItemId,
                    $receivedBy,
                );
            }

            $status = $this->recalculateOrderStatus($purchaseOrderId);
            $updateOrder = $this->db->prepare('UPDATE purchase_orders SET status = ? WHERE id = ?');
            $updateOrder->execute([$status, $purchaseOrderId]);

            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }

        $result = $this->db->prepare('SELECT * FROM goods_receipts WHERE id = ?');
        $result->execute([$receiptId]);

        return ['goods_receipt' => $result->fetch(), 'purchase_order_status' => $status];
    }

    private function recalculateOrderStatus(int $purchaseOrderId): string
    {
        $stmt = $this->db->prepare(
            "SELECT poi.id, poi.quantity,
                    COALESCE((
                        SELECT SUM(sm.quantity) FROM stock_movements sm
                        WHERE sm.reference_type = 'PURCHASE_ORDER_ITEM' AND sm.reference_id = poi.id
                    ), 0) AS received
             FROM purchase_order_items poi
             WHERE poi.purchase_order_id = ?"
        );
        $stmt->execute([$purchaseOrderId]);
        $items = $stmt->fetchAll();

        if ($items === []) {
            return 'CONFIRMADO';
        }

        $allComplete = true;
        $anyReceived = false;
        foreach ($items as $item) {
            if ((float) $item['received'] > 0) {
                $anyReceived = true;
            }
            if ((float) $item['received'] < (float) $item['quantity']) {
                $allComplete = false;
            }
        }

        if ($allComplete) {
            return 'RECEBIDO_TOTAL';
        }
        return $anyReceived ? 'RECEBIDO_PARCIAL' : 'CONFIRMADO';
    }
}
