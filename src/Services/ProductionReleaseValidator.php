<?php

declare(strict_types=1);

namespace App\Services;

use PDO;

/**
 * Aplica as regras de bloqueio da seção 13 do briefing técnico: nenhuma
 * formula_version pode ser marcada LIBERADO_PRODUCAO enquanto o checklist não
 * estiver 100% atendido. Este serviço só LÊ o estado atual e diz sim/não — a
 * transição de status em si é responsabilidade de quem chama (sempre uma ação
 * humana explícita, nunca automática).
 */
final class ProductionReleaseValidator
{
    public function __construct(private readonly PDO $db)
    {
    }

    /** @return array{released: bool, checklist: array<string, bool>, pending: list<string>} */
    public function check(int $formulaVersionId): array
    {
        $checklist = [
            'possui_componentes'        => $this->hasComponents($formulaVersionId),
            'descontos_folgas_validados' => $this->deductionsValidated($formulaVersionId),
            'validacoes_aprovadas'       => $this->allValidationsApproved($formulaVersionId),
            'prototipo_aprovado'         => $this->hasApprovedPrototype($formulaVersionId),
            'responsavel_tecnico'        => $this->hasTechnicalApproval($formulaVersionId),
            'versao_nao_bloqueada'       => $this->versionNotBlocked($formulaVersionId),
        ];

        $pending = array_keys(array_filter($checklist, static fn (bool $ok) => !$ok));

        return [
            'released' => $pending === [],
            'checklist' => $checklist,
            'pending' => $pending,
        ];
    }

    private function hasComponents(int $formulaVersionId): bool
    {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM formula_components WHERE formula_version_id = ?');
        $stmt->execute([$formulaVersionId]);
        return ((int) $stmt->fetchColumn()) > 0;
    }

    private function deductionsValidated(int $formulaVersionId): bool
    {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) FROM formula_deductions WHERE formula_version_id = ? AND status_code <> ?'
        );
        $stmt->execute([$formulaVersionId, 'VALIDADO']);
        // Só passa se existir ao menos uma dedução E todas estiverem VALIDADO.
        $unvalidated = (int) $stmt->fetchColumn();
        $totalStmt = $this->db->prepare('SELECT COUNT(*) FROM formula_deductions WHERE formula_version_id = ?');
        $totalStmt->execute([$formulaVersionId]);
        $total = (int) $totalStmt->fetchColumn();
        return $total > 0 && $unvalidated === 0;
    }

    private function allValidationsApproved(int $formulaVersionId): bool
    {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) FROM formula_validations WHERE formula_version_id = ? AND result <> ?'
        );
        $stmt->execute([$formulaVersionId, 'APROVADO']);
        $notApproved = (int) $stmt->fetchColumn();
        $totalStmt = $this->db->prepare('SELECT COUNT(*) FROM formula_validations WHERE formula_version_id = ?');
        $totalStmt->execute([$formulaVersionId]);
        $total = (int) $totalStmt->fetchColumn();
        return $total > 0 && $notApproved === 0;
    }

    private function hasApprovedPrototype(int $formulaVersionId): bool
    {
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM prototypes WHERE formula_version_id = ? AND status = 'APROVADO'"
        );
        $stmt->execute([$formulaVersionId]);
        return ((int) $stmt->fetchColumn()) > 0;
    }

    private function hasTechnicalApproval(int $formulaVersionId): bool
    {
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM technical_approvals WHERE subject_type = 'FORMULA_VERSION' AND subject_id = ?"
        );
        $stmt->execute([$formulaVersionId]);
        return ((int) $stmt->fetchColumn()) > 0;
    }

    private function versionNotBlocked(int $formulaVersionId): bool
    {
        $stmt = $this->db->prepare('SELECT status_code FROM formula_versions WHERE id = ?');
        $stmt->execute([$formulaVersionId]);
        $status = $stmt->fetchColumn();
        return $status !== false && !in_array($status, ['BLOQUEADO', 'OBSOLETO'], true);
    }
}
