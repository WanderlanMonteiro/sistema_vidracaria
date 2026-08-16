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
| 10 | Planilha interna de cálculo de corte (`PlanilhaEsquadrias101.xlsx`) | várias (ver abaixo) | 76 abas de tipologia | ✅ Processada — **primeira fonte real de fórmulas de corte** do projeto. Ver seção dedicada abaixo. |

## Planilha interna de cálculo de corte — a fonte mais importante até agora

Diferente dos catálogos de fabricante (que só trazem peso/dimensão de perfil
isolado), esta planilha é a **ferramenta de cálculo que o usuário já usa na
operação real** — 80 abas, das quais 76 têm uma tabela "LISTA DE PERFIS" com
fórmulas de Excel relacionando o comprimento de corte de cada perfil à largura
(L) e altura (A) do vão.

**Como foi processada** (script `gen_seed_planilha.py`, ver histórico da sessão):
1. Cada aba tem células de entrada (`LARGURA`→L, `ALTURA`→A, `QUANT.`→N) e uma
   tabela de corte (código do perfil, descrição, fórmula de `TAMANHO`).
2. Cada fórmula de Excel foi resolvida **recursivamente**, substituindo
   referências de célula até sobrar só L/A/N e números literais — nunca se
   inventou ou aproximou um valor; fórmulas que dependiam de `IF`/`SUM`/
   `ROUNDUP` (que são cálculo de compra de barra, não de corte) foram marcadas
   como não resolvidas e não entraram como fórmula de corte.
3. O código de cada perfil foi conferido contra o banco já carregado —
   **62 das 76 abas bateram diretamente** com perfis já catalogados (Suprema
   35, UNNION 12, Gold III 9, Ecoline 2.5 6), então a fórmula ficou vinculada
   ao `profiles.id` real, com peso/dimensão já conhecidos de outra fonte.
4. As outras 14 abas usam códigos de **3 linhas que não existiam em nenhum
   catálogo já processado**: "Módulo Prático / Linha 30" (perfis MP-xxx),
   "Linha Portão" (perfis PC/PU/LB-xxx) e "Linha Moveleira" (armários/
   gaveteiros com porta de giro em alumínio — linha citada na contracapa do
   catálogo Ecoline 2.5, mas nunca detalhada em nenhum PDF recebido). Essas 3
   linhas foram cadastradas com fabricante `NECESSITA_CONFERENCIA` porque a
   planilha não diz quem fabrica os perfis MP/Portão — só o próprio código.
   Os 204 perfis novos ficaram com peso/dimensão `PENDENTE` (a planilha não
   traz peso nem cota de seção, só o comprimento de corte calculado).
5. Uma aba (`04 GAVETAS P02`) tinha um layout diferente e não foi processada.

**Resultado**: 77 fórmulas reais (`formulas`/`formula_versions`), 996
componentes de corte (`formula_components`), todas **verificadas batendo
exatamente com os valores reais calculados na própria planilha** (testado via
API contra a fórmula "Janela de Correr 2 Folhas UNNION": L=1393/A=1090 produz
os mesmos 1368/1368/1090/1040/1040/640mm que a planilha calcula).

**Todas ficam com `status_code = CATALOGADO` e `production_locked = 1`** —
nenhuma foi liberada para produção automaticamente. Nenhuma tem
`formula_deductions` nomeadas ainda (as constantes tipo `-25`, `-50`, `/2`
embutidas nas expressões não foram decompostas e rotuladas individualmente),
então o checklist da seção 13 sempre bloqueia liberação até isso ser feito —
ver `docs/GOVERNANCA_DE_DADOS.md`.

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
