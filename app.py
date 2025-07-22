from flask import Flask, render_template, request, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
app.secret_key = 'sua_chave_secreta_aqui'

# Configurar conexão PostgreSQL pelo .env
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Models

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    id = db.Column(db.Integer, primary_key=True)
    usuario = db.Column(db.String(50), unique=True, nullable=False)
    senha = db.Column(db.String(255), nullable=False)
    nome = db.Column(db.String(100))
    email = db.Column(db.String(100))

class Linha(db.Model):
    __tablename__ = 'linhas'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(50), unique=True, nullable=False)
    descricao = db.Column(db.Text)

class GrupoMaterial(db.Model):
    __tablename__ = 'grupos_materiais'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(50), unique=True, nullable=False)

class Material(db.Model):
    __tablename__ = 'materiais'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    grupo_id = db.Column(db.Integer, db.ForeignKey('grupos_materiais.id'), nullable=False)
    linha_id = db.Column(db.Integer, db.ForeignKey('linhas.id'))
    descricao = db.Column(db.Text)
    preco = db.Column(db.Numeric(10,2))
    unidade_medida = db.Column(db.String(20))

    grupo = db.relationship('GrupoMaterial')
    linha = db.relationship('Linha')

# Rotas

@app.route('/')
def index():
    return "Sistema de Vidraçaria - Backend funcionando"

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        usuario = request.form['usuario']
        senha = request.form['senha']
        user = Usuario.query.filter_by(usuario=usuario, senha=senha).first()
        if user:
            session['usuario'] = user.usuario
            return redirect(url_for('index'))
        else:
            return "Usuário ou senha inválidos", 401
    return '''
        <form method="post">
            Usuário: <input name="usuario" /><br/>
            Senha: <input name="senha" type="password" /><br/>
            <input type="submit" value="Login" />
        </form>
    '''

@app.route('/materiais')
def listar_materiais():
    materiais = Material.query.all()
    return '<br>'.join([f'{m.nome} - {m.preco} {m.unidade_medida}' for m in materiais])

if __name__ == '__main__':
    app.run(debug=True)

