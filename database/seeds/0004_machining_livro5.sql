-- 0004_machining_livro5.sql
-- Ferramentas e operações de usinagem gerais descritas no Livro 5 de Serralheria
-- (itens 15, 21 e 22). São descrições gerais do processo, não cotas de um perfil
-- específico — por isso profile_id/typology_id ficam NULL e status CATALOGADO.

INSERT INTO source_references (technical_source_id, page_number, section_title, excerpt, extracted_by) VALUES
(1, 12, 'Conhecendo os Principais Equipamentos', 'Máquina de Corte (Serra de Disco/Policorte), Fresa de Topo ou Entestadeira, Fresa Copiadora ou Pantógrafo, Estampo, Curvadeira. Outros citados: Refiladeira, Furadeira Radial, Parafusadeiras, Arrebitadeiras.', 'manual-extraction');
SET @ref_equip = LAST_INSERT_ID();

INSERT INTO source_references (technical_source_id, page_number, section_title, excerpt, extracted_by) VALUES
(1, 17, 'Corte das Barras de Perfis / Usinagem', 'Tipos de usinagem: 1. Desabes e entalhes dos perfis; 2. Furação, furo guia e furo de fixação; 3. Rasgos de Conchas e Fechos. Usinagem tradicional sendo substituída por estampagem.', 'manual-extraction');
SET @ref_usinagem = LAST_INSERT_ID();

INSERT INTO machining_tools (name, tool_type, notes, source_reference_id) VALUES
('Máquina de Corte (Serra de Disco / Policorte)', 'CORTE', 'Corte processado por disco especial de vídea. Existem modelos automáticos de cabeça dupla com avanço frontal do disco.', @ref_equip),
('Fresa de Topo ou Entestadeira', 'USINAGEM', 'Usada para fazer entalhes ou desabes nos extremos dos perfis. Modelos mais sofisticados têm cabeça dupla (duas fresas trabalhando em diferentes graus).', @ref_equip),
('Fresa Copiadora ou Pantógrafo', 'USINAGEM', 'Também conhecida como "Topia". Usada para produzir furos oblongos ou alongados (rasgos de fecho e concha), copiando a usinagem de um gabarito no perfil.', @ref_equip),
('Estampo', 'USINAGEM', 'Ferramenta de usinagem manual ou pneumática. Os pneumáticos podem usinar mais de uma linha/sistema; encaixa o perfil em diferentes posições de operação através de punções.', @ref_equip),
('Curvadeira', 'CONFORMACAO', 'Usada para moldar perfis com configuração arredondada, via três carretéis dispostos em triângulo.', @ref_equip),
('Refiladeira', 'OUTRO', 'Citada como equipamento adicional comum, sem detalhamento no livro.', @ref_equip),
('Furadeira Radial', 'FURACAO', 'Citada como equipamento adicional comum, sem detalhamento no livro.', @ref_equip),
('Parafusadeira', 'MONTAGEM', 'Citada como equipamento adicional comum, sem detalhamento no livro.', @ref_equip),
('Arrebitadeira', 'MONTAGEM', 'Citada como equipamento adicional comum, sem detalhamento no livro.', @ref_equip);

INSERT INTO machining_operations (name, typology_id, profile_id, machining_tool_id, notes, origin_type, status_code, source_reference_id) VALUES
('DESABE_ENTALHE', NULL, NULL, (SELECT id FROM machining_tools WHERE name = 'Fresa de Topo ou Entestadeira'), 'Desabes e entalhes dos perfis (item 1 da usinagem geral, livro p.17). Cotas dependem do perfil/tipologia específicos, ainda não cadastradas.', 'ENCONTRADO_DOCUMENTO', 'CATALOGADO', @ref_usinagem),
('FURACAO', NULL, NULL, (SELECT id FROM machining_tools WHERE name = 'Furadeira Radial'), 'Furação, furo guia e furo de fixação (item 2 da usinagem geral, livro p.17).', 'ENCONTRADO_DOCUMENTO', 'CATALOGADO', @ref_usinagem),
('RASGO_CONCHA', NULL, NULL, (SELECT id FROM machining_tools WHERE name = 'Fresa Copiadora ou Pantógrafo'), 'Rasgo de concha (item 3 da usinagem geral, livro p.17): feito no equipamento Pantógrafo.', 'ENCONTRADO_DOCUMENTO', 'CATALOGADO', @ref_usinagem),
('RASGO_FECHO', NULL, NULL, (SELECT id FROM machining_tools WHERE name = 'Fresa Copiadora ou Pantógrafo'), 'Rasgo de fecho (item 3 da usinagem geral, livro p.17): feito no equipamento Pantógrafo; estampos pneumáticos mais sofisticados também podem estampar esses rasgos.', 'ENCONTRADO_DOCUMENTO', 'CATALOGADO', @ref_usinagem),
('CORTE', NULL, NULL, (SELECT id FROM machining_tools WHERE name = 'Máquina de Corte (Serra de Disco / Policorte)'), 'Corte das barras de perfil — usinagem principal (livro p.17). Ângulo de 45° para Sistema Flex ou 90° para corte reto.', 'ENCONTRADO_DOCUMENTO', 'CATALOGADO', @ref_usinagem);
