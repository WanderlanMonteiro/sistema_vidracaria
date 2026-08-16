<?php

declare(strict_types=1);

require __DIR__ . '/TestRunner.php';

use App\Services\ProductionReleaseValidator;

// Usa SQLite em memória com um subconjunto mínimo do schema para testar as regras
// de bloqueio (seção 13) sem depender de um MySQL rodando. A sintaxe usada nas
// queries do validator é simples o bastante para funcionar em ambos os motores.
function makeInMemoryDb(): PDO
{
    $db = new PDO('sqlite::memory:');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec('CREATE TABLE formula_versions (id INTEGER PRIMARY KEY, status_code TEXT)');
    $db->exec('CREATE TABLE formula_components (id INTEGER PRIMARY KEY, formula_version_id INTEGER)');
    $db->exec('CREATE TABLE formula_deductions (id INTEGER PRIMARY KEY, formula_version_id INTEGER, status_code TEXT)');
    $db->exec('CREATE TABLE formula_validations (id INTEGER PRIMARY KEY, formula_version_id INTEGER, result TEXT)');
    $db->exec("CREATE TABLE prototypes (id INTEGER PRIMARY KEY, formula_version_id INTEGER, status TEXT)");
    $db->exec("CREATE TABLE technical_approvals (id INTEGER PRIMARY KEY, subject_type TEXT, subject_id INTEGER)");
    return $db;
}

test('fórmula recém-importada (Asa Flex real) NÃO deve ser liberada para produção', function () {
    $db = makeInMemoryDb();
    $db->exec("INSERT INTO formula_versions (id, status_code) VALUES (1, 'PENDENTE')");
    $db->exec('INSERT INTO formula_components (formula_version_id) VALUES (1)');
    // Descontos existem mas ainda NECESSITA_CONFERENCIA (como o seed real do Asa Flex).
    $db->exec("INSERT INTO formula_deductions (formula_version_id, status_code) VALUES (1, 'NECESSITA_CONFERENCIA')");
    $db->exec("INSERT INTO formula_validations (formula_version_id, result) VALUES (1, 'PENDENTE')");

    $validator = new ProductionReleaseValidator($db);
    $check = $validator->check(1);

    assertTrue($check['released'] === false, 'Fórmula sem protótipo aprovado não pode ser liberada');
    assertTrue(in_array('prototipo_aprovado', $check['pending'], true));
    assertTrue(in_array('descontos_folgas_validados', $check['pending'], true));
    assertTrue(in_array('validacoes_aprovadas', $check['pending'], true));
    assertTrue(in_array('responsavel_tecnico', $check['pending'], true));
});

test('fórmula com checklist 100% completo É liberada', function () {
    $db = makeInMemoryDb();
    $db->exec("INSERT INTO formula_versions (id, status_code) VALUES (2, 'APROVADO')");
    $db->exec('INSERT INTO formula_components (formula_version_id) VALUES (2)');
    $db->exec("INSERT INTO formula_deductions (formula_version_id, status_code) VALUES (2, 'VALIDADO')");
    $db->exec("INSERT INTO formula_validations (formula_version_id, result) VALUES (2, 'APROVADO')");
    $db->exec("INSERT INTO prototypes (formula_version_id, status) VALUES (2, 'APROVADO')");
    $db->exec("INSERT INTO technical_approvals (subject_type, subject_id) VALUES ('FORMULA_VERSION', 2)");

    $validator = new ProductionReleaseValidator($db);
    $check = $validator->check(2);

    assertTrue($check['released'] === true, 'Checklist completo deveria liberar a fórmula');
    assertTrue($check['pending'] === []);
});

test('fórmula com status BLOQUEADO nunca é liberada mesmo com checklist completo', function () {
    $db = makeInMemoryDb();
    $db->exec("INSERT INTO formula_versions (id, status_code) VALUES (3, 'BLOQUEADO')");
    $db->exec('INSERT INTO formula_components (formula_version_id) VALUES (3)');
    $db->exec("INSERT INTO formula_deductions (formula_version_id, status_code) VALUES (3, 'VALIDADO')");
    $db->exec("INSERT INTO formula_validations (formula_version_id, result) VALUES (3, 'APROVADO')");
    $db->exec("INSERT INTO prototypes (formula_version_id, status) VALUES (3, 'APROVADO')");
    $db->exec("INSERT INTO technical_approvals (subject_type, subject_id) VALUES ('FORMULA_VERSION', 3)");

    $validator = new ProductionReleaseValidator($db);
    $check = $validator->check(3);

    assertTrue($check['released'] === false);
    assertTrue(in_array('versao_nao_bloqueada', $check['pending'], true));
});

exit(runRegisteredTests('ProductionReleaseValidatorTest') > 0 ? 1 : 0);
