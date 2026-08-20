<?php

declare(strict_types=1);

namespace App\Support;

use App\Http\Response;

/**
 * Autenticação por sessão de cookie (não token/JWT) -- o frontend é um SPA no
 * mesmo domínio da API, então cookie é a opção mais simples e segura aqui:
 * sem localStorage exposto a XSS, sem precisar implementar/guardar token à mão.
 */
final class Auth
{
    private const SESSION_KEY = 'user';

    public static function start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        $isHttps = (($_SERVER['HTTPS'] ?? '') !== '') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

        session_set_cookie_params([
            'lifetime' => 0, // expira ao fechar o navegador
            'path' => '/',
            'httponly' => true, // não acessível via JS -- mitiga roubo de sessão por XSS
            'samesite' => 'Lax', // navegador não envia o cookie em requisição cross-site -- mitiga CSRF
            'secure' => $isHttps,
        ]);
        ini_set('session.gc_maxlifetime', (string) (8 * 3600)); // 8h de inatividade

        session_start();
    }

    /** @param array<string, mixed> $user */
    public static function login(array $user): void
    {
        $_SESSION[self::SESSION_KEY] = $user;
        session_regenerate_id(true); // evita fixação de sessão em login
    }

    public static function logout(): void
    {
        $_SESSION = [];
        session_destroy();
    }

    /** @return array<string, mixed>|null */
    public static function user(): ?array
    {
        return $_SESSION[self::SESSION_KEY] ?? null;
    }

    /** @return array<string, mixed> nunca retorna -- responde 401 e encerra se não autenticado */
    public static function requireAuth(): array
    {
        $user = self::user();
        if ($user === null) {
            Response::error('Não autenticado.', 401);
        }
        return $user;
    }
}
