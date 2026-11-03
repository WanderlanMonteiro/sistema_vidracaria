<?php

declare(strict_types=1);

namespace App\Services;

use InvalidArgumentException;
use PDO;

/**
 * Cadastro de usuários (hoje só existia direto no banco -- ver docs/API.md).
 * Continua uma camada só de acesso (sem permissão por role aplicada ainda),
 * mas agora dá pra criar/desativar usuário pela API em vez de SQL manual.
 */
final class UserService
{
    public function __construct(private readonly PDO $db)
    {
    }

    /** @return list<array<string, mixed>> */
    public function list(): array
    {
        $stmt = $this->db->query('SELECT id, name, email, role, active, created_at, last_login_at FROM users ORDER BY name');
        return $stmt->fetchAll();
    }

    /** @return array<string, mixed> */
    public function create(string $name, string $email, string $password, string $role = 'USER'): array
    {
        $name = trim($name);
        $email = trim($email);
        if ($name === '' || $email === '') {
            throw new InvalidArgumentException('name e email são obrigatórios.');
        }
        if (mb_strlen($password) < 8) {
            throw new InvalidArgumentException('A senha precisa ter 8 ou mais caracteres.');
        }

        $stmt = $this->db->prepare(
            'INSERT INTO users (name, email, password_hash, role, active) VALUES (?, ?, ?, ?, 1)'
        );
        $stmt->execute([$name, $email, password_hash($password, PASSWORD_BCRYPT), $role]);
        $id = (int) $this->db->lastInsertId();

        return $this->find($id);
    }

    /** @return array<string, mixed> */
    public function updateStatusAndRole(int $id, ?bool $active, ?string $role, ?string $name): array
    {
        $sets = [];
        $args = [];
        if ($active !== null) {
            $sets[] = 'active = ?';
            $args[] = $active ? 1 : 0;
        }
        if ($role !== null) {
            $sets[] = 'role = ?';
            $args[] = $role;
        }
        if ($name !== null && trim($name) !== '') {
            $sets[] = 'name = ?';
            $args[] = trim($name);
        }
        if ($sets === []) {
            return $this->find($id);
        }

        $args[] = $id;
        $stmt = $this->db->prepare('UPDATE users SET ' . implode(', ', $sets) . ' WHERE id = ?');
        $stmt->execute($args);

        return $this->find($id);
    }

    /** @return array<string, mixed> */
    private function find(int $id): array
    {
        $stmt = $this->db->prepare('SELECT id, name, email, role, active, created_at, last_login_at FROM users WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if ($row === false) {
            throw new InvalidArgumentException("Usuário {$id} não encontrado.");
        }
        return $row;
    }
}
