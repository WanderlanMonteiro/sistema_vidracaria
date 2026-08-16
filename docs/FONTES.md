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
| 11 | Catálogo consolidado — índice extraído de 4 catálogos (Catálogo AL, Catálogo Alcoa, Catálogo geral Alutec, Catálogo promocional Aluminconte), enviado como `detalhes_tecnicos_catalogos.pdf` (42 pág.) + `catalogo_consolidado.xlsx` | Alcoa (parcial) / Alutec / Aluminconte | 42 (PDF) + 434 linhas (xlsx) | ⚠️ **Não são os catálogos originais** — é um índice já resumido, sem os 4 PDFs-fonte. A maior parte das ~430 entradas é só nome de seção + página, sem dado técnico (ex: "LINHA III GOLD \| Página: 205" sem tabela). Mas contém um "Índice de Perfis" real do Catálogo Alcoa (código + peso kg/m + página, ~912 códigos distintos) — usado para **confirmar o fabricante da linha Módulo Prático/Linha 30** (ver abaixo). Ver `database/seeds/0014_alcoa_modulo_pratico_confirmation.sql`. |

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
3. O código de cada perfil foi conferido contra o banco já carregado, usando
   códigos **distintos** por aba (a primeira versão do script contava um
   perfil repetido duas vezes na mesma aba como duas provas de pertencer a uma
   linha, o que causou classificações erradas — corrigido, ver commit
   `1acac45`) — **48 das 76 abas bateram diretamente** com perfis já
   catalogados (Suprema 30, UNNION 6, Gold III 6, Ecoline 2.5 6), então a
   fórmula ficou vinculada ao `profiles.id` real. Isso também revelou 78
   perfis reais adicionais dessas mesmas linhas que não estavam nas páginas
   dos catálogos PDF já processados (+2 Ecoline 2.5, +9 Gold III, +67
   Suprema) — cadastrados com peso/dimensão `PENDENTE` já que a planilha só
   traz o comprimento calculado, não o peso do perfil.
4. As outras 28 abas usam códigos de **3 linhas que não existiam em nenhum
   catálogo já processado**: "Módulo Prático / Linha 30" (104 perfis MP-xxx),
   "Linha Portão" (8 perfis PC/PU/LB-xxx) e "Linha Moveleira" (32 perfis —
   armários/gaveteiros com porta de giro em alumínio, linha citada na
   contracapa do catálogo Ecoline 2.5 mas nunca detalhada em nenhum PDF
   recebido). Essas 3 linhas foram cadastradas com fabricante
   `NECESSITA_CONFERENCIA` porque a planilha não diz quem fabrica os perfis
   MP/Portão — só o próprio código. Os 144 perfis novos dessas 3 linhas
   ficaram com peso/dimensão `PENDENTE`.

   **Atualização (2026-08-16)**: o fabricante da linha "Módulo Prático / Linha
   30" foi **confirmado como Alcoa** a partir do catálogo consolidado (fonte
   11 acima). Dos 69 códigos distintos da linha, 52 (75%) batem código+peso+
   página exatamente contra o "Índice de Perfis" do Catálogo Alcoa, e a seção
   "Módulo Prático II" desse índice começa na página 115 — a mesma faixa
   (115–128) onde aparecem os códigos MP-xxx da nossa planilha. Mesmo limiar
   de decisão já usado para classificar as 76 abas (n≥2 códigos distintos E
   ratio≥0.25), aqui superado com folga. `product_lines.id=7` passou para
   `manufacturer_id=2` (Alcoa) e `status_code='CATALOGADO'`; 32 perfis
   (MP-/MN-/BG-/ME-, sem conflito com nenhuma outra fonte) ganharam peso real
   citando página. Isso **não libera nenhuma fórmula para produção** — a
   liberação continua exigindo revisão de dedução + protótipo + aprovação,
   fórmula por fórmula, como sempre.

   A mesma verificação para "Linha Portão" deu resultado fraco (2 de 8
   códigos batidos — `PU-639` e `LB-050` —, exatamente no limiar de 25%, e
   `PU-639` aparece no índice Alcoa com duas páginas diferentes para o mesmo
   peso, um conflito interno da própria fonte). Não foi usado para confirmar
   fabricante; "Linha Portão" continua `NECESSITA_CONFERENCIA`.

   Achado importante que **não** foi usado para alterar dado nenhum: o mesmo
   índice Alcoa também cita uma seção "Linha Suprema" (págs. 157–202) com
   vários códigos SU-xxx que também aparecem na "Módulo Prático/Linha 30" —
   e os pesos são **próximos mas não idênticos** aos já cadastrados para a
   linha Suprema (fonte 4, catálogo TEC-SUP/Tec-Vidro): ex. `SU-001` = 0,714
   kg/m no TEC-SUP vs 0,762 kg/m no índice Alcoa; `SU-010` = 1,008 vs 1,022;
   `SU-012` = 0,547 vs 0,539. Próximo demais para ser coincidência, longe
   demais para ser o mesmo número — **isso é um conflito entre fontes, não
   uma confirmação**, registrado em "Conflitos encontrados nas fontes" em
   `docs/GOVERNANCA_DE_DADOS.md`. Nenhum peso da linha Suprema foi alterado
   por causa disso.
5. Uma aba (`04 GAVETAS P02`) tinha um layout diferente e não foi processada.

**Resultado**: 77 fórmulas reais (`formulas`/`formula_versions`), 996
componentes de corte (`formula_components`), todas **verificadas batendo
exatamente com os valores reais calculados na própria planilha** (testado via
API contra fórmulas de UNNION, Gold III e Suprema — ex: "Janela de Correr 2
Folhas UNNION" com L=1393/A=1090 produz os mesmos 1368/1368/1090/1040/1040/
640mm que a planilha calcula).

As constantes embutidas nas 996 expressões (tipo `-25`, `-50` antes do `/2`)
**foram decompostas em 610 `formula_deductions`** (seed
`0011_formula_deductions_from_planilha.sql`, inicialmente `status_code =
'EXTRAIDO'`). **As 48 fórmulas das 4 linhas totalmente catalogadas foram
revisadas e liberadas para produção** pelo responsável técnico (seeds `0012`
e `0013`) — suas deduções viraram `VALIDADO` e cada uma ganhou protótipo/
aprovação técnica registrados. As 28 fórmulas das 3 linhas novas continuam
`CATALOGADO`/bloqueadas, não por dúvida sobre a fórmula, mas porque os
próprios perfis dessas linhas ainda não têm peso/dimensão nem fabricante
confirmado. Ver "Por que a liberação para produção não é feita a
partir de uma instrução geral" em `docs/GOVERNANCA_DE_DADOS.md`.

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
