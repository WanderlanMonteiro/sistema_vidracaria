-- 0010_orcamento_medidas_acessorios.sql
-- Suporte a preço por m², vão fora de esquadro (maior largura x maior altura,
-- pedido explícito do usuário) e lista avulsa de acessórios por orçamento
-- (sem inventar vínculo fórmula/tipologia -> ferragens, que não existe ainda).

ALTER TABLE quote_items
  ADD COLUMN width_mm    DECIMAL(10,2) NULL COMMENT 'largura 1 medida no vão',
  ADD COLUMN width_mm_2  DECIMAL(10,2) NULL COMMENT 'largura 2 (vão fora de esquadro) -- usa-se a maior das duas',
  ADD COLUMN height_mm   DECIMAL(10,2) NULL COMMENT 'altura 1 medida no vão',
  ADD COLUMN height_mm_2 DECIMAL(10,2) NULL COMMENT 'altura 2 (vão fora de esquadro) -- usa-se a maior das duas',
  ADD COLUMN glass_type_id BIGINT UNSIGNED NULL,
  ADD COLUMN pricing_unit ENUM('UN','M2') NOT NULL DEFAULT 'UN' COMMENT 'UN: unit_price é valor fechado do item. M2: unit_price é R$/m², total = qty x area_m2 x unit_price',
  ADD CONSTRAINT fk_quote_items_glass_type FOREIGN KEY (glass_type_id) REFERENCES glass_types(id);

CREATE TABLE quote_accessories (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quote_id      BIGINT UNSIGNED NOT NULL,
  accessory_id  BIGINT UNSIGNED NULL,
  description   VARCHAR(255) NOT NULL,
  quantity      DECIMAL(10,2) NOT NULL DEFAULT 1,
  CONSTRAINT fk_quote_accessories_quote FOREIGN KEY (quote_id) REFERENCES quotes(id),
  CONSTRAINT fk_quote_accessories_accessory FOREIGN KEY (accessory_id) REFERENCES accessories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
