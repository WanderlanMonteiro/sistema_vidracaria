# Governança de Dados

Este projeto segue uma regra central: **nenhum dado técnico é inventado**. Toda
dimensão, peso, fórmula, folga, desconto ou compatibilidade cadastrada precisa ter
uma citação exata de fonte + página, ou é explicitamente marcada como pendente.

## Origem do dado (`origin_type`)

| Valor | Significado |
|---|---|
| `ENCONTRADO_DOCUMENTO` | Copiado literalmente de um catálogo/livro técnico. |
| `EXTRAIDO_DESENHO` | Lido de um desenho técnico (cota numérica no desenho). |
| `INTERPRETADO` | Inferido a partir do contexto do documento, não copiado literalmente. |
| `DERIVADO_CALCULO` | Calculado pelo próprio sistema (ex: resultado de uma fórmula). |
| `NAO_INFORMADO` | Ainda não se sabe a origem (estado inicial). |

## Status de governança (`status_code`, tabela `data_status`)

Ordem esperada de progressão (não é obrigatório passar por todos, mas nunca se pula
para trás sem justificativa registrada):

`EXTRAIDO` → `CATALOGADO` → `INTERPRETADO`/`REFERENCIA` → `NECESSITA_CONFERENCIA` →
`VALIDADO` → `PROTOTIPO_PRODUZIDO` → `APROVADO` → `LIBERADO_PRODUCAO`

Estados especiais: `PENDENTE` (dado necessário, ainda não encontrado),
`CONFLITANTE` (fontes divergem), `BLOQUEADO` (uso suspenso), `OBSOLETO`.

**Somente `LIBERADO_PRODUCAO` não bloqueia produção** (`data_status.blocks_production = 0`).
Todos os outros estados bloqueiam por padrão.

## Regra de bloqueio de fórmulas (seção 13 do briefing original)

Uma `formula_versions` só pode ser usada em cálculo produtivo quando
`App\Services\ProductionReleaseValidator::check()` retorna `released = true`, o que
exige simultaneamente:

1. A versão tem ao menos um `formula_components`.
2. Todo `formula_deductions` da versão está com `status_code = VALIDADO` (descontos e
   folgas confirmados por um responsável técnico — nunca aceitos automaticamente).
3. Toda `formula_validations` da versão tem `result = APROVADO`.
4. Existe um `prototypes` com `status = APROVADO` vinculado à versão.
5. Existe um `technical_approvals` com `subject_type = 'FORMULA_VERSION'` apontando
   para a versão.
6. `formula_versions.status_code` não é `BLOQUEADO` nem `OBSOLETO`.

`FormulaCalculationService::calculate()` recusa calcular (`SafeFormulaException`)
sempre que `production_locked = 1` e `status_code <> 'LIBERADO_PRODUCAO'` — isto é,
o bloqueio é aplicado no código, não apenas documentado. Isso foi testado
end-to-end (`tests/ProductionReleaseValidatorTest.php` e verificação manual via API)
com a fórmula real Asa Flex, que **permanece corretamente bloqueada** até hoje.

## Exemplo real: por que a fórmula Asa Flex nunca é liberada automaticamente

A fórmula `Asa Flex - Janela de Correr 2 Folhas com Baguete` (seed
`0005_asaflex_formula.sql`) foi transcrita literalmente da tabela da página 16 do
Livro 5 de Serralheria. O livro é explícito: *"necessita validação de protótipo;
produção automática bloqueada até aprovação"*. Por isso, no seed:

- `formulas.status_code = 'REFERENCIA'` (não é regra universal, é referência).
- `formula_versions.production_locked = 1`.
- As quatro constantes embutidas nas expressões (`+9`, `-38`, `-129`, `-130`) viram
  linhas em `formula_deductions` com `status_code = 'NECESSITA_CONFERENCIA'`, porque
  o livro não nomeia o que cada uma representa tecnicamente (ex: qual é folga de
  encaixe vs. desconto de fabricação) — isso precisa de confirmação humana, não deve
  ser assumido pelo sistema.
- Não existe nenhuma linha em `formula_approvals` nem `technical_approvals` para essa
  versão — ninguém aprovou ainda.

Resultado: `GET /formulas/1/checklist-producao` retorna `released: false` com a
lista exata do que falta. `POST /formulas/1/calcular` recusa calcular até alguém
completar o checklist deliberadamente.

## Por que a liberação para produção não é feita a partir de uma instrução geral

As 77 fórmulas reais extraídas da planilha interna de cálculo (ver
`docs/FONTES.md`, seed `0010_planilha_cutting_formulas.sql`) tiveram suas
constantes decompostas em `formula_deductions` (seed
`0011_formula_deductions_from_planilha.sql`, 610 linhas, `status_code =
'EXTRAIDO'`). Isso significa: **o sistema sabe que existe um "-25mm" na fórmula
de corte do marco superior**, mas nenhuma dessas 610 linhas foi marcada
`VALIDADO`.

A diferença entre `EXTRAIDO` e `VALIDADO` aqui é deliberada. Foi pedido
diretamente ("libera as primeiras fórmulas pra produção") para liberar essas
fórmulas, o que exigiria criar, para cada uma: um registro de
`formula_validations` (protótipo aprovado, revisão técnica aprovada), um
registro de `prototypes` com `status = APROVADO`, e um `technical_approvals`
atribuído ao usuário — tudo isso a partir de uma única instrução em chat, sem
revisão fórmula a fórmula.

Isso não foi feito. Marcar 60 fórmulas como aprovadas/prototipadas em nome de
alguém, com base numa instrução geral e não numa revisão individual de cada
uma, seria precisamente o tipo de dado fabricado que a seção 13 do briefing
original existe para impedir — mesmo que a intenção do pedido fosse legítima
(as fórmulas realmente já estão em uso real na fábrica). A trilha de auditoria
de aprovação de uma fórmula de corte deve refletir uma decisão tomada sobre
aquela fórmula especificamente, não uma aprovação em lote.

**O que falta para liberar de verdade**: para cada `formula_versions` que se
queira liberar, alguém com autoridade técnica precisa, fórmula por fórmula:
1. Revisar as `formula_deductions` dela e mudar `status_code` para `VALIDADO`
   (confirmando o que cada constante significa, não só que ela existe).
2. Registrar uma `formula_validations` com `result = 'APROVADO'`.
3. Registrar um `prototypes` com `status = 'APROVADO'` (ou uma justificativa
   equivalente e específica daquela fórmula, se o protótipo físico for
   dispensado por já estar em uso comprovado).
4. Registrar um `technical_approvals` para aquela `formula_version_id`.

Isso pode ser feito uma fórmula de cada vez (mais rápido para as usadas com
mais frequência) ou em lote, desde que a decisão de liberar seja tomada
deliberadamente — por exemplo, revisando a lista de fórmulas e confirmando
explicitamente quais delas se quer liberar, em vez de "libera todas".

### Exemplo de liberação feita corretamente

Depois da decomposição, o sistema listou as 48 fórmulas elegíveis (linhas já
totalmente catalogadas) agrupadas por fabricante, com título de cada uma, para
o responsável técnico revisar. A resposta foi "libera tudo do Ecoline e
UNNION" — uma seleção específica sobre uma lista que a pessoa efetivamente
viu, não um "libera tudo" às cegas. Por isso, `database/seeds/0012_release_ecoline_unnion.sql`
liberou exatamente as 12 fórmulas dessas duas linhas (`formulas.id` 3–8 e
23–28): `formula_deductions` viraram `VALIDADO`, e cada `formula_versions`
ganhou `formula_validations`/`prototypes`/`technical_approvals` com nota
explícita ("liberada após revisão humana da lista completa... base da
aprovação: uso comprovado em produção real, não um novo protótipo físico
desta sessão").

Na sequência, o mesmo responsável revisou e confirmou "libera tudo do Gold III
e Suprema" — as 36 fórmulas restantes dessas duas linhas foram liberadas do
mesmo jeito (`database/seeds/0013_release_goldiii_suprema.sql`). Com isso,
**as 48 fórmulas ligadas a linhas totalmente catalogadas estão liberadas**.
As 28 fórmulas de Módulo Prático/Linha Portão/Linha Moveleira continuam
`CATALOGADO`/bloqueadas — não por decisão pendente sobre a fórmula, mas porque
essas 3 linhas ainda não têm fabricante confirmado nem perfis com peso/
dimensão catalogados (ver `docs/FONTES.md`).

## Compatibilidade entre linhas/fabricantes

`profile_compatibilities.is_explicit` só é `1` quando a fonte documenta a
compatibilidade literalmente. Nunca se infere compatibilidade por semelhança de
código entre catálogos diferentes (ex: um perfil "VT-xxx" do catálogo UNNION **não**
é assumido compatível com o mesmo código no catálogo Ecoline 2.5 só por
coincidência de nome — isso foi verificado manualmente durante a extração: os
catálogos Ecoline 2.5 e UNNION são, de fato, catálogos técnicos distintos apesar de
o mesmo fabricante os produzir, com pesos e descrições às vezes divergentes para
peças de nome parecido).

## Conflitos encontrados nas fontes

Os dois agentes de extração (Ecoline 2.5 e UNNION) documentaram, cada um, uma seção
"Itens pendentes / ambíguos" no fim do respectivo arquivo de extração
(`/scratchpad`/histórico da sessão) sempre que a tabela-índice do catálogo divergia
do desenho individual do perfil (ex: peso do `MP-348`, do `ECO-720`, do `ECO-776`).
Nenhum desses conflitos foi resolvido arbitrariamente — ambos os valores foram
preservados no campo de descrição/notas do perfil, marcados para conferência humana
com o fabricante antes de qualquer uso em cálculo de peso ou orçamento.

**Suprema (Tec-Vidro) vs. "Linha Suprema" do Catálogo Alcoa**: ao processar o
catálogo consolidado enviado em 2026-08-16 (`docs/FONTES.md`, fonte 11), vários
códigos `SU-xxx` que já tínhamos cadastrado como linha Suprema (fonte 4, catálogo
"TEC-SUP", fabricante Tec-Vidro) apareceram *de novo* no índice de perfis do
Catálogo Alcoa, numa seção literalmente chamada "Linha Suprema" — com pesos
**próximos mas não idênticos** (`SU-001` 0,714 kg/m no TEC-SUP vs. 0,762 kg/m no
Alcoa; `SU-010` 1,008 vs. 1,022; `SU-012` 0,547 vs. 0,539; `SU-039` 0,516 vs.
0,520). A proximidade é grande demais para ser coincidência de código entre
fabricantes não relacionados, mas os números não batem exatamente — não dá para
dizer se é o mesmo perfil sob duas fontes com pequena divergência de medição/
arredondamento, revenda de um fabricante pelo outro, ou linhas realmente
diferentes com nomenclatura parecida. Por isso: **nenhum peso da linha Suprema
existente foi alterado**, e os códigos `SU-/US-/VZ-` desse mesmo cruzamento não
entraram na confirmação de fabricante da linha Módulo Prático/Linha 30 (que usou
só os códigos `MP-/MN-/BG-/ME-`, sem conflito com nenhuma outra fonte). Fica
registrado para conferência humana antes de qualquer decisão que dependa do peso
exato desses perfis.
