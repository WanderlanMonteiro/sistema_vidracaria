# Publicando na HostGator

Assumindo hospedagem compartilhada padrão (cPanel), sem SSH garantido. Se o seu
plano tiver SSH, os passos "via SSH" abaixo são mais rápidos — use-os.

## 1. Banco de dados

No cPanel: **Bancos de Dados MySQL**
1. Crie um banco (ex: `usuariocpanel_esquadrias`).
2. Crie um usuário MySQL e uma senha forte.
3. Adicione o usuário ao banco com **todos os privilégios**.
4. Anote host (geralmente `localhost`), nome do banco, usuário e senha.

## 2. Enviar os arquivos

Envie todo o conteúdo do repositório para uma pasta **fora** de `public_html`
(ex: `/home/usuariocpanel/sistema_esquadrias/`), e configure o domínio/subdomínio
para apontar sua "Raiz do Documento" para a subpasta `public/` desse projeto
(cPanel → **Domínios** → editar → "Raiz do Documento"). Isso garante que só o
front controller (`public/index.php`) fica acessível pela web — o resto do
código, migrations e `.env` ficam fora do alcance direto do navegador.

Se seu plano só permite apontar para `public_html` diretamente, copie o
*conteúdo* de `public/` para dentro de `public_html/` e ajuste os `require` em
`public/index.php` para apontar para o caminho real de `src/` (`../src/autoload.php`
vira o caminho relativo correto a partir de `public_html/`).

## 3. Configurar `.env`

Copie `.env.example` para `.env` na raiz do projeto (não dentro de `public/`) e
preencha com os dados do passo 1. O `.htaccess` em `public/` já bloqueia acesso
HTTP direto a arquivos `.env*`.

## 4. Rodar migrations e seeds

**Via SSH** (se disponível):
```bash
cd /home/usuariocpanel/sistema_esquadrias
php database/migrate.php
php database/seed.php
```

**Sem SSH** (phpMyAdmin):
1. Abra phpMyAdmin no cPanel, selecione o banco criado no passo 1.
2. Aba **Importar** → selecione cada arquivo de `database/migrations/` **em ordem
   numérica** (`0000_bootstrap.sql`, `0001_core_technical.sql`, ...) e importe um
   por um.
3. Repita para `database/seeds/` **em ordem numérica**.
4. Os arquivos de seed usam variáveis de sessão MySQL (`SET @x = LAST_INSERT_ID()`)
   — isso funciona normalmente pelo importador do phpMyAdmin, mas **cada arquivo
   precisa ser importado como um único lote** (não corte o arquivo ao meio).

## 5. Verificar

Acesse `https://seudominio.com.br/` — deve responder com o JSON de boas-vindas da
API. Teste `https://seudominio.com.br/formulas` para confirmar que os dados
foram carregados.

## 6. PHP na HostGator

No cPanel → **MultiPHP Manager**, selecione PHP 8.1 ou superior para o domínio
(o projeto usa `readonly` properties e `match`, recursos de PHP 8.1+). As
extensões `pdo_mysql` e `json` já vêm habilitadas por padrão nos planos HostGator.
