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
