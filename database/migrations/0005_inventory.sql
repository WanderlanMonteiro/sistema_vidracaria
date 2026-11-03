-- 0005_inventory.sql
-- Núcleo de estoque: materiais, depósitos, saldos, movimentações, reservas e compras.

CREATE TABLE materials (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(180) NOT NULL,
  category     VARCHAR(40) NOT NULL COMMENT 'PERFIL, VIDRO, ACESSORIO, GUARNICAO, OUTRO',
  profile_id   BIGINT UNSIGNED NULL,
  accessory_id BIGINT UNSIGNED NULL,
  glass_type_id BIGINT UNSIGNED NULL,
  unit         VARCHAR(10) NOT NULL DEFAULT 'un',
  min_stock    DECIMAL(14,3) NOT NULL DEFAULT 0,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_materials_profile FOREIGN KEY (profile_id) REFERENCES profiles(id),
  CONSTRAINT fk_materials_accessory FOREIGN KEY (accessory_id) REFERENCES accessories(id),
  CONSTRAINT fk_materials_glass_type FOREIGN KEY (glass_type_id) REFERENCES glass_types(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE warehouses (
  id      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name    VARCHAR(120) NOT NULL,
  address VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stock_balances (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  material_id  BIGINT UNSIGNED NOT NULL,
  warehouse_id BIGINT UNSIGNED NOT NULL,
  quantity     DECIMAL(14,3) NOT NULL DEFAULT 0,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_stock_balances_material FOREIGN KEY (material_id) REFERENCES materials(id),
  CONSTRAINT fk_stock_balances_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  UNIQUE KEY uk_stock_balances_material_warehouse (material_id, warehouse_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stock_movements (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  material_id    BIGINT UNSIGNED NOT NULL,
  warehouse_id   BIGINT UNSIGNED NOT NULL,
  movement_type  ENUM('ENTRADA','SAIDA','AJUSTE','RESERVA','BAIXA_RESERVA') NOT NULL,
  quantity       DECIMAL(14,3) NOT NULL,
  reference_type VARCHAR(40) NULL COMMENT 'ex: PURCHASE_ORDER, PRODUCTION_ORDER, MANUAL',
  reference_id   BIGINT UNSIGNED NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by     VARCHAR(120) NULL,
  CONSTRAINT fk_stock_movements_material FOREIGN KEY (material_id) REFERENCES materials(id),
  CONSTRAINT fk_stock_movements_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  KEY idx_stock_movements_reference (reference_type, reference_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stock_reservations (
  id                   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  material_id          BIGINT UNSIGNED NOT NULL,
  warehouse_id         BIGINT UNSIGNED NOT NULL,
  production_order_id  BIGINT UNSIGNED NULL,
  quantity             DECIMAL(14,3) NOT NULL,
  status               ENUM('ATIVA','LIBERADA','CONSUMIDA') NOT NULL DEFAULT 'ATIVA',
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_stock_reservations_material FOREIGN KEY (material_id) REFERENCES materials(id),
  CONSTRAINT fk_stock_reservations_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE purchase_orders (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  supplier_id  BIGINT UNSIGNED NOT NULL,
  status       ENUM('RASCUNHO','ENVIADO','CONFIRMADO','RECEBIDO_PARCIAL','RECEBIDO_TOTAL','CANCELADO') NOT NULL DEFAULT 'RASCUNHO',
  total_value  DECIMAL(14,2) NOT NULL DEFAULT 0,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_purchase_orders_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE purchase_order_items (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  purchase_order_id BIGINT UNSIGNED NOT NULL,
  material_id       BIGINT UNSIGNED NOT NULL,
  quantity          DECIMAL(14,3) NOT NULL,
  unit_price        DECIMAL(14,4) NOT NULL,
  CONSTRAINT fk_purchase_order_items_order FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
  CONSTRAINT fk_purchase_order_items_material FOREIGN KEY (material_id) REFERENCES materials(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE goods_receipts (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  purchase_order_id BIGINT UNSIGNED NOT NULL,
  received_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  received_by       VARCHAR(120) NULL,
  notes             TEXT NULL,
  CONSTRAINT fk_goods_receipts_order FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
