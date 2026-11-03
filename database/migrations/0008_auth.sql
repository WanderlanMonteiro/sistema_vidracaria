-- 0008_auth.sql
-- Usuários do sistema (login). Uma camada só: qualquer usuário ativo autenticado
-- acessa toda a API -- não há permissão granular por papel ainda (campo `role`
-- existe para uso futuro, não é verificado em nenhuma rota hoje).

CREATE TABLE users (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(150) NOT NULL,
  email          VARCHAR(150) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  role           VARCHAR(30) NOT NULL DEFAULT 'USER',
  active         TINYINT(1) NOT NULL DEFAULT 1,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at  DATETIME NULL,
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
