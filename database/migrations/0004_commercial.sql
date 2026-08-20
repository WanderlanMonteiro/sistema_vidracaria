-- 0004_commercial.sql
-- Núcleo comercial: clientes, fornecedores, vendedores, tabelas de preço,
-- projetos, ambientes, vãos, orçamentos e pedidos de venda.

CREATE TABLE customers (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(180) NOT NULL,
  document_number VARCHAR(20) NULL,
  phone           VARCHAR(30) NULL,
  email           VARCHAR(150) NULL,
  address         VARCHAR(255) NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE suppliers (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(180) NOT NULL,
  document_number VARCHAR(20) NULL,
  phone           VARCHAR(30) NULL,
  email           VARCHAR(150) NULL,
  address         VARCHAR(255) NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sellers (
  id      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name    VARCHAR(150) NOT NULL,
  email   VARCHAR(150) NULL,
  phone   VARCHAR(30) NULL,
  active  TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE price_tables (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(150) NOT NULL,
  product_line_id  BIGINT UNSIGNED NULL,
  valid_from       DATE NULL,
  valid_to         DATE NULL,
  status           ENUM('RASCUNHO','ATIVA','ENCERRADA') NOT NULL DEFAULT 'RASCUNHO',
  CONSTRAINT fk_price_tables_line FOREIGN KEY (product_line_id) REFERENCES product_lines(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE price_table_items (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  price_table_id  BIGINT UNSIGNED NOT NULL,
  item_type       VARCHAR(30) NOT NULL COMMENT 'PROFILE, ACCESSORY, GLASS_TYPE, FORMULA',
  item_id         BIGINT UNSIGNED NOT NULL,
  unit_price      DECIMAL(14,4) NOT NULL,
  unit            VARCHAR(20) NOT NULL DEFAULT 'un',
  CONSTRAINT fk_price_table_items_table FOREIGN KEY (price_table_id) REFERENCES price_tables(id),
  KEY idx_price_table_items_item (item_type, item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE projects (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(180) NOT NULL,
  address     VARCHAR(255) NULL,
  status      ENUM('LEVANTAMENTO','ORCAMENTO','APROVADO','EM_PRODUCAO','ENTREGUE','CANCELADO') NOT NULL DEFAULT 'LEVANTAMENTO',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_projects_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE environments (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id  BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(120) NOT NULL COMMENT 'ex: Sala, Quarto 1, Cozinha',
  notes       TEXT NULL,
  CONSTRAINT fk_environments_project FOREIGN KEY (project_id) REFERENCES projects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE openings (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  environment_id BIGINT UNSIGNED NOT NULL,
  typology_id    BIGINT UNSIGNED NULL,
  width_mm       DECIMAL(10,2) NOT NULL,
  height_mm      DECIMAL(10,2) NOT NULL,
  quantity       INT NOT NULL DEFAULT 1,
  notes          TEXT NULL,
  CONSTRAINT fk_openings_environment FOREIGN KEY (environment_id) REFERENCES environments(id),
  CONSTRAINT fk_openings_typology FOREIGN KEY (typology_id) REFERENCES typologies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quotes (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id   BIGINT UNSIGNED NOT NULL,
  seller_id    BIGINT UNSIGNED NULL,
  status       ENUM('RASCUNHO','ENVIADO','APROVADO','REJEITADO','EXPIRADO') NOT NULL DEFAULT 'RASCUNHO',
  total_value  DECIMAL(14,2) NOT NULL DEFAULT 0,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_quotes_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_quotes_seller FOREIGN KEY (seller_id) REFERENCES sellers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quote_items (
  id                   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quote_id             BIGINT UNSIGNED NOT NULL,
  opening_id           BIGINT UNSIGNED NULL,
  formula_version_id   BIGINT UNSIGNED NULL,
  description          VARCHAR(255) NOT NULL,
  quantity             INT NOT NULL DEFAULT 1,
  unit_price           DECIMAL(14,4) NOT NULL DEFAULT 0,
  total_price           DECIMAL(14,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_quote_items_quote FOREIGN KEY (quote_id) REFERENCES quotes(id),
  CONSTRAINT fk_quote_items_opening FOREIGN KEY (opening_id) REFERENCES openings(id),
  CONSTRAINT fk_quote_items_formula_version FOREIGN KEY (formula_version_id) REFERENCES formula_versions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sales_orders (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quote_id    BIGINT UNSIGNED NULL,
  project_id  BIGINT UNSIGNED NOT NULL,
  status      ENUM('ABERTO','EM_PRODUCAO','CONCLUIDO','CANCELADO') NOT NULL DEFAULT 'ABERTO',
  total_value DECIMAL(14,2) NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sales_orders_quote FOREIGN KEY (quote_id) REFERENCES quotes(id),
  CONSTRAINT fk_sales_orders_project FOREIGN KEY (project_id) REFERENCES projects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sales_order_items (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sales_order_id  BIGINT UNSIGNED NOT NULL,
  description     VARCHAR(255) NOT NULL,
  quantity        INT NOT NULL DEFAULT 1,
  unit_price      DECIMAL(14,4) NOT NULL DEFAULT 0,
  total_price     DECIMAL(14,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_sales_order_items_order FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
