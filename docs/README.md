# Sistema Técnico e Operacional — Esquadrias de Alumínio, Forro PVC e Drywall

Fase 1 (núcleo técnico): schema relacional completo, interpretador seguro de fórmulas,
API básica em PHP e dados reais extraídos de catálogos técnicos com citação de fonte
e página. Fase 2 (comercial/estoque/produção/qualidade): API REST sobre o restante do
schema (clientes, projetos, orçamentos, pedidos, estoque, ordens de produção,
protótipos, inspeção). Ver `docs/GOVERNANCA_DE_DADOS.md` para as regras que todo o
projeto segue e `docs/API.md` para a lista completa de endpoints.

## Stack

- **Backend**: PHP 8.1+ puro (sem framework, sem Composer obrigatório em produção) — compatível com hospedagem compartilhada HostGator/cPanel.
- **Banco**: MySQL 5.7+/MariaDB 10.3+ (mesmo servidor da hospedagem do domínio).
- **Frontend**: SPA estática (HTML/CSS/JS puro, sem build) em `public/app/`, servida no mesmo domínio da API, com tela de login. Cobre: catálogo técnico (fabricantes, perfis, fórmulas com checklist de liberação e calculadora), tipologias, criação de fórmula nova, clientes, obras, orçamentos (com itens ligados a fórmula/vidro, preço fechado ou por m², vão fora de esquadro usando sempre a maior largura × maior altura, acessórios avulsos, relatório de compras, relatório de têmpera e impressão sem mostrar largura×altura — só a metragem), financeiro básico (lançamentos de receita/despesa) e relatório de materiais a comprar (estoque abaixo do mínimo). Estoque/compras/produção/qualidade em si ainda não têm tela própria além do que foi listado — só a API (ver `docs/API.md`).
- **Autenticação**: sessão por cookie (`App\Support\Auth`), toda rota exige login exceto `/` e `/auth/login`. Ver `docs/API.md#autenticação`.

## Estrutura

```
database/
  migrations/   -- schema completo (DDL), aplicado em ordem numérica
  seeds/        -- dados reais (DML), aplicado em ordem numérica
  migrate.php   -- aplica migrations pendentes (idempotente)
  seed.php      -- aplica seeds pendentes (idempotente)
src/
  Config/       -- conexão PDO
  Formula/      -- interpretador seguro de fórmulas (lexer/parser/evaluator)
  Services/     -- cálculo de fórmula, validador de liberação de produção,
                   movimentação de estoque, recebimento de compra, status de produção,
                   autenticação (AuthService, testável sem sessão real)
  Support/      -- .env loader, SQL script splitter, sessão de autenticação (Auth)
  Http/         -- request/response/router minimalistas
  Controllers/  -- endpoints da API (Support/CrudController.php é a base genérica
                   usada pela maioria dos endpoints comerciais/estoque/produção/
                   qualidade — ver docs/API.md)
public/
  index.php     -- front controller da API
  .htaccess     -- roteamento Apache (HostGator)
  app/          -- frontend estático (catálogo técnico + calculadora de fórmula)
tests/          -- testes sem dependências externas (`php tests/run-all.php`)
docs/           -- esta documentação
```

## Rodando localmente

```bash
cp .env.example .env
# edite .env com as credenciais do seu MySQL local

php database/migrate.php
php database/seed.php
php -S 127.0.0.1:8000 -t public

# quase toda rota exige login -- a seed 0019 cria um usuário inicial (a senha
# gerada foi entregue fora do repositório; troque com PUT /auth/senha assim que
# possível). Guarde a sessão num cookie jar:
curl -c /tmp/cookies.txt -X POST http://127.0.0.1:8000/auth/login \
  -d '{"email":"...", "password":"..."}'
curl -b /tmp/cookies.txt http://127.0.0.1:8000/formulas
```

Ou abra `http://127.0.0.1:8000/app/` no navegador para usar a interface com login.

## Rodando os testes

```bash
php tests/run-all.php
```

Não há dependência de Composer/PHPUnit — os testes são scripts PHP puros
(`tests/TestRunner.php`), incluindo testes de regressão da fórmula Asa Flex real
extraída do Livro 5 de Serralheria (p.16) e das regras de bloqueio de produção.

## Publicando na HostGator

Ver `docs/DEPLOY_HOSTGATOR.md` — resumo: criar banco MySQL pelo cPanel, importar
`database/migrations/*.sql` e `database/seeds/*.sql` pelo phpMyAdmin (ou via SSH com
`php database/migrate.php` / `php database/seed.php` se o plano tiver acesso SSH),
apontar o domínio/subdomínio para a pasta `public/`.

## Estado atual dos dados (fonte real vs. pendente)

| Fonte | Status |
|---|---|
| Livro 5 — Serralheria Alumínios | Extraído por completo (28 páginas) |
| Catálogo Ecoline 2.5 / SGT-GTS | Extraído — 163 perfis cadastrados com página citada |
| Catálogo UNNION | Extraído — 135 perfis cadastrados com página citada |
| Guias gerais Hydro + CEHOP | Extraídos, aguardando importação em seed (ver `docs/FONTES.md`) |
| Catálogo Gold III (perfis + acessórios) | Extraído — 114 perfis + 94 acessórios + 22 compatibilidades vidro/guarnição |
| Catálogo "TEC-SUP" / Suprema (Tec-Vidro) | Extraído — 41 perfis. O nome "Suprema" não é confirmado na fonte (ver `docs/FONTES.md`) |
| Planilha interna de cálculo de corte | Extraída — **77 fórmulas de corte reais** (996 componentes). **48 já liberadas para produção** (Ecoline 2.5 + UNNION + Gold III + Suprema — todas as ligadas a linhas totalmente catalogadas). As 28 restantes (Módulo Prático, Linha Portão, Linha Moveleira) seguem bloqueadas até essas linhas terem fabricante e catálogo confirmados. Ver `docs/FONTES.md` e `docs/GOVERNANCA_DE_DADOS.md` |
| Catálogo consolidado (AL/Alcoa/Alutec/Aluminconte) | Analisado — índice resumido, não os catálogos originais. Confirmou o fabricante da linha "Módulo Prático/Linha 30" como Alcoa (75% dos códigos batem com peso+página citados) e carregou peso real para 32 perfis. Revelou um conflito de peso entre a linha Suprema já cadastrada e uma seção "Linha Suprema" do próprio catálogo Alcoa (não resolvido, ver `docs/GOVERNANCA_DE_DADOS.md`). Fórmulas seguem bloqueadas — essa é confirmação de fabricante/peso, não liberação para produção. |
| Catálogo Super5 (ferragens para vidro temperado) | Extraído por completo (54 páginas) — **228 acessórios** com imagem de página vinculada, aplicação registrada em 100% dos itens (41 já ligados a uma tipologia existente — Correr/Basculante/Maxim-Ar/Pivotante/Giro; 187 aguardam o usuário confirmar/cadastrar tipologias novas — box, granito/alvenaria, sacada, rack, porta sanfonada, vitrine). Ver `docs/FONTES.md`. |

Ver `docs/FONTES.md` para o detalhamento completo e o que falta para cada fonte.
