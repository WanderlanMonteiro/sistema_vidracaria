<?php

declare(strict_types=1);

require __DIR__ . '/TestRunner.php';

use App\Services\FormulaBuilderService;

function makeFormulaBuilderDb(): PDO
{
    $db = new PDO('sqlite::memory:');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec('CREATE TABLE formulas (
        id INTEGER PRIMARY KEY, name TEXT, typology_id INTEGER, product_line_id INTEGER,
        description TEXT, is_reference_only INTEGER DEFAULT 1, current_version_id INTEGER,
        status_code TEXT, source_reference_id INTEGER
    )');
    $db->exec('CREATE TABLE formula_versions (
        id INTEGER PRIMARY KEY, formula_id INTEGER, version_number INTEGER, notes TEXT,
        rounding_mode TEXT, rounding_decimals INTEGER, status_code TEXT,
        production_locked INTEGER, created_by TEXT
    )');
    $db->exec('CREATE TABLE formula_components (
        id INTEGER PRIMARY KEY, formula_version_id INTEGER, component_role TEXT, profile_id INTEGER,
        quantity INTEGER, expression TEXT, cut_angle_deg REAL, notes TEXT, source_reference_id INTEGER
    )');
    $db->exec('CREATE TABLE formula_deductions (
        id INTEGER PRIMARY KEY, formula_version_id INTEGER, formula_component_id INTEGER,
        deduction_type TEXT, value_mm REAL, description TEXT, status_code TEXT, source_reference_id INTEGER
    )');
    return $db;
}

test('cria fórmula com componentes, sempre PENDENTE e bloqueada para produção', function () {
    $db = makeFormulaBuilderDb();
    $service = new FormulaBuilderService($db);

    $formula = $service->create([
        'name' => 'Janela de correr 2 folhas — teste',
        'typology_id' => 1,
        'components' => [
            ['component_role' => 'MARCO', 'profile_id' => 1, 'quantity' => 2, 'expression' => 'L - 10'],
            ['component_role' => 'FOLHA_LARGURA', 'profile_id' => 2, 'quantity' => 2, 'expression' => '(L / 2) + 20'],
        ],
    ]);

    assertTrue($formula['status_code'] === 'PENDENTE');
    assertTrue(count($formula['components']) === 2);

    $versionStmt = $db->prepare('SELECT * FROM formula_versions WHERE id = ?');
    $versionStmt->execute([$formula['current_version_id']]);
    $version = $versionStmt->fetch();
    assertTrue($version['status_code'] === 'PENDENTE');
    assertTrue(((int) $version['production_locked']) === 1, 'Fórmula recém-criada precisa nascer bloqueada para produção');
});

test('rejeita fórmula sem nome', function () {
    $db = makeFormulaBuilderDb();
    $service = new FormulaBuilderService($db);

    assertThrows(InvalidArgumentException::class, function () use ($service) {
        $service->create(['components' => [['component_role' => 'MARCO', 'expression' => 'L']]]);
    });
});

test('rejeita fórmula sem nenhum componente', function () {
    $db = makeFormulaBuilderDb();
    $service = new FormulaBuilderService($db);

    assertThrows(InvalidArgumentException::class, function () use ($service) {
        $service->create(['name' => 'Sem componentes']);
    });
});

test('rejeita expressão com sintaxe inválida e não grava nada (transação revertida)', function () {
    $db = makeFormulaBuilderDb();
    $service = new FormulaBuilderService($db);

    assertThrows(InvalidArgumentException::class, function () use ($service) {
        $service->create([
            'name' => 'Expressão quebrada',
            'components' => [
                ['component_role' => 'MARCO', 'expression' => 'L + '],
            ],
        ]);
    });

    $stmt = $db->query('SELECT COUNT(*) FROM formulas');
    assertTrue((int) $stmt->fetchColumn() === 0, 'Nenhuma fórmula deveria ter sido gravada após falha de validação');
});

test('componente sem expressão (ex: vidro cortado à parte) é aceito com expression nula', function () {
    $db = makeFormulaBuilderDb();
    $service = new FormulaBuilderService($db);

    $formula = $service->create([
        'name' => 'Com componente sem expressão',
        'components' => [
            ['component_role' => 'VIDRO', 'quantity' => 1],
        ],
    ]);

    assertTrue($formula['components'][0]['expression'] === null);
});

test('deduções são aceitas e nascem PENDENTE', function () {
    $db = makeFormulaBuilderDb();
    $service = new FormulaBuilderService($db);

    $formula = $service->create([
        'name' => 'Com dedução',
        'components' => [
            ['component_role' => 'MARCO', 'expression' => 'L - 10'],
        ],
        'deductions' => [
            ['deduction_type' => 'DESCONTO', 'value_mm' => 10, 'description' => 'desconto de encaixe'],
        ],
    ]);

    assertTrue(count($formula['deductions']) === 1);
    assertTrue($formula['deductions'][0]['status_code'] === 'PENDENTE');
});

exit(runRegisteredTests('FormulaBuilderServiceTest') > 0 ? 1 : 0);
