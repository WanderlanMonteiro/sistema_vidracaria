<?php

declare(strict_types=1);

namespace App\Services;

use InvalidArgumentException;
use PDO;

/**
 * Regra central do estoque: toda movimentação (stock_movements) precisa
 * refletir no saldo (stock_balances) dentro da mesma transação, senão o saldo
 * diverge do histórico. Extraído do controller para poder ser testado sem
 * depender da camada HTTP (Request/Response fazem exit(), o que inviabiliza
 * teste unitário direto do controller).
 *
 * `record()` abre sua própria transação (uso standalone, ex: POST direto de
 * uma movimentação manual). `apply()` faz o mesmo trabalho SEM abrir
 * transação, para ser chamado por outro serviço que já está dentro de uma
 * transação própria (ex: GoodsReceiptService) -- PDO não suporta transação
 * aninhada, então nunca chame record() de dentro de outra transação.
 */
final class StockMovementService
{
    private const INCREASING = ['ENTRADA', 'AJUSTE'];
    private const VALID_TYPES = ['ENTRADA', 'AJUSTE', 'SAIDA', 'RESERVA', 'BAIXA_RESERVA'];

    public function __construct(private readonly PDO $db)
    {
    }

    /** @return array<string, mixed> a linha de stock_movements criada */
    public function record(
        int $materialId,
        int $warehouseId,
        string $movementType,
        float $quantity,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?string $createdBy = null,
    ): array {
        $this->db->beginTransaction();
        try {
            $movementId = $this->apply($materialId, $warehouseId, $movementType, $quantity, $referenceType, $referenceId, $createdBy);
            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }

        $find = $this->db->prepare('SELECT * FROM stock_movements WHERE id = ?');
        $find->execute([$movementId]);
        return $find->fetch();
    }

    /**
     * Mesma regra que record(), mas sem abrir transação própria -- para ser
     * chamado de dentro da transação de outro serviço. Retorna o id da
     * movimentação criada.
     */
    public function apply(
        int $materialId,
        int $warehouseId,
        string $movementType,
        float $quantity,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?string $createdBy = null,
    ): int {
        if (!in_array($movementType, self::VALID_TYPES, true)) {
            throw new InvalidArgumentException("movement_type inválido: {$movementType}");
        }
        if ($quantity <= 0) {
            throw new InvalidArgumentException('quantity deve ser maior que zero (o sinal é definido por movement_type).');
        }

        $stmt = $this->db->prepare(
            'INSERT INTO stock_movements (material_id, warehouse_id, movement_type, quantity, reference_type, reference_id, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$materialId, $warehouseId, $movementType, $quantity, $referenceType, $referenceId, $createdBy]);
        $movementId = (int) $this->db->lastInsertId();

        $delta = in_array($movementType, self::INCREASING, true) ? $quantity : -$quantity;
        $this->applyBalanceDelta($materialId, $warehouseId, $delta);

        return $movementId;
    }

    private function applyBalanceDelta(int $materialId, int $warehouseId, float $delta): void
    {
        // Resolvido manualmente (select + insert/update) em vez de "ON DUPLICATE KEY
        // UPDATE" (só MySQL/MariaDB) para funcionar também no SQLite usado nos testes.
        $select = $this->db->prepare('SELECT quantity FROM stock_balances WHERE material_id = ? AND warehouse_id = ?');
        $select->execute([$materialId, $warehouseId]);
        $current = $select->fetch();

        if ($current === false) {
            $insert = $this->db->prepare('INSERT INTO stock_balances (material_id, warehouse_id, quantity) VALUES (?, ?, ?)');
            $insert->execute([$materialId, $warehouseId, $delta]);
            return;
        }

        $update = $this->db->prepare('UPDATE stock_balances SET quantity = quantity + ? WHERE material_id = ? AND warehouse_id = ?');
        $update->execute([$delta, $materialId, $warehouseId]);
    }
}
