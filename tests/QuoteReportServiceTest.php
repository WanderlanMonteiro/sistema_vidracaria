<?php

declare(strict_types=1);

require __DIR__ . '/TestRunner.php';

use App\Services\QuoteReportService;

function makeQuoteReportDb(): PDO
{
    $db = new PDO('sqlite::memory:');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $db->exec('CREATE TABLE quote_items (
        id INTEGER PRIMARY KEY, quote_id INTEGER, opening_id INTEGER, formula_version_id INTEGER,
        description TEXT, quantity REAL, unit_price REAL, total_price REAL,
        width_mm REAL, width_mm_2 REAL, height_mm REAL, height_mm_2 REAL,
        glass_type_id INTEGER, pricing_unit TEXT
    )');
    $db->exec('CREATE TABLE formula_versions (
        id INTEGER PRIMARY KEY, status_code TEXT, production_locked INTEGER,
        rounding_mode TEXT DEFAULT "ROUND", rounding_decimals INTEGER DEFAULT 1
    )');
    $db->exec('CREATE TABLE formula_components (
        id INTEGER PRIMARY KEY, formula_version_id INTEGER, component_role TEXT,
        profile_id INTEGER, quantity INTEGER, expression TEXT, notes TEXT
    )');
    $db->exec('CREATE TABLE profiles (id INTEGER PRIMARY KEY, code TEXT, name TEXT)');
    $db->exec('CREATE TABLE glass_types (id INTEGER PRIMARY KEY, name TEXT, thickness_mm REAL, glass_category TEXT)');
    $db->exec('CREATE TABLE accessories (id INTEGER PRIMARY KEY, code TEXT)');
    $db->exec('CREATE TABLE quote_accessories (
        id INTEGER PRIMARY KEY, quote_id INTEGER, accessory_id INTEGER, description TEXT, quantity REAL
    )');

    return $db;
}

test('perfil: usa a MAIOR largura e a MAIOR altura em vão fora de esquadro', function () {
    $db = makeQuoteReportDb();
    $db->exec("INSERT INTO formula_versions (id, status_code, production_locked) VALUES (1, 'LIBERADO_PRODUCAO', 0)");
    $db->exec("INSERT INTO formula_components (formula_version_id, component_role, profile_id, quantity, expression) VALUES (1, 'MARCO', 10, 2, 'L - 10')");
    $db->exec("INSERT INTO profiles (id, code, name) VALUES (10, 'MP-100', 'Marco teste')");
    // largura: 1000 e 1020 (fora de esquadro) -> deve usar 1020. altura irrelevante aqui.
    $db->exec("INSERT INTO quote_items (id, quote_id, formula_version_id, description, quantity, width_mm, width_mm_2, height_mm) VALUES (1, 1, 1, 'Item teste', 1, 1000, 1020, 1000)");

    $service = new QuoteReportService($db);
    $report = $service->purchaseReport(1);

    assertTrue(count($report['profiles']) === 1);
    // (1020 - 10) * 2 pecas * 1 qty = 2020mm
    assertEqualsFloat(2020.0, $report['profiles'][0]['total_length_mm']);
    assertTrue($report['profiles'][0]['estimativa_formula_nao_liberada'] === false);
});

test('perfil de fórmula PENDENTE ainda é calculado mas marcado como estimativa', function () {
    $db = makeQuoteReportDb();
    $db->exec("INSERT INTO formula_versions (id, status_code, production_locked) VALUES (1, 'PENDENTE', 1)");
    $db->exec("INSERT INTO formula_components (formula_version_id, component_role, profile_id, quantity, expression) VALUES (1, 'MARCO', 10, 1, 'L')");
    $db->exec("INSERT INTO profiles (id, code, name) VALUES (10, 'MP-100', 'Marco teste')");
    $db->exec("INSERT INTO quote_items (id, quote_id, formula_version_id, description, quantity, width_mm, height_mm) VALUES (1, 1, 1, 'Item teste', 1, 1000, 1000)");

    $service = new QuoteReportService($db);
    $report = $service->purchaseReport(1);

    assertTrue(count($report['profiles']) === 1);
    assertTrue($report['profiles'][0]['estimativa_formula_nao_liberada'] === true);
});

test('vidro: área somada em m² usa a maior largura/altura e ignora item sem vidro', function () {
    $db = makeQuoteReportDb();
    $db->exec("INSERT INTO glass_types (id, name, thickness_mm, glass_category) VALUES (1, 'Temperado 8mm', 8, 'TEMPERADO')");
    $db->exec("INSERT INTO quote_items (id, quote_id, description, quantity, width_mm, width_mm_2, height_mm, height_mm_2, glass_type_id) VALUES
        (1, 1, 'Porta 1', 2, 1000, 990, 2100, 2110, 1),
        (2, 1, 'Item sem vidro', 1, 500, NULL, 500, NULL, NULL)");

    $service = new QuoteReportService($db);
    $report = $service->purchaseReport(1);

    assertTrue(count($report['glass']) === 1);
    // 1.0m x 2.11m x 2 unidades = 4.22 m2
    assertEqualsFloat(4.22, $report['glass'][0]['total_area_m2']);
});

test('relatório de têmpera lista só vidro TEMPERADO, itemizado (não agregado)', function () {
    $db = makeQuoteReportDb();
    $db->exec("INSERT INTO glass_types (id, name, thickness_mm, glass_category) VALUES (1, 'Comum 6mm', 6, 'SIMPLES'), (2, 'Temperado 10mm', 10, 'TEMPERADO')");
    $db->exec("INSERT INTO quote_items (id, quote_id, description, quantity, width_mm, height_mm, glass_type_id) VALUES
        (1, 1, 'Vidro comum', 1, 800, 800, 1),
        (2, 1, 'Box temperado', 1, 900, 1900, 2)");

    $service = new QuoteReportService($db);
    $report = $service->temperingReport(1);

    assertTrue(count($report) === 1, 'Só o item de vidro temperado deve aparecer');
    assertTrue($report[0]['description'] === 'Box temperado');
    assertEqualsFloat(900.0, $report[0]['width_mm']);
});

test('acessórios avulsos do orçamento são somados por descrição', function () {
    $db = makeQuoteReportDb();
    $db->exec("INSERT INTO quote_accessories (quote_id, accessory_id, description, quantity) VALUES
        (1, NULL, 'Dobradiça inox', 4),
        (1, NULL, 'Dobradiça inox', 2),
        (1, NULL, 'Fechadura', 1)");

    $service = new QuoteReportService($db);
    $report = $service->purchaseReport(1);

    $byDescription = [];
    foreach ($report['accessories'] as $row) {
        $byDescription[$row['description']] = (float) $row['total_quantity'];
    }
    assertEqualsFloat(6.0, $byDescription['Dobradiça inox']);
    assertEqualsFloat(1.0, $byDescription['Fechadura']);
});

exit(runRegisteredTests('QuoteReportServiceTest') > 0 ? 1 : 0);
