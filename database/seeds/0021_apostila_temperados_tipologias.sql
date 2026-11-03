-- 0021_apostila_temperados_tipologias.sql
-- Fonte: "Apostila Técnica para Vidros de Segurança" (curso temperado), autoria
-- suportecnicojota@hotmail.com, 134 páginas -- enviada em duas partes (PDF),
-- lida por completo. Diferente do Livro 5 de Serralheria (esquadrias de
-- alumínio com perfil), aqui as tipologias são montagens de vidro temperado
-- SEM marco de alumínio (ferragem direto no vidro) -- por isso viram
-- tipologias novas (categoria VIDRO_TEMPERADO), não reaproveitam os nomes já
-- cadastrados em 0003_typologies.sql (Correr/Giro/Basculante/... são famílias
-- de esquadria com perfil, produto diferente).
--
-- Cada tipologia abaixo tem o desenho técnico REAL da apostila (página
-- renderizada como imagem, igual ao padrão já usado no catálogo Super5),
-- vinculado via technical_drawings -- não é um desenho recriado pelo sistema.

INSERT INTO technical_sources (title, file_name, edition, document_type, is_uploaded, page_count, notes) VALUES
('Apostila Técnica para Vidros de Segurança (curso temperado)', 'ApostilaTecnicadeVidrodeSeguranca_1.pdf + _2.pdf', NULL, 'LIVRO_TECNICO', 1, 134,
 'Autoria suportecnicojota@hotmail.com ("Elaboração"). Enviada primeiro como .docx convertido de PDF (sem imagens, só texto/tabelas) e depois reenviada como os dois PDFs originais (100 + 34 páginas), com os desenhos técnicos e fotos completos. Lida por completo (134/134 páginas) nas duas versões.');
SET @src_apostila = LAST_INSERT_ID();

-- ---------------------------------------------------------------------------
-- Tipologias (categoria nova: VIDRO_TEMPERADO -- montagem sem perfil de marco)
-- ---------------------------------------------------------------------------

INSERT INTO source_references (technical_source_id, page_number, section_title, excerpt, extracted_by) VALUES
(@src_apostila, 23, 'Box de Canto', 'BOX DE CANTO -- Box de vidro temperado usado em banheiros, sua colocação é feita sobre o canto tendo sua abertura situada no centro abrindo uma porta a direita e outra e esquerda.', 'manual-extraction');
SET @ref = LAST_INSERT_ID();
INSERT INTO typologies (name, category, has_baguete, is_common_in_brazil, notes, source_reference_id) VALUES
('Box de Canto', 'VIDRO_TEMPERADO', NULL, 1, 'Colocado sobre o canto do banheiro, abertura no centro (porta abre para os dois lados). Apostila p.23.', @ref);
SET @ty_box_canto = LAST_INSERT_ID();
INSERT INTO technical_drawings (subject_type, subject_id, file_path, caption, source_reference_id) VALUES
('TYPOLOGY', @ty_box_canto, 'uploads/catalogos/apostila-temperados/pagina-023.jpg', 'Box de Canto -- apostila p.23 (página também mostra Box Frontal e Box Frontal de Giro)', @ref);

INSERT INTO source_references (technical_source_id, page_number, section_title, excerpt, extracted_by) VALUES
(@src_apostila, 23, 'Box Frontal', 'BOX FRONTAL -- Box de vidro é o mais vendido no Brasil, usado de parede a parede de fácil colocação.', 'manual-extraction');
SET @ref = LAST_INSERT_ID();
INSERT INTO typologies (name, category, has_baguete, is_common_in_brazil, notes, source_reference_id) VALUES
('Box Frontal', 'VIDRO_TEMPERADO', NULL, 1, 'De parede a parede, o modelo de box mais vendido no Brasil. Apostila p.23.', @ref);
SET @ty_box_frontal = LAST_INSERT_ID();
INSERT INTO technical_drawings (subject_type, subject_id, file_path, caption, source_reference_id) VALUES
('TYPOLOGY', @ty_box_frontal, 'uploads/catalogos/apostila-temperados/pagina-023.jpg', 'Box Frontal -- apostila p.23 (página também mostra Box de Canto e Box Frontal de Giro)', @ref);

INSERT INTO source_references (technical_source_id, page_number, section_title, excerpt, extracted_by) VALUES
(@src_apostila, 23, 'Box Frontal de Giro', 'BOX FRONTAL DE GIRO -- Ideal para vãos com máximo de 1000, sua abertura é feita para dentro do Box, sua porta não deve passar de 600 de largura, evitando assim manutenção constante nas dobradiças.', 'manual-extraction');
SET @ref = LAST_INSERT_ID();
INSERT INTO typologies (name, category, has_baguete, is_common_in_brazil, notes, source_reference_id) VALUES
('Box Frontal de Giro', 'VIDRO_TEMPERADO', NULL, 1, 'Vão máx. 1000mm, porta gira para dentro, largura máx. da porta 600mm (apostila p.23).', @ref);
SET @ty_box_giro = LAST_INSERT_ID();
INSERT INTO technical_drawings (subject_type, subject_id, file_path, caption, source_reference_id) VALUES
('TYPOLOGY', @ty_box_giro, 'uploads/catalogos/apostila-temperados/pagina-023.jpg', 'Box Frontal de Giro -- apostila p.23 (página também mostra Box de Canto e Box Frontal)', @ref);

INSERT INTO source_references (technical_source_id, page_number, section_title, excerpt, extracted_by) VALUES
(@src_apostila, 26, 'Kit Sacada', 'KIT SACADA -- ideal para fechamento de sacadas, jardim de inverno, divisórias e similares, mantendo toda abertura e ventilação, praticidade e segurança. Folga entre vidros: 3mm; folga lateral: 10mm; altura = vão - 145mm.', 'manual-extraction');
SET @ref = LAST_INSERT_ID();
INSERT INTO typologies (name, category, has_baguete, is_common_in_brazil, notes, source_reference_id) VALUES
('Kit Sacada', 'VIDRO_TEMPERADO', NULL, 1, 'Painéis de vidro deslizantes empilháveis para fechamento de sacada/jardim de inverno. Folga entre vidros 3mm, folga lateral 10mm cada lado, altura = altura do vão - 145mm (apostila p.26).', @ref);
SET @ty_kit_sacada = LAST_INSERT_ID();
INSERT INTO technical_drawings (subject_type, subject_id, file_path, caption, source_reference_id) VALUES
('TYPOLOGY', @ty_kit_sacada, 'uploads/catalogos/apostila-temperados/pagina-026.jpg', 'Kit Sacada -- apostila p.26 (página também mostra Porta de Correr com Mão Amiga, já cadastrada à parte)', @ref);

INSERT INTO source_references (technical_source_id, page_number, section_title, excerpt, extracted_by) VALUES
(@src_apostila, 27, 'Spider', 'SPIDER -- visual arquitetônico leve e transparente, o peso do vidro é suportado somente por parafusos superiores. Sistema de fechamento de vidros utilizado em fachadas, divisórias, vitrines e similares; utiliza vidros furados e fixados em quatro pontos (braço do spider/aranha), vidros temperados, lapidados, furados, parafusos de aço inoxidável com rótulas, spider em aço inox ou alumínio, silicone estrutural para juntas e vedações.', 'manual-extraction');
SET @ref = LAST_INSERT_ID();
INSERT INTO typologies (name, category, has_baguete, is_common_in_brazil, notes, source_reference_id) VALUES
('Spider (Estrutura Aranha)', 'VIDRO_TEMPERADO', NULL, 1, 'Fachadas/divisórias/vitrines com vidro furado fixado em 4 pontos por peças "aranha"; peso suportado pelos parafusos superiores. Apostila p.27.', @ref);
SET @ty_spider = LAST_INSERT_ID();
INSERT INTO technical_drawings (subject_type, subject_id, file_path, caption, source_reference_id) VALUES
('TYPOLOGY', @ty_spider, 'uploads/catalogos/apostila-temperados/pagina-027.jpg', 'Spider -- apostila p.27', @ref);

INSERT INTO source_references (technical_source_id, page_number, section_title, excerpt, extracted_by) VALUES
(@src_apostila, 28, 'Fachada Glazing', 'FACHADA GLAZING -- perfis visíveis apenas no interior, aspecto exterior uniforme tanto com vidro fixo e folhas projetantes. Sistema desenvolvido em meados de 1984 para eliminar a visualização do alumínio pelo lado externo (envidraçamento estrutural).', 'manual-extraction');
SET @ref = LAST_INSERT_ID();
INSERT INTO typologies (name, category, has_baguete, is_common_in_brazil, notes, source_reference_id) VALUES
('Fachada Glazing', 'VIDRO_TEMPERADO', NULL, 1, 'Envidraçamento estrutural: perfil de alumínio visível só por dentro, fachada externa só com vidro. Apostila p.28.', @ref);
SET @ty_glazing = LAST_INSERT_ID();
INSERT INTO technical_drawings (subject_type, subject_id, file_path, caption, source_reference_id) VALUES
('TYPOLOGY', @ty_glazing, 'uploads/catalogos/apostila-temperados/pagina-028.jpg', 'Fachada Glazing -- apostila p.28', @ref);

INSERT INTO source_references (technical_source_id, page_number, section_title, excerpt, extracted_by) VALUES
(@src_apostila, 29, 'Guarda-corpo / Sacada de Vidro', 'Guarda-corpo e similares. Parapeito = peitoril, proteção que atinge a altura do peito, presente em janelas, sacadas, terraços, patamares. Norma NBR 14718. Altura mínima do parapeito 1100mm a partir do piso; distância entre perfis inferior a 1100mm; vidro mínimo 8mm (laminado, temperado laminado ou armado); vedação sem massa.', 'manual-extraction');
SET @ref = LAST_INSERT_ID();
INSERT INTO typologies (name, category, has_baguete, is_common_in_brazil, notes, source_reference_id) VALUES
('Guarda-corpo / Sacada de Vidro', 'VIDRO_TEMPERADO', NULL, 1, 'Painel de vidro como proteção de sacada/terraço. NBR 14718: altura mínima 1100mm, vidro mínimo 8mm laminado/temperado-laminado/armado, sem massa na colocação. Apostila p.29 e p.31.', @ref);
SET @ty_guarda_corpo = LAST_INSERT_ID();
INSERT INTO technical_drawings (subject_type, subject_id, file_path, caption, source_reference_id) VALUES
('TYPOLOGY', @ty_guarda_corpo, 'uploads/catalogos/apostila-temperados/pagina-029.jpg', 'Guarda-corpo de sacada -- apostila p.29', @ref);

-- "Modelos de projetos" (p.33-46): uma tipologia por página, formulário +
-- desenho cotado real usado pela têmpera.

INSERT INTO source_references (technical_source_id, page_number, section_title, excerpt, extracted_by) VALUES
(@src_apostila, 33, 'Modelos de projetos -- Max ar único', 'Formulário e desenho cotado do modelo "Max ar único" (ferragens 1921VA, furação 12mm).', 'manual-extraction');
SET @ref = LAST_INSERT_ID();
INSERT INTO typologies (name, category, has_baguete, is_common_in_brazil, notes, source_reference_id) VALUES
('Max-Ar Único (Vidro Temperado)', 'VIDRO_TEMPERADO', NULL, 1, 'Peça móvel projetante única, sem marco de alumínio. Apostila p.33.', @ref);
SET @ty1 = LAST_INSERT_ID();
INSERT INTO technical_drawings (subject_type, subject_id, file_path, caption, source_reference_id) VALUES
('TYPOLOGY', @ty1, 'uploads/catalogos/apostila-temperados/pagina-033.jpg', 'Max-Ar único -- modelo de projeto, apostila p.33', @ref);

INSERT INTO source_references (technical_source_id, page_number, section_title, excerpt, extracted_by) VALUES
(@src_apostila, 34, 'Modelos de projetos -- Basculantes laterais e fixo central', 'Formulário e desenho cotado com fórmula de cálculo da peça: "480 + L = -A + 2" (variações para 6/8/10mm) e peso de referência por espessura.', 'manual-extraction');
SET @ref = LAST_INSERT_ID();
INSERT INTO typologies (name, category, has_baguete, is_common_in_brazil, notes, source_reference_id) VALUES
('Basculantes Laterais e Fixo Central', 'VIDRO_TEMPERADO', NULL, 1, 'Dois basculantes nas laterais com fixo/recorte no centro, sem marco de alumínio. Apostila p.34 -- traz fórmula de exemplo do próprio fabricante da apostila para a peça central (não conferida/adaptada para o interpretador de fórmulas deste sistema).', @ref);
SET @ty2 = LAST_INSERT_ID();
INSERT INTO technical_drawings (subject_type, subject_id, file_path, caption, source_reference_id) VALUES
('TYPOLOGY', @ty2, 'uploads/catalogos/apostila-temperados/pagina-034.jpg', 'Basculantes laterais e fixo central -- modelo de projeto, apostila p.34', @ref);

INSERT INTO source_references (technical_source_id, page_number, section_title, excerpt, extracted_by) VALUES
(@src_apostila, 35, 'Modelos de projetos -- Janela 2 folhas correr', 'Formulário e desenho cotado do modelo "Janela 2 folhas correr".', 'manual-extraction');
SET @ref = LAST_INSERT_ID();
INSERT INTO typologies (name, category, has_baguete, is_common_in_brazil, notes, source_reference_id) VALUES
('Janela 2 Folhas de Correr (Vidro Temperado)', 'VIDRO_TEMPERADO', NULL, 1, 'Uma folha fixa e uma móvel, sem marco de alumínio. Apostila p.35.', @ref);
SET @ty3 = LAST_INSERT_ID();
INSERT INTO technical_drawings (subject_type, subject_id, file_path, caption, source_reference_id) VALUES
('TYPOLOGY', @ty3, 'uploads/catalogos/apostila-temperados/pagina-035.jpg', 'Janela 2 folhas de correr -- modelo de projeto, apostila p.35', @ref);

INSERT INTO source_references (technical_source_id, page_number, section_title, excerpt, extracted_by) VALUES
(@src_apostila, 36, 'Modelos de projetos -- Janela 4 folhas correr', 'Formulário e desenho cotado do modelo "Janela 4 folhas correr", uns dos projetos mais usados (salas, suítes, cozinha) -- 2 vidros fixos nas extremidades e 2 móveis no centro.', 'manual-extraction');
SET @ref = LAST_INSERT_ID();
INSERT INTO typologies (name, category, has_baguete, is_common_in_brazil, notes, source_reference_id) VALUES
('Janela 4 Folhas de Correr (Vidro Temperado)', 'VIDRO_TEMPERADO', NULL, 1, '2 vidros fixos nas extremidades e 2 móveis no centro, sem marco de alumínio. Apostila p.21/36.', @ref);
SET @ty4 = LAST_INSERT_ID();
INSERT INTO technical_drawings (subject_type, subject_id, file_path, caption, source_reference_id) VALUES
('TYPOLOGY', @ty4, 'uploads/catalogos/apostila-temperados/pagina-036.jpg', 'Janela 4 folhas de correr -- modelo de projeto, apostila p.36', @ref);

INSERT INTO source_references (technical_source_id, page_number, section_title, excerpt, extracted_by) VALUES
(@src_apostila, 37, 'Modelos de projetos -- Vitrina fixa 3 peças', 'Formulário e desenho cotado do modelo "Vitrina fixa 3 peças".', 'manual-extraction');
SET @ref = LAST_INSERT_ID();
INSERT INTO typologies (name, category, has_baguete, is_common_in_brazil, notes, source_reference_id) VALUES
('Vitrine Fixa 3 Peças', 'VIDRO_TEMPERADO', NULL, 1, 'Três peças fixas lado a lado, usada em fachadas de loja/vitrine. Apostila p.37.', @ref);
SET @ty5 = LAST_INSERT_ID();
INSERT INTO technical_drawings (subject_type, subject_id, file_path, caption, source_reference_id) VALUES
('TYPOLOGY', @ty5, 'uploads/catalogos/apostila-temperados/pagina-037.jpg', 'Vitrine fixa 3 peças -- modelo de projeto, apostila p.37', @ref);

INSERT INTO source_references (technical_source_id, page_number, section_title, excerpt, extracted_by) VALUES
(@src_apostila, 38, 'Modelos de projetos -- Vitrina fixa tubo e bandeira 2 peças', 'Formulário e desenho cotado do modelo "Vitrina fixa tubo e bandeira 2 peças" (tubo 50x100 dividindo bandeira superior do vidro principal).', 'manual-extraction');
SET @ref = LAST_INSERT_ID();
INSERT INTO typologies (name, category, has_baguete, is_common_in_brazil, notes, source_reference_id) VALUES
('Vitrine Fixa com Tubo e Bandeira', 'VIDRO_TEMPERADO', NULL, 1, 'Vidro fixo dividido por tubo de alumínio 50x100 com bandeira superior. Apostila p.38.', @ref);
SET @ty6 = LAST_INSERT_ID();
INSERT INTO technical_drawings (subject_type, subject_id, file_path, caption, source_reference_id) VALUES
('TYPOLOGY', @ty6, 'uploads/catalogos/apostila-temperados/pagina-038.jpg', 'Vitrine fixa com tubo e bandeira -- modelo de projeto, apostila p.38', @ref);

INSERT INTO source_references (technical_source_id, page_number, section_title, excerpt, extracted_by) VALUES
(@src_apostila, 39, 'Modelos de projetos -- Porta pivotante única', 'Formulário e desenho cotado do modelo "Porta pivotante única".', 'manual-extraction');
SET @ref = LAST_INSERT_ID();
INSERT INTO typologies (name, category, has_baguete, is_common_in_brazil, notes, source_reference_id) VALUES
('Porta Pivotante Única (Vidro Temperado)', 'VIDRO_TEMPERADO', NULL, 1, 'Porta giratória em eixo vertical, uma folha, sem marco de alumínio. Apostila p.39.', @ref);
SET @ty7 = LAST_INSERT_ID();
INSERT INTO technical_drawings (subject_type, subject_id, file_path, caption, source_reference_id) VALUES
('TYPOLOGY', @ty7, 'uploads/catalogos/apostila-temperados/pagina-039.jpg', 'Porta pivotante única -- modelo de projeto, apostila p.39', @ref);

INSERT INTO source_references (technical_source_id, page_number, section_title, excerpt, extracted_by) VALUES
(@src_apostila, 40, 'Modelos de projetos -- Porta pivotante 2 folhas e bandeira', 'Formulário e desenho cotado do modelo "Porta pivotante 2 folhas e bandeira".', 'manual-extraction');
SET @ref = LAST_INSERT_ID();
INSERT INTO typologies (name, category, has_baguete, is_common_in_brazil, notes, source_reference_id) VALUES
('Porta Pivotante 2 Folhas e Bandeira', 'VIDRO_TEMPERADO', NULL, 1, 'Duas portas pivotantes com bandeira fixa superior, sem marco de alumínio. Apostila p.40.', @ref);
SET @ty8 = LAST_INSERT_ID();
INSERT INTO technical_drawings (subject_type, subject_id, file_path, caption, source_reference_id) VALUES
('TYPOLOGY', @ty8, 'uploads/catalogos/apostila-temperados/pagina-040.jpg', 'Porta pivotante 2 folhas e bandeira -- modelo de projeto, apostila p.40', @ref);

INSERT INTO source_references (technical_source_id, page_number, section_title, excerpt, extracted_by) VALUES
(@src_apostila, 41, 'Modelos de projetos -- Porta de correr 2 folhas tubo e bandeira', 'Formulário e desenho cotado do modelo "Porta de correr 2 folhas tubo e bandeira" (tubo 4"x2").', 'manual-extraction');
SET @ref = LAST_INSERT_ID();
INSERT INTO typologies (name, category, has_baguete, is_common_in_brazil, notes, source_reference_id) VALUES
('Porta de Correr 2 Folhas com Tubo e Bandeira', 'VIDRO_TEMPERADO', NULL, 1, 'Porta de correr de 2 folhas com bandeira superior fixa separada por tubo 4"x2". Apostila p.41.', @ref);
SET @ty9 = LAST_INSERT_ID();
INSERT INTO technical_drawings (subject_type, subject_id, file_path, caption, source_reference_id) VALUES
('TYPOLOGY', @ty9, 'uploads/catalogos/apostila-temperados/pagina-041.jpg', 'Porta de correr 2 folhas, tubo e bandeira -- modelo de projeto, apostila p.41', @ref);

INSERT INTO source_references (technical_source_id, page_number, section_title, excerpt, extracted_by) VALUES
(@src_apostila, 42, 'Modelos de projetos -- Porta de correr 4 folhas', 'Formulário e desenho cotado do modelo "Porta de correr 4 folhas" (guia embutida/aparente/interrompida, porta com cadeado gabarito 1320 passante).', 'manual-extraction');
SET @ref = LAST_INSERT_ID();
INSERT INTO typologies (name, category, has_baguete, is_common_in_brazil, notes, source_reference_id) VALUES
('Porta de Correr 4 Folhas (Vidro Temperado)', 'VIDRO_TEMPERADO', NULL, 1, '2 folhas fixas + 2 móveis, guia de piso embutida/aparente/interrompida. Apostila p.42.', @ref);
SET @ty10 = LAST_INSERT_ID();
INSERT INTO technical_drawings (subject_type, subject_id, file_path, caption, source_reference_id) VALUES
('TYPOLOGY', @ty10, 'uploads/catalogos/apostila-temperados/pagina-042.jpg', 'Porta de correr 4 folhas -- modelo de projeto, apostila p.42', @ref);

INSERT INTO source_references (technical_source_id, page_number, section_title, excerpt, extracted_by) VALUES
(@src_apostila, 43, 'Modelos de projetos -- Porta de correr 2 folhas atrás da parede alvenaria', 'Formulário e desenho cotado do modelo "Porta de correr 2 folhas atrás da parede alvenaria" (peças correm por trás da parede, ideal para pouco espaço).', 'manual-extraction');
SET @ref = LAST_INSERT_ID();
INSERT INTO typologies (name, category, has_baguete, is_common_in_brazil, notes, source_reference_id) VALUES
('Porta de Correr 2 Folhas Atrás da Alvenaria', 'VIDRO_TEMPERADO', NULL, 1, 'Portas correm embutidas atrás da parede de alvenaria, ambiente interno com pouco espaço. Apostila p.22/43.', @ref);
SET @ty11 = LAST_INSERT_ID();
INSERT INTO technical_drawings (subject_type, subject_id, file_path, caption, source_reference_id) VALUES
('TYPOLOGY', @ty11, 'uploads/catalogos/apostila-temperados/pagina-043.jpg', 'Porta de correr 2 folhas atrás da alvenaria -- modelo de projeto, apostila p.43', @ref);

INSERT INTO source_references (technical_source_id, page_number, section_title, excerpt, extracted_by) VALUES
(@src_apostila, 44, 'Modelos de projetos -- Porta sanfonada 3 folhas com trilho 1030', 'Formulário, desenho cotado e fórmula de divisão de portas: "(vão menos 12mm folga) menos 65 (ponto giro) dividido 2,5 = portas maiores; portas maiores dividido 2 mais 65 = porta menor".', 'manual-extraction');
SET @ref = LAST_INSERT_ID();
INSERT INTO typologies (name, category, has_baguete, is_common_in_brazil, notes, source_reference_id) VALUES
('Porta Sanfonada 3 Folhas (Trilho 1030)', 'VIDRO_TEMPERADO', NULL, 1, 'Porta articulada de 3 folhas sobre trilho Stanley 68/carro 1030, ideal para abertura total do vão. Apostila p.22/44 -- fórmula de divisão das folhas citada como referência do fabricante, não conferida/adaptada para o interpretador de fórmulas deste sistema.', @ref);
SET @ty12 = LAST_INSERT_ID();
INSERT INTO technical_drawings (subject_type, subject_id, file_path, caption, source_reference_id) VALUES
('TYPOLOGY', @ty12, 'uploads/catalogos/apostila-temperados/pagina-044.jpg', 'Porta sanfonada 3 folhas com trilho 1030 -- modelo de projeto, apostila p.44', @ref);

INSERT INTO source_references (technical_source_id, page_number, section_title, excerpt, extracted_by) VALUES
(@src_apostila, 45, 'Modelos de projetos -- Porta sanfonada 6 peças com trilho 1030', 'Formulário, desenho cotado e fórmula de divisão de portas: "(vão menos 24mm folga) menos 130mm (ponto giro) dividido 5,0 = portas maiores; portas maiores dividido 2 mais 65 = portas menores".', 'manual-extraction');
SET @ref = LAST_INSERT_ID();
INSERT INTO typologies (name, category, has_baguete, is_common_in_brazil, notes, source_reference_id) VALUES
('Porta Sanfonada 6 Peças (Trilho 1030)', 'VIDRO_TEMPERADO', NULL, 1, 'Porta articulada de 6 peças sobre trilho Stanley 68/carro 1030. Apostila p.22/45 -- fórmula de divisão das folhas citada como referência do fabricante, não conferida/adaptada para o interpretador de fórmulas deste sistema.', @ref);
SET @ty13 = LAST_INSERT_ID();
INSERT INTO technical_drawings (subject_type, subject_id, file_path, caption, source_reference_id) VALUES
('TYPOLOGY', @ty13, 'uploads/catalogos/apostila-temperados/pagina-045.jpg', 'Porta sanfonada 6 peças com trilho 1030 -- modelo de projeto, apostila p.45', @ref);

INSERT INTO source_references (technical_source_id, page_number, section_title, excerpt, extracted_by) VALUES
(@src_apostila, 46, 'Modelos de projetos -- Porta de correr 5 folhas com mão amiga trilho 1030', 'Formulário e desenho cotado do modelo "Porta de correr 5 folhas com mão amiga trilho 1030" (guia embutida).', 'manual-extraction');
SET @ref = LAST_INSERT_ID();
INSERT INTO typologies (name, category, has_baguete, is_common_in_brazil, notes, source_reference_id) VALUES
('Porta de Correr 5 Folhas com Mão Amiga (Trilho 1030)', 'VIDRO_TEMPERADO', NULL, 1, 'Porta de correr de 5 folhas com "mão amiga" (guia auxiliar), trilho 1030, para vãos superiores a 2000mm. Apostila p.26/46.', @ref);
SET @ty14 = LAST_INSERT_ID();
INSERT INTO technical_drawings (subject_type, subject_id, file_path, caption, source_reference_id) VALUES
('TYPOLOGY', @ty14, 'uploads/catalogos/apostila-temperados/pagina-046.jpg', 'Porta de correr 5 folhas com mão amiga, trilho 1030 -- modelo de projeto, apostila p.46', @ref);

-- ---------------------------------------------------------------------------
-- Tabela de folgas/descontos de instalação (apostila p.32) -- "cada medidor
-- tem sua própria folga, já que não existe folga padrão" (citação literal).
-- Só recebe typology_id quando o tipo de instalação bate sem ambiguidade com
-- uma das tipologias cadastradas acima; nos demais casos fica sem vínculo,
-- ainda assim citável/consultável como referência.
-- ---------------------------------------------------------------------------

INSERT INTO source_references (technical_source_id, page_number, section_title, excerpt, extracted_by) VALUES
(@src_apostila, 32, 'Folgas em mm considerando paredes e pisos nivelados e no esquadro', 'Tabela "Folgas (mm) considerando paredes e pisos nivelados e no esquadro. Cada medidor tem sua própria folga, já que não existe folga padrão." -- colunas: Tipo de instalação, Altura móvel, Altura Fixos, Largura total.', 'manual-extraction');
SET @ref_folgas = LAST_INSERT_ID();

INSERT INTO installation_deductions (typology_id, installation_type, moving_height_mm, fixed_height_mm, total_width_mm, source_reference_id) VALUES
(NULL, 'Porta correr 2 e 4 folhas guia embutida', '-00', '-40', '+transpasse', @ref_folgas),
(NULL, 'Porta correr 2 e 4 folhas guia aparente e interrompida', '-20', '-60', '+transpasse', @ref_folgas),
(@ty7, 'Porta pivotante sem cantoneira', '-13', NULL, '-6', @ref_folgas),
(@ty7, 'Porta pivotante com cantoneira', '-13', NULL, '-10', @ref_folgas),
(NULL, 'Porta pivotante com fixo lateral no perfil U AL 12', '-13', '-15', '15', @ref_folgas),
(NULL, 'Porta pivotante com bandeira no perfil e cantoneira', '-13', '-7', '-10', @ref_folgas),
(NULL, 'Bandeira porta de correr no perfil AL 10 cavalão', NULL, '-30', '-30', @ref_folgas),
(NULL, 'Bandeira porta de correr no perfil U AL 12 e ferragens', NULL, '-10', '-20', @ref_folgas),
(NULL, 'Bandeira porta de correr no perfil U AL 12', NULL, '-15', '-15', @ref_folgas),
(NULL, 'Janela de correr 4 e 2 folhas trilho AL 51', '-20', '-60', '+transpasso', @ref_folgas),
(NULL, 'Janela de correr 4 e 2 folhas trilho AL 49', '-20', '-55', '+transpasso', @ref_folgas),
(@ty_box_frontal, 'Box banheiro frontal 4 e 3 e 2 folhas', '-20', '-55', '+transpasso', @ref_folgas),
(@ty_box_giro, 'Box de giro com fixo lateral cadeirinha perfil U', '-5', '-5', '-15', @ref_folgas),
(NULL, 'Basculante único com cantoneira', '-10', NULL, '-10', @ref_folgas),
(NULL, 'Basculante com fixo inferior cadeirinha', '-20', NULL, '-10', @ref_folgas),
(NULL, 'Pivotante único com cantoneira', '-10', NULL, '-10', @ref_folgas),
(NULL, 'Max-ar único com cantoneira', '-10', NULL, '-10', @ref_folgas),
(NULL, 'Max-ar único com fixo inferior cadeirinha', '-20', NULL, '-10', @ref_folgas),
(NULL, 'Fixo colocado no perfil U AL 10 cavalão', NULL, '-30', '-30', @ref_folgas),
(NULL, 'Fixo colocado no perfil U AL 12 para 10mm', NULL, '-15', '-15', @ref_folgas),
(NULL, 'Fixo colocado no perfil U AL 30 para 8mm', NULL, '-10', '-10', @ref_folgas),
(@ty14, 'Porta de correr com mão amiga (ver desenho)', '-65', '-15', '+transpasso', @ref_folgas),
(NULL, 'Portas sanfonadas (ver desenho nesta apostila)', '-65', NULL, 'Variável', @ref_folgas),
(NULL, 'Vidro vidro', NULL, NULL, '3mm entre vidros', @ref_folgas);
