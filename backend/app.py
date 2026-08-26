from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv 

load_dotenv()

# ================================================
# CONFIGURAÇÃO DO BANCO DE DADOS
# ================================================

DATABASE_URL = os.environ.get('DATABASE_URL')

# O PostgreSQL no Render usa "postgres://" mas o SQLAlchemy exige "postgresql://"
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


# ================================================
# MODELO — a tabela do banco
# ================================================

class FilmeModel(Base):
    __tablename__ = 'filmes'

    id         = Column(Integer, primary_key=True, index=True)
    titulo     = Column(String(200), nullable=False)
    genero     = Column(String(100), nullable=False)
    nota       = Column(Float, nullable=True)
    status     = Column(String(50), nullable=False)
    comentario = Column(String(500), nullable=True)


# Cria as tabelas no banco
Base.metadata.create_all(bind=engine)


# ================================================
# SCHEMAS — valida os dados que chegam pela API
# ================================================

class FilmeSchema(BaseModel):
    # Define o formato dos dados que a API aceita
    titulo:     str
    genero:     str
    status:     str
    nota:       Optional[float] = None
    comentario: Optional[str]   = None

class FilmeResposta(FilmeSchema):
    # Inclui o id na resposta
    id: int

    class Config:
        from_attributes = True
        # Permite converter objeto do banco em JSON automaticamente


# ================================================
# APLICAÇÃO FASTAPI
# ================================================

app = FastAPI(title='MovieShelf API')

# Serve os arquivos estáticos (CSS, JS, imagens)
app.mount('/static', StaticFiles(directory='static'), name='static')

# Configura os templates HTML
templates = Jinja2Templates(directory='templates')


# ================================================
# FUNÇÃO AUXILIAR — abre e fecha sessão do banco
# ================================================

def get_db():
    db = SessionLocal()
    try:
        yield db      # "empresta" a sessão pra rota
    finally:
        db.close()    # sempre fecha no final


# ================================================
# ROTA 1 — Página inicial
# ================================================

@app.get('/')
def index(request: Request):
    return templates.TemplateResponse(request, 'index.html')


# ================================================
# ROTA 2 — LISTAR filmes (GET)
# ================================================

@app.get('/filmes', response_model=list[FilmeResposta])
def listar_filmes():
    db = SessionLocal()
    filmes = db.query(FilmeModel).all()
    db.close()
    return filmes


# ================================================
# ROTA 3 — ADICIONAR filme (POST)
# ================================================

@app.post('/filmes', response_model=FilmeResposta, status_code=201)
def adicionar_filme(filme: FilmeSchema):
    # O FastAPI já valida os dados automaticamente pelo Schema!
    db = SessionLocal()

    novo_filme = FilmeModel(**filme.model_dump())
    # **filme.model_dump() converte o schema num dicionário
    # e passa cada campo pro modelo do banco

    db.add(novo_filme)
    db.commit()
    db.refresh(novo_filme)  # atualiza o objeto com o id gerado
    db.close()

    return novo_filme


# ================================================
# ROTA 4 — EDITAR filme (PUT)
# ================================================

@app.put('/filmes/{id}', response_model=FilmeResposta)
def editar_filme(id: int, dados: FilmeSchema):
    db = SessionLocal()
    filme = db.query(FilmeModel).filter(FilmeModel.id == id).first()

    if not filme:
        db.close()
        raise HTTPException(status_code=404, detail='Filme não encontrado')
        # HTTPException substitui o "abort(404)" do Flask

    for campo, valor in dados.model_dump().items():
        setattr(filme, campo, valor)
        # setattr: atualiza cada campo dinamicamente
        # equivalente a: filme.titulo = dados.titulo, etc.

    db.commit()
    db.refresh(filme)
    db.close()

    return filme


# ================================================
# ROTA 5 — DELETAR filme (DELETE)
# ================================================

@app.delete('/filmes/{id}')
def deletar_filme(id: int):
    db = SessionLocal()
    filme = db.query(FilmeModel).filter(FilmeModel.id == id).first()

    if not filme:
        db.close()
        raise HTTPException(status_code=404, detail='Filme não encontrado')

    titulo = filme.titulo
    db.delete(filme)
    db.commit()
    db.close()

    return {'mensagem': f'Filme "{titulo}" deletado com sucesso!'}