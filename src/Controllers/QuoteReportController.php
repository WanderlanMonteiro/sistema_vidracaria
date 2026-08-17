<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Services\QuoteReportService;
use PDO;

final class QuoteReportController
{
    public function __construct(private readonly PDO $db)
    {
    }

    /** @param array<string, string> $params */
    public function purchaseReport(Request $request, array $params): void
    {
        $service = new QuoteReportService($this->db);
        Response::json($service->purchaseReport((int) $params['id']));
    }

    /** @param array<string, string> $params */
    public function temperingReport(Request $request, array $params): void
    {
        $service = new QuoteReportService($this->db);
        Response::json($service->temperingReport((int) $params['id']));
    }
}
