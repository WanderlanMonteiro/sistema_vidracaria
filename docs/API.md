# API

Todas as respostas são JSON. Sem autenticação nesta fase (adicionar antes de expor
publicamente — ver "Próximos passos" no fim deste documento).

## Fase 1 — núcleo técnico

## `GET /`
Lista os endpoints disponíveis.

## `GET /fabricantes`
Lista fabricantes com suas linhas de produto (`product_lines`).

## `GET /perfis`
Lista perfis (máx. 200 por chamada). Filtros via query string:
- `?manufacturer_id=1`
- `?product_line_id=1`
- `?code=VT-0` (busca parcial no código)

## `GET /perfis/{id}`
Detalhe de um perfil, incluindo fabricante, linha e a citação de fonte (`source_title`,
`page_number`, `source_url`).

## `GET /tipologias`
Lista as tipologias cadastradas (Correr, Giro, Maxim-Ar, Oscilobatente, Pivotante,
Ribanta, Camarão, Guilhotina, Basculante — ver Livro 5, p.13).

## `GET /formulas`
Lista fórmulas com o status da versão atual (`version_status`, `production_locked`).

## `GET /formulas/{id}`
Detalhe de uma fórmula: componentes (`formula_components`) e deduções/folgas
(`formula_deductions`) da versão atual.

## `GET /formulas/{id}/checklist-producao`
Executa `ProductionReleaseValidator::check()` e retorna:
```json
{
  "released": false,
  "checklist": { "possui_componentes": true, "prototipo_aprovado": false, "...": "..." },
  "pending": ["prototipo_aprovado", "..."]
}
```

## `POST /formulas/{id}/calcular`
Corpo JSON com as variáveis do interpretador seguro:
```json
{ "L": 1200, "A": 1000, "N": 2, "E": 6, "P": 0 }
```
Retorna o comprimento calculado de cada componente da fórmula (`result_mm`) usando
o interpretador seguro (`App\Formula\FormulaInterpreter` — sem `eval`, apenas
variáveis cadastradas, operadores matemáticos e funções autorizadas). **Recusa
calcular** (HTTP 422) se a versão da fórmula estiver com `production_locked = 1` e
`status_code` diferente de `LIBERADO_PRODUCAO` — ver `docs/GOVERNANCA_DE_DADOS.md`.

## Fase 2 — comercial, estoque, produção e qualidade

Cobre as tabelas das migrations `0004_commercial.sql`–`0007_quality.sql`. A maioria é
CRUD simples (`GET`/`GET {id}`/`POST`/`PUT {id}`/`DELETE {id}`) via
`App\Controllers\Support\CrudController`; três recursos têm regra de negócio própria
(ver abaixo) implementada em `App\Services\*Service` e testada em `tests/*ServiceTest.php`
com SQLite em memória (mesmo padrão do `ProductionReleaseValidatorTest`).

### CRUD simples

| Domínio | Endpoints |
|---|---|
| Comercial | `/clientes`, `/fornecedores`, `/vendedores`, `/tabelas-preco`, `/tabelas-preco-itens`, `/projetos`, `/ambientes`, `/vaos`, `/orcamentos`, `/orcamentos-itens`, `/pedidos-venda`, `/pedidos-venda-itens` |
| Estoque/compras | `/materiais`, `/depositos`, `/reservas-estoque`, `/pedidos-compra`, `/pedidos-compra-itens` (leitura: `/saldos-estoque?material_id=&warehouse_id=`) |
| Produção | `/ordens-producao`, `/listas-corte`, `/listas-corte-itens`, `/listas-vidro`, `/listas-acessorios`, `/planos-otimizacao`, `/planos-otimizacao-itens`, `/etapas-producao` (leitura: `/historico-status-producao?production_order_item_id=`) |
| Qualidade | `/prototipos`, `/prototipos-componentes`, `/prototipos-medicoes`, `/validacoes`, `/checklists-inspecao`, `/resultados-inspecao`, `/nao-conformidades`, `/acoes-corretivas`, `/aprovacoes-tecnicas`, `/desenhos-tecnicos` (leitura apenas: `/auditoria`) |

Filtros de igualdade aceitos via query string variam por recurso (ex: `?project_id=`,
`?status=`, `?production_order_item_id=`) — ver a lista de `filterable` de cada
`CrudController` em `public/index.php`. Violação de integridade referencial (FK) ou
de chave única retorna **409**, não 500.

### `POST /movimentacoes-estoque`
```json
{ "material_id": 1, "warehouse_id": 1, "movement_type": "ENTRADA", "quantity": 100 }
```
`movement_type`: `ENTRADA`/`AJUSTE` somam ao saldo, `SAIDA`/`RESERVA`/`BAIXA_RESERVA`
subtraem. Toda movimentação atualiza `stock_balances` na mesma transação
(`App\Services\StockMovementService`) — nunca só grava o histórico sem tocar o saldo.

### `POST /recebimentos`
```json
{
  "purchase_order_id": 1, "warehouse_id": 1, "received_by": "fulano",
  "items": [{ "purchase_order_item_id": 1, "quantity": 20 }]
}
```
Registra o `goods_receipt`, gera uma entrada de estoque (`ENTRADA`) por item recebido
e recalcula `purchase_orders.status` comparando o total já recebido (soma dos
`stock_movements` com `reference_type='PURCHASE_ORDER_ITEM'`) contra a quantidade de
cada item: `CONFIRMADO` → `RECEBIDO_PARCIAL` → `RECEBIDO_TOTAL`
(`App\Services\GoodsReceiptService`). Suporta recebimento em várias etapas.

### `PUT /ordens-producao-itens/{id}/status`
```json
{ "status_code": "VALIDADO", "changed_by": "fulano", "notes": "corte iniciado" }
```
Troca `production_order_items.status_code` e grava uma linha em
`production_status_history` com o valor anterior e o novo
(`App\Services\ProductionStatusService`). **Atenção**: esse campo é uma FK para
`data_status` (o mesmo domínio de governança usado em `profiles`/`formulas` — valores
como `PENDENTE`, `VALIDADO`, `APROVADO`, `BLOQUEADO`), não um enum de workflow de
produção próprio; o andamento etapa-a-etapa (corte, usinagem, montagem...) é
`/etapas-producao`, que tem seu próprio enum de status.

## Próximos passos sugeridos (fora do escopo desta fase)

- Autenticação (token/JWT) antes de expor a API fora da rede interna.
- Endpoints de aprovação/liberação de fórmula (`POST /formulas/{id}/aprovar` etc.) —
  hoje essas linhas são criadas via seed/SQL direto, com revisão humana registrada em
  `docs/GOVERNANCA_DE_DADOS.md`, não pela API.
- CORS explícito quando o frontend for servido de um subdomínio separado.
- Paginação de verdade (hoje é `LIMIT 200/500` fixo) quando o volume de dados crescer.
