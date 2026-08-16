<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use PDO;

final class TypologyController
{
    public function __construct(private readonly PDO $db)
    {
    }

    /** @param array<string, string> $params */
    public function index(Request $request, array $params): void
    {
        Response::json($this->db->query('SELECT * FROM typologies ORDER BY name')->fetchAll());
    }
}
