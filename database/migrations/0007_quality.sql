-- 0007_quality.sql
-- Núcleo de qualidade: protótipos, validações, inspeções, não conformidades,
-- ações corretivas, aprovações técnicas e auditoria.

CREATE TABLE prototypes (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  formula_version_id  BIGINT UNSIGNED NOT NULL,
  built_by            VARCHAR(120) NULL,
  built_at            DATETIME NULL,
  status              ENUM('EM_CONSTRUCAO','MONTADO','APROVADO','REPROVADO') NOT NULL DEFAULT 'EM_CONSTRUCAO',
  notes               TEXT NULL,
  CONSTRAINT fk_prototypes_version FOREIGN KEY (formula_version_id) REFERENCES formula_versions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE prototype_components (
  id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  prototype_id          BIGINT UNSIGNED NOT NULL,
  formula_component_id  BIGINT UNSIGNED NOT NULL,
  measured_length_mm    DECIMAL(10,2) NULL,
  notes                 TEXT NULL,
  CONSTRAINT fk_prototype_components_prototype FOREIGN KEY (prototype_id) REFERENCES prototypes(id),
  CONSTRAINT fk_prototype_components_formula_component FOREIGN KEY (formula_component_id) REFERENCES formula_components(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE prototype_measurements (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  prototype_id      BIGINT UNSIGNED NOT NULL,
  measurement_name  VARCHAR(120) NOT NULL,
  expected_value    DECIMAL(12,3) NULL,
  measured_value    DECIMAL(12,3) NULL,
  deviation         DECIMAL(12,3) NULL,
  within_tolerance  TINYINT(1) NULL,
  CONSTRAINT fk_prototype_measurements_prototype FOREIGN KEY (prototype_id) REFERENCES prototypes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE validation_records (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  subject_type  VARCHAR(40) NOT NULL,
  subject_id    BIGINT UNSIGNED NOT NULL,
  validated_by  VARCHAR(120) NULL,
  validated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  result        ENUM('APROVADO','REPROVADO','NECESSITA_CONFERENCIA') NOT NULL DEFAULT 'NECESSITA_CONFERENCIA',
  notes         TEXT NULL,
  KEY idx_validation_records_subject (subject_type, subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE inspection_checklists (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  applies_to  VARCHAR(40) NOT NULL COMMENT 'PRODUCTION_ORDER_ITEM, PROTOTYPE, RECEBIMENTO_PERFIL',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE inspection_results (
  id                        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  inspection_checklist_id   BIGINT UNSIGNED NOT NULL,
  production_order_item_id BIGINT UNSIGNED NULL,
  prototype_id               BIGINT UNSIGNED NULL,
  item_label                 VARCHAR(200) NOT NULL,
  result                     ENUM('OK','NAO_CONFORME','NA') NOT NULL DEFAULT 'NA',
  notes                      TEXT NULL,
  inspected_by               VARCHAR(120) NULL,
  inspected_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_inspection_results_checklist FOREIGN KEY (inspection_checklist_id) REFERENCES inspection_checklists(id),
  CONSTRAINT fk_inspection_results_item FOREIGN KEY (production_order_item_id) REFERENCES production_order_items(id),
  CONSTRAINT fk_inspection_results_prototype FOREIGN KEY (prototype_id) REFERENCES prototypes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE nonconformities (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  source_type  VARCHAR(40) NOT NULL,
  source_id    BIGINT UNSIGNED NOT NULL,
  description  TEXT NOT NULL,
  severity     ENUM('BAIXA','MEDIA','ALTA','CRITICA') NOT NULL DEFAULT 'MEDIA',
  status       ENUM('ABERTA','EM_TRATAMENTO','ENCERRADA') NOT NULL DEFAULT 'ABERTA',
  opened_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  opened_by    VARCHAR(120) NULL,
  KEY idx_nonconformities_source (source_type, source_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE corrective_actions (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nonconformity_id    BIGINT UNSIGNED NOT NULL,
  action_description  TEXT NOT NULL,
  responsible         VARCHAR(120) NULL,
  due_date            DATE NULL,
  status               ENUM('ABERTA','EM_ANDAMENTO','CONCLUIDA') NOT NULL DEFAULT 'ABERTA',
  closed_at            DATETIME NULL,
  CONSTRAINT fk_corrective_actions_nonconformity FOREIGN KEY (nonconformity_id) REFERENCES nonconformities(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE technical_approvals (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  subject_type  VARCHAR(40) NOT NULL,
  subject_id    BIGINT UNSIGNED NOT NULL,
  approved_by   VARCHAR(120) NOT NULL,
  role          VARCHAR(80) NULL,
  approved_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes         TEXT NULL,
  KEY idx_technical_approvals_subject (subject_type, subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_logs (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_type  VARCHAR(60) NOT NULL,
  entity_id    BIGINT UNSIGNED NOT NULL,
  action       VARCHAR(20) NOT NULL COMMENT 'INSERT, UPDATE, DELETE, STATUS_CHANGE',
  old_value    JSON NULL,
  new_value    JSON NULL,
  changed_by   VARCHAR(120) NULL,
  changed_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_logs_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de apoio para os desenhos técnicos extraídos dos catálogos (ex: Gold III).
CREATE TABLE technical_drawings (
  id                   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  subject_type         VARCHAR(40) NOT NULL COMMENT 'PROFILE, ACCESSORY, TYPOLOGY',
  subject_id           BIGINT UNSIGNED NOT NULL,
  file_path            VARCHAR(500) NOT NULL,
  caption              VARCHAR(255) NULL,
  source_reference_id  BIGINT UNSIGNED NULL,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_technical_drawings_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id),
  KEY idx_technical_drawings_subject (subject_type, subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
