-- 0005_asaflex_formula.sql
-- Fórmula de referência Asa Flex (Livro 5 de Serralheria, itens 19-20, p.15-16):
-- Janela de Correr Duas Folhas Simples, montagem a 45°, com baguete, vidro até 6mm.
--
-- Esta fórmula é cadastrada como REFERÊNCIA, não universal (seção 7 do briefing).
-- Ela NUNCA deve alcançar o status LIBERADO_PRODUCAO nesta base sem que um humano
-- complete o checklist da seção 13 (protótipo aprovado, folgas/descontos nomeados
-- e confirmados, responsável técnico etc.) — ver docs/GOVERNANCA_DE_DADOS.md.

INSERT INTO source_references (technical_source_id, page_number, section_title, excerpt, extracted_by) VALUES
(1, 16, 'Esquema de Montagem - Janela de Correr Duas Folhas', 'Tabela ELEMENTO/POSIÇÃO/PERFIL/MEDIDA/QUANT.: Pingadeira AF-023 L (01); Marco Largura AF-020 L (02); Marco Altura AF-020 A (02); Folha Largura AF-026 (L+9)/2 (04); Folha Altura AF-026 A-38 (04); Baguete Largura 88-102 (L-129)/2 (04); Baguete Altura 88-102 A-130 (04); Mão Amigo AF-030 A-38 (02); Flex Travamento CF-050 (08); Vidro Até 6mm L=Largura A=Altura (02); Arremate (sem perfil/medida definidos).', 'manual-extraction');
SET @ref_asaflex_tabela = LAST_INSERT_ID();

INSERT INTO source_references (technical_source_id, page_number, section_title, excerpt, extracted_by) VALUES
(1, 15, 'Principais Componentes de Uma Esquadria', 'Legenda dos componentes: 1-Trilho Inferior, 2-Trilho Superior, 3-Lateral, 4-Montante Folha, 5-Base da Folha, 7-Mão-de-Amigo, 8-Pingadeira, 9-Conexão Flex, 10-Flex Lock, 11-Baguete, 12-Contramarco, 13-Arremate. Perfil CF-050 mostrado no detalhe de furação/aplicação do Flex, parafuso inox atarrachante 4,8mm x 12,00mm.', 'manual-extraction');
SET @ref_asaflex_componentes = LAST_INSERT_ID();

-- Perfis citados na fórmula Asa Flex
INSERT INTO profiles (manufacturer_id, product_line_id, code, name, category, origin_type, status_code, source_reference_id) VALUES
(4, 4, 'AF-020', 'Marco (largura e altura)', 'MARCO', 'ENCONTRADO_DOCUMENTO', 'CATALOGADO', @ref_asaflex_tabela),
(4, 4, 'AF-023', 'Pingadeira', 'PINGADEIRA', 'ENCONTRADO_DOCUMENTO', 'CATALOGADO', @ref_asaflex_tabela),
(4, 4, 'AF-026', 'Folha (largura e altura)', 'FOLHA', 'ENCONTRADO_DOCUMENTO', 'CATALOGADO', @ref_asaflex_tabela),
(4, 4, 'AF-030', 'Mão de Amigo', 'MAO_DE_AMIGO', 'ENCONTRADO_DOCUMENTO', 'CATALOGADO', @ref_asaflex_tabela),
(4, 4, 'CF-050', 'Flex (travamento/conexão parafusada)', 'FLEX', 'ENCONTRADO_DOCUMENTO', 'CATALOGADO', @ref_asaflex_componentes),
(4, 4, '88-102', 'Baguete (largura e altura), vidro até 6mm', 'BAGUETE', 'ENCONTRADO_DOCUMENTO', 'CATALOGADO', @ref_asaflex_tabela);

SET @profile_af020 = (SELECT id FROM profiles WHERE manufacturer_id = 4 AND code = 'AF-020');
SET @profile_af023 = (SELECT id FROM profiles WHERE manufacturer_id = 4 AND code = 'AF-023');
SET @profile_af026 = (SELECT id FROM profiles WHERE manufacturer_id = 4 AND code = 'AF-026');
SET @profile_af030 = (SELECT id FROM profiles WHERE manufacturer_id = 4 AND code = 'AF-030');
SET @profile_cf050 = (SELECT id FROM profiles WHERE manufacturer_id = 4 AND code = 'CF-050');
SET @profile_88102 = (SELECT id FROM profiles WHERE manufacturer_id = 4 AND code = '88-102');

-- Vidro como glass_type (limite documentado: até 6mm; largura/altura seguem L/A do vão, sem folga confirmada)
INSERT INTO glass_types (name, thickness_mm, glass_category, notes, origin_type, status_code, source_reference_id) VALUES
('Vidro até 6mm (Asa Flex)', 6.00, 'SIMPLES', 'Espessura máxima documentada para a fórmula Asa Flex 2 folhas. Cálculo de largura/altura do vidro fica PENDENTE até confirmação da folga de encaixe (seção 7 do briefing: "necessita validação de protótipo").', 'ENCONTRADO_DOCUMENTO', 'PENDENTE', @ref_asaflex_tabela);
SET @glass_asaflex = LAST_INSERT_ID();

-- Fórmula (referência, não universal)
INSERT INTO formulas (name, typology_id, product_line_id, description, is_reference_only, status_code, source_reference_id) VALUES
('Asa Flex - Janela de Correr 2 Folhas com Baguete', 1, 4,
 'Fórmula de referência do Sistema Asa Flex para janela de correr de duas folhas, montagem a 45°, com baguete, vidro até 6mm. Cadastrada como referência técnica, NÃO como fórmula universal aplicável a outras linhas/fabricantes (seção 7 do briefing).',
 1, 'REFERENCIA', @ref_asaflex_tabela);
SET @formula_asaflex = LAST_INSERT_ID();

INSERT INTO formula_versions (formula_id, version_number, notes, rounding_mode, rounding_decimals, status_code, production_locked, created_by) VALUES
(@formula_asaflex, 1, 'Versão inicial, transcrita literalmente da tabela "Esquema de Montagem" do Livro 5, p.16. Necessita validação de protótipo antes de qualquer uso produtivo (regra explícita da fonte).', 'ROUND', 1, 'PENDENTE', 1, 'importacao-inicial');
SET @formula_version_asaflex = LAST_INSERT_ID();

UPDATE formulas SET current_version_id = @formula_version_asaflex WHERE id = @formula_asaflex;

INSERT INTO formula_sources (formula_id, source_reference_id) VALUES
(@formula_asaflex, @ref_asaflex_tabela),
(@formula_asaflex, @ref_asaflex_componentes);

-- Variáveis globais do interpretador (seção 12 do briefing)
INSERT INTO formula_variables (formula_version_id, code, label, unit, is_global) VALUES
(NULL, 'L', 'Largura do vão', 'mm', 1),
(NULL, 'A', 'Altura do vão', 'mm', 1),
(NULL, 'N', 'Quantidade de folhas', 'un', 1),
(NULL, 'E', 'Espessura do vidro', 'mm', 1),
(NULL, 'P', 'Peso da folha', 'kg', 1);

-- Componentes da fórmula (expressões literais da tabela da p.16)
INSERT INTO formula_components (formula_version_id, component_role, profile_id, quantity, expression, cut_angle_deg, notes, source_reference_id) VALUES
(@formula_version_asaflex, 'PINGADEIRA', @profile_af023, 1, 'L', NULL, 'Medida = L (largura do vão).', @ref_asaflex_tabela),
(@formula_version_asaflex, 'MARCO_LARGURA', @profile_af020, 2, 'L', NULL, NULL, @ref_asaflex_tabela),
(@formula_version_asaflex, 'MARCO_ALTURA', @profile_af020, 2, 'A', NULL, NULL, @ref_asaflex_tabela),
(@formula_version_asaflex, 'FOLHA_LARGURA', @profile_af026, 4, '(L + 9) / 2', 45.00, NULL, @ref_asaflex_tabela),
(@formula_version_asaflex, 'FOLHA_ALTURA', @profile_af026, 4, 'A - 38', 45.00, NULL, @ref_asaflex_tabela),
(@formula_version_asaflex, 'BAGUETE_LARGURA', @profile_88102, 4, '(L - 129) / 2', 45.00, NULL, @ref_asaflex_tabela),
(@formula_version_asaflex, 'BAGUETE_ALTURA', @profile_88102, 4, 'A - 130', 45.00, NULL, @ref_asaflex_tabela),
(@formula_version_asaflex, 'MAO_DE_AMIGO', @profile_af030, 2, 'A - 38', NULL, NULL, @ref_asaflex_tabela),
(@formula_version_asaflex, 'FLEX', @profile_cf050, 8, NULL, NULL, 'Travamento/conexão parafusada; sem expressão de comprimento (peça de conexão, não de corte por medida do vão).', @ref_asaflex_tabela),
(@formula_version_asaflex, 'ARREMATE', NULL, 0, NULL, NULL, 'Linha "Arremate" presente na tabela original sem perfil nem medida definidos — PENDENTE de confirmação com o fabricante.', @ref_asaflex_tabela);

-- Vidro não é um formula_component (não tem "perfil"); é registrado como referência
-- de glass_type associada à fórmula via nota, pois o schema de formula_components
-- assume corte de perfil. O glass_type @glass_asaflex já carrega o vínculo textual.

-- Descontos/folgas embutidos nas expressões (+9, -38, -129, -130): o livro não nomeia
-- estes deltas como "folga" ou "desconto" — são apenas constantes na fórmula. Ficam
-- registrados aqui como PENDENTE de decomposição/confirmação técnica, conforme a
-- regra "não invente descontos/folgas" (briefing, seção 3 introdutória).
INSERT INTO formula_deductions (formula_version_id, formula_component_id, deduction_type, value_mm, description, status_code, source_reference_id) VALUES
(@formula_version_asaflex, (SELECT id FROM formula_components WHERE formula_version_id = @formula_version_asaflex AND component_role = 'FOLHA_LARGURA'), 'FOLGA', 9.00, 'Constante "+9" na expressão (L+9)/2 da largura da folha — significado técnico exato (folga de sobreposição entre folhas?) não nomeado explicitamente na fonte.', 'NECESSITA_CONFERENCIA', @ref_asaflex_tabela),
(@formula_version_asaflex, (SELECT id FROM formula_components WHERE formula_version_id = @formula_version_asaflex AND component_role = 'FOLHA_ALTURA'), 'DESCONTO', -38.00, 'Constante "-38" na expressão A-38 da altura da folha — significado técnico exato não nomeado explicitamente na fonte.', 'NECESSITA_CONFERENCIA', @ref_asaflex_tabela),
(@formula_version_asaflex, (SELECT id FROM formula_components WHERE formula_version_id = @formula_version_asaflex AND component_role = 'BAGUETE_LARGURA'), 'DESCONTO', -129.00, 'Constante "-129" na expressão (L-129)/2 da largura do baguete — significado técnico exato não nomeado explicitamente na fonte.', 'NECESSITA_CONFERENCIA', @ref_asaflex_tabela),
(@formula_version_asaflex, (SELECT id FROM formula_components WHERE formula_version_id = @formula_version_asaflex AND component_role = 'BAGUETE_ALTURA'), 'DESCONTO', -130.00, 'Constante "-130" na expressão A-130 da altura do baguete — significado técnico exato não nomeado explicitamente na fonte.', 'NECESSITA_CONFERENCIA', @ref_asaflex_tabela);

-- Validação obrigatória de protótipo, explicitamente exigida pela fonte (seção 7)
INSERT INTO formula_validations (formula_version_id, validation_type, result, notes) VALUES
(@formula_version_asaflex, 'PROTOTIPO', 'PENDENTE', 'Fonte exige "validação de protótipo" antes de uso produtivo (briefing, seção 7). Nenhum protótipo foi montado ainda nesta base.'),
(@formula_version_asaflex, 'REVISAO_TECNICA', 'PENDENTE', 'Decomposição/nomeação das constantes em formula_deductions (+9, -38, -129, -130) ainda não confirmada por responsável técnico.');

-- Nenhuma linha em formula_approvals: a fórmula NÃO foi aprovada nem liberada para
-- produção. formula_versions.production_locked permanece 1 (bloqueada).
