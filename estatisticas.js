// ===================================
// stats.js - Lógica para a página de estatísticas
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // Referências a elementos do DOM
    const tabs = document.querySelectorAll('.tab-button');
    const playerStatsContainer = document.getElementById('players-stats-container');
    const teamStatsContainer = document.getElementById('teams-stats-container');
    const leagueSelect = document.getElementById('league-select');
    const seasonSelect = document.getElementById('season-select');
    const playerStatsBody = document.getElementById('players-stats-body');
    const teamStatsBody = document.getElementById('teams-stats-body');
    const loadingIndicator = document.getElementById('loading-stats');
    const noResultsMessage = document.getElementById('no-stats-results');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const pageInfo = document.getElementById('page-info');
    
    // Estado da página de estatísticas
    const StatsState = {
        currentTab: 'players',
        leagues: [],
        seasons: [],
        players: [],
        teams: [],
        currentPage: 1,
        itemsPerPage: 20
    };

    // Função para mostrar/esconder a tabela de estatísticas
    function switchTab(tabName) {
        StatsState.currentTab = tabName;
        tabs.forEach(tab => tab.classList.remove('active'));
        document.querySelector(`.tab-button[data-tab="${tabName}"]`).classList.add('active');

        playerStatsContainer.classList.add('hidden');
        teamStatsContainer.classList.add('hidden');
        noResultsMessage.classList.add('hidden');

        if (tabName === 'players') {
            playerStatsContainer.classList.remove('hidden');
            renderPlayers(StatsState.players);
        } else {
            teamStatsContainer.classList.remove('hidden');
            renderTeams(StatsState.teams);
        }
    }

    // Função para renderizar as opções dos filtros
    function renderFilters() {
        // Renderizar ligas
        leagueSelect.innerHTML = `<option value="">Selecione uma Liga</option>`;
        StatsState.leagues.forEach(league => {
            const option = document.createElement('option');
            option.value = league.id;
            option.textContent = league.name;
            leagueSelect.appendChild(option);
        });
        
        // Renderizar temporadas
        seasonSelect.innerHTML = `<option value="">Selecione uma Temporada</option>`;
        StatsState.seasons.forEach(season => {
            const option = document.createElement('option');
            option.value = season;
            option.textContent = season;
            seasonSelect.appendChild(option);
        });

        // Habilita ou desabilita os selects
        seasonSelect.disabled = StatsState.leagues.length === 0;
        leagueSelect.disabled = StatsState.leagues.length === 0;
    }
    
    // Função para renderizar a tabela de jogadores
    function renderPlayers(players) {
        playerStatsBody.innerHTML = '';
        if (!players || players.length === 0) {
            noResultsMessage.classList.remove('hidden');
            return;
        }
        noResultsMessage.classList.add('hidden');

        const start = (StatsState.currentPage - 1) * StatsState.itemsPerPage;
        const end = start + StatsState.itemsPerPage;
        const playersToRender = players.slice(start, end);

        playersToRender.forEach((player, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${start + index + 1}</td>
                <td>${player.firstname} ${player.lastname}</td>
                <td>${player.team.name}</td>
                <td>${player.points}</td>
                <td>${player.assists}</td>
                <td>${player.rebounds}</td>
                <td>${player.steals}</td>
                <td>${player.blocks}</td>
            `;
            playerStatsBody.appendChild(row);
        });
        updatePagination(players.length);
    }
    
    // Função para renderizar a tabela de times
    function renderTeams(teams) {
        teamStatsBody.innerHTML = '';
        if (!teams || teams.length === 0) {
            noResultsMessage.classList.remove('hidden');
            return;
        }
        noResultsMessage.classList.add('hidden');

        const start = (StatsState.currentPage - 1) * StatsState.itemsPerPage;
        const end = start + StatsState.itemsPerPage;
        const teamsToRender = teams.slice(start, end);
        
        teamsToRender.forEach((team, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${start + index + 1}</td>
                <td>${team.team.name}</td>
                <td>${team.wins.total}</td>
                <td>${team.losses.total}</td>
                <td>${team.win_percentage}</td>
                <td>${team.points_for}</td>
                <td>${team.points_against}</td>
            `;
            teamStatsBody.appendChild(row);
        });
        updatePagination(teams.length);
    }

    // Função para atualizar os botões de paginação
    function updatePagination(totalItems) {
        const totalPages = Math.ceil(totalItems / StatsState.itemsPerPage);
        pageInfo.textContent = `Página ${StatsState.currentPage} de ${totalPages}`;
        
        prevPageBtn.disabled = StatsState.currentPage === 1;
        nextPageBtn.disabled = StatsState.currentPage >= totalPages;
    }

    // Função principal para buscar estatísticas
    async function fetchStats() {
        const leagueId = leagueSelect.value;
        const season = seasonSelect.value;
        
        if (!leagueId || !season) {
            return;
        }
        
        UIManager.showStatsLoading();
        noResultsMessage.classList.add('hidden');

        try {
            const playersData = await APIManager.getPlayers(leagueId, season);
            const teamsData = await APIManager.getTeamsStandings(leagueId, season);
            
            StatsState.players = playersData.response || [];
            StatsState.teams = teamsData.response || [];
            
            // Renderizar a aba ativa
            StatsState.currentPage = 1; // Resetar para a primeira página ao buscar novos dados
            if (StatsState.currentTab === 'players') {
                renderPlayers(StatsState.players);
            } else {
                renderTeams(StatsState.teams);
            }

        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            Utils.showToast('Erro ao carregar estatísticas. Tente novamente.', 'error');
            noResultsMessage.classList.remove('hidden');
        } finally {
            UIManager.hideStatsLoading();
        }
    }

    // Event Listeners
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });

    // Ações ao mudar os filtros
    leagueSelect.addEventListener('change', fetchStats);
    seasonSelect.addEventListener('change', fetchStats);
    
    // Ações de Paginação
    prevPageBtn.addEventListener('click', () => {
        if (StatsState.currentPage > 1) {
            StatsState.currentPage--;
            if (StatsState.currentTab === 'players') {
                renderPlayers(StatsState.players);
            } else {
                renderTeams(StatsState.teams);
            }
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalItems = StatsState.currentTab === 'players' ? StatsState.players.length : StatsState.teams.length;
        const totalPages = Math.ceil(totalItems / StatsState.itemsPerPage);
        if (StatsState.currentPage < totalPages) {
            StatsState.currentPage++;
            if (StatsState.currentTab === 'players') {
                renderPlayers(StatsState.players);
            } else {
                renderTeams(StatsState.teams);
            }
        }
    });

    // Inicia o carregamento quando a página de estatísticas se torna visível
    const statsTab = document.getElementById('stats-tab');
    if (statsTab) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'hidden') {
                    if (statsTab.getAttribute('hidden') === null) {
                        loadLeaguesAndSeasons();
                    }
                }
            });
        });
        observer.observe(statsTab, { attributes: true });
    }
    
    // Carregar ligas e temporadas quando a página de estatísticas é ativada
    async function loadLeaguesAndSeasons() {
        UIManager.showStatsLoading();
        try {
            const leaguesData = await APIManager.getLeagues();
            StatsState.leagues = leaguesData;
            
            // Buscar temporadas para a primeira liga por padrão
            if (StatsState.leagues.length > 0) {
                const seasonsData = await APIManager.getSeasons(StatsState.leagues[0].id);
                StatsState.seasons = seasonsData;
            }
            
            renderFilters();
            
        } catch (error) {
            Utils.showToast('Não foi possível carregar as ligas e temporadas.', 'error');
        } finally {
            UIManager.hideStatsLoading();
        }
    }
});