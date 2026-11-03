-- 0002_formulas.sql
-- Núcleo de fórmulas: sempre versionadas, com variáveis, validações e aprovações
-- explícitas antes de liberar produção (ver seções 12 e 13 do briefing técnico).

CREATE TABLE formulas (
  id                   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name                 VARCHAR(150) NOT NULL,
  typology_id          BIGINT UNSIGNED NULL,
  product_line_id      BIGINT UNSIGNED NULL,
  description          TEXT NULL,
  is_reference_only    TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'fórmula de referência, não universal (ex: Asa Flex)',
  current_version_id   BIGINT UNSIGNED NULL,
  status_code          VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
  source_reference_id  BIGINT UNSIGNED NULL,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_formulas_typology FOREIGN KEY (typology_id) REFERENCES typologies(id),
  CONSTRAINT fk_formulas_product_line FOREIGN KEY (product_line_id) REFERENCES product_lines(id),
  CONSTRAINT fk_formulas_status FOREIGN KEY (status_code) REFERENCES data_status(status_code),
  CONSTRAINT fk_formulas_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE formula_versions (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  formula_id          BIGINT UNSIGNED NOT NULL,
  version_number      INT NOT NULL,
  notes               TEXT NULL,
  rounding_mode       ENUM('NONE','ROUND','FLOOR','CEIL') NOT NULL DEFAULT 'ROUND',
  rounding_decimals   TINYINT NOT NULL DEFAULT 1,
  status_code         VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
  production_locked   TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'bloqueia cálculo produtivo até aprovação explícita (seção 13)',
  created_by          VARCHAR(120) NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_formula_versions_formula FOREIGN KEY (formula_id) REFERENCES formulas(id),
  CONSTRAINT fk_formula_versions_status FOREIGN KEY (status_code) REFERENCES data_status(status_code),
  UNIQUE KEY uk_formula_versions_formula_version (formula_id, version_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE formulas
  ADD CONSTRAINT fk_formulas_current_version FOREIGN KEY (current_version_id) REFERENCES formula_versions(id);

CREATE TABLE formula_components (
  id                   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  formula_version_id   BIGINT UNSIGNED NOT NULL,
  component_role       VARCHAR(60) NOT NULL COMMENT 'ex: MARCO, FOLHA_LARGURA, FOLHA_ALTURA, BAGUETE_LARGURA, BAGUETE_ALTURA, MAO_DE_AMIGO, FLEX, VIDRO, ARREMATE, PINGADEIRA',
  profile_id           BIGINT UNSIGNED NULL,
  quantity             INT NOT NULL,
  expression           VARCHAR(255) NULL COMMENT 'ex: (L + 9) / 2 — validada pelo interpretador seguro',
  cut_angle_deg        DECIMAL(5,2) NULL,
  notes                TEXT NULL,
  source_reference_id  BIGINT UNSIGNED NULL,
  CONSTRAINT fk_formula_components_version FOREIGN KEY (formula_version_id) REFERENCES formula_versions(id),
  CONSTRAINT fk_formula_components_profile FOREIGN KEY (profile_id) REFERENCES profiles(id),
  CONSTRAINT fk_formula_components_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id),
  KEY idx_formula_components_version (formula_version_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Variáveis globais (L, A, N, E, P) OU específicas de uma versão de fórmula.
CREATE TABLE formula_variables (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  formula_version_id  BIGINT UNSIGNED NULL,
  code                VARCHAR(10) NOT NULL,
  label               VARCHAR(100) NOT NULL,
  unit                VARCHAR(20) NULL,
  is_global           TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_formula_variables_version FOREIGN KEY (formula_version_id) REFERENCES formula_versions(id),
  UNIQUE KEY uk_formula_variables_scope_code (formula_version_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Descontos e folgas embutidos na fórmula (seção 11: obrigatórios para liberar produção).
-- Nunca inserir valor aqui sem citação de fonte; para Asa Flex, os deltas (+9, -38, -129, -130)
-- estão documentados apenas como parte da expressão, não como folga nomeada — por isso
-- ficam PENDENTE de decomposição/confirmação (ver docs/GOVERNANCA_DE_DADOS.md).
CREATE TABLE formula_deductions (
  id                   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  formula_version_id   BIGINT UNSIGNED NOT NULL,
  formula_component_id BIGINT UNSIGNED NULL,
  deduction_type       ENUM('DESCONTO','FOLGA') NOT NULL,
  value_mm             DECIMAL(8,2) NULL,
  description          VARCHAR(255) NULL,
  status_code          VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
  source_reference_id  BIGINT UNSIGNED NULL,
  CONSTRAINT fk_formula_deductions_version FOREIGN KEY (formula_version_id) REFERENCES formula_versions(id),
  CONSTRAINT fk_formula_deductions_component FOREIGN KEY (formula_component_id) REFERENCES formula_components(id),
  CONSTRAINT fk_formula_deductions_status FOREIGN KEY (status_code) REFERENCES data_status(status_code),
  CONSTRAINT fk_formula_deductions_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE formula_validations (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  formula_version_id  BIGINT UNSIGNED NOT NULL,
  validation_type     VARCHAR(60) NOT NULL COMMENT 'PROTOTIPO, CALCULO_PESO, REVISAO_TECNICA, LIMITE_DIMENSIONAL',
  result              ENUM('PENDENTE','APROVADO','REPROVADO') NOT NULL DEFAULT 'PENDENTE',
  validated_by        VARCHAR(120) NULL,
  validated_at        DATETIME NULL,
  notes               TEXT NULL,
  CONSTRAINT fk_formula_validations_version FOREIGN KEY (formula_version_id) REFERENCES formula_versions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE formula_approvals (
  id                     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  formula_version_id     BIGINT UNSIGNED NOT NULL,
  approved_by            VARCHAR(120) NOT NULL,
  role                   VARCHAR(80) NULL,
  approved_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  checklist_snapshot     JSON NULL COMMENT 'resultado do checklist da seção 13 no momento da aprovação',
  released_for_production TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_formula_approvals_version FOREIGN KEY (formula_version_id) REFERENCES formula_versions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE formula_sources (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  formula_id          BIGINT UNSIGNED NOT NULL,
  source_reference_id BIGINT UNSIGNED NOT NULL,
  CONSTRAINT fk_formula_sources_formula FOREIGN KEY (formula_id) REFERENCES formulas(id),
  CONSTRAINT fk_formula_sources_reference FOREIGN KEY (source_reference_id) REFERENCES source_references(id),
  UNIQUE KEY uk_formula_sources (formula_id, source_reference_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
