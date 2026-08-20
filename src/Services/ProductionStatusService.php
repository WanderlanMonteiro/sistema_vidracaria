<?php

declare(strict_types=1);

namespace App\Services;

use InvalidArgumentException;
use PDO;
use PDOException;

/**
 * Toda troca de status_code em production_order_items precisa deixar rastro em
 * production_status_history -- nunca só sobrescrever o campo.
 */
final class ProductionStatusService
{
    public function __construct(private readonly PDO $db)
    {
    }

    /** @return array<string, mixed> a linha de production_order_items atualizada */
    public function changeStatus(int $itemId, string $newStatus, ?string $changedBy = null, ?string $notes = null): array
    {
        $find = $this->db->prepare('SELECT * FROM production_order_items WHERE id = ?');
        $find->execute([$itemId]);
        $item = $find->fetch();
        if ($item === false) {
            throw new InvalidArgumentException('Item de ordem de produção não encontrado.');
        }

        $this->db->beginTransaction();
        try {
            $update = $this->db->prepare('UPDATE production_order_items SET status_code = ? WHERE id = ?');
            try {
                $update->execute([$newStatus, $itemId]);
            } catch (PDOException $e) {
                if ($e->getCode() === '23000') {
                    throw new InvalidArgumentException(
                        "status_code inválido: '{$newStatus}'. Precisa ser um valor válido de data_status (ex: PENDENTE, VALIDADO, APROVADO, BLOQUEADO)."
                    );
                }
                throw $e;
            }

            $history = $this->db->prepare(
                'INSERT INTO production_status_history (production_order_item_id, from_status, to_status, changed_by, notes)
                 VALUES (?, ?, ?, ?, ?)'
            );
            $history->execute([$itemId, $item['status_code'], $newStatus, $changedBy, $notes]);

            $this->db->commit();
        } catch (InvalidArgumentException $e) {
            $this->db->rollBack();
            throw $e;
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }

        $find->execute([$itemId]);
        return $find->fetch();
    }
}
