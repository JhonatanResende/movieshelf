// =============================================
// URL DO BACK-END
// Quando fizer o deploy no Render, troca pelo link real!
// =============================================
const API_URL = 'https://movieshelf-c9ld.onrender.com';


// =============================================
// VARIÁVEIS GLOBAIS
// =============================================
let todosOsFilmes = [];
let filtroAtivo   = 'Todos';


// =============================================
// 1. CARREGAR FILMES
// =============================================

async function carregarFilmes(tentativa = 1) {
    const maxTentativas = 5;

    try {
        const resposta = await fetch(`${API_URL}/filmes`);

        if (!resposta.ok) throw new Error('Servidor não respondeu');

        todosOsFilmes = await resposta.json();
        renderizarFilmes();

    } catch (erro) {
        if (tentativa <= maxTentativas) {
            document.getElementById('lista-filmes').innerHTML = `
                <div class="loading">
                    ☕ Acordando o servidor... tentativa ${tentativa}/${maxTentativas}
                </div>`;
            setTimeout(() => carregarFilmes(tentativa + 1), 3000);
        } else {
            document.getElementById('lista-filmes').innerHTML =
                '<p class="empty"><span>😵</span>Servidor demorou demais. Recarrega a página!</p>';
        }
    }
}


// =============================================
// 2. RENDERIZAR FILMES
// =============================================

function renderizarFilmes() {
    const lista = document.getElementById('lista-filmes');

    const filmesFiltrados = filtroAtivo === 'Todos'
        ? todosOsFilmes
        : todosOsFilmes.filter(f => f.status === filtroAtivo);

    if (filmesFiltrados.length === 0) {
        lista.innerHTML = `
            <div class="empty">
                <span>🎬</span>
                <p>Nenhum filme aqui ainda. Adicione o primeiro!</p>
            </div>`;
        return;
    }

    lista.innerHTML = filmesFiltrados.map(filme => criarCardHTML(filme)).join('');
}


// =============================================
// 3. CRIAR CARD
// =============================================

function criarCardHTML(filme) {
    const statusClasse = {
        'Assistido':      'status-assistido',
        'Assistindo':     'status-assistindo',
        'Quero assistir': 'status-quero'
    }[filme.status] || 'status-quero';

    const statusEmoji = {
        'Assistido':      '✅',
        'Assistindo':     '▶️',
        'Quero assistir': '🕐'
    }[filme.status] || '🕐';

    const nota = filme.nota !== null
        ? `<div class="card-nota">⭐ ${filme.nota}/10</div>`
        : '';

    const comentario = filme.comentario
        ? `<div class="card-comentario">"${filme.comentario}"</div>`
        : '';

    return `
        <div class="card" id="card-${filme.id}">
            <div class="card-titulo">${filme.titulo}</div>
            <div class="card-genero">${filme.genero}</div>
            <span class="card-status ${statusClasse}">
                ${statusEmoji} ${filme.status}
            </span>
            ${nota}
            ${comentario}
            <div class="card-actions">
                <button class="btn-editar"  onclick="abrirModal(${filme.id})">✏️ Editar</button>
                <button class="btn-deletar" onclick="deletarFilme(${filme.id})">🗑️ Deletar</button>
            </div>
        </div>
    `;
}


// =============================================
// 4. ADICIONAR FILME
// =============================================

async function adicionarFilme() {
    const titulo     = document.getElementById('titulo').value.trim();
    const genero     = document.getElementById('genero').value;
    const status     = document.getElementById('status').value;
    const nota       = document.getElementById('nota').value;
    const comentario = document.getElementById('comentario').value.trim();

    if (!titulo || !genero || !status) {
        alert('Preencha pelo menos o título, gênero e status!');
        return;
    }

    const dados = {
        titulo,
        genero,
        status,
        nota:       nota ? parseFloat(nota) : null,
        comentario: comentario || null
    };

    try {
        const resposta = await fetch(`${API_URL}/filmes`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(dados)
        });

        if (resposta.ok) {
            limparFormulario();
            await carregarFilmes();
        } else {
            const erro = await resposta.json();
            alert('Erro: ' + erro.detail);
        }

    } catch (erro) {
        console.error('Erro ao adicionar:', erro);
    }
}


// =============================================
// 5. DELETAR FILME
// =============================================

async function deletarFilme(id) {
    if (!confirm('Tem certeza que quer remover este filme da estante?')) return;

    try {
        const resposta = await fetch(`${API_URL}/filmes/${id}`, {
            method: 'DELETE'
        });

        if (resposta.ok) {
            await carregarFilmes();
        }

    } catch (erro) {
        console.error('Erro ao deletar:', erro);
    }
}


// =============================================
// 6. MODAL DE EDIÇÃO
// =============================================

function abrirModal(id) {
    const filme = todosOsFilmes.find(f => f.id === id);
    if (!filme) return;

    document.getElementById('edit-id').value         = filme.id;
    document.getElementById('edit-titulo').value     = filme.titulo;
    document.getElementById('edit-genero').value     = filme.genero;
    document.getElementById('edit-status').value     = filme.status;
    document.getElementById('edit-nota').value       = filme.nota || '';
    document.getElementById('edit-comentario').value = filme.comentario || '';

    document.getElementById('modal').style.display = 'flex';
}

function fecharModal() {
    document.getElementById('modal').style.display = 'none';
}

document.getElementById('modal').addEventListener('click', function(e) {
    if (e.target === this) fecharModal();
});


// =============================================
// 7. SALVAR EDIÇÃO
// =============================================

async function salvarEdicao() {
    const id   = document.getElementById('edit-id').value;
    const nota = document.getElementById('edit-nota').value;

    const dados = {
        titulo:     document.getElementById('edit-titulo').value.trim(),
        genero:     document.getElementById('edit-genero').value,
        status:     document.getElementById('edit-status').value,
        nota:       nota ? parseFloat(nota) : null,
        comentario: document.getElementById('edit-comentario').value.trim() || null
    };

    try {
        const resposta = await fetch(`${API_URL}/filmes/${id}`, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(dados)
        });

        if (resposta.ok) {
            fecharModal();
            await carregarFilmes();
        }

    } catch (erro) {
        console.error('Erro ao editar:', erro);
    }
}


// =============================================
// 8. FILTROS
// =============================================

function filtrar(status) {
    filtroAtivo = status;

    document.querySelectorAll('.filtro').forEach(btn => {
        btn.classList.remove('ativo');
    });

    event.target.classList.add('ativo');
    renderizarFilmes();
}


// =============================================
// 9. LIMPAR FORMULÁRIO
// =============================================

function limparFormulario() {
    document.getElementById('titulo').value     = '';
    document.getElementById('genero').value     = '';
    document.getElementById('status').value     = '';
    document.getElementById('nota').value       = '';
    document.getElementById('comentario').value = '';
}


// =============================================
// INICIALIZAR
// =============================================
document.addEventListener('DOMContentLoaded', carregarFilmes);