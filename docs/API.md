# API (Fase 1)

Todas as respostas são JSON. Sem autenticação nesta fase (adicionar antes de expor
publicamente — ver "Próximos passos" no fim deste documento).

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

## Próximos passos sugeridos (fora do escopo desta fase)

- Autenticação (token/JWT) antes de expor a API fora da rede interna.
- Endpoints de escrita (`POST /perfis`, `POST /formulas/{id}/aprovar`, etc.) com
  validação de payload e trilha de auditoria em `audit_logs`.
- Endpoints comerciais/produção/estoque (schema já existe nas migrations 0004-0007,
  faltam controllers).
- CORS explícito quando o frontend for servido de um subdomínio separado.
