# 🎬 MovieShelf

Sua estante pessoal de filmes e séries favoritos.

## 📋 Sobre o projeto

Aplicação web completa para gerenciar sua lista de filmes e séries.
Adicione títulos, dê notas, marque o status e deixe seus comentários.

## 🛠️ Tecnologias utilizadas

- **Python** + **FastAPI** — back-end e API REST
- **PostgreSQL** + **SQLAlchemy** — banco de dados
- **HTML + CSS + JavaScript** — front-end

## ✨ Funcionalidades

- ➕ Adicionar filmes e séries
- ⭐ Dar notas de 0 a 10
- 🗂️ Filtrar por status (Assistido, Assistindo, Quero assistir)
- ✏️ Editar informações
- 🗑️ Remover da estante
- 📄 Documentação automática da API com Swagger UI (`/docs`)

## 🚀 Como rodar localmente

**1. Clone o repositório:**
```bash
git clone https://github.com/JhonatanResende/movieshelf.git
cd movieshelf
```

**2. Crie e ative o ambiente virtual:**
```bash
python -m venv venv

# Windows:
venv\Scripts\activate

# Mac/Linux:
source venv/bin/activate
```

**3. Instale as dependências:**
```bash
pip install -r requirements.txt
```

**4. Configure as variáveis de ambiente:**

Crie um arquivo `.env` na raiz do projeto:
```
DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/movieshelf
```

**5. Rode o servidor:**
```bash
uvicorn app:app --reload
```

**6. Acesse no navegador:**
```
http://localhost:8000
```

> 📄 Documentação da API disponível em `http://localhost:8000/docs`

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.