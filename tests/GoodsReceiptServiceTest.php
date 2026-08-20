<?php

declare(strict_types=1);

require __DIR__ . '/TestRunner.php';

use App\Services\GoodsReceiptService;

function makeGoodsReceiptDb(): PDO
{
    $db = new PDO('sqlite::memory:');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec('CREATE TABLE purchase_orders (id INTEGER PRIMARY KEY, supplier_id INTEGER, status TEXT, total_value REAL)');
    $db->exec('CREATE TABLE purchase_order_items (id INTEGER PRIMARY KEY, purchase_order_id INTEGER, material_id INTEGER, quantity REAL, unit_price REAL)');
    $db->exec('CREATE TABLE goods_receipts (id INTEGER PRIMARY KEY, purchase_order_id INTEGER, received_at TEXT DEFAULT CURRENT_TIMESTAMP, received_by TEXT, notes TEXT)');
    $db->exec('CREATE TABLE stock_movements (
        id INTEGER PRIMARY KEY, material_id INTEGER, warehouse_id INTEGER,
        movement_type TEXT, quantity REAL, reference_type TEXT, reference_id INTEGER,
        created_by TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )');
    $db->exec('CREATE TABLE stock_balances (id INTEGER PRIMARY KEY, material_id INTEGER, warehouse_id INTEGER, quantity REAL, UNIQUE(material_id, warehouse_id))');

    $db->exec("INSERT INTO purchase_orders (id, supplier_id, status, total_value) VALUES (1, 1, 'CONFIRMADO', 0)");
    $db->exec('INSERT INTO purchase_order_items (id, purchase_order_id, material_id, quantity, unit_price) VALUES (1, 1, 10, 50, 10.5)');
    return $db;
}

test('recebimento parcial deixa pedido como RECEBIDO_PARCIAL e gera entrada de estoque', function () {
    $db = makeGoodsReceiptDb();
    $service = new GoodsReceiptService($db);

    $result = $service->receive(1, 1, [['purchase_order_item_id' => 1, 'quantity' => 20]], 'teste');

    assertTrue($result['purchase_order_status'] === 'RECEBIDO_PARCIAL');
    $stmt = $db->query('SELECT quantity FROM stock_balances WHERE material_id = 10 AND warehouse_id = 1');
    assertEqualsFloat(20.0, (float) $stmt->fetchColumn());
});

test('recebimento completo (soma de dois recebimentos) fecha o pedido como RECEBIDO_TOTAL', function () {
    $db = makeGoodsReceiptDb();
    $service = new GoodsReceiptService($db);

    $service->receive(1, 1, [['purchase_order_item_id' => 1, 'quantity' => 20]], 'teste');
    $result = $service->receive(1, 1, [['purchase_order_item_id' => 1, 'quantity' => 30]], 'teste');

    assertTrue($result['purchase_order_status'] === 'RECEBIDO_TOTAL');
    $stmt = $db->query('SELECT quantity FROM stock_balances WHERE material_id = 10 AND warehouse_id = 1');
    assertEqualsFloat(50.0, (float) $stmt->fetchColumn());

    $orderStmt = $db->query('SELECT status FROM purchase_orders WHERE id = 1');
    assertTrue($orderStmt->fetchColumn() === 'RECEBIDO_TOTAL');
});

test('item que não pertence ao pedido é rejeitado e nada é gravado (transação revertida)', function () {
    $db = makeGoodsReceiptDb();
    $service = new GoodsReceiptService($db);

    assertThrows(InvalidArgumentException::class, function () use ($service) {
        $service->receive(1, 1, [['purchase_order_item_id' => 999, 'quantity' => 10]]);
    });

    $stmt = $db->query('SELECT COUNT(*) FROM goods_receipts');
    assertTrue((int) $stmt->fetchColumn() === 0, 'Nenhum goods_receipt deveria ter sido gravado após falha');
    $stmt = $db->query('SELECT COUNT(*) FROM stock_movements');
    assertTrue((int) $stmt->fetchColumn() === 0, 'Nenhuma movimentação deveria ter sido gravada após falha');
});

exit(runRegisteredTests('GoodsReceiptServiceTest') > 0 ? 1 : 0);
