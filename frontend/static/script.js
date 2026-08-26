// =============================================
// VARIÁVEL GLOBAL — guarda todos os filmes
// =============================================
let todosOsFilmes = [];   // começa vazia, vai ser preenchida ao carregar a página
let filtroAtivo   = 'Todos';


// =============================================
// 1. CARREGAR FILMES — roda quando a página abre
// =============================================

async function carregarFilmes() {
    // "async" significa que essa função vai esperar respostas do servidor
    // sem travar o navegador. É como ligar pro garçom e esperar ele vir.

    try {
        const resposta = await fetch('/filmes');
        // fetch('/filmes') faz um GET para http://localhost:5000/filmes
        // "await" espera a resposta chegar antes de continuar

        todosOsFilmes = await resposta.json();
        // .json() converte a resposta (texto) em objeto JavaScript
        // "await" de novo porque isso também leva um tempinho

        renderizarFilmes();
        // agora que temos os dados, manda desenhar na tela

    } catch (erro) {
        console.error('Erro ao carregar filmes:', erro);
        document.getElementById('lista-filmes').innerHTML =
            '<p class="empty"><span>😵</span>Erro ao carregar. Servidor está rodando?</p>';
    }
}


// =============================================
// 2. RENDERIZAR — desenha os cards na tela
// =============================================

function renderizarFilmes() {
    const lista = document.getElementById('lista-filmes');
    // getElementById busca um elemento HTML pelo id

    // Filtra conforme o botão ativo
    const filmesFiltrados = filtroAtivo === 'Todos'
        ? todosOsFilmes
        : todosOsFilmes.filter(f => f.status === filtroAtivo);
    // .filter() cria uma nova lista só com quem passa na condição
    // f => f.status === filtroAtivo: "pega só filmes cujo status é igual ao filtro"

    // Se não tiver nenhum filme, mostra mensagem amigável
    if (filmesFiltrados.length === 0) {
        lista.innerHTML = `
            <div class="empty">
                <span>🎬</span>
                <p>Nenhum filme aqui ainda. Adicione o primeiro!</p>
            </div>`;
        return;  // para a função aqui, não precisa continuar
    }

    // Monta o HTML de todos os cards de uma vez
    lista.innerHTML = filmesFiltrados.map(filme => criarCardHTML(filme)).join('');
    // .map() transforma cada filme num HTML de card
    // .join('') junta todos os HTMLs num só texto
}


// =============================================
// 3. CRIAR CARD — monta o HTML de um filme
// =============================================

function criarCardHTML(filme) {
    // Define a classe de cor do status
    const statusClasse = {
        'Assistido':      'status-assistido',
        'Assistindo':     'status-assistindo',
        'Quero assistir': 'status-quero'
    }[filme.status] || 'status-quero';
    // Isso é um "dicionário" — busca a classe pelo nome do status

    const statusEmoji = {
        'Assistido':      '✅',
        'Assistindo':     '▶️',
        'Quero assistir': '🕐'
    }[filme.status] || '🕐';

    const nota = filme.nota !== null
        ? `<div class="card-nota">⭐ ${filme.nota}/10</div>`
        : '';
    // Se não tem nota, não mostra nada

    const comentario = filme.comentario
        ? `<div class="card-comentario">"${filme.comentario}"</div>`
        : '';

    // Template literal — monta o HTML com os dados do filme
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
    // Note: o ${...} dentro da template literal injeta valores JavaScript no HTML
}


// =============================================
// 4. ADICIONAR FILME
// =============================================

async function adicionarFilme() {
    // Pega o valor de cada campo do formulário
    const titulo     = document.getElementById('titulo').value.trim();
    const genero     = document.getElementById('genero').value;
    const status     = document.getElementById('status').value;
    const nota       = document.getElementById('nota').value;
    const comentario = document.getElementById('comentario').value.trim();

    // Validação básica no front-end
    if (!titulo || !genero || !status) {
        alert('Preencha pelo menos o título, gênero e status!');
        return;
    }

    // Monta o objeto com os dados
    const dados = {
        titulo,
        genero,
        status,
        nota:       nota ? parseFloat(nota) : null,
        // parseFloat converte texto "9.5" para número 9.5
        // se nota estiver vazio, manda null
        comentario: comentario || null
    };

    try {
        const resposta = await fetch('/filmes', {
            method:  'POST',           // tipo da requisição
            headers: { 'Content-Type': 'application/json' },
            // headers: avisa o servidor que estamos mandando JSON
            body: JSON.stringify(dados)
            // JSON.stringify: converte o objeto JS para texto JSON
        });

        if (resposta.ok) {
            // .ok é true se o status HTTP foi 200-299 (sucesso)
            limparFormulario();
            await carregarFilmes();   // recarrega a lista com o novo filme
        } else {
            const erro = await resposta.json();
            alert('Erro: ' + erro.erro);
        }

    } catch (erro) {
        console.error('Erro ao adicionar:', erro);
    }
}


// =============================================
// 5. DELETAR FILME
// =============================================

async function deletarFilme(id) {
    // Pede confirmação antes de deletar
    if (!confirm('Tem certeza que quer remover este filme da estante?')) return;

    try {
        const resposta = await fetch(`/filmes/${id}`, {
            method: 'DELETE'
        });

        if (resposta.ok) {
            await carregarFilmes();   // atualiza a lista
        }

    } catch (erro) {
        console.error('Erro ao deletar:', erro);
    }
}


// =============================================
// 6. MODAL DE EDIÇÃO
// =============================================

function abrirModal(id) {
    // Busca o filme na lista local (sem precisar ir ao servidor)
    const filme = todosOsFilmes.find(f => f.id === id);
    // .find() retorna o primeiro item que satisfaz a condição

    if (!filme) return;

    // Preenche os campos do modal com os dados do filme
    document.getElementById('edit-id').value         = filme.id;
    document.getElementById('edit-titulo').value     = filme.titulo;
    document.getElementById('edit-genero').value     = filme.genero;
    document.getElementById('edit-status').value     = filme.status;
    document.getElementById('edit-nota').value       = filme.nota || '';
    document.getElementById('edit-comentario').value = filme.comentario || '';

    // Mostra o modal
    document.getElementById('modal').style.display = 'flex';
}

function fecharModal() {
    document.getElementById('modal').style.display = 'none';
}

// Fecha o modal se clicar fora dele
document.getElementById('modal').addEventListener('click', function(e) {
    if (e.target === this) fecharModal();
    // e.target: o elemento que foi clicado
    // "this": o overlay (fundo escuro)
    // se clicou no fundo (e não no box), fecha
});


// =============================================
// 7. SALVAR EDIÇÃO
// =============================================

async function salvarEdicao() {
    const id = document.getElementById('edit-id').value;
    const nota = document.getElementById('edit-nota').value;

    const dados = {
        titulo:     document.getElementById('edit-titulo').value.trim(),
        genero:     document.getElementById('edit-genero').value,
        status:     document.getElementById('edit-status').value,
        nota:       nota ? parseFloat(nota) : null,
        comentario: document.getElementById('edit-comentario').value.trim() || null
    };

    try {
        const resposta = await fetch(`/filmes/${id}`, {
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

    // Atualiza o botão ativo visualmente
    document.querySelectorAll('.filtro').forEach(btn => {
        btn.classList.remove('ativo');
        // querySelectorAll: pega TODOS os elementos com aquela classe
        // forEach: percorre cada um
        // classList.remove: remove a classe CSS "ativo"
    });

    // Adiciona "ativo" no botão clicado
    event.target.classList.add('ativo');

    renderizarFilmes();   // redesenha com o filtro aplicado
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
// INICIALIZAR — roda quando a página termina de carregar
// =============================================
document.addEventListener('DOMContentLoaded', carregarFilmes);
// DOMContentLoaded: evento que dispara quando o HTML terminou de carregar
// Só aí chamamos carregarFilmes — garantindo que os elementos existem na tela