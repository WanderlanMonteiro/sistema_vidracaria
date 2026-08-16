<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Services\StockMovementService;
use InvalidArgumentException;
use PDO;

final class StockMovementController
{
    private readonly StockMovementService $service;

    public function __construct(private readonly PDO $db)
    {
        $this->service = new StockMovementService($db);
    }

    /** @param array<string, string> $params */
    public function index(Request $request, array $params): void
    {
        $sql = 'SELECT * FROM stock_movements WHERE 1=1';
        $args = [];

        if ($materialId = $request->input('material_id')) {
            $sql .= ' AND material_id = ?';
            $args[] = $materialId;
        }
        if ($warehouseId = $request->input('warehouse_id')) {
            $sql .= ' AND warehouse_id = ?';
            $args[] = $warehouseId;
        }

        $sql .= ' ORDER BY created_at DESC, id DESC LIMIT 500';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($args);
        Response::json($stmt->fetchAll());
    }

    /** @param array<string, string> $params */
    public function create(Request $request, array $params): void
    {
        $materialId = $request->input('material_id');
        $warehouseId = $request->input('warehouse_id');
        $movementType = $request->input('movement_type');
        $quantity = $request->input('quantity');

        if (!$materialId || !$warehouseId || !$movementType || $quantity === null) {
            Response::error('Campos obrigatórios: material_id, warehouse_id, movement_type, quantity.', 422);
        }

        try {
            $movement = $this->service->record(
                (int) $materialId,
                (int) $warehouseId,
                (string) $movementType,
                (float) $quantity,
                $request->input('reference_type') !== null ? (string) $request->input('reference_type') : null,
                $request->input('reference_id') !== null ? (int) $request->input('reference_id') : null,
                $request->input('created_by') !== null ? (string) $request->input('created_by') : null,
            );
        } catch (InvalidArgumentException $e) {
            Response::error($e->getMessage(), 422);
        }

        Response::json($movement, 201);
    }
}
