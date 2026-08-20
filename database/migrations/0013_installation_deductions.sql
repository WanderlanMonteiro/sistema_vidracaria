-- 0013_installation_deductions.sql
-- Tabela de folgas/descontos de instalação (largura/altura da folha em relação
-- ao vão) por tipo de instalação, conforme "Apostila Técnica para Vidros
-- Temperados" (p.32). Cada medidor/fabricante tem sua própria folga -- não
-- existe folga padrão (a própria apostila afirma isso) -- por isso os valores
-- ficam em VARCHAR (aceitam "+transpasse", "Variável" etc., não só números) e
-- servem como referência a conferir, não como regra travada de produção.

CREATE TABLE installation_deductions (
  id                   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  typology_id          BIGINT UNSIGNED NULL COMMENT 'só preenchido quando o tipo de instalação bate sem ambiguidade com uma tipologia cadastrada',
  installation_type    VARCHAR(160) NOT NULL,
  moving_height_mm     VARCHAR(20) NULL COMMENT 'desconto de altura da folha móvel em relação ao vão',
  fixed_height_mm      VARCHAR(20) NULL COMMENT 'desconto de altura da folha fixa em relação ao vão',
  total_width_mm       VARCHAR(20) NULL COMMENT 'desconto de largura total em relação ao vão',
  notes                TEXT NULL,
  status_code          VARCHAR(30) NOT NULL DEFAULT 'EXTRAIDO',
  source_reference_id  BIGINT UNSIGNED NULL,
  CONSTRAINT fk_installation_deductions_typology FOREIGN KEY (typology_id) REFERENCES typologies(id),
  CONSTRAINT fk_installation_deductions_status FOREIGN KEY (status_code) REFERENCES data_status(status_code),
  CONSTRAINT fk_installation_deductions_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id),
  KEY idx_installation_deductions_typology (typology_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
