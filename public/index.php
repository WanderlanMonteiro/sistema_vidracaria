<?php

declare(strict_types=1);

require __DIR__ . '/../src/autoload.php';

use App\Config\Database;
use App\Controllers\AuthController;
use App\Controllers\UserController;
use App\Controllers\FormulaController;
use App\Controllers\GoodsReceiptController;
use App\Controllers\ManufacturerController;
use App\Controllers\ProductionOrderItemController;
use App\Controllers\ProfileController;
use App\Controllers\QuoteReportController;
use App\Controllers\StockMovementController;
use App\Controllers\TemperingOrderController;
use App\Controllers\Support\CrudController;
use App\Http\Request;
use App\Http\Response;
use App\Http\Router;
use App\Support\Auth;
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

Auth::start();

$db = Database::connection();
$router = new Router();

/**
 * Registra as 5 rotas REST padrão (index/show/create/update/delete) para um
 * CrudController — evita repetir a mesma sequência de 5 linhas para cada uma
 * das ~30 tabelas transacionais que não têm regra de negócio própria.
 */
$registerCrud = static function (Router $router, string $path, CrudController $controller): void {
    $router->get($path, [$controller, 'index']);
    $router->get($path . '/{id}', [$controller, 'show']);
    $router->post($path, [$controller, 'create']);
    $router->put($path . '/{id}', [$controller, 'update']);
    $router->delete($path . '/{id}', [$controller, 'delete']);
};

$router->get('/', static function () use ($db): void {
    Response::json([
        'sistema' => 'Sistema Técnico e Operacional — Esquadrias de Alumínio, Forro PVC e Drywall',
        'fase' => 'Fase 1 (núcleo técnico) + Fase 2 (comercial/estoque/produção/qualidade)',
        'documentacao' => 'Ver docs/API.md',
    ]);
});

// --- Autenticação --- (/auth/login é a única rota de dado que fica pública, ver guard abaixo)
$router->post('/auth/login', [new AuthController($db), 'login']);
$router->post('/auth/logout', [new AuthController($db), 'logout']);
$router->get('/auth/me', [new AuthController($db), 'me']);
$router->put('/auth/senha', [new AuthController($db), 'changePassword']);
$router->get('/usuarios', [new UserController($db), 'index']);
$router->post('/usuarios', [new UserController($db), 'create']);
$router->put('/usuarios/{id}', [new UserController($db), 'update']);

// --- Núcleo técnico (Fase 1) ---
$router->get('/fabricantes', [new ManufacturerController($db), 'index']);
$router->get('/perfis', [new ProfileController($db), 'index']);
$router->get('/perfis/{id}', [new ProfileController($db), 'show']);
$registerCrud($router, '/tipologias', new CrudController($db, 'typologies', ['name', 'category', 'has_baguete', 'is_common_in_brazil', 'drawing_data'], ['category']));
$router->get('/deducoes-instalacao', [new CrudController($db, 'installation_deductions', [], ['typology_id']), 'index']);
$registerCrud($router, '/vidros', new CrudController($db, 'glass_types', ['name', 'thickness_mm', 'glass_category', 'notes', 'status_code'], ['glass_category']));
$router->get('/acessorios', [new CrudController($db, 'accessories', [], ['category', 'manufacturer_id']), 'index']);
$router->get('/acessorios/{id}', [new CrudController($db, 'accessories', [], ['category', 'manufacturer_id']), 'show']);
$router->get('/acessorios-compatibilidades', [new CrudController($db, 'accessory_compatibilities', [], ['accessory_id', 'typology_id']), 'index']);
$router->get('/formulas', [new FormulaController($db), 'index']);
$router->get('/formulas/{id}', [new FormulaController($db), 'show']);
$router->get('/formulas/{id}/checklist-producao', [new FormulaController($db), 'checklist']);
$router->post('/formulas/{id}/calcular', [new FormulaController($db), 'calculate']);
$router->post('/formulas', [new FormulaController($db), 'create']);

// --- Comercial ---
$registerCrud($router, '/clientes', new CrudController($db, 'customers', ['name', 'document_number', 'phone', 'email', 'address']));
$registerCrud($router, '/fornecedores', new CrudController($db, 'suppliers', ['name', 'document_number', 'phone', 'email', 'address']));
$registerCrud($router, '/vendedores', new CrudController($db, 'sellers', ['name', 'email', 'phone', 'active']));
$registerCrud($router, '/tabelas-preco', new CrudController($db, 'price_tables', ['name', 'product_line_id', 'valid_from', 'valid_to', 'status'], ['product_line_id', 'status']));
$registerCrud($router, '/tabelas-preco-itens', new CrudController($db, 'price_table_items', ['price_table_id', 'item_type', 'item_id', 'unit_price', 'unit'], ['price_table_id']));
$registerCrud($router, '/projetos', new CrudController($db, 'projects', ['customer_id', 'name', 'address', 'status'], ['customer_id', 'status']));
$registerCrud($router, '/ambientes', new CrudController($db, 'environments', ['project_id', 'name', 'notes'], ['project_id']));
$registerCrud($router, '/vaos', new CrudController($db, 'openings', ['environment_id', 'typology_id', 'width_mm', 'height_mm', 'quantity', 'notes'], ['environment_id']));
$registerCrud($router, '/orcamentos', new CrudController($db, 'quotes', ['project_id', 'seller_id', 'status', 'total_value'], ['project_id', 'status']));
$registerCrud($router, '/orcamentos-itens', new CrudController($db, 'quote_items', [
    'quote_id', 'opening_id', 'formula_version_id', 'description', 'quantity', 'unit_price', 'total_price',
    'width_mm', 'width_mm_2', 'height_mm', 'height_mm_2', 'glass_type_id', 'pricing_unit',
], ['quote_id']));
$registerCrud($router, '/orcamentos-acessorios', new CrudController($db, 'quote_accessories', ['quote_id', 'accessory_id', 'description', 'quantity'], ['quote_id']));
$router->get('/orcamentos/{id}/relatorio-compras', [new QuoteReportController($db), 'purchaseReport']);
$router->get('/orcamentos/{id}/relatorio-tempera', [new QuoteReportController($db), 'temperingReport']);

// --- Pedido de têmpera (rastreável: pendente/enviado/recebido) ---
$router->get('/pedidos-tempera', [new CrudController($db, 'tempering_orders', [], ['status', 'quote_id', 'supplier_id']), 'index']);
$router->get('/pedidos-tempera/{id}', [new TemperingOrderController($db), 'show']);
$router->post('/pedidos-tempera', [new TemperingOrderController($db), 'createFromQuote']);
$router->post('/pedidos-tempera/manual', [new TemperingOrderController($db), 'createManual']);
$router->put('/pedidos-tempera/{id}', [new CrudController($db, 'tempering_orders', ['status', 'supplier_id', 'sent_at', 'received_at', 'notes']), 'update']);
$registerCrud($router, '/pedidos-venda', new CrudController($db, 'sales_orders', ['quote_id', 'project_id', 'status', 'total_value'], ['project_id', 'status']));
$registerCrud($router, '/pedidos-venda-itens', new CrudController($db, 'sales_order_items', ['sales_order_id', 'description', 'quantity', 'unit_price', 'total_price'], ['sales_order_id']));

// --- Estoque e compras ---
$registerCrud($router, '/materiais', new CrudController($db, 'materials', ['name', 'category', 'profile_id', 'accessory_id', 'glass_type_id', 'unit', 'min_stock'], ['category']));
$registerCrud($router, '/depositos', new CrudController($db, 'warehouses', ['name', 'address']));
$router->get('/saldos-estoque', [new CrudController($db, 'stock_balances', [], ['material_id', 'warehouse_id']), 'index']);
$router->get('/movimentacoes-estoque', [new StockMovementController($db), 'index']);
$router->post('/movimentacoes-estoque', [new StockMovementController($db), 'create']);
$registerCrud($router, '/reservas-estoque', new CrudController($db, 'stock_reservations', ['material_id', 'warehouse_id', 'production_order_id', 'quantity', 'status'], ['production_order_id', 'status']));
$registerCrud($router, '/pedidos-compra', new CrudController($db, 'purchase_orders', ['supplier_id', 'status', 'total_value'], ['supplier_id', 'status']));
$registerCrud($router, '/pedidos-compra-itens', new CrudController($db, 'purchase_order_items', ['purchase_order_id', 'material_id', 'quantity', 'unit_price'], ['purchase_order_id']));
$router->get('/recebimentos', [new GoodsReceiptController($db), 'index']);
$router->post('/recebimentos', [new GoodsReceiptController($db), 'create']);

// --- Financeiro ---
$registerCrud($router, '/lancamentos-financeiros', new CrudController(
    $db,
    'financial_entries',
    ['entry_type', 'category', 'description', 'amount', 'due_date', 'paid_date', 'status', 'project_id', 'purchase_order_id', 'sales_order_id', 'notes'],
    ['project_id', 'status', 'entry_type']
));

// --- Produção ---
$registerCrud($router, '/ordens-producao', new CrudController($db, 'production_orders', ['sales_order_id', 'status', 'priority', 'planned_start', 'planned_end'], ['sales_order_id', 'status']));
$router->get('/ordens-producao-itens', [new ProductionOrderItemController($db), 'index']);
$router->post('/ordens-producao-itens', [new ProductionOrderItemController($db), 'create']);
$router->put('/ordens-producao-itens/{id}/status', [new ProductionOrderItemController($db), 'updateStatus']);
$registerCrud($router, '/listas-corte', new CrudController($db, 'cut_lists', ['production_order_item_id', 'generated_by'], ['production_order_item_id']));
$registerCrud($router, '/listas-corte-itens', new CrudController($db, 'cut_list_items', ['cut_list_id', 'profile_id', 'length_mm', 'quantity', 'bar_sequence', 'angle_deg'], ['cut_list_id']));
$registerCrud($router, '/listas-vidro', new CrudController($db, 'glass_lists', ['production_order_item_id', 'glass_type_id', 'width_mm', 'height_mm', 'quantity'], ['production_order_item_id']));
$registerCrud($router, '/listas-acessorios', new CrudController($db, 'accessory_lists', ['production_order_item_id', 'accessory_id', 'quantity'], ['production_order_item_id']));
$registerCrud($router, '/planos-otimizacao', new CrudController($db, 'optimization_plans', ['production_order_id', 'algorithm', 'waste_percentage'], ['production_order_id']));
$registerCrud($router, '/planos-otimizacao-itens', new CrudController($db, 'optimization_items', ['optimization_plan_id', 'profile_id', 'bar_length_mm', 'cuts_json', 'leftover_mm'], ['optimization_plan_id']));
$registerCrud($router, '/etapas-producao', new CrudController($db, 'production_steps', ['production_order_item_id', 'step_name', 'sequence', 'status'], ['production_order_item_id']));
$router->get('/historico-status-producao', [new CrudController($db, 'production_status_history', [], ['production_order_item_id']), 'index']);

// --- Qualidade ---
$registerCrud($router, '/prototipos', new CrudController($db, 'prototypes', ['formula_version_id', 'built_by', 'built_at', 'status', 'notes'], ['formula_version_id', 'status']));
$registerCrud($router, '/prototipos-componentes', new CrudController($db, 'prototype_components', ['prototype_id', 'formula_component_id', 'measured_length_mm', 'notes'], ['prototype_id']));
$registerCrud($router, '/prototipos-medicoes', new CrudController($db, 'prototype_measurements', ['prototype_id', 'measurement_name', 'expected_value', 'measured_value', 'deviation', 'within_tolerance'], ['prototype_id']));
$registerCrud($router, '/validacoes', new CrudController($db, 'validation_records', ['subject_type', 'subject_id', 'validated_by', 'result', 'notes'], ['subject_type', 'subject_id']));
$registerCrud($router, '/checklists-inspecao', new CrudController($db, 'inspection_checklists', ['name', 'applies_to'], ['applies_to']));
$registerCrud($router, '/resultados-inspecao', new CrudController($db, 'inspection_results', ['inspection_checklist_id', 'production_order_item_id', 'prototype_id', 'item_label', 'result', 'notes', 'inspected_by'], ['inspection_checklist_id', 'production_order_item_id', 'prototype_id']));
$registerCrud($router, '/nao-conformidades', new CrudController($db, 'nonconformities', ['source_type', 'source_id', 'description', 'severity', 'status', 'opened_by'], ['source_type', 'source_id', 'status']));
$registerCrud($router, '/acoes-corretivas', new CrudController($db, 'corrective_actions', ['nonconformity_id', 'action_description', 'responsible', 'due_date', 'status', 'closed_at'], ['nonconformity_id', 'status']));
$registerCrud($router, '/aprovacoes-tecnicas', new CrudController($db, 'technical_approvals', ['subject_type', 'subject_id', 'approved_by', 'role', 'notes'], ['subject_type', 'subject_id']));
$registerCrud($router, '/desenhos-tecnicos', new CrudController($db, 'technical_drawings', ['subject_type', 'subject_id', 'file_path', 'caption', 'source_reference_id'], ['subject_type', 'subject_id']));
// audit_logs é somente leitura pela API -- é escrito pelo próprio sistema, nunca editado por um cliente.
$router->get('/auditoria', [new CrudController($db, 'audit_logs', [], ['entity_type', 'entity_id']), 'index']);

$request = Request::fromGlobals();

// Toda rota exige sessão autenticada, exceto o endpoint de descoberta e o login em si.
$publicPaths = ['/', '/auth/login'];
if (!in_array($request->path, $publicPaths, true)) {
    Auth::requireAuth();
}

$router->dispatch($request);
