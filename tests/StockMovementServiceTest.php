<?php

declare(strict_types=1);

require __DIR__ . '/TestRunner.php';

use App\Services\StockMovementService;

function makeStockDb(): PDO
{
    $db = new PDO('sqlite::memory:');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec('CREATE TABLE stock_movements (
        id INTEGER PRIMARY KEY, material_id INTEGER, warehouse_id INTEGER,
        movement_type TEXT, quantity REAL, reference_type TEXT, reference_id INTEGER,
        created_by TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )');
    $db->exec('CREATE TABLE stock_balances (
        id INTEGER PRIMARY KEY, material_id INTEGER, warehouse_id INTEGER, quantity REAL,
        UNIQUE(material_id, warehouse_id)
    )');
    return $db;
}

test('ENTRADA cria saldo novo quando não existe', function () {
    $db = makeStockDb();
    $service = new StockMovementService($db);

    $service->record(1, 1, 'ENTRADA', 100.0);

    $stmt = $db->query('SELECT quantity FROM stock_balances WHERE material_id = 1 AND warehouse_id = 1');
    assertEqualsFloat(100.0, (float) $stmt->fetchColumn());
});

test('ENTRADA + SAIDA acumulam corretamente no mesmo saldo', function () {
    $db = makeStockDb();
    $service = new StockMovementService($db);

    $service->record(1, 1, 'ENTRADA', 100.0);
    $service->record(1, 1, 'SAIDA', 30.0);

    $stmt = $db->query('SELECT quantity FROM stock_balances WHERE material_id = 1 AND warehouse_id = 1');
    assertEqualsFloat(70.0, (float) $stmt->fetchColumn());
});

test('AJUSTE soma e RESERVA subtrai, como ENTRADA/SAIDA', function () {
    $db = makeStockDb();
    $service = new StockMovementService($db);

    $service->record(2, 1, 'AJUSTE', 50.0);
    $service->record(2, 1, 'RESERVA', 20.0);

    $stmt = $db->query('SELECT quantity FROM stock_balances WHERE material_id = 2 AND warehouse_id = 1');
    assertEqualsFloat(30.0, (float) $stmt->fetchColumn());
});

test('movement_type inválido lança exceção e não grava nada', function () {
    $db = makeStockDb();
    $service = new StockMovementService($db);

    assertThrows(InvalidArgumentException::class, function () use ($service) {
        $service->record(1, 1, 'TIPO_INEXISTENTE', 10.0);
    });

    $stmt = $db->query('SELECT COUNT(*) FROM stock_movements');
    assertTrue((int) $stmt->fetchColumn() === 0, 'Nenhuma movimentação deveria ter sido gravada');
});

test('quantity zero ou negativa é rejeitada', function () {
    $db = makeStockDb();
    $service = new StockMovementService($db);

    assertThrows(InvalidArgumentException::class, function () use ($service) {
        $service->record(1, 1, 'ENTRADA', 0.0);
    });
    assertThrows(InvalidArgumentException::class, function () use ($service) {
        $service->record(1, 1, 'ENTRADA', -5.0);
    });
});

exit(runRegisteredTests('StockMovementServiceTest') > 0 ? 1 : 0);
