import os

class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'postgresql://db_dados_hnsj_user:rglNUlPon4CWus77gWG6Fksp37Jic9mR@dpg-d1vdqrjuibrs739achm0-a.oregon-postgres.render.com/db_dados_hnsj'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = 'sua_chave_super_secreta'

