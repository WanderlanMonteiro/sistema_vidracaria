<?php

declare(strict_types=1);

namespace App\Services;

use PDO;

/**
 * Lógica de autenticação sem tocar em $_SESSION/superglobais -- fica testável
 * com PDO puro (ver tests/AuthServiceTest.php). A ligação com sessão de fato
 * fica em App\Support\Auth, que é só um wrapper fino em cima disto.
 */
final class AuthService
{
    public function __construct(private readonly PDO $db)
    {
    }

    /** @return array<string, mixed>|null usuário (sem password_hash) ou null se credenciais inválidas */
    public function attempt(string $email, string $password): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE email = ? AND active = 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user === false || !password_verify($password, $user['password_hash'])) {
            return null;
        }

        $update = $this->db->prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?');
        $update->execute([$user['id']]);

        unset($user['password_hash']);
        return $user;
    }

    public function changePassword(int $userId, string $currentPassword, string $newPassword): bool
    {
        $stmt = $this->db->prepare('SELECT password_hash FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $row = $stmt->fetch();

        if ($row === false || !password_verify($currentPassword, $row['password_hash'])) {
            return false;
        }

        $update = $this->db->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        $update->execute([password_hash($newPassword, PASSWORD_BCRYPT), $userId]);
        return true;
    }
}
