# Fontes Técnicas

Registro de todo documento usado como fonte de dados, seu estado de extração e o
que falta. IDs referem-se à tabela `technical_sources`.

| ID | Fonte | Fabricante | Páginas | Estado |
|---|---|---|---|---|
| 1 | Livro 5 — Serralheria Alumínios | — | 28 | ✅ Extraído por completo (manual, nesta sessão) |
| 2 | Catálogo Técnico Ecoline 2.5 / SGT-GTS (5ª ed., jun/2023) | Perfil Alumínio do Brasil | 41 | ✅ Extraído — 163 perfis, ver `database/seeds/0006_ecoline25_profiles.sql` |
| 3 | Catálogo Técnico UNNION (4ª ed., jun/2023) | Perfil Alumínio do Brasil | 32 | ✅ Extraído — 135 perfis, ver `database/seeds/0007_unnion_profiles.sql` |
| 4 | Catálogo de Perfis Tec-Vidro Suprema | Tec-Vidro | 10 | ⏳ Upload recebido; agente de extração falhou por limite de sessão da conta antes de salvar resultado. **Repetir extração.** |
| 5-7 | Gold III — Perfis e Acessórios (3 partes) | Alcoa / Alumínio & Cia | 49+37+7 | ⏳ Upload recebido; ~85 imagens de página já exportadas em `docs/assets/gold-iii/` (`pdftoppm`, 150dpi), mas a tabela estruturada (códigos LG-xxx, acessórios GUA-xxx, cotas de usinagem FEC-xxxx) não foi salva antes do limite de sessão. **Repetir extração e depois associar cada `technical_drawings` às imagens já exportadas.** |
| 8 | "Esquadrias de Alumínio: como especificar, comprar e conservar" (Hydro, 2004) | Hydro Building Systems | 52 | ✅ Extraído (normas NBR, checklist de manutenção, tabela de anodização); ainda **não convertido em seed SQL** — conteúdo só existe no histórico da sessão/relatório do agente. |
| 9 | "Tipos de Esquadria de Alumínio" (CEHOP 1.10.02) | — | 8 | ✅ Extraído (tabela completa de tipos de janela com vantagens/desvantagens); ainda **não convertido em seed SQL**. |

## Como retomar a extração pendente

As fontes 4 a 7 falharam porque a conta atingiu o limite de uso da sessão durante a
extração em paralelo (5 agentes simultâneos). Para retomar:

1. Repita o mesmo padrão de tarefa usada para Ecoline/UNNION (ver histórico desta
   sessão ou o texto death dos agentes "Extract Suprema catalog data" / "Extract Gold
   III catalog data and drawings") — a regra inegociável é: **nunca inventar
   dimensão/peso/fórmula, sempre citar página, usar "não encontrado" quando faltar**.
2. Salvar a extração em Markdown com tabelas no formato
   `| Código | Descrição | Peso kg/m | Dimensões | Aplicação | Página |` (6 colunas
   exatas) — é o formato que `scripts` de importação (baseados em
   `gen_seed.py`, ver mensagem de commit ou repita o padrão manualmente) sabem
   converter automaticamente em `INSERT`s com `source_references` corretas.
3. Depois de gerar o `.md`, gerar o seed SQL e rodar `php database/seed.php`.
4. Para o Gold III, associar as imagens já exportadas (`docs/assets/gold-iii/p0XX_*.png`)
   a cada `profiles.id`/`accessories.id` via `technical_drawings` (tabela criada
   especificamente para isso em `database/migrations/0007_quality.sql`).

## Import pendente: guias gerais Hydro + CEHOP

O conteúdo já foi extraído (normas NBR citadas, checklist de manutenção Anexo I,
tabela de tipos de janela com vantagens/desvantagens do CEHOP) mas ainda não foi
transformado em linhas de `inspection_checklists`/`validation_records`/documentação
de tipologia. Prioridade sugerida: usar a tabela CEHOP para enriquecer
`typologies.notes` (vantagens/desvantagens por tipo) e o checklist Hydro como seed
inicial de `inspection_checklists` para recebimento de perfil / inspeção de produto
acabado.
