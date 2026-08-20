<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use PDO;

final class ManufacturerController
{
    public function __construct(private readonly PDO $db)
    {
    }

    /** @param array<string, string> $params */
    public function index(Request $request, array $params): void
    {
        $manufacturers = $this->db->query('SELECT * FROM manufacturers ORDER BY name')->fetchAll();
        foreach ($manufacturers as &$m) {
            $stmt = $this->db->prepare('SELECT id, name, code, status_code FROM product_lines WHERE manufacturer_id = ? ORDER BY name');
            $stmt->execute([$m['id']]);
            $m['product_lines'] = $stmt->fetchAll();
        }
        Response::json($manufacturers);
    }
}
