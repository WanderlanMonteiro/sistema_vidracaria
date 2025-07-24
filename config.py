import os

class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get("SECRET_KEY", "uma_chave_aleatoria_segura")
    ENV = os.environ.get("FLASK_ENV", "production")

class DevelopmentConfig(Config):
    DEBUG = True
    ENV = "development"

class ProductionConfig(Config):
    DEBUG = False
    ENV = "production"
