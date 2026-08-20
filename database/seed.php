<?php

declare(strict_types=1);

// CLI: php database/seed.php
// Aplica, em ordem alfabética, todo .sql em database/seeds/ ainda não registrado em
// schema_seeds. Cada arquivo de seed é responsável por si mesmo (IDs explícitos para
// dados-base, variáveis de sessão MySQL para linhas geradas dinamicamente).

require __DIR__ . '/../src/autoload.php';

use App\Config\Database;
use App\Support\Env;
use App\Support\SqlScript;

Env::load(__DIR__ . '/../.env');

$db = Database::connection();

$db->exec(
    "CREATE TABLE IF NOT EXISTS schema_seeds (
        seed VARCHAR(180) PRIMARY KEY,
        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
);

$applied = $db->query('SELECT seed FROM schema_seeds')->fetchAll(PDO::FETCH_COLUMN);

$dir = __DIR__ . '/seeds';
$files = glob($dir . '/*.sql') ?: [];
sort($files);

foreach ($files as $file) {
    $name = basename($file);
    if (in_array($name, $applied, true)) {
        echo "= já aplicado: {$name}\n";
        continue;
    }

    echo "-> aplicando: {$name}\n";
    $sql = file_get_contents($file);
    if ($sql === false) {
        fwrite(STDERR, "Falha ao ler {$file}\n");
        exit(1);
    }

    try {
        // Seeds só têm DML (INSERT/UPDATE/SET), então uma transação por arquivo é
        // segura e dá atomicidade real em caso de erro no meio do arquivo.
        $db->beginTransaction();
        foreach (SqlScript::splitStatements($sql) as $statement) {
            $db->exec($statement);
        }
        $stmt = $db->prepare('INSERT INTO schema_seeds (seed) VALUES (?)');
        $stmt->execute([$name]);
        $db->commit();
        echo "   ok\n";
    } catch (\Throwable $e) {
        $db->rollBack();
        fwrite(STDERR, "Erro ao aplicar {$name}: {$e->getMessage()}\n");
        exit(1);
    }
}

echo "Seeds concluídos.\n";
