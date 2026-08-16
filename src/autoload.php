<?php

declare(strict_types=1);

// Autoloader manual PSR-4 (App\ -> src/). Sem dependência de Composer/vendor,
// para funcionar em hospedagem compartilhada sem acesso a `composer install`.
spl_autoload_register(function (string $class): void {
    $prefix = 'App\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }
    $relative = substr($class, strlen($prefix));
    $path = __DIR__ . '/' . str_replace('\\', '/', $relative) . '.php';
    if (is_file($path)) {
        require $path;
    }
});
