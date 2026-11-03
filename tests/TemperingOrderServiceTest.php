<?php

declare(strict_types=1);

require __DIR__ . '/TestRunner.php';

use App\Services\TemperingOrderService;

function makeTemperingOrderDb(): PDO
{
    $db = new PDO('sqlite::memory:');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec('CREATE TABLE quote_items (
        id INTEGER PRIMARY KEY, quote_id INTEGER, description TEXT, quantity REAL,
        width_mm REAL, width_mm_2 REAL, height_mm REAL, height_mm_2 REAL, glass_type_id INTEGER
    )');
    $db->exec('CREATE TABLE glass_types (id INTEGER PRIMARY KEY, name TEXT, thickness_mm REAL, glass_category TEXT)');
    $db->exec('CREATE TABLE tempering_orders (
        id INTEGER PRIMARY KEY, quote_id INTEGER, supplier_id INTEGER, status TEXT DEFAULT "PENDENTE",
        sent_at TEXT, received_at TEXT, notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )');
    $db->exec('CREATE TABLE tempering_order_items (
        id INTEGER PRIMARY KEY, tempering_order_id INTEGER, description TEXT,
        glass_type_id INTEGER, width_mm REAL, height_mm REAL, quantity REAL
    )');
    return $db;
}

test('cria pedido de têmpera a partir do orçamento, só com vidro TEMPERADO', function () {
    $db = makeTemperingOrderDb();
    $db->exec("INSERT INTO glass_types (id, name, thickness_mm, glass_category) VALUES
        (1, 'Comum 6mm', 6, 'SIMPLES'), (2, 'Temperado 10mm', 10, 'TEMPERADO')");
    $db->exec("INSERT INTO quote_items (id, quote_id, description, quantity, width_mm, width_mm_2, height_mm, glass_type_id) VALUES
        (1, 5, 'Vidro comum', 1, 800, NULL, 800, 1),
        (2, 5, 'Box temperado', 1, 900, 920, 1900, 2)");

    $service = new TemperingOrderService($db);
    $order = $service->createFromQuote(5, 3, 'urgente');

    assertTrue($order['status'] === 'PENDENTE');
    assertTrue((int) $order['supplier_id'] === 3);
    assertTrue(count($order['items']) === 1, 'Só a peça temperada deveria virar item do pedido');
    assertTrue($order['items'][0]['description'] === 'Box temperado');
    assertEqualsFloat(920.0, $order['items'][0]['width_mm']);
});

test('orçamento sem vidro temperado lança exceção e não cria pedido vazio', function () {
    $db = makeTemperingOrderDb();
    $db->exec("INSERT INTO glass_types (id, name, thickness_mm, glass_category) VALUES (1, 'Comum 6mm', 6, 'SIMPLES')");
    $db->exec("INSERT INTO quote_items (id, quote_id, description, quantity, width_mm, height_mm, glass_type_id) VALUES
        (1, 5, 'Vidro comum', 1, 800, 800, 1)");

    $service = new TemperingOrderService($db);
    assertThrows(InvalidArgumentException::class, function () use ($service) {
        $service->createFromQuote(5, null, null);
    });

    $stmt = $db->query('SELECT COUNT(*) FROM tempering_orders');
    assertTrue((int) $stmt->fetchColumn() === 0);
});

test('pedido manual aceita itens avulsos sem orçamento', function () {
    $db = makeTemperingOrderDb();
    $service = new TemperingOrderService($db);

    $order = $service->createManual(null, null, [
        ['description' => 'Porta avulsa', 'width_mm' => 1000, 'height_mm' => 2100, 'quantity' => 2],
    ]);

    assertTrue($order['quote_id'] === null);
    assertTrue(count($order['items']) === 1);
    assertEqualsFloat(2.0, $order['items'][0]['quantity']);
});

exit(runRegisteredTests('TemperingOrderServiceTest') > 0 ? 1 : 0);
