from flask import Blueprint, render_template, request, redirect, url_for, flash
from models import db, Marmore, AcabamentoMarmoraria, PecaMarmoraria

marmoraria_bp = Blueprint('marmoraria', __name__)

@marmoraria_bp.route('/marmores')
def listar_marmores():
    marmores = Marmore.query.all()
    return render_template('marmoraria/marmores.html', marmores=marmores)

@marmoraria_bp.route('/marmores/novo', methods=['GET', 'POST'])
def novo_marmore():
    if request.method == 'POST':
        nome = request.form['nome']
        tipo = request.form['tipo']
        cor = request.form['cor']
        preco_m2 = request.form['preco_m2']
        descricao = request.form['descricao']
        marmore = Marmore(nome=nome, tipo=tipo, cor=cor, preco_m2=preco_m2, descricao=descricao)
        db.session.add(marmore)
        db.session.commit()
        flash('Mármore cadastrado com sucesso!', 'success')
        return redirect(url_for('marmoraria.listar_marmores'))
    return render_template('marmoraria/novo_marmore.html')

# Repita para acabamentos, peças, etc.