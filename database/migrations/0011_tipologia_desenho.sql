-- 0011_tipologia_desenho.sql
-- Desenho esquemático da tipologia (marco/folha/sentido de abertura), desenhado
-- pelo próprio usuário no editor do sistema -- guardado como dado estruturado
-- (lista de formas: retângulo/linha/seta/texto), não como imagem, pra poder
-- reabrir e editar depois. Não é dado extraído de catálogo, por isso não passa
-- por source_reference_id/status_code de governança técnica.

ALTER TABLE typologies
  ADD COLUMN drawing_data JSON NULL COMMENT 'lista de formas do editor de desenho (retângulo/linha/seta/texto)';
