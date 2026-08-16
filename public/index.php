<?php

declare(strict_types=1);

require __DIR__ . '/../src/autoload.php';

use App\Config\Database;
use App\Controllers\FormulaController;
use App\Controllers\ManufacturerController;
use App\Controllers\ProfileController;
use App\Controllers\TypologyController;
use App\Http\Request;
use App\Http\Response;
use App\Http\Router;
use App\Support\Env;

Env::load(__DIR__ . '/../.env');

error_reporting(E_ALL);
ini_set('display_errors', Env::get('APP_DEBUG', '0') === '1' ? '1' : '0');

set_exception_handler(static function (\Throwable $e): void {
    error_log($e->getMessage() . "\n" . $e->getTraceAsString());
    Response::error(
        Env::get('APP_DEBUG', '0') === '1' ? $e->getMessage() : 'Erro interno do servidor.',
        500
    );
});

$db = Database::connection();
$router = new Router();

$router->get('/', static function (): void {
    Response::json([
        'sistema' => 'Sistema Técnico e Operacional — Esquadrias de Alumínio, Forro PVC e Drywall',
        'fase' => 'Fase 1 — núcleo técnico',
        'endpoints' => [
            'GET /fabricantes',
            'GET /perfis',
            'GET /perfis/{id}',
            'GET /tipologias',
            'GET /formulas',
            'GET /formulas/{id}',
            'GET /formulas/{id}/checklist-producao',
            'POST /formulas/{id}/calcular',
        ],
    ]);
});

$router->get('/fabricantes', [new ManufacturerController($db), 'index']);
$router->get('/perfis', [new ProfileController($db), 'index']);
$router->get('/perfis/{id}', [new ProfileController($db), 'show']);
$router->get('/tipologias', [new TypologyController($db), 'index']);
$router->get('/formulas', [new FormulaController($db), 'index']);
$router->get('/formulas/{id}', [new FormulaController($db), 'show']);
$router->get('/formulas/{id}/checklist-producao', [new FormulaController($db), 'checklist']);
$router->post('/formulas/{id}/calcular', [new FormulaController($db), 'calculate']);

$router->dispatch(Request::fromGlobals());
