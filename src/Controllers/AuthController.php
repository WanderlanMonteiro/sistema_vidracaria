<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Services\AuthService;
use App\Support\Auth;
use PDO;

final class AuthController
{
    public function __construct(private readonly PDO $db)
    {
    }

    /** @param array<string, string> $params */
    public function login(Request $request, array $params): void
    {
        $email = trim((string) ($request->input('email') ?? ''));
        $password = (string) ($request->input('password') ?? '');

        if ($email === '' || $password === '') {
            Response::error('Informe e-mail e senha.', 422);
        }

        $user = (new AuthService($this->db))->attempt($email, $password);
        if ($user === null) {
            Response::error('E-mail ou senha inválidos.', 401);
        }

        Auth::login($user);
        Response::json(['user' => $user]);
    }

    /** @param array<string, string> $params */
    public function logout(Request $request, array $params): void
    {
        Auth::logout();
        Response::json(['ok' => true]);
    }

    /** @param array<string, string> $params */
    public function me(Request $request, array $params): void
    {
        $user = Auth::user();
        if ($user === null) {
            Response::error('Não autenticado.', 401);
        }
        Response::json(['user' => $user]);
    }

    /** @param array<string, string> $params */
    public function changePassword(Request $request, array $params): void
    {
        $user = Auth::requireAuth();

        $current = (string) ($request->input('current_password') ?? '');
        $new = (string) ($request->input('new_password') ?? '');

        if (strlen($new) < 8) {
            Response::error('A nova senha precisa ter ao menos 8 caracteres.', 422);
        }

        $ok = (new AuthService($this->db))->changePassword((int) $user['id'], $current, $new);
        if (!$ok) {
            Response::error('Senha atual incorreta.', 401);
        }

        Response::json(['ok' => true]);
    }
}
