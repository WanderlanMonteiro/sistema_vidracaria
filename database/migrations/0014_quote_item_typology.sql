-- 0014_quote_item_typology.sql
-- Vínculo direto item-de-orçamento -> tipologia, independente de fórmula.
-- Necessário porque nem toda tipologia tem fórmula de corte cadastrada (ex:
-- as tipologias de vidro temperado sem marco de alumínio, criadas a partir da
-- apostila -- Box, Spider, Vitrine etc. -- não decompõem em perfil, só vidro +
-- acessórios avulsos). Guardar o typology_id permite mostrar o desenho técnico
-- e o nome da tipologia no item mesmo quando não há fórmula por trás.

ALTER TABLE quote_items
  ADD COLUMN typology_id BIGINT UNSIGNED NULL,
  ADD CONSTRAINT fk_quote_items_typology FOREIGN KEY (typology_id) REFERENCES typologies(id);
