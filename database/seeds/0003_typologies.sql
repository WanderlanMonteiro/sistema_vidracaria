-- 0003_typologies.sql
-- Tipologias do Livro 5 de Serralheria (item 16, página 13).
-- has_baguete não é fixado por tipologia: o próprio livro (item 17, p.13) trata
-- "com baguete" / "sem baguete" como uma variação de construção, não uma propriedade
-- fixa do tipo de esquadria (ex: Correr aparece "Com Baguete" e "Sem Baguete" no
-- catálogo Ecoline 2.5, p.60-65). Por isso fica NULL aqui.

INSERT INTO source_references (technical_source_id, page_number, section_title, excerpt, extracted_by) VALUES
(1, 13, 'Principais Tipos de Esquadrias - Tipologias', 'Tabela "TIPOLOGIAS MAIS CONHECIDAS NO MERCADO BRASILEIRO": Deslizante ou Correr, Abrir ou Giro, Maxim-Ar, Oscilobatente*, Pivotante*, Ribanta*, Camarão*, Guilhotina*, Basculante. (*) Tipologias que não são aplicadas usualmente na arquitetura brasileira; derivam de modelos europeus.', 'manual-extraction');
SET @ref_tipologias = LAST_INSERT_ID();

INSERT INTO typologies (name, category, has_baguete, is_common_in_brazil, notes, source_reference_id) VALUES
('Deslizante ou Correr', 'CORRER', NULL, 1, 'Tipologia mais comum no mercado brasileiro.', @ref_tipologias),
('Abrir ou Giro', 'GIRO', NULL, 1, NULL, @ref_tipologias),
('Maxim-Ar', 'MAXIM_AR', NULL, 1, NULL, @ref_tipologias),
('Oscilobatente', 'OSCILOBATENTE', NULL, 0, 'Derivada de modelo europeu; incomum na arquitetura brasileira (livro, p.13).', @ref_tipologias),
('Pivotante', 'PIVOTANTE', NULL, 0, 'Derivada de modelo europeu; incomum na arquitetura brasileira (livro, p.13).', @ref_tipologias),
('Ribanta', 'RIBANTA', NULL, 0, 'Derivada de modelo europeu; incomum na arquitetura brasileira (livro, p.13).', @ref_tipologias),
('Camarão', 'CAMARAO', NULL, 0, 'Derivada de modelo europeu; incomum na arquitetura brasileira (livro, p.13).', @ref_tipologias),
('Guilhotina', 'GUILHOTINA', NULL, 0, 'Derivada de modelo europeu; incomum na arquitetura brasileira (livro, p.13).', @ref_tipologias),
('Basculante', 'BASCULANTE', NULL, 1, NULL, @ref_tipologias);
