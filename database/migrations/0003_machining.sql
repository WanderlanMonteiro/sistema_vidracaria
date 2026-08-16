-- 0003_machining.sql
-- Núcleo de usinagem: operações, ferramentas, posições, estampagem e aprovações.

CREATE TABLE machining_tools (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL COMMENT 'ex: Máquina de Corte (Serra de Disco), Fresa de Topo/Entestadeira, Fresa Copiadora/Pantógrafo, Estampo, Curvadeira',
  tool_type   VARCHAR(60) NULL,
  notes       TEXT NULL,
  source_reference_id BIGINT UNSIGNED NULL,
  CONSTRAINT fk_machining_tools_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE machining_operations (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name                VARCHAR(80) NOT NULL COMMENT 'DESABE_ENTALHE, FURACAO, FURO_GUIA, FURO_FIXACAO, RASGO_CONCHA, RASGO_FECHO, CORTE',
  typology_id         BIGINT UNSIGNED NULL,
  profile_id          BIGINT UNSIGNED NULL,
  machining_tool_id   BIGINT UNSIGNED NULL,
  dimension_a_mm      DECIMAL(8,2) NULL,
  dimension_b_mm      DECIMAL(8,2) NULL,
  hole_diameter_mm    DECIMAL(6,2) NULL,
  notes               TEXT NULL,
  origin_type         ENUM('ENCONTRADO_DOCUMENTO','EXTRAIDO_DESENHO','INTERPRETADO','DERIVADO_CALCULO','NAO_INFORMADO') NOT NULL DEFAULT 'NAO_INFORMADO',
  status_code         VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
  source_reference_id BIGINT UNSIGNED NULL,
  CONSTRAINT fk_machining_operations_typology FOREIGN KEY (typology_id) REFERENCES typologies(id),
  CONSTRAINT fk_machining_operations_profile FOREIGN KEY (profile_id) REFERENCES profiles(id),
  CONSTRAINT fk_machining_operations_tool FOREIGN KEY (machining_tool_id) REFERENCES machining_tools(id),
  CONSTRAINT fk_machining_operations_status FOREIGN KEY (status_code) REFERENCES data_status(status_code),
  CONSTRAINT fk_machining_operations_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE machining_positions (
  id                     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  machining_operation_id BIGINT UNSIGNED NOT NULL,
  position_label         VARCHAR(80) NOT NULL,
  offset_mm              DECIMAL(8,2) NULL,
  notes                  TEXT NULL,
  CONSTRAINT fk_machining_positions_operation FOREIGN KEY (machining_operation_id) REFERENCES machining_operations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stamping_tools (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(150) NOT NULL,
  applicable_lines  TEXT NULL,
  notes             TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stamping_operations (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_line_id     BIGINT UNSIGNED NULL,
  stamping_tool_id    BIGINT UNSIGNED NULL,
  description         VARCHAR(255) NOT NULL,
  status_code         VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
  source_reference_id BIGINT UNSIGNED NULL,
  CONSTRAINT fk_stamping_operations_line FOREIGN KEY (product_line_id) REFERENCES product_lines(id),
  CONSTRAINT fk_stamping_operations_tool FOREIGN KEY (stamping_tool_id) REFERENCES stamping_tools(id),
  CONSTRAINT fk_stamping_operations_status FOREIGN KEY (status_code) REFERENCES data_status(status_code),
  CONSTRAINT fk_stamping_operations_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE machining_approvals (
  id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  machining_operation_id  BIGINT UNSIGNED NOT NULL,
  approved_by             VARCHAR(120) NOT NULL,
  approved_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes                   TEXT NULL,
  CONSTRAINT fk_machining_approvals_operation FOREIGN KEY (machining_operation_id) REFERENCES machining_operations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
