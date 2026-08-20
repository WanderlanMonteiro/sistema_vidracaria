<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Services\UserService;
use InvalidArgumentException;
use PDO;
use PDOException;

final class UserController
{
    public function __construct(private readonly PDO $db)
    {
    }

    /** @param array<string, string> $params */
    public function index(Request $request, array $params): void
    {
        Response::json((new UserService($this->db))->list());
    }

    /** @param array<string, string> $params */
    public function create(Request $request, array $params): void
    {
        $body = $request->body();
        try {
            $user = (new UserService($this->db))->create(
                (string) ($body['name'] ?? ''),
                (string) ($body['email'] ?? ''),
                (string) ($body['password'] ?? ''),
                (string) ($body['role'] ?? 'USER')
            );
            Response::json($user, 201);
        } catch (InvalidArgumentException $e) {
            Response::error($e->getMessage(), 422);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                Response::error('Já existe um usuário com esse e-mail.', 409);
            }
            throw $e;
        }
    }

    /** @param array<string, string> $params */
    public function update(Request $request, array $params): void
    {
        $body = $request->body();
        try {
            $user = (new UserService($this->db))->updateStatusAndRole(
                (int) $params['id'],
                array_key_exists('active', $body) ? (bool) $body['active'] : null,
                isset($body['role']) ? (string) $body['role'] : null,
                isset($body['name']) ? (string) $body['name'] : null
            );
            Response::json($user);
        } catch (InvalidArgumentException $e) {
            Response::error($e->getMessage(), 404);
        }
    }
}
