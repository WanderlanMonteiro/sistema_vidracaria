<?php

declare(strict_types=1);

require __DIR__ . '/TestRunner.php';

use App\Services\UserService;

function makeUserServiceDb(): PDO
{
    $db = new PDO('sqlite::memory:');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec('CREATE TABLE users (
        id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE, password_hash TEXT,
        role TEXT DEFAULT "USER", active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP, last_login_at TEXT
    )');
    return $db;
}

test('cria usuário com senha e retorna sem o hash', function () {
    $db = makeUserServiceDb();
    $service = new UserService($db);

    $user = $service->create('Fulano', 'fulano@exemplo.com', 'senha1234', 'TECNICO');

    assertTrue($user['name'] === 'Fulano');
    assertTrue($user['role'] === 'TECNICO');
    assertTrue(!array_key_exists('password_hash', $user));

    $stmt = $db->query('SELECT password_hash FROM users WHERE email = "fulano@exemplo.com"');
    $hash = $stmt->fetchColumn();
    assertTrue(password_verify('senha1234', $hash));
});

test('rejeita senha curta', function () {
    $db = makeUserServiceDb();
    $service = new UserService($db);

    assertThrows(InvalidArgumentException::class, function () use ($service) {
        $service->create('Fulano', 'fulano@exemplo.com', '123', 'USER');
    });
});

test('desativar usuário muda active sem mexer no resto', function () {
    $db = makeUserServiceDb();
    $service = new UserService($db);
    $created = $service->create('Fulano', 'fulano@exemplo.com', 'senha1234');

    $updated = $service->updateStatusAndRole((int) $created['id'], false, null, null);

    assertTrue(((int) $updated['active']) === 0);
    assertTrue($updated['name'] === 'Fulano');
});

exit(runRegisteredTests('UserServiceTest') > 0 ? 1 : 0);
