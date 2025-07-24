# Sistema de Vidraçaria

Sistema web para gestão de vidraçaria, esquadrias e marmoraria.

## Tecnologias
- Python 3.x
- Flask
- PostgreSQL
- SQLAlchemy

## Instalação
```bash
git clone https://github.com/WanderlanMonteiro/sistema_vidracaria.git
cd sistema_vidracaria
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

## Executando localmente
```bash
flask run
```

## Estrutura
- `app.py`: Inicialização do app
- `models.py`: Modelos do banco de dados
- `blueprints/`: Rotas modulares (autenticação, marmoraria, etc)
- `templates/`: HTML e Jinja2
- `static/`: CSS, JS, imagens

## Deploy
- Usando Render ou Heroku, configure as variáveis de ambiente conforme `.env.example`

## Contribuição
Pull requests são bem-vindos!
