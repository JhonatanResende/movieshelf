from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///movieshelf.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


# ================================================
# MODELO
# ================================================

class Filme(db.Model):
    id         = db.Column(db.Integer, primary_key=True)
    titulo     = db.Column(db.String(200), nullable=False)
    genero     = db.Column(db.String(100), nullable=False)
    nota       = db.Column(db.Float, nullable=True)
    status     = db.Column(db.String(50), nullable=False)
    comentario = db.Column(db.String(500), nullable=True)

    # Transforma o filme num dicionário (para enviar como JSON)
    def to_dict(self):
        return {
            'id':         self.id,
            'titulo':     self.titulo,
            'genero':     self.genero,
            'nota':       self.nota,
            'status':     self.status,
            'comentario': self.comentario
        }


# ================================================
# ROTA 1 — Página inicial (retorna o HTML)
# ================================================

@app.route('/')
def index():
    return render_template('index.html') 


# ================================================
# ROTA 2 — LISTAR todos os filmes (GET)
# ================================================

@app.route('/filmes', methods=['GET'])
def listar_filmes():
    filmes = Filme.query.all()          # busca TODOS os filmes no banco
    return jsonify([f.to_dict() for f in filmes])


# ================================================
# ROTA 3 — ADICIONAR um filme (POST)
# ================================================

@app.route('/filmes', methods=['POST'])
def adicionar_filme():
    dados = request.get_json()          # pega os dados enviados pelo front-end

    # Validação: campos obrigatórios precisam estar presentes
    if not dados.get('titulo') or not dados.get('genero') or not dados.get('status'):
        return jsonify({'erro': 'titulo, genero e status são obrigatórios'}), 400

    novo_filme = Filme(
        titulo     = dados['titulo'],
        genero     = dados['genero'],
        nota       = dados.get('nota'),       # .get() retorna None se não existir
        status     = dados['status'],
        comentario = dados.get('comentario')
    )

    db.session.add(novo_filme)          # prepara para salvar
    db.session.commit()                 # salva de verdade no banco

    return jsonify(novo_filme.to_dict()), 201   # 201 = "criado com sucesso"


# ================================================
# ROTA 4 — EDITAR um filme (PUT)
# ================================================

@app.route('/filmes/<int:id>', methods=['PUT'])
def editar_filme(id):
    # Busca o filme pelo ID, se não achar retorna erro 404
    filme = Filme.query.get_or_404(id)
    dados = request.get_json()

    # Atualiza só os campos que foram enviados
    filme.titulo     = dados.get('titulo',     filme.titulo)
    filme.genero     = dados.get('genero',     filme.genero)
    filme.nota       = dados.get('nota',       filme.nota)
    filme.status     = dados.get('status',     filme.status)
    filme.comentario = dados.get('comentario', filme.comentario)

    db.session.commit()                 # salva as mudanças

    return jsonify(filme.to_dict())


# ================================================
# ROTA 5 — DELETAR um filme (DELETE)
# ================================================

@app.route('/filmes/<int:id>', methods=['DELETE'])
def deletar_filme(id):
    filme = Filme.query.get_or_404(id)  # busca o filme, ou retorna 404

    db.session.delete(filme)            # marca para deletar
    db.session.commit()                 # deleta de verdade

    return jsonify({'mensagem': f'Filme "{filme.titulo}" deletado com sucesso!'})


# ================================================
# INICIALIZAR
# ================================================

import os

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print('✅ Banco de dados pronto!')
    app.run(debug=True)
else:
    with app.app_context():
        db.create_all()