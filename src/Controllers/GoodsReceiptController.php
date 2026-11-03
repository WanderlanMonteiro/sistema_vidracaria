<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Services\GoodsReceiptService;
use InvalidArgumentException;
use PDO;

final class GoodsReceiptController
{
    private readonly GoodsReceiptService $service;

    public function __construct(private readonly PDO $db)
    {
        $this->service = new GoodsReceiptService($db);
    }

    /** @param array<string, string> $params */
    public function index(Request $request, array $params): void
    {
        $sql = 'SELECT * FROM goods_receipts WHERE 1=1';
        $args = [];
        if ($orderId = $request->input('purchase_order_id')) {
            $sql .= ' AND purchase_order_id = ?';
            $args[] = $orderId;
        }
        $sql .= ' ORDER BY received_at DESC LIMIT 500';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($args);
        Response::json($stmt->fetchAll());
    }

    /** @param array<string, string> $params */
    public function create(Request $request, array $params): void
    {
        $purchaseOrderId = $request->input('purchase_order_id');
        $warehouseId = $request->input('warehouse_id');
        $items = $request->input('items');

        if (!$purchaseOrderId || !$warehouseId || !is_array($items) || $items === []) {
            Response::error('Campos obrigatórios: purchase_order_id, warehouse_id, items (lista de {purchase_order_item_id, quantity}).', 422);
        }

        try {
            $result = $this->service->receive(
                (int) $purchaseOrderId,
                (int) $warehouseId,
                $items,
                $request->input('received_by') !== null ? (string) $request->input('received_by') : null,
                $request->input('notes') !== null ? (string) $request->input('notes') : null,
            );
        } catch (InvalidArgumentException $e) {
            Response::error($e->getMessage(), 422);
        }

        Response::json($result, 201);
    }
}
