from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    usuario = db.Column(db.String(50), unique=True, nullable=False)
    senha = db.Column(db.String(255), nullable=False)
    tipo = db.Column(db.String(20), default='usuario')
    orcamentos = db.relationship('Orcamento', backref='usuario', lazy=True)

    def set_password(self, senha):
        self.senha = generate_password_hash(senha)

    def check_password(self, senha):
        return check_password_hash(self.senha, senha)

    def __repr__(self):
        return f"<Usuario {self.usuario}>"

class Cliente(db.Model):
    __tablename__ = 'clientes'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    telefone = db.Column(db.String(20))
    email = db.Column(db.String(100))
    endereco = db.Column(db.Text)
    orcamentos = db.relationship('Orcamento', backref='cliente', lazy=True)

    def __repr__(self):
        return f"<Cliente {self.nome}>"

class Perfil(db.Model):
    __tablename__ = 'perfis'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    linha = db.Column(db.String(50))
    preco_unitario = db.Column(db.Numeric(10,2))
    descricao = db.Column(db.Text)

    def __repr__(self):
        return f"<Perfil {self.nome}>"

class Vidro(db.Model):
    __tablename__ = 'vidros'
    id = db.Column(db.Integer, primary_key=True)
    tipo = db.Column(db.String(50), nullable=False)
    espessura = db.Column(db.String(20))
    cor = db.Column(db.String(30))
    preco_m2 = db.Column(db.Numeric(10,2))

    def __repr__(self):
        return f"<Vidro {self.tipo} {self.espessura} {self.cor}>"

class Acessorio(db.Model):
    __tablename__ = 'acessorios'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    tipo = db.Column(db.String(50))
    preco_unitario = db.Column(db.Numeric(10,2))
    descricao = db.Column(db.Text)

    def __repr__(self):
        return f"<Acessorio {self.nome}>"

class Orcamento(db.Model):
    __tablename__ = 'orcamentos'
    id = db.Column(db.Integer, primary_key=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey('clientes.id'))
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'))
    data_orcamento = db.Column(db.DateTime)
    total = db.Column(db.Numeric(10,2))
    status = db.Column(db.String(20), default='pendente')
    itens = db.relationship('ItemOrcamento', backref='orcamento', lazy=True)
    pecas_marmoraria = db.relationship('PecaMarmoraria', backref='orcamento', lazy=True)

    def __repr__(self):
        return f"<Orcamento {self.id} Cliente:{self.cliente_id}>"

class ItemOrcamento(db.Model):
    __tablename__ = 'itens_orcamento'
    id = db.Column(db.Integer, primary_key=True)
    orcamento_id = db.Column(db.Integer, db.ForeignKey('orcamentos.id'))
    tipo_item = db.Column(db.String(30)) # vidro, perfil, acessorio, marmoraria
    item_id = db.Column(db.Integer)
    descricao = db.Column(db.Text)
    quantidade = db.Column(db.Numeric(10,2))
    preco_unitario = db.Column(db.Numeric(10,2))
    subtotal = db.Column(db.Numeric(10,2))

    def __repr__(self):
        return f"<ItemOrcamento {self.id} Orcamento:{self.orcamento_id}>"

# --- MÓDULO MARMORARIA ---

class Marmore(db.Model):
    __tablename__ = 'marmores'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    tipo = db.Column(db.String(50)) # mármore, granito, quartzo, etc
    cor = db.Column(db.String(50))
    preco_m2 = db.Column(db.Numeric(10,2))
    descricao = db.Column(db.Text)
    pecas = db.relationship('PecaMarmoraria', backref='marmore', lazy=True)

    def __repr__(self):
        return f"<Marmore {self.nome}>"

class AcabamentoMarmoraria(db.Model):
    __tablename__ = 'acabamentos_marmoraria'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(50), nullable=False)
    descricao = db.Column(db.Text)
    preco_linear = db.Column(db.Numeric(10,2)) # preço por metro linear do acabamento
    pecas = db.relationship('PecaMarmoraria', backref='acabamento', lazy=True)

    def __repr__(self):
        return f"<AcabamentoMarmoraria {self.nome}>"

class PecaMarmoraria(db.Model):
    __tablename__ = 'pecas_marmoraria'
    id = db.Column(db.Integer, primary_key=True)
    orcamento_id = db.Column(db.Integer, db.ForeignKey('orcamentos.id'))
    marmore_id = db.Column(db.Integer, db.ForeignKey('marmores.id'))
    acabamento_id = db.Column(db.Integer, db.ForeignKey('acabamentos_marmoraria.id'))
    tipo_peca = db.Column(db.String(50))
    comprimento = db.Column(db.Numeric(10,2))
    largura = db.Column(db.Numeric(10,2))
    espessura = db.Column(db.String(20))
    quantidade = db.Column(db.Integer, default=1)
    preco_unitario = db.Column(db.Numeric(10,2))
    subtotal = db.Column(db.Numeric(10,2))
    observacao = db.Column(db.Text)

    def __repr__(self):
        return f"<PecaMarmoraria {self.id} Orcamento:{self.orcamento_id}>"