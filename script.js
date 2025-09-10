// Dados de exemplo, em um site real viriam de uma API
const games = [
    {
        id: 'game-1',
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Boston Celtics',
        odds: {
            homeWin: 1.65,
            awayWin: 2.20
        },
        time: 'Hoje, 20:00 BRT'
    },
    {
        id: 'game-2',
        homeTeam: 'Golden State Warriors',
        awayTeam: 'Brooklyn Nets',
        odds: {
            homeWin: 1.90,
            awayWin: 1.90
        },
        time: 'Hoje, 21:30 BRT'
    },
    {
        id: 'game-3',
        homeTeam: 'Milwaukee Bucks',
        awayTeam: 'Phoenix Suns',
        odds: {
            homeWin: 2.30,
            awayWin: 1.70
        },
        time: 'Amanhã, 19:00 BRT'
    },
    {
        id: 'game-4',
        homeTeam: 'Chicago Bulls',
        awayTeam: 'Miami Heat',
        odds: {
            homeWin: 2.10,
            awayWin: 1.75
        },
        time: 'Amanhã, 20:30 BRT'
    }
];

let betSlip = []; // Armazenará as apostas selecionadas
let stake = 10.00; // Valor inicial da aposta

// Seletores do DOM
const gamesContainer = document.getElementById('games-container');
const betList = document.getElementById('bet-list');
const stakeInput = document.getElementById('stake-input');
const totalOddsValue = document.getElementById('total-odds-value');
const potentialReturnValue = document.getElementById('potential-return-value');
const placeBetButton = document.getElementById('place-bet-button');

// Função para renderizar os jogos no DOM
function renderGames() {
    gamesContainer.innerHTML = ''; // Limpa o container antes de adicionar
    games.forEach(game => {
        const gameCard = document.createElement('div');
        gameCard.classList.add('game-card');
        gameCard.innerHTML = `
            <h3>${game.homeTeam} <i class="fas fa-versus"></i> ${game.awayTeam}</h3>
            <p class="game-time">${game.time}</p>
            <div class="odd-selection">
                <button class="odd-button" data-game-id="${game.id}" data-team="${game.homeTeam}" data-bet-type="homeWin" data-odd="${game.odds.homeWin}">
                    ${game.homeTeam} <br> <strong>${game.odds.homeWin.toFixed(2)}</strong>
                </button>
                <button class="odd-button" data-game-id="${game.id}" data-team="${game.awayTeam}" data-bet-type="awayWin" data-odd="${game.odds.awayWin}">
                    ${game.awayTeam} <br> <strong>${game.odds.awayWin.toFixed(2)}</strong>
                </button>
            </div>
        `;
        gamesContainer.appendChild(gameCard);
    });

    // Reaplicar a seleção visual se já houver apostas no ticket
    updateGameCardSelections();
}

// Função para atualizar a seleção visual nos cards dos jogos
function updateGameCardSelections() {
    document.querySelectorAll('.odd-button').forEach(btn => btn.classList.remove('selected'));
    betSlip.forEach(bet => {
        const selectedBtn = document.querySelector(`.odd-button[data-game-id="${bet.gameId}"][data-bet-type="${bet.betType}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
        }
    });
}

// Função para atualizar o ticket de aposta
function updateBetSlip() {
    betList.innerHTML = '';
    let totalOdds = 1.00;

    if (betSlip.length === 0) {
        betList.innerHTML = '<li class="empty-slip">Nenhuma aposta selecionada.</li>';
        placeBetButton.disabled = true;
    } else {
        betSlip.forEach(bet => {
            const betItem = document.createElement('li');
            betItem.innerHTML = `
                <span>${bet.team} (${bet.odd.toFixed(2)})</span>
                <button class="remove-bet" data-game-id="${bet.gameId}" aria-label="Remover aposta"><i class="fas fa-times"></i></button>
            `;
            betList.appendChild(betItem);
            totalOdds *= bet.odd;
        });
        placeBetButton.disabled = false;
    }

    totalOddsValue.textContent = totalOdds.toFixed(2);
    potentialReturnValue.textContent = (stake * totalOdds).toFixed(2);
    updateGameCardSelections(); // Garante que a seleção visual esteja sempre correta
}

// Event Listener para seleção de odds nos jogos
gamesContainer.addEventListener('click', (event) => {
    const target = event.target.closest('.odd-button'); // Garante que pegamos o botão mesmo clicando no texto
    if (target) {
        const gameId = target.dataset.gameId;
        const team = target.dataset.team;
        const betType = target.dataset.betType;
        const odd = parseFloat(target.dataset.odd);

        const existingBetIndex = betSlip.findIndex(b => b.gameId === gameId);

        if (existingBetIndex > -1) {
            // Se a aposta já existe para o mesmo jogo
            if (betSlip[existingBetIndex].betType === betType) {
                // Se for a mesma aposta, remove (desseleciona)
                betSlip.splice(existingBetIndex, 1);
            } else {
                // Se for outra aposta no mesmo jogo, substitui
                betSlip[existingBetIndex] = { gameId, team, betType, odd };
            }
        } else {
            // Adiciona nova aposta
            betSlip.push({ gameId, team, betType, odd });
        }
        updateBetSlip();
    }
});

// Event Listener para remover aposta do ticket
betList.addEventListener('click', (event) => {
    const target = event.target.closest('.remove-bet');
    if (target) {
        const gameIdToRemove = target.dataset.game-id;
        betSlip = betSlip.filter(bet => bet.gameId !== gameIdToRemove);
        updateBetSlip();
    }
});

// Event Listener para o input de valor da aposta
stakeInput.addEventListener('input', (event) => {
    const newStake = parseFloat(event.target.value);
    if (!isNaN(newStake) && newStake >= 1) {
        stake = newStake;
    } else if (event.target.value === '') {
        stake = 0; // Ou defina um valor padrão razoável se o campo estiver vazio
    }
    updateBetSlip();
});

// Event Listener para fazer a aposta
placeBetButton.addEventListener('click', () => {
    if (betSlip.length > 0 && stake > 0) {
        // Em um sistema real, aqui você enviaria os dados para o backend para processamento
        alert(`Aposta de R$${stake.toFixed(2)} realizada com sucesso! Retorno potencial: R$${potentialReturnValue.textContent}`);
        betSlip = []; // Limpa o ticket após a aposta
        stake = 10.00; // Reset o valor da aposta
        stakeInput.value = stake.toFixed(2);
        updateBetSlip();
    } else if (betSlip.length === 0) {
        alert('Adicione pelo menos uma aposta ao seu ticket.');
    } else {
        alert('Por favor, insira um valor de aposta válido.');
    }
});

// Inicializa a aplicação quando o DOM estiver completamente carregado
document.addEventListener('DOMContentLoaded', () => {
    renderGames();
    updateBetSlip();
    stakeInput.value = stake.toFixed(2); // Garante que o input tenha o valor inicial
}); 
