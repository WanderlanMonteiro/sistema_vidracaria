-- 0012_pedido_tempera.sql
-- Pedido de têmpera como registro rastreável (status pendente/enviado/recebido),
-- em vez de só o relatório-instantâneo por orçamento que já existia
-- (App\Services\QuoteReportService::temperingReport). O pedido pode nascer a
-- partir de um orçamento (itens pré-preenchidos com a medida final -- maior
-- largura x maior altura) ou ser lançado manualmente.

CREATE TABLE tempering_orders (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quote_id    BIGINT UNSIGNED NULL,
  supplier_id BIGINT UNSIGNED NULL,
  status      ENUM('PENDENTE','ENVIADO','RECEBIDO','CANCELADO') NOT NULL DEFAULT 'PENDENTE',
  sent_at     DATE NULL,
  received_at DATE NULL,
  notes       TEXT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tempering_orders_quote FOREIGN KEY (quote_id) REFERENCES quotes(id),
  CONSTRAINT fk_tempering_orders_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tempering_order_items (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tempering_order_id  BIGINT UNSIGNED NOT NULL,
  description         VARCHAR(255) NOT NULL,
  glass_type_id       BIGINT UNSIGNED NULL,
  width_mm            DECIMAL(10,2) NOT NULL,
  height_mm           DECIMAL(10,2) NOT NULL,
  quantity            DECIMAL(10,2) NOT NULL DEFAULT 1,
  CONSTRAINT fk_tempering_order_items_order FOREIGN KEY (tempering_order_id) REFERENCES tempering_orders(id),
  CONSTRAINT fk_tempering_order_items_glass FOREIGN KEY (glass_type_id) REFERENCES glass_types(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
