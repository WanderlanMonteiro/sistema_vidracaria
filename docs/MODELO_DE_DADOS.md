# Modelo de Dados

Schema completo em `database/migrations/`, aplicado em ordem numérica. MySQL/MariaDB,
InnoDB, `utf8mb4`. Todas as tabelas de fato técnico carregam `origin_type` +
`status_code` + `source_reference_id` — ver `docs/GOVERNANCA_DE_DADOS.md`.

## 0000 — Bootstrap
`schema_migrations`, `data_status` (domínio fixo de status).

## 0001 — Núcleo técnico
`manufacturers`, `technical_sources`, `source_references`, `product_lines`,
`profiles`, `profile_dimensions`, `profile_applications`, `profile_connections`,
`profile_compatibilities`, `profile_variants`, `accessories`,
`accessory_compatibilities`, `glass_types`, `gaskets`, `brushes`, `tapes`,
`shutters`, `blinds`, `typologies`, `typology_components`, `dimensional_limits`,
`structural_limits`, `pressure_limits`.

## 0002 — Fórmulas
`formulas`, `formula_versions`, `formula_components`, `formula_variables`,
`formula_deductions` (descontos/folgas nomeados), `formula_validations`,
`formula_approvals`, `formula_sources`.

## 0003 — Usinagem
`machining_tools`, `machining_operations`, `machining_positions`,
`stamping_tools`, `stamping_operations`, `machining_approvals`.

## 0004 — Comercial
`customers`, `suppliers`, `sellers`, `price_tables`, `price_table_items`,
`projects`, `environments`, `openings`, `quotes`, `quote_items`, `sales_orders`,
`sales_order_items`.

## 0005 — Estoque
`materials`, `warehouses`, `stock_balances`, `stock_movements`,
`stock_reservations`, `purchase_orders`, `purchase_order_items`, `goods_receipts`.

## 0006 — Produção
`production_orders`, `production_order_items`, `cut_lists`, `cut_list_items`,
`glass_lists`, `accessory_lists`, `optimization_plans`, `optimization_items`,
`production_steps`, `production_status_history`.

## 0007 — Qualidade
`prototypes`, `prototype_components`, `prototype_measurements`,
`validation_records`, `inspection_checklists`, `inspection_results`,
`nonconformities`, `corrective_actions`, `technical_approvals`, `audit_logs`,
`technical_drawings` (extra: imagens de desenho técnico associadas a
perfil/acessório/tipologia — criada para atender ao pedido de desenhos do Gold III).

## Decisões de modelagem que valem registrar

- **`profiles` é único por `(manufacturer_id, product_line_id, code)`, não por
  `(manufacturer_id, code)`.** Descoberto durante a carga real dos dados: peças
  genéricas (ex: conector `CL-006`) aparecem catalogadas de forma idêntica ou quase
  idêntica em mais de uma linha do mesmo fabricante (Ecoline 2.5 e UNNION, ambos
  Perfil Alumínio do Brasil). Tratar como registros por linha evita perder a citação
  de página específica de cada catálogo.
- **Dimensões de perfil não foram decompostas em `profile_dimensions` estruturado
  para os perfis já importados.** Os catálogos Ecoline 2.5/UNNION apresentam cotas
  como números soltos ao lado de linhas de cota no desenho técnico (escala 1:2), sem
  rótulo textual dizendo "isto é largura" / "isto é altura". Decompor isso em campos
  nomeados exigiria inferir a semântica de cada número — o que violaria a regra de
  não interpretar além do que a fonte diz. Por isso as dimensões ficam como texto
  literal em `profiles.description` (campo "Dimensões(raw)") até que alguém com o
  desenho em mãos confirme a semântica de cada cota.
- **Pressões máximas de ensaio** (ex: "250 Pa") aparecem no texto de
  `profiles.description` em vez de em `pressure_limits`, porque a tabela
  `pressure_limits` é por `product_line_id` (linha inteira), enquanto os valores
  encontrados são por perfil individual. Migrar isso para uma tabela por-perfil é
  um ajuste de schema pendente, não uma perda de dado (o valor está preservado).
- **3 linhas de produto novas sem fabricante confirmado** ("Módulo Prático /
  Linha 30", "Linha Portão", "Linha Moveleira") foram criadas a partir da
  planilha interna de cálculo de corte, cujos códigos de perfil não batem com
  nenhum catálogo de fabricante já processado. `manufacturers.notes` e
  `product_lines.status_code = NECESSITA_CONFERENCIA` deixam isso explícito —
  ver `docs/FONTES.md`.
- **2 tipologias fora do escopo original de esquadrias de janela/porta**
  ("Portão de Correr", "Porta/Gaveta de Móvel") foram adicionadas pela mesma
  razão: a planilha do usuário cobre mais do que só esquadrias de edificação.
- **`formula_deductions`** existe para nomear separadamente descontos/folgas
  embutidos numa expressão de fórmula (ex: os `+9`/`-38`/`-129`/`-130` do Asa Flex),
  permitindo que o checklist de liberação de produção (seção 13) verifique se cada
  um foi confirmado por um responsável técnico — sem isso, seria impossível
  bloquear produção "por folga não confirmada" de forma granular.
