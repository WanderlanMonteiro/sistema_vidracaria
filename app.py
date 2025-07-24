from flask import Flask, render_template, request, redirect, url_for, session, flash
from datetime import timedelta
from config import Config
from models import db
from dotenv import load_dotenv

load_dotenv()  # Carrega variáveis do .env localmente

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)

app.permanent_session_lifetime = timedelta(minutes=30)

# Usuário padrão (futuramente pode migrar para SQLAlchemy)
usuarios = {
    "admin": "admin"
}

@app.route('/')
def home():
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        usuario = request.form['usuario']
        senha = request.form['senha']
        if usuario in usuarios and usuarios[usuario] == senha:
            session.permanent = True
            session['usuario'] = usuario
            flash('Login realizado com sucesso!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Usuário ou senha inválidos!', 'danger')
            return redirect(url_for('login'))
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    if 'usuario' in session:
        return render_template('dashboard.html', usuario=session['usuario'])
    else:
        flash('Você precisa estar logado para acessar o dashboard.', 'warning')
        return redirect(url_for('login'))

@app.route('/logout')
def logout():
    session.pop('usuario', None)
    flash('Você saiu com sucesso.', 'info')
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run()