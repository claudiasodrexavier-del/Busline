// --- CONFIGURAÇÕES E BANCO ---
const LOGIN_USER = "admin";
const LOGIN_PASS = "1234";

// Recupera os dados do estoque (Local Storage). Se vazio, retorna um array em branco.
const getDB = () => JSON.parse(localStorage.getItem('produtos_ti') || '[]');
const setDB = (dados) => { localStorage.setItem('produtos_ti', JSON.stringify(dados)); refresh(); };

// Recupera os itens salvos no carrinho do usuário.
const getCart = () => JSON.parse(localStorage.getItem('carrinho_ti') || '[]');
const setCart = (dados) => { localStorage.setItem('carrinho_ti', JSON.stringify(dados)); refresh(); };

// Centralizador de renderização. Sempre que algo muda, atualiza as telas abertas.
function refresh() {
    if (document.getElementById('corpoTabela')) renderTabelaAdm();
    if (document.getElementById('listaCatalogo')) renderCatalogo();
    if (document.getElementById('corpoCarrinho')) renderCarrinho();
}

// --- SEGURANÇA ---
if (window.location.pathname.includes('produtos.html') && sessionStorage.getItem('logado') !== 'true') {
    window.location.href = 'login.html';
}
window.logout = () => { sessionStorage.removeItem('logado'); window.location.href = 'index.html'; };

// --- LOGIN ---
const formLogin = document.getElementById('formLogin');
if (formLogin) {
    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        if (document.getElementById('usuario').value === LOGIN_USER && document.getElementById('senha').value === LOGIN_PASS) {
            sessionStorage.setItem('logado', 'true');
            window.location.href = 'produtos.html';
        } else { alert("Acesso Negado!"); }
    });
}

// --- ITEM 1: VINCULAR PROMOÇÃO NO CARRINHO ---
// Esta função lida especificamente com itens comprados através da aba de promoções
window.adicionarPromocaoAoCarrinho = (id, nome, preco) => {
    const cart = getCart();
    
    // Verifica se esse item promocional já consta na lista do carrinho
    const itemExistente = cart.find(i => i.id === id);

    if (itemExistente) {
        itemExistente.qtd++;
    } else {
        // Insere o produto com o preço já reduzido da promoção
        cart.push({ id: id, nome: nome, preco: preco, qtd: 1 });
    }
    
    setCart(cart);
    alert(`${nome} adicionado com preço promocional de R$ ${preco.toFixed(2)}!`);
};

// --- ITEM 3: CALCULAR VALIDADE DOS CRÉDITOS (+90 DIAS) ---
// Função auxiliar que lê a data de hoje e gera uma string formatada contendo a data limite.
function calcularDataValidade() {
    const dataAtual = new Date();
    // Incrementa 90 dias na data de hoje
    dataAtual.setDate(dataAtual.getDate() + 90);
    
    // Formata o resultado no padrão brasileiro DD/MM/AAAA
    const dia = String(dataAtual.getDate()).padStart(2, '0');
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0'); // Meses começam do 0 no JS
    const ano = dataAtual.getFullYear();
    
    return `${dia}/${mes}/${ano}`;
}

// --- FUNÇÕES DO CARRINHO (CRUD CLIENTE) ---
function renderCarrinho() {
    const corpo = document.getElementById('corpoCarrinho');
    if (!corpo) return;
    const cart = getCart();
    corpo.innerHTML = '';
    let totalGeral = 0;

    if (cart.length === 0) {
        corpo.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Seu carrinho está vazio.</td></tr>';
    } else {
        // Busca a data limite calculada para exibição na linha
        const dataValidadeStr = calcularDataValidade();

        cart.forEach((item, index) => {
            const subtotal = item.preco * item.qtd;
            totalGeral += subtotal;
            
            // Injeção dinâmica da linha adicionando a célula da Validade calculada
            corpo.innerHTML += `
                <tr>
                    <td><strong>${item.nome}</strong></td>
                    <td>R$ ${parseFloat(item.preco).toFixed(2)}</td>
                    <td><input type="number" value="${item.qtd}" min="1" onchange="alterarQtd(${index}, this.value)" style="width:60px; padding:5px;"></td>
                    <td style="color: var(--danger); font-weight: bold;">${dataValidadeStr} (90 dias)</td>
                    <td>R$ ${subtotal.toFixed(2)}</td>
                    <td><button class="btn-perigo" onclick="removerDoCarrinho(${index})">Remover</button></td>
                </tr>`;
        });
    }
    const totalDisplay = document.getElementById('totalCarrinho');
    if (totalDisplay) totalDisplay.innerText = `Total: R$ ${totalGeral.toFixed(2)}`;
}

window.adicionarAoCarrinho = (id) => {
    const db = getDB();
    const cart = getCart();
    const prod = db.find(p => p.id === id);
    const itemExistente = cart.find(i => i.id === id);

    if (itemExistente) {
        itemExistente.qtd++;
    } else {
        cart.push({ ...prod, qtd: 1 });
    }
    setCart(cart);
    alert(`${prod.nome} adicionado com sucesso!`);
};

window.alterarQtd = (index, novaQtd) => {
    const cart = getCart();
    cart[index].qtd = parseInt(novaQtd);
    setCart(cart);
};

window.removerDoCarrinho = (index) => {
    const cart = getCart();
    cart.splice(index, 1);
    setCart(cart);
};

window.limparTodoCarrinho = () => {
    if (confirm("Deseja esvaziar o carrinho?")) {
        setCart([]);
    }
};

// --- ITEM 2: ALTERNAR CAMPOS DE PAGAMENTO DINAMICAMENTE ---
// Esconde ou exibe os blocos de input conforme a escolha do Select de pagamentos
window.alternarCamposPagamento = () => {
    const metodo = document.getElementById('metodoPagamento').value;
    
    // Captura os elementos HTML contêineres das caixas
    const campoPix = document.getElementById('campoPix');
    const campoDebito = document.getElementById('campoDebito');
    const campoCredito = document.getElementById('campoCredito');

    // Reseta todos para "none" (invisível) por padrão
    campoPix.style.display = 'none';
    campoDebito.style.display = 'none';
    campoCredito.style.display = 'none';

    // Exibe apenas o bloco correspondente ao método selecionado
    if (metodo === 'pix') campoPix.style.display = 'block';
    if (metodo === 'debito') campoDebito.style.display = 'block';
    if (metodo === 'credito') campoCredito.style.display = 'block';
};

// --- FUNÇÃO FINALIZAR PEDIDO (VALIDADA COM PAGAMENTO) ---
window.finalizarPedido = () => {
    const cart = getCart();
    if (cart.length === 0) {
        alert("Seu carrinho está vazio! Adicione passagens antes de finalizar.");
        return;
    }

    const metodo = document.getElementById('metodoPagamento').value;
    if (!metodo) {
        alert("Por favor, selecione um método de pagamento antes de prosseguir.");
        return;
    }

    // Validação dos dados preenchidos conforme a escolha do usuário
    if (metodo === 'pix') {
        const chave = document.getElementById('chavePixInput').value.trim();
        if (!chave) { alert("Por favor, preencha o campo de chave Pix."); return; }
    } 
    else if (metodo === 'debito') {
        const banco = document.getElementById('bancoInput').value.trim();
        const ag = document.getElementById('agenciaInput').value.trim();
        const conta = document.getElementById('contaInput').value.trim();
        if (!banco || !ag || !conta) { alert("Por favor, preencha todos os dados da conta corrente."); return; }
    } 
    else if (metodo === 'credito') {
        const num = document.getElementById('cartaoNumero').value.trim();
        const nome = document.getElementById('cartaoNome').value.trim();
        const val = document.getElementById('cartaoValidade').value.trim();
        const cvv = document.getElementById('cartaoCVV').value.trim();
        if (!num || !nome || !val || !cvv) { alert("Por favor, preencha todos os dados do cartão de crédito."); return; }
    }
    
    // Sucesso na transação simulada
    alert("Compra autorizada e finalizada com sucesso! Seus créditos estarão disponíveis e serão válidos por 90 dias.");
    setCart([]); // Esvazia o carrinho local do usuário
    window.location.href = 'index.html'; // Redireciona à página inicial
};

// --- FUNÇÕES ADMINISTRATIVAS (CRUD ADM) ---
function renderTabelaAdm() {
    const corpo = document.getElementById('corpoTabela');
    if (!corpo) return;
    corpo.innerHTML = '';
    getDB().forEach(p => {
        corpo.innerHTML += `
            <tr>
                <td><img src="${p.imagem}" class="img-mini" onerror="this.src='https://via.placeholder.com/50'"></td>
                <td>${p.nome}</td>
                <td>${p.categoria}</td>
                <td>R$ ${p.preco}</td>
                <td>
                    <button class="btn-info" onclick="abrirModal(${p.id})">Editar</button>
                    <button class="btn-perigo" onclick="deletar(${p.id})">Excluir</button>
                </td>
            </tr>`;
    });
}

const fProd = document.getElementById('formProduto');
if (fProd) {
    fProd.addEventListener('submit', (e) => {
        e.preventDefault();
        const db = getDB();
        db.push({
            id: Date.now(),
            nome: document.getElementById('nome').value,
            categoria: document.getElementById('categoria').value,
            preco: parseFloat(document.getElementById('preco').value).toFixed(2),
            imagem: document.getElementById('urlImagem').value
        });
        setDB(db);
        fProd.reset();
    });
}

window.abrirModal = (id) => {
    const p = getDB().find(x => x.id === id);
    document.getElementById('edit-id').value = p.id;
    document.getElementById('edit-nome').value = p.nome;
    document.getElementById('edit-categoria').value = p.categoria;
    document.getElementById('edit-preco').value = p.preco;
    document.getElementById('edit-urlImagem').value = p.imagem;
    document.getElementById('modalEdicao').style.display = 'block';
};

const fEdit = document.getElementById('formEdicao');
if (fEdit) {
    fEdit.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = parseInt(document.getElementById('edit-id').value);
        let db = getDB();
        const i = db.findIndex(p => p.id === id);
        db[i] = { 
            id, 
            nome: document.getElementById('edit-nome').value,
            categoria: document.getElementById('edit-categoria').value, 
            preco: parseFloat(document.getElementById('edit-preco').value).toFixed(2), 
            imagem: document.getElementById('edit-urlImagem').value 
        };
        setDB(db);
        fecharModal();
    });
}

window.fecharModal = () => document.getElementById('modalEdicao').style.display = 'none';
window.deletar = (id) => { if(confirm("Excluir?")) setDB(getDB().filter(x => x.id !== id)); };

function renderCatalogo() {
    const lista = document.getElementById('listaCatalogo');
    if (!lista) return;
    const db = getDB();
    lista.innerHTML = db.length ? '' : '<p class="text-center">Estoque vazio.</p>';
    db.forEach(p => {
        const div = document.createElement('div');
        div.className = 'card-servico';
        div.innerHTML = `
            <img src="${p.imagem}" class="card-img">
            <h4>${p.nome}</h4>
            <p>R$ ${parseFloat(p.preco).toFixed(2)}</p>
            <button class="btn-cta" onclick="adicionarAoCarrinho(${p.id})">🛒 Adicionar</button>`;
        lista.appendChild(div);
    });
}

// Inicialização automática das listagens ao abrir a página correspondente
refresh();
