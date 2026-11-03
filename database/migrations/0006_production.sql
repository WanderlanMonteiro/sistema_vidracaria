-- 0006_production.sql
-- Núcleo de produção: ordens, listas de corte, listas de vidro/acessórios,
-- planos de otimização, etapas e histórico de status.

CREATE TABLE production_orders (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sales_order_id BIGINT UNSIGNED NOT NULL,
  status         ENUM('PLANEJADA','EM_ANDAMENTO','CONCLUIDA','BLOQUEADA','CANCELADA') NOT NULL DEFAULT 'PLANEJADA',
  priority       TINYINT NOT NULL DEFAULT 3,
  planned_start  DATE NULL,
  planned_end    DATE NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_production_orders_sales_order FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE production_order_items (
  id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  production_order_id   BIGINT UNSIGNED NOT NULL,
  opening_id            BIGINT UNSIGNED NULL,
  formula_version_id    BIGINT UNSIGNED NOT NULL,
  quantity              INT NOT NULL DEFAULT 1,
  status_code           VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
  CONSTRAINT fk_production_order_items_order FOREIGN KEY (production_order_id) REFERENCES production_orders(id),
  CONSTRAINT fk_production_order_items_opening FOREIGN KEY (opening_id) REFERENCES openings(id),
  CONSTRAINT fk_production_order_items_formula_version FOREIGN KEY (formula_version_id) REFERENCES formula_versions(id),
  CONSTRAINT fk_production_order_items_status FOREIGN KEY (status_code) REFERENCES data_status(status_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cut_lists (
  id                        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  production_order_item_id BIGINT UNSIGNED NOT NULL,
  generated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  generated_by              VARCHAR(120) NULL,
  CONSTRAINT fk_cut_lists_item FOREIGN KEY (production_order_item_id) REFERENCES production_order_items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cut_list_items (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cut_list_id   BIGINT UNSIGNED NOT NULL,
  profile_id    BIGINT UNSIGNED NOT NULL,
  length_mm     DECIMAL(10,2) NOT NULL,
  quantity      INT NOT NULL,
  bar_sequence  INT NULL,
  angle_deg     DECIMAL(5,2) NULL,
  CONSTRAINT fk_cut_list_items_list FOREIGN KEY (cut_list_id) REFERENCES cut_lists(id),
  CONSTRAINT fk_cut_list_items_profile FOREIGN KEY (profile_id) REFERENCES profiles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE glass_lists (
  id                        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  production_order_item_id BIGINT UNSIGNED NOT NULL,
  glass_type_id             BIGINT UNSIGNED NOT NULL,
  width_mm                  DECIMAL(10,2) NOT NULL,
  height_mm                 DECIMAL(10,2) NOT NULL,
  quantity                  INT NOT NULL,
  CONSTRAINT fk_glass_lists_item FOREIGN KEY (production_order_item_id) REFERENCES production_order_items(id),
  CONSTRAINT fk_glass_lists_glass_type FOREIGN KEY (glass_type_id) REFERENCES glass_types(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE accessory_lists (
  id                        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  production_order_item_id BIGINT UNSIGNED NOT NULL,
  accessory_id               BIGINT UNSIGNED NOT NULL,
  quantity                   INT NOT NULL,
  CONSTRAINT fk_accessory_lists_item FOREIGN KEY (production_order_item_id) REFERENCES production_order_items(id),
  CONSTRAINT fk_accessory_lists_accessory FOREIGN KEY (accessory_id) REFERENCES accessories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE optimization_plans (
  id                   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  production_order_id  BIGINT UNSIGNED NOT NULL,
  algorithm            VARCHAR(40) NOT NULL DEFAULT 'FIRST_FIT_DECREASING',
  generated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  waste_percentage     DECIMAL(5,2) NULL,
  CONSTRAINT fk_optimization_plans_order FOREIGN KEY (production_order_id) REFERENCES production_orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE optimization_items (
  id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  optimization_plan_id  BIGINT UNSIGNED NOT NULL,
  profile_id            BIGINT UNSIGNED NOT NULL,
  bar_length_mm         DECIMAL(10,2) NOT NULL DEFAULT 6000,
  cuts_json             JSON NULL,
  leftover_mm           DECIMAL(10,2) NULL,
  CONSTRAINT fk_optimization_items_plan FOREIGN KEY (optimization_plan_id) REFERENCES optimization_plans(id),
  CONSTRAINT fk_optimization_items_profile FOREIGN KEY (profile_id) REFERENCES profiles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE production_steps (
  id                        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  production_order_item_id BIGINT UNSIGNED NOT NULL,
  step_name                  VARCHAR(60) NOT NULL COMMENT 'CORTE, USINAGEM, MONTAGEM, ACESSORIOS, INSPECAO, EXPEDICAO',
  sequence                   INT NOT NULL,
  status                     ENUM('PENDENTE','EM_ANDAMENTO','CONCLUIDO','BLOQUEADO') NOT NULL DEFAULT 'PENDENTE',
  CONSTRAINT fk_production_steps_item FOREIGN KEY (production_order_item_id) REFERENCES production_order_items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE production_status_history (
  id                        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  production_order_item_id BIGINT UNSIGNED NOT NULL,
  from_status                VARCHAR(30) NULL,
  to_status                  VARCHAR(30) NOT NULL,
  changed_by                 VARCHAR(120) NULL,
  changed_at                 DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes                      TEXT NULL,
  CONSTRAINT fk_production_status_history_item FOREIGN KEY (production_order_item_id) REFERENCES production_order_items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
