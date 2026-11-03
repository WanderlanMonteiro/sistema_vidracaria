<?php

declare(strict_types=1);

require __DIR__ . '/TestRunner.php';

use App\Services\ProductionStatusService;

function makeProductionStatusDb(): PDO
{
    $db = new PDO('sqlite::memory:');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec('CREATE TABLE production_order_items (id INTEGER PRIMARY KEY, production_order_id INTEGER, formula_version_id INTEGER, quantity INTEGER, status_code TEXT)');
    $db->exec('CREATE TABLE production_status_history (
        id INTEGER PRIMARY KEY, production_order_item_id INTEGER, from_status TEXT, to_status TEXT,
        changed_by TEXT, changed_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT
    )');
    $db->exec("INSERT INTO production_order_items (id, production_order_id, formula_version_id, quantity, status_code) VALUES (1, 1, 1, 2, 'PENDENTE')");
    return $db;
}

test('troca de status grava o novo valor e uma linha de histórico com from/to corretos', function () {
    $db = makeProductionStatusDb();
    $service = new ProductionStatusService($db);

    $item = $service->changeStatus(1, 'VALIDADO', 'responsavel', 'corte iniciado');

    assertTrue($item['status_code'] === 'VALIDADO');

    $stmt = $db->query('SELECT from_status, to_status, changed_by, notes FROM production_status_history WHERE production_order_item_id = 1');
    $history = $stmt->fetch(PDO::FETCH_ASSOC);
    assertTrue($history['from_status'] === 'PENDENTE');
    assertTrue($history['to_status'] === 'VALIDADO');
    assertTrue($history['changed_by'] === 'responsavel');
    assertTrue($history['notes'] === 'corte iniciado');
});

test('item inexistente lança exceção', function () {
    $db = makeProductionStatusDb();
    $service = new ProductionStatusService($db);

    assertThrows(InvalidArgumentException::class, function () use ($service) {
        $service->changeStatus(999, 'VALIDADO');
    });
});

test('duas trocas de status em sequência acumulam duas linhas de histórico distintas', function () {
    $db = makeProductionStatusDb();
    $service = new ProductionStatusService($db);

    $service->changeStatus(1, 'VALIDADO');
    $service->changeStatus(1, 'APROVADO');

    $stmt = $db->query('SELECT COUNT(*) FROM production_status_history WHERE production_order_item_id = 1');
    assertTrue((int) $stmt->fetchColumn() === 2);

    $stmt = $db->query('SELECT status_code FROM production_order_items WHERE id = 1');
    assertTrue($stmt->fetchColumn() === 'APROVADO');
});

exit(runRegisteredTests('ProductionStatusServiceTest') > 0 ? 1 : 0);
