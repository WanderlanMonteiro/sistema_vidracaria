<?php

declare(strict_types=1);

// Executa todos os *Test.php desta pasta em subprocessos php isolados (cada arquivo
// registra seus próprios testes em $GLOBALS, então isolar evita colisão entre eles).

$files = glob(__DIR__ . '/*Test.php') ?: [];
sort($files);

$failures = 0;
foreach ($files as $file) {
    echo '=== ' . basename($file) . " ===\n";
    passthru('php ' . escapeshellarg($file), $exitCode);
    $failures += $exitCode;
    echo "\n";
}

exit($failures > 0 ? 1 : 0);
