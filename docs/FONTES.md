# Fontes Técnicas

Registro de todo documento usado como fonte de dados, seu estado de extração e o
que falta. IDs referem-se à tabela `technical_sources`.

| ID | Fonte | Fabricante | Páginas | Estado |
|---|---|---|---|---|
| 1 | Livro 5 — Serralheria Alumínios | — | 28 | ✅ Extraído por completo (manual, nesta sessão) |
| 2 | Catálogo Técnico Ecoline 2.5 / SGT-GTS (5ª ed., jun/2023) | Perfil Alumínio do Brasil | 41 | ✅ Extraído — 163 perfis, ver `database/seeds/0006_ecoline25_profiles.sql` |
| 3 | Catálogo Técnico UNNION (4ª ed., jun/2023) | Perfil Alumínio do Brasil | 32 | ✅ Extraído — 135 perfis, ver `database/seeds/0007_unnion_profiles.sql` |
| 4 | Catálogo de Perfis Tec-Vidro "TEC-SUP" | Tec-Vidro | 10 | ✅ Extraído na 2ª tentativa — 41 perfis, ver `database/seeds/0008_suprema_profiles.sql`. **Achado importante**: a palavra "Suprema" não aparece em nenhuma página do PDF-fonte; o catálogo se identifica só como "TEC-SUP". A linha ficou com `status_code = NECESSITA_CONFERENCIA` até confirmar o nome comercial real com o fabricante. Sem coluna de aplicação nem segmentação "revenda"/"fachada cortina" nesta fonte. |
| 5-7 | Gold III — Perfis e Acessórios (3 partes) | Alcoa / Alumínio & Cia | 49+37+7 | ✅ Extraído — 114 perfis + 94 acessórios + 22 combinações de compatibilidade vidro/guarnição (p.104), ver `database/seeds/0009_goldiii_profiles_accessories.sql`. 93 imagens de página em `docs/assets/gold-iii/`. **Achados importantes**: os códigos de exemplo do pedido original (fechos FEC1028/1029, FEC1036/1038/1040/1042, cotas "A"/"B" de usinagem) **não existem** em nenhum dos 3 arquivos — não foram inventados. O exemplo de compatibilidade citado no pedido ("LG015/LG050 vidro 6mm → GUA256/GUA304") também não bate exatamente com o catálogo; a tabela real está na fonte. O catálogo grafa o mesmo perfil ora como "LG-0XX" ora como "LG-XX" em páginas diferentes (ex: LG-018/LG-0018) — tratado com casamento tolerante de código, documentado em cada linha afetada. |
| 8 | "Esquadrias de Alumínio: como especificar, comprar e conservar" (Hydro, 2004) | Hydro Building Systems | 52 | ✅ Extraído (normas NBR, checklist de manutenção, tabela de anodização); ainda **não convertido em seed SQL** — conteúdo só existe no histórico da sessão/relatório do agente. |
| 9 | "Tipos de Esquadria de Alumínio" (CEHOP 1.10.02) | — | 8 | ✅ Extraído (tabela completa de tipos de janela com vantagens/desvantagens); ainda **não convertido em seed SQL**. |

## Pendências residuais do Gold III

- **Dados estruturais (Jx/Jy/Wx/Wy)** das páginas impressas 19–36 (gráficos de
  pressão de ensaio por tipologia: bandeira, peitoril, mão de amigo, central 4
  folhas, montante maxim-ar) foram extraídos e documentados no relatório, mas
  ainda **não carregados** em `structural_limits`/`pressure_limits` — exigem
  decidir o `subject_type` correto (tipologia vs. combinação de perfis) antes de
  modelar.
- **Arquivo 3** (5d03514a, tipologias JC2F/PC2FPE/etc.) não tem dados tabulares
  próprios, só nomes de tipologia — não gerou linhas em `typologies` para evitar
  duplicar as 9 tipologias já cadastradas do Livro 5 sem uma correspondência clara.
- **`technical_drawings`**: as 93 imagens em `docs/assets/gold-iii/` ainda não
  foram associadas linha a linha a `profiles.id`/`accessories.id` — o nome do
  arquivo (`pXXX_fN.png`) já corresponde à página de cada código (ver tabelas do
  relatório de extração), falta o script de associação em lote.

## Import pendente: guias gerais Hydro + CEHOP

O conteúdo já foi extraído (normas NBR citadas, checklist de manutenção Anexo I,
tabela de tipos de janela com vantagens/desvantagens do CEHOP) mas ainda não foi
transformado em linhas de `inspection_checklists`/`validation_records`/documentação
de tipologia. Prioridade sugerida: usar a tabela CEHOP para enriquecer
`typologies.notes` (vantagens/desvantagens por tipo) e o checklist Hydro como seed
inicial de `inspection_checklists` para recebimento de perfil / inspeção de produto
acabado.
