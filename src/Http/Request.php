<?php

declare(strict_types=1);

namespace App\Http;

final class Request
{
    /** @var array<string, mixed> */
    private array $body;

    public function __construct(
        public readonly string $method,
        public readonly string $path,
        /** @var array<string, string> */
        public readonly array $query = [],
    ) {
        $raw = file_get_contents('php://input') ?: '';
        $decoded = $raw !== '' ? json_decode($raw, true) : [];
        $this->body = is_array($decoded) ? $decoded : [];
    }

    public static function fromGlobals(): self
    {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $path = rtrim((string) parse_url($uri, PHP_URL_PATH), '/');
        return new self($method, $path === '' ? '/' : $path, $_GET);
    }

    /** @return array<string, mixed> */
    public function body(): array
    {
        return $this->body;
    }

    public function input(string $key, mixed $default = null): mixed
    {
        return $this->body[$key] ?? $this->query[$key] ?? $default;
    }
}
