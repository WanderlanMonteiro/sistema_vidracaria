-- 0000_bootstrap.sql
-- Estrutura de controle de migrations e domínio de status de governança de dados.

CREATE TABLE IF NOT EXISTS schema_migrations (
  migration     VARCHAR(180) PRIMARY KEY,
  applied_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Domínio fixo de status de governança de dados (seção 11 do briefing técnico).
CREATE TABLE IF NOT EXISTS data_status (
  status_code       VARCHAR(30) PRIMARY KEY,
  label             VARCHAR(120) NOT NULL,
  description       TEXT NULL,
  blocks_production TINYINT(1) NOT NULL DEFAULT 1,
  sort_order        INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Origem do dado (seção 2): como o fato chegou ao sistema.
-- Modelado como domínio fixo (não tabela separada) para reutilização simples via CHECK/ENUM.
