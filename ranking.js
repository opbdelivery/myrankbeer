// Funções auxiliares para manipular cookies
function setCookie(name, value, days) {
    const expires = "expires=" + new Date(new Date().getTime() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = name + "=" + (value || "") + ";" + expires + ";path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function deleteCookie(name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

// Array para armazenar os participantes e seus consumos
let participantes = obterParticipantes();

// Função para salvar os participantes em um cookie
function salvarParticipantes(participantes) {
    setCookie('participantes', JSON.stringify(participantes), 7);
}

// Função para obter os participantes do cookie
function obterParticipantes() {
    const participantesCookie = getCookie('participantes');
    return participantesCookie ? JSON.parse(participantesCookie) : [];
}

// Função para atualizar o layout da lista de participantes
function atualizarLista() {
    const listaRanking = document.querySelector(".ranking-table tbody");
    listaRanking.innerHTML = ""; // Limpar a lista antes de renderizar novamente

    // Ordenar participantes por quantidade de litros (maior para menor)
    participantes.sort((a, b) => b.litros - a.litros);

    // Atualizar os 13 melhores ou preencher com linhas vazias
    for (let i = 0; i < 13; i++) {
        const participante = participantes[i] || { nome: "", litros: 0 };
        const tr = document.createElement("tr");

        // Adiciona classes para o top 3
        if (i === 0) tr.classList.add("top1");
        if (i === 1) tr.classList.add("top2");
        if (i === 2) tr.classList.add("top3");

        tr.innerHTML = `
            <td>${i + 1}º</td>
            <td>${participante.nome || '-'}</td>
            <td>${participante.litros ? participante.litros.toFixed(2) + "L" : '-'}</td>
            <td class="btn-group">
                <button onclick="alterarLitros('${participante.nome}', '+')">+</button>
                <button onclick="alterarLitros('${participante.nome}', '-')">-</button>
                <button onclick="removerParticipante('${participante.nome}')">sair</button>
            </td>
        `;

        listaRanking.appendChild(tr);
    }

    atualizarRanking();
}

// Função para adicionar um novo participante
function adicionarParticipante() {
    const nome = document.getElementById("novoParticipante").value;
    const litros = parseFloat(document.getElementById("litrosConsumidos").value);

    if (nome && !isNaN(litros) && litros > 0) {
        participantes.push({ nome, litros });
        salvarParticipantes(participantes);
        atualizarLista(); // Atualiza a lista e o top 3
        atualizarGrafico(); // Atualiza o gráfico
    } else {
        alert("Por favor, insira um nome válido e uma quantidade de litros maior que 0.");
    }

    // Limpar os campos após adicionar
    document.getElementById("novoParticipante").value = '';
    document.getElementById("litrosConsumidos").value = '';
}

// Função para remover um participante
function removerParticipante(nome) {
    if (nome) {
        // Filtra o array de participantes para remover o participante
        participantes = participantes.filter(part => part.nome !== nome);
        salvarParticipantes(participantes);

        // Atualiza a lista e o ranking
        atualizarLista();
        
        alert(`${nome} foi removido da competição!`);
    }
}

// Função para alterar a quantidade de litros
function alterarLitros(nome, operacao) {
    const participante = participantes.find(part => part.nome === nome);
    if (participante) {
        if (operacao === '+') {
            participante.litros += 0.2;
        } else if (operacao === '-') {
            participante.litros = Math.max(0, participante.litros - 0.2);
        }
        salvarParticipantes(participantes);
        atualizarLista();
        atualizarGrafico();
    }
}

// Função para exibir a mensagem de conquista
function mostrarMensagemConquista(usuario) {
    const mensagemConquista = document.getElementById("mensagem-conquista");
    mensagemConquista.textContent = `Parabéns, ${usuario}! Você subiu no ranking!`;

    // Exibe a mensagem com animação
    mensagemConquista.style.display = "block";
    
    // Remove a mensagem após 5 segundos
    setTimeout(() => {
        mensagemConquista.style.display = "none";
    }, 5000);
}

// Função para atualizar o ranking visual
function atualizarRanking() {
    // Ordena os participantes pelo número de litros, em ordem decrescente
    participantes.sort((a, b) => b.litros - a.litros);

    // Atualiza a seção de troféus e medalhas
    document.getElementById('nome-primeiro').innerText = participantes[0]?.nome || 'Vazio';
    document.getElementById('nome-segundo').innerText = participantes[1]?.nome || 'Vazio';
    document.getElementById('nome-terceiro').innerText = participantes[2]?.nome || 'Vazio';

    // Exibe mensagem de conquista para usuários que subiram de posição
    participantes.forEach((participante, index) => {
        const anterior = participantes[index + 1];
        if (anterior && participante.litros > anterior.litros) {
            mostrarMensagemConquista(participante.nome);
        }
    });
}

// Função para atualizar o gráfico
function atualizarGrafico() {
    const ctx = document.getElementById("grafico").getContext("2d");

    const nomes = participantes.slice(0, 3).map(p => p.nome);
    const litros = participantes.slice(0, 3).map(p => p.litros);

    // Se houver um gráfico anterior, destrua-o
    if (window.meuGrafico) {
        window.meuGrafico.destroy();
    }

    // Criar novo gráfico
    window.meuGrafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: nomes,
            datasets: [{
                label: 'Litros Consumidos',
                data: litros,
                backgroundColor: ['#ffd700', '#c0c0c0', '#cd7f32', ''],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + ' L';
                        }
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutBounce',
                onComplete: function() {
                    document.querySelectorAll('.bar').forEach(function(bar) {
                        var foam = document.createElement('div');
                        foam.className = 'foam';
                        bar.appendChild(foam);
                    });
                }
            }
        }
    });
}

// Inicializa a lista e gráfico ao carregar a página
window.onload = function () {
    atualizarLista();
    atualizarGrafico();
};
