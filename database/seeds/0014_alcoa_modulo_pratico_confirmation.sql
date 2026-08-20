-- 0014_alcoa_modulo_pratico_confirmation.sql
-- Confirma o fabricante da linha "Modulo Pratico / Linha 30" (product_lines.id=7) como Alcoa,
-- a partir do documento consolidado enviado pelo usuario (detalhes_tecnicos_catalogos.pdf /
-- catalogo_consolidado.xlsx), que contem um indice real de perfis do Catalogo Alcoa (codigo +
-- peso kg/m + pagina, ~912 codigos distintos).
--
-- Metodologia identica a ja usada para classificar as abas da planilha original em
-- gen_seed_planilha.py / commit 1acac45 (n >= 2 codigos distintos batendo E ratio >= 0.25 dos
-- codigos distintos da linha). Aqui: 52 de 69 codigos distintos da linha 7 verificados contra
-- o indice Alcoa batem exatamente (codigo + peso + pagina) -- 75%, bem acima do limiar -- e a
-- faixa de pagina das ocorrencias MP-xxx (115-128) coincide com a secao "Modulo Pratico II"
-- citada no proprio indice de linhas da Alcoa (pagina 115).
--
-- Dos 52 codigos batidos, os 32 abaixo (MP-/MN-/BG-/ME-) nao tinham nenhum peso cadastrado
-- antes (primeira fonte de peso) e por isso sao carregados como CATALOGADO. Os outros 20
-- codigos batidos eram SU-/US-/VZ- cujo peso ja existe cadastrado a partir de OUTRA fonte (o
-- catalogo TEC-SUP, linha "Suprema", manufacturer_id=3) com valores PROXIMOS mas NAO
-- IDENTICOS (ex.: SU-001 = 0.714 kg/m no TEC-SUP vs 0.762 kg/m no indice Alcoa) -- isso e um
-- conflito entre fontes, nao uma confirmacao, e por isso NAO foi usado para preencher peso.
-- Ver secao "Conflitos encontrados nas fontes" em docs/GOVERNANCA_DE_DADOS.md.

INSERT INTO technical_sources (id, manufacturer_id, title, file_name, source_url, edition, document_type, is_uploaded, page_count, notes) VALUES
(11, NULL, 'Catalogo consolidado - detalhes tecnicos extraidos dos catalogos enviados (AL, Alcoa, Alutec, Aluminconte)',
'043333d8-detalhes_tecnicos_catalogos.pdf / 6f944ebc-catalogo_consolidado.xlsx', NULL, NULL, 'OUTRO', 1, 42,
'Documento consolidado enviado pelo usuario: um indice extraido de 4 catalogos (Catalogo AL, Catalogo Alcoa, Catalogo geral Alutec, Catalogo promocional Aluminconte) -- nao sao os PDFs originais desses catalogos, que nao foram recebidos. A maior parte das ~430 entradas da planilha e so um nome de secao + pagina, sem dado tecnico extraivel (ex: "LINHA III GOLD | Pagina: 205" sem tabela). O conteudo tabular real e utilizavel esta nos blocos "Indice de Perfis" do Catalogo Alcoa (codigo + peso kg/m + pagina, ~912 codigos distintos) e em blocos de ferragem do Alutec/Aluminconte (nao carregados nesta migracao).');

INSERT INTO source_references (technical_source_id, section_title, excerpt, extracted_by) VALUES
(11, 'Indice de Perfis (Catalogo Alcoa) - secao Modulo Pratico II / diversos (MN/BG/ME)',
'nº Alcoa / Peso (kg/m) / Pag. -- amostra usada para confirmar o fabricante da linha Modulo Pratico/Linha 30: MP-300 0.370 123; MP-302 0.452 123; MP-309 0.429 124; MP-321 0.473 123; MP-332 0.618 125; MP-336 0.499 127; MP-352 0.199 118; MP-354 0.980 125; MP-357 0.659 117; MP-360 0.442 115; MP-366 0.865 120; MP-368 0.683 119; MP-369 0.588 119; MP-379 0.975 127; MP-380 0.905 127; MP-416 0.902 122; MN-001 1.377 218; MN-002 0.669 216; MN-003 1.093 217; MN-005 0.783 221; MN-006 0.878 221; MN-007 0.710 229; MN-010 1.495 217; MN-015 0.881 228; MN-031 1.331 223; MN-039 1.400 225; MN-050 0.734 218; MN-055 0.371 220; BG-035 0.122 137; BG-057 0.170 207; BG-202 0.108 128; ME-013 0.267 189. O indice de linhas da Alcoa (mesmo documento) cita a secao "Modulo Pratico II" a partir da pagina 115, faixa que coincide com as paginas dos MP-xxx acima (115-128).',
'analise-catalogo-consolidado');
SET @ref11 = LAST_INSERT_ID();

-- Reclassifica a linha inteira (todos os ~104 perfis, mesmo os sem peso batido nesta leva)
-- como Alcoa -- a evidencia acima e sobre a LINHA (75% dos codigos distintos verificados batem),
-- nao apenas sobre os 32 perfis que ganham peso aqui.
UPDATE product_lines SET
manufacturer_id = 2,
status_code = 'CATALOGADO',
description = CONCAT(description, ' | Fabricante confirmado como Alcoa em 2026-08-16 a partir do documento consolidado enviado pelo usuario: 52 de 69 codigos distintos verificados (75%) batem codigo+peso+pagina com o Indice de Perfis do Catalogo Alcoa (ver source_references.id=', @ref11, '), e a secao "Modulo Pratico II" do indice de linhas da Alcoa comeca exatamente na faixa de pagina (115-128) onde os MP-xxx desta linha aparecem.'),
source_reference_id = @ref11
WHERE id = 7;

UPDATE profiles SET manufacturer_id = 2 WHERE product_line_id = 7;

-- Peso confirmado (primeira fonte de peso para estes codigos -- sem conflito com outra fonte).
UPDATE profiles SET weight_kg_per_m=0.370, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 123.') WHERE product_line_id=7 AND code='MP-300';
UPDATE profiles SET weight_kg_per_m=0.452, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 123.') WHERE product_line_id=7 AND code='MP-302';
UPDATE profiles SET weight_kg_per_m=0.429, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 124.') WHERE product_line_id=7 AND code='MP-309';
UPDATE profiles SET weight_kg_per_m=0.473, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 123.') WHERE product_line_id=7 AND code='MP-321';
UPDATE profiles SET weight_kg_per_m=0.618, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 125.') WHERE product_line_id=7 AND code='MP-332';
UPDATE profiles SET weight_kg_per_m=0.499, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 127.') WHERE product_line_id=7 AND code='MP-336';
UPDATE profiles SET weight_kg_per_m=0.199, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 118.') WHERE product_line_id=7 AND code='MP-352';
UPDATE profiles SET weight_kg_per_m=0.980, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 125.') WHERE product_line_id=7 AND code='MP-354';
UPDATE profiles SET weight_kg_per_m=0.659, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 117.') WHERE product_line_id=7 AND code='MP-357';
UPDATE profiles SET weight_kg_per_m=0.442, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 115.') WHERE product_line_id=7 AND code='MP-360';
UPDATE profiles SET weight_kg_per_m=0.865, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 120.') WHERE product_line_id=7 AND code='MP-366';
UPDATE profiles SET weight_kg_per_m=0.683, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 119.') WHERE product_line_id=7 AND code='MP-368';
UPDATE profiles SET weight_kg_per_m=0.588, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 119.') WHERE product_line_id=7 AND code='MP-369';
UPDATE profiles SET weight_kg_per_m=0.975, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 127.') WHERE product_line_id=7 AND code='MP-379';
UPDATE profiles SET weight_kg_per_m=0.905, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 127.') WHERE product_line_id=7 AND code='MP-380';
UPDATE profiles SET weight_kg_per_m=0.902, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 122.') WHERE product_line_id=7 AND code='MP-416';
UPDATE profiles SET weight_kg_per_m=1.377, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 218.') WHERE product_line_id=7 AND code='MN-001';
UPDATE profiles SET weight_kg_per_m=0.669, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 216.') WHERE product_line_id=7 AND code='MN-002';
UPDATE profiles SET weight_kg_per_m=1.093, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 217.') WHERE product_line_id=7 AND code='MN-003';
UPDATE profiles SET weight_kg_per_m=0.783, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 221.') WHERE product_line_id=7 AND code='MN-005';
UPDATE profiles SET weight_kg_per_m=0.878, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 221.') WHERE product_line_id=7 AND code='MN-006';
UPDATE profiles SET weight_kg_per_m=0.710, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 229.') WHERE product_line_id=7 AND code='MN-007';
UPDATE profiles SET weight_kg_per_m=1.495, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 217.') WHERE product_line_id=7 AND code='MN-010';
UPDATE profiles SET weight_kg_per_m=0.881, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 228.') WHERE product_line_id=7 AND code='MN-015';
UPDATE profiles SET weight_kg_per_m=1.331, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 223.') WHERE product_line_id=7 AND code='MN-031';
UPDATE profiles SET weight_kg_per_m=1.400, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 225.') WHERE product_line_id=7 AND code='MN-039';
UPDATE profiles SET weight_kg_per_m=0.734, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 218.') WHERE product_line_id=7 AND code='MN-050';
UPDATE profiles SET weight_kg_per_m=0.371, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 220.') WHERE product_line_id=7 AND code='MN-055';
UPDATE profiles SET weight_kg_per_m=0.122, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 137.') WHERE product_line_id=7 AND code='BG-035';
UPDATE profiles SET weight_kg_per_m=0.170, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 207.') WHERE product_line_id=7 AND code='BG-057';
UPDATE profiles SET weight_kg_per_m=0.108, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 128.') WHERE product_line_id=7 AND code='BG-202';
UPDATE profiles SET weight_kg_per_m=0.267, status_code='CATALOGADO', origin_type='ENCONTRADO_DOCUMENTO', source_reference_id=@ref11, description=CONCAT(COALESCE(description,''), ' | Peso: Catalogo Alcoa, Indice de Perfis, pag. 189.') WHERE product_line_id=7 AND code='ME-013';
