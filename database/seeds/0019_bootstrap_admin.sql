-- 0019_bootstrap_admin.sql
-- Usuário inicial para conseguir logar pela primeira vez. A senha em texto puro
-- NUNCA fica no repositório -- só o hash bcrypt abaixo. A senha gerada foi
-- entregue ao usuário fora do repositório (no chat), com instrução de trocar
-- no primeiro acesso via PUT /auth/senha.

INSERT INTO users (name, email, password_hash, role, active) VALUES
('Responsavel Tecnico', 'wmdshere@gmail.com', '$2y$12$utLTPcd9DOCjKXQqk4iY3emPYyGlZ9iNoxxyuJgX3G/Mh1.LkpIIq', 'ADMIN', 1);
