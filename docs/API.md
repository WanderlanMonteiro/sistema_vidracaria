# API

Todas as respostas são JSON. **Toda rota exige sessão autenticada**, exceto `GET /`
(descoberta) e `POST /auth/login`.

## Autenticação

Sessão por cookie (não token/JWT) — o frontend (`public/app/`) é servido no mesmo
domínio da API, então cookie é a opção mais simples: `HttpOnly` (não acessível via
JS, mitiga roubo de sessão por XSS), `SameSite=Lax` (o navegador não manda o cookie
em requisição disparada por outro site, mitiga CSRF), `Secure` automático quando
servido por HTTPS. Sessão expira em 8h de inatividade ou ao fechar o navegador.

### `POST /auth/login`
```json
{ "email": "fulano@exemplo.com", "password": "..." }
```
200 com `{ "user": {...} }` e grava o cookie de sessão. 401 com `{ "error": "E-mail
ou senha inválidos." }` para e-mail inexistente, senha errada, ou usuário inativo —
a mensagem é a mesma nos três casos, de propósito, para não revelar quais e-mails
existem no sistema.

### `POST /auth/logout`
Encerra a sessão. Sempre 200.

### `GET /auth/me`
Retorna `{ "user": {...} }` da sessão atual, ou 401 se não autenticado — é assim que
o frontend decide se mostra a tela de login ou o conteúdo.

### `PUT /auth/senha`
```json
{ "current_password": "...", "new_password": "..." }
```
Exige sessão ativa. Nova senha precisa ter 8+ caracteres. 401 se a senha atual
informada estiver errada.

### Usuários
Não há endpoint de cadastro de usuário pela API ainda (só o `users` da migration
`0008_auth.sql`) — criar/desativar usuário é feito direto no banco por enquanto.
Só existe uma camada de autenticação hoje: qualquer usuário ativo autenticado acessa
toda a API. O campo `role` existe na tabela `users` para uso futuro (permissão por
papel), mas nenhuma rota verifica esse campo ainda.

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

## `GET /acessorios` / `GET /acessorios/{id}`
Lista ferragens/acessórios (catálogo, só leitura). Filtros: `?category=&manufacturer_id=`.

## `GET /acessorios-compatibilidades`
Vínculo de aplicação de cada acessório (`notes` = aplicação como impressa na fonte;
`typology_id` só preenchido quando bate literalmente com uma tipologia já
cadastrada — ver `docs/FONTES.md`, seção "Catálogo Super5"). Filtros: `?accessory_id=&typology_id=`.

## Tipologias
CRUD completo (`GET`/`GET {id}`/`POST`/`PUT {id}`/`DELETE {id}`) em `/tipologias`
via `CrudController`. Duas famílias de categoria: esquadria de alumínio com
marco/perfil (Correr, Giro, Maxim-Ar, Oscilobatente, Pivotante, Ribanta, Camarão,
Guilhotina, Basculante — Livro 5, p.13) e `VIDRO_TEMPERADO` (montagem de vidro
temperado sem marco de alumínio, ferragem direto no vidro — Box, Spider, Fachada
Glazing, Guarda-corpo, Sacada, Sanfonada, Vitrine e variantes de Pivotante/
Correr/Max-Ar sem marco, extraídas da apostila técnica de vidros temperados —
ver `docs/FONTES.md`). Filtro: `?category=`.

Campo `drawing_data` (JSON, opcional): lista de formas do editor de desenho do
frontend (retângulo/linha/seta/texto — esquema de marco/folha/sentido de
abertura), guardada como **string JSON já serializada** pelo cliente, não como
imagem. Não é dado extraído de catálogo (desenhado pelo próprio usuário), por
isso não tem `source_reference_id`/`status_code` de governança. Quando a
tipologia foi extraída de catálogo/apostila, o desenho técnico real vem por
`GET /desenhos-tecnicos?subject_type=TYPOLOGY&subject_id=` (imagem da página
original, não o `drawing_data`).

## `GET /deducoes-instalacao`
Tabela de folgas/descontos de instalação (largura/altura da folha em relação ao
vão) por tipo de instalação — apostila técnica de vidros temperados, p.32. Cada
linha tem `installation_type` (texto), `moving_height_mm`/`fixed_height_mm`/
`total_width_mm` (texto, não número — aceitam `+transpasse`/`Variável`, já que a
fonte afirma que não existe folga padrão) e `typology_id` opcional (só quando o
tipo de instalação bate sem ambiguidade com uma tipologia cadastrada). Filtro:
`?typology_id=`. Referência de apoio ao cálculo, `status_code = EXTRAIDO` — não é
regra travada de produção.

## `GET /formulas`
Lista fórmulas com o status da versão atual (`version_status`, `production_locked`)
e `typology_id` (usado pelo frontend do orçamento pra achar o desenho técnico da
tipologia da fórmula escolhida).

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

## `POST /formulas`
Cria uma fórmula nova com sua primeira versão e componentes, em uma única transação
(`App\Services\FormulaBuilderService`). Nasce **sempre `PENDENTE` e com
`production_locked = 1`** — criar pelo formulário não libera nada para produção; a
liberação continua exigindo o checklist completo da seção 13 (protótipo aprovado,
validações, aprovação técnica etc. — ver `GET /formulas/{id}/checklist-producao`).
```json
{
  "name": "Janela de correr 2 folhas",
  "typology_id": 1,
  "product_line_id": 3,
  "description": "opcional",
  "rounding_mode": "ROUND",
  "components": [
    { "component_role": "MARCO", "quantity": 2, "expression": "L - 10", "profile_id": 12 },
    { "component_role": "FOLHA_LARGURA", "quantity": 2, "expression": "(L / 2) + 20" }
  ],
  "deductions": [
    { "deduction_type": "DESCONTO", "value_mm": 10, "description": "encaixe do marco" }
  ]
}
```
`expression` é opcional por componente (ex: vidro cortado à parte fica sem expressão)
e é validada sintaticamente pelo interpretador seguro no momento da criação — uma
expressão malformada retorna 422 e **nada é gravado** (transação revertida). Não há
endpoint de liberação pela API de propósito: a transição para `LIBERADO_PRODUCAO`
continua sendo uma decisão humana explícita, registrada via `/prototipos`,
`/validacoes` e `/aprovacoes-tecnicas` (todas já expostas pela API).

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

## Usuários

Não é mais só direto no banco: `GET /usuarios` (lista, sem `password_hash`),
`POST /usuarios` (`name`, `email`, `password` 8+ caracteres, `role` livre —
ADMIN/USER/TECNICO por convenção do frontend, mas o campo aceita qualquer texto),
`PUT /usuarios/{id}` (`active`, `role`, `name` — nunca troca e-mail/senha por aqui;
senha é sempre `PUT /auth/senha` pelo próprio usuário). Continua **sem** permissão
por papel — todo usuário ativo vê o sistema inteiro.

## Pedido de têmpera

Registro rastreável (`PENDENTE`→`ENVIADO`→`RECEBIDO`/`CANCELADO`), diferente do
`GET /orcamentos/{id}/relatorio-tempera` (que é só uma consulta instantânea, sem
status próprio).

- `POST /pedidos-tempera` `{ quote_id, supplier_id?, notes? }` — cria o pedido com
  os itens vindos direto do relatório de têmpera daquele orçamento (só vidro
  `TEMPERADO`, medida final já resolvida pela regra de maior largura × maior
  altura). Erro 422 se o orçamento não tiver nenhuma peça temperada com medida.
- `POST /pedidos-tempera/manual` `{ supplier_id?, notes?, items: [...] }` — pedido
  avulso, sem orçamento, com itens informados na mão.
- `GET /pedidos-tempera` (filtros `?status=&quote_id=&supplier_id=`), `GET /pedidos-tempera/{id}`
  (com itens), `PUT /pedidos-tempera/{id}` (`status`, `supplier_id`, `sent_at`,
  `received_at`, `notes`).

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
| Financeiro | `/lancamentos-financeiros` (`entry_type`: `RECEITA`/`DESPESA`; `status`: `PENDENTE`/`PAGO`/`CANCELADO`; filtros `?project_id=&status=&entry_type=`) |
| Vidro/acessórios (catálogo) | `/vidros` (CRUD completo — tipos de vidro são dado operacional, não exigem citação de página como perfil); `/acessorios` (só leitura, catálogo extraído de fonte) |
| Acessórios do orçamento | `/orcamentos-acessorios` (lista avulsa por orçamento — `quote_id`, `accessory_id` opcional, `description`, `quantity`; não há vínculo automático fórmula/tipologia → ferragens ainda) |
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

### Itens de orçamento: medidas, m² e vão fora de esquadro

`quote_items` aceita opcionalmente `formula_version_id`, `glass_type_id`, `width_mm`,
`width_mm_2`, `height_mm`, `height_mm_2` e `pricing_unit` (`UN` ou `M2`). Quando o vão
está fora de esquadro, informe as duas larguras e as duas alturas medidas — todo
cálculo (m², relatório de compras, têmpera) usa sempre a **maior largura × maior
altura** das informadas, nunca a média (regra explícita do usuário). Com
`pricing_unit=M2`, `unit_price` é interpretado como R$/m² e o total esperado é
`quantity × area_m2 × unit_price` — quem calcula e valida isso é o frontend antes de
enviar; a API não recalcula `total_price` sozinha.

### `GET /orcamentos/{id}/relatorio-compras`
Agrega, a partir dos itens do orçamento, quanto precisa comprar de:
- **Perfis**: só para itens com `formula_version_id` + largura/altura preenchidas.
  Calcula via `FormulaCalculationService` em modo estimativa (`requireReleased=false`)
  — funciona mesmo com fórmula ainda `PENDENTE`, mas cada perfil retorna
  `estimativa_formula_nao_liberada: true` nesse caso, pra deixar claro que o número
  não passou pelo checklist de liberação (`App\Services\QuoteReportService`).
- **Vidro**: só para itens com `glass_type_id` + largura/altura, agregado por tipo
  (área total em m², maior largura × maior altura de cada item).
- **Acessórios**: soma de `quote_accessories` do orçamento, por descrição.

### `GET /orcamentos/{id}/relatorio-tempera`
Lista itemizada (não agregada) de toda peça de vidro do orçamento cujo
`glass_types.glass_category = 'TEMPERADO'`, com a medida final (maior largura ×
maior altura) — pronta pra mandar pra têmpera, já que vidro temperado não pode ser
cortado depois.

## Próximos passos sugeridos (fora do escopo desta fase)

- Endpoint de cadastro/gestão de usuários pela API (hoje é direto no banco).
- Permissão por papel (`users.role` existe, não é verificado ainda — hoje é tudo ou nada).
- Endpoints de aprovação/liberação de fórmula (`POST /formulas/{id}/aprovar` etc.) —
  hoje essas linhas são criadas via seed/SQL direto, com revisão humana registrada em
  `docs/GOVERNANCA_DE_DADOS.md`, não pela API.
- CORS explícito quando o frontend for servido de um subdomínio separado (hoje conta
  com cookie de sessão same-origin, então não precisa).
- Paginação de verdade (hoje é `LIMIT 200/500` fixo) quando o volume de dados crescer.
