<?php

declare(strict_types=1);

require __DIR__ . '/TestRunner.php';

use App\Services\AuthService;

function makeAuthDb(): PDO
{
    $db = new PDO('sqlite::memory:');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec('CREATE TABLE users (
        id INTEGER PRIMARY KEY, name TEXT, email TEXT, password_hash TEXT,
        role TEXT, active INTEGER DEFAULT 1, last_login_at TEXT
    )');
    $hash = password_hash('senha-correta-123', PASSWORD_BCRYPT);
    $db->exec("INSERT INTO users (id, name, email, password_hash, role, active) VALUES
        (1, 'Fulano', 'fulano@exemplo.com', '{$hash}', 'ADMIN', 1)");
    $inactiveHash = password_hash('outra-senha', PASSWORD_BCRYPT);
    $db->exec("INSERT INTO users (id, name, email, password_hash, role, active) VALUES
        (2, 'Inativo', 'inativo@exemplo.com', '{$inactiveHash}', 'USER', 0)");
    return $db;
}

test('login com e-mail e senha corretos retorna o usuário sem o hash', function () {
    $db = makeAuthDb();
    $service = new AuthService($db);

    $user = $service->attempt('fulano@exemplo.com', 'senha-correta-123');

    assertTrue($user !== null, 'Deveria autenticar com credenciais corretas');
    assertTrue($user['email'] === 'fulano@exemplo.com');
    assertTrue(!array_key_exists('password_hash', $user), 'password_hash nunca deve ser devolvido ao chamador');
});

test('login com senha errada retorna null', function () {
    $db = makeAuthDb();
    $service = new AuthService($db);

    $user = $service->attempt('fulano@exemplo.com', 'senha-errada');

    assertTrue($user === null);
});

test('login com e-mail inexistente retorna null (sem vazar se o e-mail existe)', function () {
    $db = makeAuthDb();
    $service = new AuthService($db);

    $user = $service->attempt('naoexiste@exemplo.com', 'qualquer-coisa');

    assertTrue($user === null);
});

test('usuário inativo não consegue logar mesmo com senha correta', function () {
    $db = makeAuthDb();
    $service = new AuthService($db);

    $user = $service->attempt('inativo@exemplo.com', 'outra-senha');

    assertTrue($user === null);
});

test('login bem-sucedido atualiza last_login_at', function () {
    $db = makeAuthDb();
    $service = new AuthService($db);

    $service->attempt('fulano@exemplo.com', 'senha-correta-123');

    $stmt = $db->query('SELECT last_login_at FROM users WHERE id = 1');
    assertTrue($stmt->fetchColumn() !== null, 'last_login_at deveria ter sido preenchido');
});

test('trocar senha com senha atual correta funciona e a nova senha passa a logar', function () {
    $db = makeAuthDb();
    $service = new AuthService($db);

    $ok = $service->changePassword(1, 'senha-correta-123', 'nova-senha-longa-456');
    assertTrue($ok === true);

    assertTrue($service->attempt('fulano@exemplo.com', 'nova-senha-longa-456') !== null, 'Deveria logar com a nova senha');
    assertTrue($service->attempt('fulano@exemplo.com', 'senha-correta-123') === null, 'Senha antiga não deveria funcionar mais');
});

test('trocar senha com senha atual errada falha e não altera nada', function () {
    $db = makeAuthDb();
    $service = new AuthService($db);

    $ok = $service->changePassword(1, 'senha-errada', 'nova-senha-longa-456');
    assertTrue($ok === false);

    assertTrue($service->attempt('fulano@exemplo.com', 'senha-correta-123') !== null, 'Senha original deveria continuar valendo');
});

exit(runRegisteredTests('AuthServiceTest') > 0 ? 1 : 0);
