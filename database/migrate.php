<?php

declare(strict_types=1);

// CLI: php database/migrate.php
// Aplica, em ordem alfabética de nome de arquivo, todo .sql em database/migrations/
// que ainda não conste em schema_migrations. Idempotente: pode rodar várias vezes.
// Em hospedagem sem SSH (HostGator básico), importe os arquivos manualmente pelo
// phpMyAdmin na mesma ordem — ver docs/DEPLOY_HOSTGATOR.md.

require __DIR__ . '/../src/autoload.php';

use App\Config\Database;
use App\Support\Env;
use App\Support\SqlScript;

Env::load(__DIR__ . '/../.env');

$db = Database::connection();

$db->exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations (
        migration VARCHAR(180) PRIMARY KEY,
        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
);

$applied = $db->query('SELECT migration FROM schema_migrations')->fetchAll(PDO::FETCH_COLUMN);

$dir = __DIR__ . '/migrations';
$files = glob($dir . '/*.sql') ?: [];
sort($files);

foreach ($files as $file) {
    $name = basename($file);
    if (in_array($name, $applied, true)) {
        echo "= já aplicada: {$name}\n";
        continue;
    }

    echo "-> aplicando: {$name}\n";
    $sql = file_get_contents($file);
    if ($sql === false) {
        fwrite(STDERR, "Falha ao ler {$file}\n");
        exit(1);
    }

    // DDL (CREATE TABLE/ALTER TABLE) causa commit implícito no MySQL, então uma
    // migration não é atomicamente reversível por natureza do próprio motor —
    // por isso não envolvemos em transação aqui (ao contrário de seed.php, que só
    // executa DML e pode se beneficiar de rollback real em caso de erro).
    try {
        foreach (SqlScript::splitStatements($sql) as $statement) {
            $db->exec($statement);
        }
        $stmt = $db->prepare('INSERT INTO schema_migrations (migration) VALUES (?)');
        $stmt->execute([$name]);
        echo "   ok\n";
    } catch (\Throwable $e) {
        fwrite(STDERR, "Erro ao aplicar {$name}: {$e->getMessage()}\n");
        exit(1);
    }
}

echo "Migrations concluídas.\n";
