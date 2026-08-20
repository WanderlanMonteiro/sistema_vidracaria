<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Services\TemperingOrderService;
use InvalidArgumentException;
use PDO;

final class TemperingOrderController
{
    public function __construct(private readonly PDO $db)
    {
    }

    /** @param array<string, string> $params */
    public function createFromQuote(Request $request, array $params): void
    {
        $body = $request->body();
        try {
            $order = (new TemperingOrderService($this->db))->createFromQuote(
                (int) ($body['quote_id'] ?? 0),
                isset($body['supplier_id']) ? (int) $body['supplier_id'] : null,
                isset($body['notes']) ? (string) $body['notes'] : null
            );
            Response::json($order, 201);
        } catch (InvalidArgumentException $e) {
            Response::error($e->getMessage(), 422);
        }
    }

    /** @param array<string, string> $params */
    public function createManual(Request $request, array $params): void
    {
        $body = $request->body();
        try {
            $order = (new TemperingOrderService($this->db))->createManual(
                isset($body['supplier_id']) ? (int) $body['supplier_id'] : null,
                isset($body['notes']) ? (string) $body['notes'] : null,
                is_array($body['items'] ?? null) ? $body['items'] : []
            );
            Response::json($order, 201);
        } catch (InvalidArgumentException $e) {
            Response::error($e->getMessage(), 422);
        }
    }

    /** @param array<string, string> $params */
    public function show(Request $request, array $params): void
    {
        $stmt = $this->db->prepare('SELECT * FROM tempering_orders WHERE id = ?');
        $stmt->execute([$params['id']]);
        $order = $stmt->fetch();
        if ($order === false) {
            Response::error('Pedido de têmpera não encontrado.', 404);
        }

        $itemsStmt = $this->db->prepare('SELECT * FROM tempering_order_items WHERE tempering_order_id = ? ORDER BY id');
        $itemsStmt->execute([$params['id']]);
        $order['items'] = $itemsStmt->fetchAll();

        Response::json($order);
    }
}
