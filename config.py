import os

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://usuario:senha@localhost:5432/meubanco')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
