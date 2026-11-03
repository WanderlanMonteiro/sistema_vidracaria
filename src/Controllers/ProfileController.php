<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use PDO;

final class ProfileController
{
    public function __construct(private readonly PDO $db)
    {
    }

    /** @param array<string, string> $params */
    public function index(Request $request, array $params): void
    {
        $sql = 'SELECT p.id, p.code, p.name, p.category, p.weight_kg_per_m, p.status_code, p.origin_type,
                       m.name AS manufacturer, pl.name AS product_line,
                       sr.page_number, ts.title AS source_title
                FROM profiles p
                JOIN manufacturers m ON m.id = p.manufacturer_id
                LEFT JOIN product_lines pl ON pl.id = p.product_line_id
                LEFT JOIN source_references sr ON sr.id = p.source_reference_id
                LEFT JOIN technical_sources ts ON ts.id = sr.technical_source_id
                WHERE 1=1';
        $args = [];

        if ($manufacturer = $request->input('manufacturer_id')) {
            $sql .= ' AND p.manufacturer_id = ?';
            $args[] = $manufacturer;
        }
        if ($productLine = $request->input('product_line_id')) {
            $sql .= ' AND p.product_line_id = ?';
            $args[] = $productLine;
        }
        if ($code = $request->input('code')) {
            $sql .= ' AND p.code LIKE ?';
            $args[] = '%' . $code . '%';
        }

        $sql .= ' ORDER BY p.code LIMIT 200';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($args);
        Response::json($stmt->fetchAll());
    }

    /** @param array<string, string> $params */
    public function show(Request $request, array $params): void
    {
        $stmt = $this->db->prepare(
            'SELECT p.*, m.name AS manufacturer, pl.name AS product_line,
                    sr.page_number, ts.title AS source_title, ts.source_url
             FROM profiles p
             JOIN manufacturers m ON m.id = p.manufacturer_id
             LEFT JOIN product_lines pl ON pl.id = p.product_line_id
             LEFT JOIN source_references sr ON sr.id = p.source_reference_id
             LEFT JOIN technical_sources ts ON ts.id = sr.technical_source_id
             WHERE p.id = ?'
        );
        $stmt->execute([$params['id']]);
        $profile = $stmt->fetch();

        if ($profile === false) {
            Response::error('Perfil não encontrado.', 404);
        }

        Response::json($profile);
    }
}
