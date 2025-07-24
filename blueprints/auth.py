from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from models import db, Usuario

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/')
def home():
    return redirect(url_for('auth.login'))

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        usuario = request.form['usuario']
        senha = request.form['senha']
        user = Usuario.query.filter_by(usuario=usuario).first()
        if user and user.check_password(senha):
            session.permanent = True
            session['usuario'] = usuario
            flash('Login realizado com sucesso!', 'success')
            return redirect(url_for('auth.dashboard'))
        else:
            flash('Usuário ou senha inválidos!', 'danger')
            return redirect(url_for('auth.login'))
    return render_template('login.html')

@auth_bp.route('/dashboard')
def dashboard():
    if 'usuario' in session:
        return render_template('dashboard.html', usuario=session['usuario'])
    else:
        flash('Você precisa estar logado para acessar o dashboard.', 'warning')
        return redirect(url_for('auth.login'))

@auth_bp.route('/logout')
def logout():
    session.pop('usuario', None)
    flash('Você saiu com sucesso.', 'info')
    return redirect(url_for('auth.login'))