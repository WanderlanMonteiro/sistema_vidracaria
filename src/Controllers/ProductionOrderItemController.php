<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Services\ProductionStatusService;
use InvalidArgumentException;
use PDO;

final class ProductionOrderItemController
{
    private readonly ProductionStatusService $statusService;

    public function __construct(private readonly PDO $db)
    {
        $this->statusService = new ProductionStatusService($db);
    }

    /** @param array<string, string> $params */
    public function index(Request $request, array $params): void
    {
        $sql = 'SELECT * FROM production_order_items WHERE 1=1';
        $args = [];
        if ($orderId = $request->input('production_order_id')) {
            $sql .= ' AND production_order_id = ?';
            $args[] = $orderId;
        }
        $sql .= ' ORDER BY id DESC LIMIT 500';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($args);
        Response::json($stmt->fetchAll());
    }

    /** @param array<string, string> $params */
    public function create(Request $request, array $params): void
    {
        $required = ['production_order_id', 'formula_version_id'];
        foreach ($required as $field) {
            if (!$request->input($field)) {
                Response::error("Campo obrigatório: {$field}.", 422);
            }
        }

        $stmt = $this->db->prepare(
            'INSERT INTO production_order_items (production_order_id, opening_id, formula_version_id, quantity, status_code)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $request->input('production_order_id'),
            $request->input('opening_id'),
            $request->input('formula_version_id'),
            $request->input('quantity', 1),
            $request->input('status_code', 'PENDENTE'),
        ]);
        $id = $this->db->lastInsertId();

        $find = $this->db->prepare('SELECT * FROM production_order_items WHERE id = ?');
        $find->execute([$id]);
        Response::json($find->fetch(), 201);
    }

    /** @param array<string, string> $params */
    public function updateStatus(Request $request, array $params): void
    {
        $newStatus = $request->input('status_code');
        if (!$newStatus) {
            Response::error('Campo obrigatório: status_code.', 422);
        }

        try {
            $item = $this->statusService->changeStatus(
                (int) $params['id'],
                (string) $newStatus,
                $request->input('changed_by') !== null ? (string) $request->input('changed_by') : null,
                $request->input('notes') !== null ? (string) $request->input('notes') : null,
            );
        } catch (InvalidArgumentException $e) {
            $status = str_contains($e->getMessage(), 'não encontrado') ? 404 : 422;
            Response::error($e->getMessage(), $status);
        }

        Response::json($item);
    }
}
