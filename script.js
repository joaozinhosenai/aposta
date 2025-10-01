// ===== CONFIGURAÇÕES =====
const CONFIG = {
    INITIAL_BALANCE: 1000,
    MIN_BET: 10,
    API_TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
    AUTO_REFRESH: 30000 // 30 segundos
};

const ERROR_CODES = {
    API_TIMEOUT: 'ERR_001',
    API_UNAVAILABLE: 'ERR_002',
    INVALID_DATA: 'ERR_003',
    INSUFFICIENT_BALANCE: 'ERR_004',
    MATCH_STARTED: 'ERR_005',
    NETWORK_ERROR: 'ERR_006'
};

// ===== ESTADO DA APLICAÇÃO =====
const state = {
    balance: CONFIG.INITIAL_BALANCE,
    currentBet: null,
    matches: [],
    bettingHistory: [],
    stats: { totalBets: 0, wonBets: 0, totalProfit: 0 },
    filters: { sport: 'all', league: 'all', status: 'all', odd: 'all', search: '' },
    historyFilter: 'all',
    theme: 'dark',
    autoRefreshInterval: null
};

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎰 BetPro v2.0 iniciado');
    loadFromStorage();
    updateUI();
    setupEventListeners();
    loadMatches();
    startAutoRefresh();
});

// ===== PERSISTÊNCIA DE DADOS =====
function loadFromStorage() {
    try {
        const storedData = localStorage.getItem('betProData');
        if (storedData) {
            const data = JSON.parse(storedData);
            state.balance = data.balance || CONFIG.INITIAL_BALANCE;
            state.bettingHistory = data.history || [];
            state.stats = data.stats || state.stats;
        }
    } catch (error) {
        console.error('❌ Erro ao carregar dados do localStorage:', error);
    }
}

function saveToStorage() {
    try {
        const dataToSave = {
            balance: state.balance,
            history: state.bettingHistory,
            stats: state.stats,
            lastUpdate: Date.now()
        };
        localStorage.setItem('betProData', JSON.stringify(dataToSave));
    } catch (error) {
        console.error('❌ Erro ao salvar dados no localStorage:', error);
    }
}

// ===== CARREGAMENTO DE PARTIDAS =====
async function loadMatches(attempt = 1) {
    const loadingEl = document.getElementById('loadingMatches');
    const errorEl = document.getElementById('errorMessage');
   
    try {
        loadingEl.style.display = 'block';
        errorEl.style.display = 'none';

        // Simula carregamento de APIs
        await new Promise(resolve => setTimeout(resolve, 1000));
       
        state.matches = generateEnhancedMockMatches();
        console.log(`✅ ${state.matches.length} partidas carregadas`);
       
        renderMatches();
        loadingEl.style.display = 'none';
        showSuccess('Partidas atualizadas com sucesso!');

    } catch (error) {
        console.error('❌ Erro:', error);
        if (attempt < CONFIG.RETRY_ATTEMPTS) {
            setTimeout(() => loadMatches(attempt + 1), 2000);
        } else {
            loadingEl.style.display = 'none';
            showError('Erro ao carregar partidas. Usando dados de demonstração.');
            state.matches = generateEnhancedMockMatches();
            renderMatches();
        }
    }
}

function generateEnhancedMockMatches() {
    const teams = [
        { name: 'Manchester City', logo: '🔵', country: 'ENG' },
        { name: 'Real Madrid', logo: '⚪', country: 'ESP' },
        { name: 'Bayern München', logo: '🔴', country: 'GER' },
        { name: 'PSG', logo: '💙', country: 'FRA' },
        { name: 'Liverpool', logo: '🔴', country: 'ENG' },
        { name: 'Barcelona', logo: '🔵', country: 'ESP' },
        { name: 'Juventus', logo: '⚫', country: 'ITA' },
        { name: 'Chelsea', logo: '🔵', country: 'ENG' },
        { name: 'Atlético Madrid', logo: '🔴', country: 'ESP' },
        { name: 'Inter Milan', logo: '🔵', country: 'ITA' },
        { name: 'Borussia Dortmund', logo: '🟡', country: 'GER' },
        { name: 'Arsenal', logo: '🔴', country: 'ENG' }
    ];

    const leagues = [
        { name: 'Premier League', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
        { name: 'La Liga', icon: '🇪🇸' },
        { name: 'Bundesliga', icon: '🇩🇪' },
        { name: 'Serie A', icon: '🇮🇹' },
        { name: 'Ligue 1', icon: '🇫🇷' },
        { name: 'Champions League', icon: '⭐' }
    ];

    const matches = [];
    const now = new Date();

    for (let i = 0; i < 15; i++) {
        const homeTeam = teams[Math.floor(Math.random() * teams.length)];
        let awayTeam = teams[Math.floor(Math.random() * teams.length)];
       
        while (awayTeam.name === homeTeam.name) {
            awayTeam = teams[Math.floor(Math.random() * teams.length)];
        }

        const league = leagues[Math.floor(Math.random() * leagues.length)];
        const isLive = Math.random() > 0.6;
        const matchTime = new Date(now.getTime() + (Math.random() * 7200000));

        const homeOdd = (1.3 + Math.random() * 3).toFixed(2);
        const drawOdd = (2.5 + Math.random() * 2).toFixed(2);
        const awayOdd = (1.3 + Math.random() * 3).toFixed(2);

        matches.push({
            id: `match_${i + 1}`,
            homeTeam: homeTeam.name,
            homeLogo: homeTeam.logo,
            awayTeam: awayTeam.name,
            awayLogo: awayTeam.logo,
            league: league.name,
            leagueIcon: league.icon,
            time: matchTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            isLive: isLive,
            odds: { home: homeOdd, draw: drawOdd, away: awayOdd },
            sport: 'football',
            status: isLive ? 'live' : 'scheduled',
            stats: {
                homeForm: Math.floor(Math.random() * 100),
                awayForm: Math.floor(Math.random() * 100),
                h2h: `${Math.floor(Math.random() * 5)}-${Math.floor(Math.random() * 5)}`
            }
        });
    }

    return matches;
}

// ===== RENDERIZAÇÃO =====
function renderMatches() {
    const matchesGrid = document.getElementById('matchesGrid');
    const filters = state.filters;
   
    let filteredMatches = state.matches.filter(match => {
        if (filters.sport !== 'all' && match.sport !== filters.sport) return false;
        if (filters.status !== 'all' && match.status !== filters.status) return false;
        if (filters.odd !== 'all') {
            const maxOdd = Math.max(match.odds.home, match.odds.draw, match.odds.away);
            if (filters.odd === 'low' && maxOdd > 2) return false;
            if (filters.odd === 'medium' && (maxOdd <= 2 || maxOdd > 4)) return false;
            if (filters.odd === 'high' && maxOdd <= 4) return false;
        }
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            return match.homeTeam.toLowerCase().includes(searchLower) ||
                   match.awayTeam.toLowerCase().includes(searchLower);
        }
        return true;
    });

    if (filteredMatches.length === 0) {
        matchesGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-icon">🔍</div>
                <p>Nenhuma partida encontrada  
Tente ajustar os filtros</p>
            </div>
        `;
        return;
    }

    matchesGrid.innerHTML = filteredMatches.map(match => `
        <article class="match-card" data-match-id="${match.id}" role="listitem">
            <div class="match-header">
                <span class="league-badge">
                    ${match.leagueIcon} ${match.league}
                </span>
                ${match.isLive ?
                    '<span class="live-indicator"><span class="live-dot"></span> AO VIVO</span>' :
                    `<span class="match-time">⏰ ${match.time}</span>`
                }
            </div>
           
            <div class="teams-container">
                <div class="team">
                    <div class="team-logo">${match.homeLogo}</div>
                    <span class="team-name">${match.homeTeam}</span>
                </div>
                <div class="vs">VS</div>
                <div class="team">
                    <div class="team-logo">${match.awayLogo}</div>
                    <span class="team-name">${match.awayTeam}</span>
                </div>
            </div>

            <div class="match-stats">
                <div class="stat-mini">
                    <div class="stat-mini-value">${match.stats.homeForm}%</div>
                    <div class="stat-mini-label">Forma Casa</div>
                </div>
                <div class="stat-mini">
                    <div class="stat-mini-value">${match.stats.h2h}</div>
                    <div class="stat-mini-label">H2H</div>
                </div>
                <div class="stat-mini">
                    <div class="stat-mini-value">${match.stats.awayForm}%</div>
                    <div class="stat-mini-label">Forma Fora</div>
                </div>
            </div>

            <div class="odds-container">
                <button class="odd-button" data-type="home" data-odd="${match.odds.home}">
                    <span class="odd-type">Casa</span>
                    <span class="odd-value">${match.odds.home}</span>
                </button>
                <button class="odd-button" data-type="draw" data-odd="${match.odds.draw}">
                    <span class="odd-type">Empate</span>
                    <span class="odd-value">${match.odds.draw}</span>
                </button>
                <button class="odd-button" data-type="away" data-odd="${match.odds.away}">
                    <span class="odd-type">Fora</span>
                    <span class="odd-value">${match.odds.away}</span>
                </button>
            </div>
        </article>
    `).join('');

    document.querySelectorAll('.odd-button').forEach(button => {
        button.addEventListener('click', handleOddClick);
    });
}

// ===== MANIPULAÇÃO DE APOSTAS =====
function handleOddClick(event) {
    const button = event.currentTarget;
    const matchCard = button.closest('.match-card');
    const matchId = matchCard.dataset.matchId;
    const match = state.matches.find(m => m.id === matchId);

    if (!match) return;

    const betType = button.dataset.type;
    const odd = parseFloat(button.dataset.odd);

    document.querySelectorAll('.odd-button.selected').forEach(btn => {
        btn.classList.remove('selected');
    });

    button.classList.add('selected');

    state.currentBet = {
        matchId,
        match: `${match.homeTeam} vs ${match.awayTeam}`,
        type: betType,
        odd,
        league: match.league
    };

    showBettingPanel();
    updateBettingPanel();
}

function showBettingPanel() {
    const panel = document.getElementById('bettingPanel');
    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function updateBettingPanel() {
    if (!state.currentBet) return;

    const betTypeLabels = {
        home: '🏠 Vitória Casa',
        draw: '🤝 Empate',
        away: '✈️ Vitória Fora'
    };

    document.getElementById('betMatch').textContent = state.currentBet.match;
    document.getElementById('betType').textContent = betTypeLabels[state.currentBet.type];
    document.getElementById('betOdd').textContent = state.currentBet.odd.toFixed(2);
    document.getElementById('betLeague').textContent = state.currentBet.league;

    calculatePotentialWin();
}

function calculatePotentialWin() {
    const betAmount = parseFloat(document.getElementById('betAmount').value) || 0;
    const odd = state.currentBet?.odd || 0;
    const potentialWin = betAmount * odd;

    document.getElementById('potentialWin').textContent = formatCurrency(potentialWin);

    const placeBetButton = document.getElementById('placeBetButton');
    placeBetButton.disabled = betAmount < CONFIG.MIN_BET || betAmount > state.balance;
}

function placeBet() {
    const betAmount = parseFloat(document.getElementById('betAmount').value);

    if (!state.currentBet) {
        showError('Selecione uma aposta primeiro');
        return;
    }

    if (betAmount < CONFIG.MIN_BET) {
        showError(`Valor mínimo: ${formatCurrency(CONFIG.MIN_BET)}`);
        return;
    }

    if (betAmount > state.balance) {
        showError('Saldo insuficiente!');
        return;
    }

    state.balance -= betAmount;
   
    const bet = {
        id: `bet_${Date.now()}`,
        ...state.currentBet,
        amount: betAmount,
        potentialWin: betAmount * state.currentBet.odd,
        timestamp: new Date().toLocaleString('pt-BR'),
        status: 'pending'
    };

    state.bettingHistory.unshift(bet);
    state.stats.totalBets++;

    // Simula resultado (60% chance de ganhar)
    setTimeout(() => {
        const won = Math.random() > 0.4;
        const betToUpdate = state.bettingHistory.find(b => b.id === bet.id);
        if (!betToUpdate) return;

        betToUpdate.status = won ? 'won' : 'lost';
       
        if (won) {
            state.balance += betToUpdate.potentialWin;
            state.stats.wonBets++;
            state.stats.totalProfit += (betToUpdate.potentialWin - betToUpdate.amount);
            showModal('🎉', 'Você Ganhou!', `Parabéns! Você ganhou ${formatCurrency(betToUpdate.potentialWin)}!`);
        } else {
            state.stats.totalProfit -= betToUpdate.amount;
            showModal('😔', 'Que pena!', `Não foi dessa vez. Continue tentando!`);
        }

        saveToStorage();
        updateUI();
        renderHistory();
    }, 8000);

    saveToStorage();
    updateUI();
    renderHistory();
    clearBet();

    showModal('✅', 'Aposta Confirmada!', `Sua aposta de ${formatCurrency(betAmount)} foi registrada!`);
}

function clearBet() {
    state.currentBet = null;
    document.getElementById('betAmount').value = '';
    document.getElementById('bettingPanel').style.display = 'none';
    document.querySelectorAll('.odd-button.selected').forEach(btn => {
        btn.classList.remove('selected');
    });
    calculatePotentialWin();
}

// ===== HISTÓRICO =====
function renderHistory() {
    const historyGrid = document.getElementById('historyGrid');
    const filter = state.historyFilter;

    let filteredHistory = state.bettingHistory;
    if (filter !== 'all') {
        filteredHistory = state.bettingHistory.filter(bet => bet.status === filter);
    }

    if (filteredHistory.length === 0) {
        const filterText = {
            all: '',
            pending: 'pendente',
            won: 'ganha',
            lost: 'perdida'
        }[filter];
        historyGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <p>Nenhuma aposta ${filterText} encontrada</p>
            </div>
        `;
        return;
    }

    const statusLabels = {
        pending: { text: '⏳ Pendente', class: 'result-pending' },
        won: { text: '✅ Ganhou', class: 'result-win' },
        lost: { text: '❌ Perdeu', class: 'result-loss' }
    };

    historyGrid.innerHTML = filteredHistory.map(bet => {
        const status = statusLabels[bet.status];
        const resultAmount = bet.status === 'won' ? bet.potentialWin : bet.amount;
        const resultSign = bet.status === 'won' ? '+' : '-';
        const resultColor = bet.status === 'won' ? 'var(--success)' : bet.status === 'lost' ? 'var(--error)' : 'var(--warning)';

        return `
            <div class="history-item">
                <div class="history-details">
                    <div class="history-match">⚽ ${bet.match}</div>
                    <div class="history-info">
                        🏆 ${bet.league} • 🕐 ${bet.timestamp}
                    </div>
                    <div class="history-info">
                        💰 Aposta: ${formatCurrency(bet.amount)} • 📊 Odd: ${bet.odd.toFixed(2)}
                    </div>
                </div>
                <div class="history-result">
                    <span class="result-badge ${status.class}">${status.text}</span>
                    <span style="font-weight: 600; font-size: 1.2rem; color: ${resultColor};">
                        ${bet.status === 'pending' ? formatCurrency(bet.potentialWin) : `${resultSign}${formatCurrency(resultAmount)}`}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

// ===== ATUALIZAÇÃO DE UI =====
function updateUI() {
    document.getElementById('userBalance').textContent = formatCurrency(state.balance);
    document.getElementById('totalBets').textContent = state.stats.totalBets;
    document.getElementById('wonBets').textContent = state.stats.wonBets;
   
    const winRate = state.stats.totalBets > 0
        ? ((state.stats.wonBets / state.stats.totalBets) * 100).toFixed(1)
        : 0;
    document.getElementById('winRate').textContent = `${winRate}%`;
   
    const profitEl = document.getElementById('totalProfit');
    profitEl.textContent = formatCurrency(state.stats.totalProfit);
    profitEl.style.color = state.stats.totalProfit >= 0 ? 'var(--success)' : 'var(--error)';
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    document.querySelectorAll('.sport-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelector('.sport-tab.active').classList.remove('active');
            e.currentTarget.classList.add('active');
            state.filters.sport = e.currentTarget.dataset.sport;
            renderMatches();
        });
    });

    document.getElementById('leagueFilter').addEventListener('change', (e) => {
        state.filters.league = e.target.value;
        renderMatches();
    });

    document.getElementById('statusFilter').addEventListener('change', (e) => {
        state.filters.status = e.target.value;
        renderMatches();
    });

    document.getElementById('oddFilter').addEventListener('change', (e) => {
        state.filters.odd = e.target.value;
        renderMatches();
    });

    document.getElementById('searchInput').addEventListener('input', debounce((e) => {
        state.filters.search = e.target.value;
        renderMatches();
    }, 300));

    document.getElementById('clearFilters').addEventListener('click', () => {
        state.filters = { sport: 'all', league: 'all', status: 'all', odd: 'all', search: '' };
        document.getElementById('leagueFilter').value = 'all';
        document.getElementById('statusFilter').value = 'all';
        document.getElementById('oddFilter').value = 'all';
        document.getElementById('searchInput').value = '';
        document.querySelector('.sport-tab.active').classList.remove('active');
        document.querySelector('.sport-tab[data-sport="all"]').classList.add('active');
        renderMatches();
        showSuccess('Filtros limpos!');
    });

    document.querySelectorAll('.quick-amount').forEach(button => {
        button.addEventListener('click', (e) => {
            document.getElementById('betAmount').value = e.currentTarget.dataset.amount;
            calculatePotentialWin();
        });
    });

    document.getElementById('betAmount').addEventListener('input', calculatePotentialWin);
    document.getElementById('clearBet').addEventListener('click', clearBet);
    document.getElementById('placeBetButton').addEventListener('click', placeBet);
    document.getElementById('modalButton').addEventListener('click', closeModal);
    document.getElementById('refreshBtn').addEventListener('click', () => loadMatches());
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    document.querySelectorAll('.history-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelector('.history-tab.active').classList.remove('active');
            e.currentTarget.classList.add('active');
            state.historyFilter = e.currentTarget.dataset.filter;
            renderHistory();
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.getElementById('confirmModal').classList.contains('active')) {
            closeModal();
        }
    });

    console.log('✅ Event listeners configurados');
}

// ===== AUTO REFRESH =====
function startAutoRefresh() {
    if (state.autoRefreshInterval) {
        clearInterval(state.autoRefreshInterval);
    }
    state.autoRefreshInterval = setInterval(() => {
        console.log('🔄 Auto-refresh das partidas...');
        loadMatches();
    }, CONFIG.AUTO_REFRESH);
}

// ===== THEME TOGGLE =====
function toggleTheme() {
    const root = document.documentElement;
    const themeBtn = document.getElementById('themeToggle');
   
    if (state.theme === 'dark') {
        root.style.setProperty('--bg-dark', '#f5f5f5');
        root.style.setProperty('--bg-card', '#ffffff');
        root.style.setProperty('--bg-hover', '#e0e0e0');
        root.style.setProperty('--text-primary', '#000000');
        root.style.setProperty('--text-secondary', '#666666');
        root.style.setProperty('--border', '#dddddd');
        themeBtn.textContent = '☀️';
        state.theme = 'light';
        showSuccess('Tema claro ativado!');
    } else {
        root.style.setProperty('--bg-dark', '#0a0e17');
        root.style.setProperty('--bg-card', '#151923');
        root.style.setProperty('--bg-hover', '#1e242e');
        root.style.setProperty('--text-primary', '#ffffff');
        root.style.setProperty('--text-secondary', '#a0a5b8');
        root.style.setProperty('--border', '#2a3040');
        themeBtn.textContent = '🌙';
        state.theme = 'dark';
        showSuccess('Tema escuro ativado!');
    }
}

// ===== MODAL =====
function showModal(icon, title, message) {
    const modal = document.getElementById('confirmModal');
    document.getElementById('modalIcon').textContent = icon;
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    modal.classList.add('active');
    document.getElementById('modalButton').focus();
}

function closeModal() {
    document.getElementById('confirmModal').classList.remove('active');
}

// ===== MENSAGENS =====
function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    errorEl.textContent = '❌ ' + message;
    errorEl.style.display = 'block';
    setTimeout(() => {
        errorEl.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    const successEl = document.getElementById('successMessage');
    successEl.textContent = '✅ ' + message;
    successEl.style.display = 'block';
    setTimeout(() => {
        successEl.style.display = 'none';
    }, 3000);
}

// ===== UTILITÁRIOS =====
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function handleError(errorCode, message) {
    console.error(`[${errorCode}] ${message}`);
   
    const errorMessages = {
        [ERROR_CODES.API_TIMEOUT]: '⏱️ Tempo esgotado ao conectar com servidor',
        [ERROR_CODES.API_UNAVAILABLE]: '🔌 Serviço temporariamente indisponível',
        [ERROR_CODES.INVALID_DATA]: '⚠️ Dados inválidos recebidos',
        [ERROR_CODES.INSUFFICIENT_BALANCE]: '💰 Saldo insuficiente para realizar aposta',
        [ERROR_CODES.MATCH_STARTED]: '⚽ Esta partida já foi iniciada',
        [ERROR_CODES.NETWORK_ERROR]: '📡 Erro de conexão com a internet'
    };

    showError(errorMessages[errorCode] || message);
}

// ===== LOG INICIAL =====
console.log(`

   🎰 BetPro - Sistema de Apostas v2.0      

 📊 APIs Integradas: 0 (Simuladas)             
 ⚡ Timeout: ${CONFIG.API_TIMEOUT}ms                        
🔄 Retry: ${CONFIG.RETRY_ATTEMPTS}x                               
 💰 Aposta mínima: ${formatCurrency(CONFIG.MIN_BET)}                  
 🔄 Auto-refresh: ${CONFIG.AUTO_REFRESH/1000}s                     
 ♿ Acessibilidade: WCAG 2.1 AA                
 📱 Responsivo: ✅                            
 🎨 Temas: Dark/Light                        
        `);
