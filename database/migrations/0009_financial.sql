-- 0009_financial.sql
-- Financeiro básico: um único lançamento (receita ou despesa), sem contas
-- bancárias/centros de custo -- suficiente para lançar custos de obra e
-- controlar contas a pagar/receber simples. Pode ser ligado a um projeto,
-- pedido de compra ou pedido de venda, mas nenhum vínculo é obrigatório.

CREATE TABLE financial_entries (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entry_type        ENUM('RECEITA','DESPESA') NOT NULL,
  category          VARCHAR(60) NOT NULL COMMENT 'ex: MATERIAL, MAO_DE_OBRA, FRETE, VENDA, OUTRO',
  description       VARCHAR(255) NOT NULL,
  amount            DECIMAL(14,2) NOT NULL,
  due_date          DATE NULL,
  paid_date         DATE NULL,
  status            ENUM('PENDENTE','PAGO','CANCELADO') NOT NULL DEFAULT 'PENDENTE',
  project_id        BIGINT UNSIGNED NULL,
  purchase_order_id BIGINT UNSIGNED NULL,
  sales_order_id    BIGINT UNSIGNED NULL,
  notes             TEXT NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_financial_entries_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_financial_entries_purchase_order FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
  CONSTRAINT fk_financial_entries_sales_order FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id),
  KEY idx_financial_entries_project (project_id),
  KEY idx_financial_entries_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
