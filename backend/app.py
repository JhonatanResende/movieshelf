from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

# ================================================
# CONFIGURAÇÃO DO BANCO DE DADOS
# ================================================

DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


# ================================================
# MODELO
# ================================================

class FilmeModel(Base):
    __tablename__ = 'filmes'

    id         = Column(Integer, primary_key=True, index=True)
    titulo     = Column(String(200), nullable=False)
    genero     = Column(String(100), nullable=False)
    nota       = Column(Float, nullable=True)
    status     = Column(String(50), nullable=False)
    comentario = Column(String(500), nullable=True)

Base.metadata.create_all(bind=engine)


# ================================================
# SCHEMAS
# ================================================

class FilmeSchema(BaseModel):
    titulo:     str
    genero:     str
    status:     str
    nota:       Optional[float] = None
    comentario: Optional[str]   = None

class FilmeResposta(FilmeSchema):
    id: int

    class Config:
        from_attributes = True


# ================================================
# APLICAÇÃO FASTAPI
# ================================================

app = FastAPI(title='MovieShelf API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    # vamos restringir depois do deploy na Vercel
    allow_methods=["*"],
    allow_headers=["*"],
)


# ================================================
# ROTAS
# ================================================

@app.get('/filmes', response_model=list[FilmeResposta])
def listar_filmes():
    db = SessionLocal()
    filmes = db.query(FilmeModel).all()
    db.close()
    return filmes


@app.post('/filmes', response_model=FilmeResposta, status_code=201)
def adicionar_filme(filme: FilmeSchema):
    db = SessionLocal()
    novo_filme = FilmeModel(**filme.model_dump())
    db.add(novo_filme)
    db.commit()
    db.refresh(novo_filme)
    db.close()
    return novo_filme


@app.put('/filmes/{id}', response_model=FilmeResposta)
def editar_filme(id: int, dados: FilmeSchema):
    db = SessionLocal()
    filme = db.query(FilmeModel).filter(FilmeModel.id == id).first()

    if not filme:
        db.close()
        raise HTTPException(status_code=404, detail='Filme não encontrado')

    for campo, valor in dados.model_dump().items():
        setattr(filme, campo, valor)

    db.commit()
    db.refresh(filme)
    db.close()
    return filme


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