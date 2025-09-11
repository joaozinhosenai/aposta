// ===================================
// Configuração da API Basketball
// ===================================

const API_CONFIG = {
    baseURL: 'https://api-basketball.p.rapidapi.com',
    headers: {
        'X-RapidAPI-Key': 'SUA_CHAVE_RAPIDAPI_AQUI', // IMPORTANTE: Substitua pela sua chave
        'X-RapidAPI-Host': 'api-basketball.p.rapidapi.com'
    },
    endpoints: {
        countries: '/countries',
        leagues: '/leagues',
        seasons: '/seasons',
        teams: '/teams'
    }
};

// Estado global da aplicação
const AppState = {
    countries: [],
    filteredCountries: [],
    favorites: new Set(JSON.parse(localStorage.getItem('favoriteCountries') || '[]')),
    currentView: 'grid',
    isLoading: false,
    apiConnected: false,
    lastUpdate: null
};

// ===================================
// Utilidades
// ===================================

const Utils = {
    formatDate: (date) => {
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    },

    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    showToast: (message, type = 'info', duration = 4000) => {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        toast.innerHTML = `
            <i class="${iconMap[type]}" aria-hidden="true"></i>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" type="button" aria-label="Fechar notificação">
                <i class="fas fa-times" aria-hidden="true"></i>
            </button>
        `;

        toastContainer.appendChild(toast);

        // Auto remover
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('hiding');
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);

        // Fechar manualmente
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        });
    },

    getCountryFlag: (countryCode) => {
        // Retorna um emoji de bandeira baseado no código do país
        if (!countryCode || countryCode.length !== 2) return '🏀';
        
        const flagOffset = 0x1F1E6;
        const asciiOffset = 0x41;
        const firstChar = countryCode.codePointAt(0) - asciiOffset + flagOffset;
        const secondChar = countryCode.codePointAt(1) - asciiOffset + flagOffset;
        
        return String.fromCodePoint(firstChar) + String.fromCodePoint(secondChar);
    },

    getRegionByCountry: (countryName) => {
        const regions = {
            america: ['United States', 'Canada', 'Brazil', 'Argentina', 'Mexico', 'Chile', 'Colombia', 'Venezuela', 'Peru', 'Uruguay'],
            europe: ['Spain', 'France', 'Italy', 'Germany', 'United Kingdom', 'Russia', 'Turkey', 'Greece', 'Serbia', 'Croatia'],
            asia: ['China', 'Japan', 'South Korea', 'Philippines', 'India', 'Iran', 'Israel', 'Lebanon', 'Jordan', 'Kazakhstan'],
            africa: ['Nigeria', 'Egypt', 'South Africa', 'Morocco', 'Tunisia', 'Angola', 'Senegal', 'Mali', 'Cameroon', 'Rwanda'],
            oceania: ['Australia', 'New Zealand', 'Fiji', 'Papua New Guinea', 'Solomon Islands']
        };

        for (const [region, countries] of Object.entries(regions)) {
            if (countries.some(country => countryName.toLowerCase().includes(country.toLowerCase()))) {
                return region;
            }
        }
        return 'other';
    }
};

// ===================================
// API Manager
// ===================================

class APIManager {
    static async request(endpoint, params = {}) {
        const url = new URL(API_CONFIG.baseURL + endpoint);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: API_CONFIG.headers
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            AppState.apiConnected = true;
            AppState.lastUpdate = new Date();
            
            return data;
        } catch (error) {
            AppState.apiConnected = false;
            console.error('API Request failed:', error);
            throw error;
        }
    }

    static async getCountries() {
        try {
            const response = await this.request(API_CONFIG.endpoints.countries);
            return response.response || response;
        } catch (error) {
            Utils.showToast('Erro ao carregar países da API', 'error');
            throw error;
        }
    }

    static async getLeagues(countryCode) {
        try {
            const response = await this.request(API_CONFIG.endpoints.leagues, {
                country: countryCode
            });
            return response.response || response;
        } catch (error) {
            Utils.showToast(`Erro ao carregar ligas para ${countryCode}`, 'error');
            throw error;
        }
    }

    static async testConnection() {
        try {
            await this.request(API_CONFIG.endpoints.countries);
            return true;
        } catch (error) {
            return false;
        }
    }
}

// ===================================
// UI Manager
// ===================================

class UIManager {
    static showLoading() {
        const loadingElement = document.getElementById('loading-indicator');
        if (loadingElement) {
            loadingElement.setAttribute('aria-hidden', 'false');
        }
        AppState.isLoading = true;
    }

    static hideLoading() {
        const loadingElement = document.getElementById('loading-indicator');
        if (loadingElement) {
            loadingElement.setAttribute('aria-hidden', 'true');
        }
        AppState.isLoading = false;
    }

    static showError(message = 'Erro desconhecido') {
        const errorElement = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        
        if (errorElement && errorText) {
            errorText.textContent = message;
            errorElement.setAttribute('aria-hidden', 'false');
        }
        this.hideLoading();
    }

    static hideError() {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.setAttribute('aria-hidden', 'true');
        }
    }

    static updateAPIStatus() {
        const statusText = document.getElementById('status-text');
        const connectionStatus = document.getElementById('api-connection-status');
        const lastUpdate = document.getElementById('last-update');

        if (statusText) {
            statusText.textContent = AppState.apiConnected ? 'API Conectada' : 'API Desconectada';
        }

        if (connectionStatus) {
            const statusDot = connectionStatus.querySelector('.status-dot');
            if (statusDot) {
                statusDot.style.background = AppState.apiConnected ? 'var(--success-color)' : 'var(--error-color)';
            }
            connectionStatus.innerHTML = `
                <span class="status-dot" style="background: ${AppState.apiConnected ? 'var(--success-color)' : 'var(--error-color)'}"></span>
                ${AppState.apiConnected ? 'Conectado' : 'Desconectado'}
            `;
        }

        if (lastUpdate && AppState.lastUpdate) {
            lastUpdate.textContent = Utils.formatDate(AppState.lastUpdate);
        }
    }

    static updateStats() {
        const totalCountries = document.getElementById('total-countries');
        const visibleCountries = document.getElementById('visible-countries');
        const activeLeagues = document.getElementById('active-leagues');

        if (totalCountries) totalCountries.textContent = AppState.countries.length;
        if (visibleCountries) visibleCountries.textContent = AppState.filteredCountries.length;
        if (activeLeagues) activeLeagues.textContent = '...'; // Placeholder
    }

    static createCountryCard(country) {
        const isFavorite = AppState.favorites.has(country.id);
        const flag = Utils.getCountryFlag(country.code);
        const region = Utils.getRegionByCountry(country.name);

        return `
            <div class="game-card country-card" data-country-id="${country.id}" data-region="${region}" role="listitem">
                <div class="country-header">
                    <div class="country-flag">${flag}</div>
                    <div class="country-info">
                        <h3 class="country-name">${country.name}</h3>
                        <span class="country-code">${country.code || 'N/A'}</span>
                    </div>
                    <button class="btn-favorite ${isFavorite ? 'active' : ''}" 
                            data-country-id="${country.id}" 
                            type="button" 
                            aria-label="${isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                        <i class="fas fa-star" aria-hidden="true"></i>
                    </button>
                </div>
                <div class="country-stats">
                    <div class="stat-item">
                        <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
                        <span class="region-name">${region.charAt(0).toUpperCase() + region.slice(1)}</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-trophy" aria-hidden="true"></i>
                        <span class="leagues-count">Carregando...</span>
                    </div>
                </div>
                <div class="country-actions">
                    <button class="btn btn-primary btn-view-country" 
                            data-country-id="${country.id}"
                            data-country-name="${country.name}"
                            data-country-code="${country.code}"
                            type="button">
                        <i class="fas fa-eye" aria-hidden="true"></i>
                        Ver Detalhes
                    </button>
                    <button class="btn btn-secondary btn-view-leagues" 
                            data-country-code="${country.code}"
                            data-country-name="${country.name}"
                            type="button">
                        <i class="fas fa-list" aria-hidden="true"></i>
                        Ligas
                    </button>
                </div>
            </div>
        `;
    }

    static renderCountries(countries = AppState.filteredCountries) {
        const container = document.getElementById('countries-container');
        const noResults = document.getElementById('no-results');
        
        if (!container) return;

        if (countries.length === 0) {
            container.innerHTML = '';
            if (noResults) noResults.setAttribute('aria-hidden', 'false');
            return;
        }

        if (noResults) noResults.setAttribute('aria-hidden', 'true');
        
        container.innerHTML = countries.map(country => this.createCountryCard(country)).join('');
        this.updateStats();
    }
}

// ===================================
// Country Manager
// ===================================

class CountryManager {
    static async loadCountries() {
        try {
            UIManager.showLoading();
            UIManager.hideError();

            const countries = await APIManager.getCountries();
            
            if (!countries || !Array.isArray(countries)) {
                throw new Error('Dados inválidos recebidos da API');
            }

            AppState.countries = countries.map(country => ({
                id: country.id || Math.random().toString(36),
                name: country.name || 'Nome não disponível',
                code: country.code || null,
                flag: country.flag || null
            }));

            AppState.filteredCountries = [...AppState.countries];
            
            UIManager.renderCountries();
            UIManager.updateAPIStatus();
            UIManager.hideLoading();
            
            Utils.showToast(`${AppState.countries.length} países carregados com sucesso!`, 'success');
            
        } catch (error) {
            console.error('Erro ao carregar países:', error);
            UIManager.showError('Não foi possível carregar os países. Verifique sua chave da API.');
            Utils.showToast('Erro ao conectar com a API de basquete', 'error');
        }
    }

    static filterCountries() {
        const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
        const selectedRegion = document.getElementById('region-filter')?.value || 'all';

        let filtered = AppState.countries;

        // Filtrar por região
        if (selectedRegion !== 'all') {
            filtered = filtered.filter(country => {
                const region = Utils.getRegionByCountry(country.name);
                return region === selectedRegion;
            });
        }

        // Filtrar por busca
        if (searchTerm) {
            filtered = filtered.filter(country => 
                country.name.toLowerCase().includes(searchTerm) ||
                (country.code && country.code.toLowerCase().includes(searchTerm))
            );
        }

        AppState.filteredCountries = filtered;
        UIManager.renderCountries();

        if (filtered.length === 0 && (searchTerm || selectedRegion !== 'all')) {
            Utils.showToast('Nenhum país encontrado com os filtros aplicados', 'info');
        }
    }

    static toggleFavorite(countryId) {
        if (AppState.favorites.has(countryId)) {
            AppState.favorites.delete(countryId);
            Utils.showToast('País removido dos favoritos', 'info');
        } else {
            AppState.favorites.add(countryId);
            Utils.showToast('País adicionado aos favoritos', 'success');
        }

        // Salvar no localStorage
        localStorage.setItem('favoriteCountries', JSON.stringify([...AppState.favorites]));
        
        // Atualizar UI
        UIManager.renderCountries();
    }

    static async showCountryModal(countryId, countryName, countryCode) {
        const modal = document.getElementById('country-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');

        if (!modal || !modalTitle || !modalBody) return;

        modalTitle.textContent = `${countryName} (${countryCode || 'N/A'})`;
        modalBody.innerHTML = '<div class="loading-modal"><div class="spinner"></div><p>Carregando informações...</p></div>';
        
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        try {
            // Tentar carregar ligas do país
            const leagues = await APIManager.getLeagues(countryCode);
            
            modalBody.innerHTML = `
                <div class="country-details">
                    <div class="country-info-detailed">
                        <div class="info-item">
                            <strong>Nome:</strong> ${countryName}
                        </div>
                        <div class="info-item">
                            <strong>Código:</strong> ${countryCode || 'N/A'}
                        </div>
                        <div class="info-item">
                            <strong>Região:</strong> ${Utils.getRegionByCountry(countryName).charAt(0).toUpperCase() + Utils.getRegionByCountry(countryName).slice(1)}
                        </div>
                        <div class="info-item">
                            <strong>Favorito:</strong> ${AppState.favorites.has(countryId) ? 'Sim' : 'Não'}
                        </div>
                    </div>
                    
                    <div class="leagues-section">
                        <h4>Ligas de Basquete</h4>
                        ${leagues && leagues.length > 0 ? `
                            <div class="leagues-list">
                                ${leagues.slice(0, 10).map(league => `
                                    <div class="league-item">
                                        <div class="league-info">
                                            <strong>${league.name}</strong>
                                            ${league.season ? `<span class="league-season">Temporada: ${league.season}</span>` : ''}
                                        </div>
                                        ${league.logo ? `<img src="${league.logo}" alt="${league.name}" class="league-logo">` : ''}
                                    </div>
                                `).join('')}
                                ${leagues.length > 10 ? `<p class="more-leagues">E mais ${leagues.length - 10} ligas...</p>` : ''}
                            </div>
                        ` : '<p class="no-leagues">Nenhuma liga encontrada para este país.</p>'}
                    </div>
                </div>
            `;
        } catch (error) {
            modalBody.innerHTML = `
                <div class="country-details">
                    <div class="country-info-detailed">
                        <div class="info-item">
                            <strong>Nome:</strong> ${countryName}
                        </div>
                        <div class="info-item">
                            <strong>Código:</strong> ${countryCode || 'N/A'}
                        </div>
                        <div class="info-item">
                            <strong>Região:</strong> ${Utils.getRegionByCountry(countryName).charAt(0).toUpperCase() + Utils.getRegionByCountry(countryName).slice(1)}
                        </div>
                    </div>
                    
                    <div class="error-section">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Não foi possível carregar as ligas deste país.</p>
                    </div>
                </div>
            `;
        }
    }

    static closeModal() {
        const modal = document.getElementById('country-modal');
        if (modal) {
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    }
}

// ===================================
// Event Handlers
// ===================================

class EventHandlers {
    static init() {
        // Botão de carregar países
        const loadCountriesBtn = document.getElementById('load-countries-btn');
        if (loadCountriesBtn) {
            loadCountriesBtn.addEventListener('click', () => {
                CountryManager.loadCountries();
            });
        }

        // Botão de retry
        const retryBtn = document.getElementById('retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                CountryManager.loadCountries();
            });
        }

        // Filtros
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                CountryManager.filterCountries();
            }, 300));
        }

        const regionFilter = document.getElementById('region-filter');
        if (regionFilter) {
            regionFilter.addEventListener('change', () => {
                CountryManager.filterCountries();
            });
        }

        // Controles de visualização
        const viewButtons = document.querySelectorAll('.btn-view');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.closest('.btn-view').dataset.view;
                this.changeView(view);
            });
        });

        // Delegação de eventos para países
        const countriesContainer = document.getElementById('countries-container');
        if (countriesContainer) {
            countriesContainer.addEventListener('click', (e) => {
                const favoriteBtn = e.target.closest('.btn-favorite');
                const viewBtn = e.target.closest('.btn-view-country');
                const leaguesBtn = e.target.closest('.btn-view-leagues');

                if (favoriteBtn) {
                    const countryId = favoriteBtn.dataset.countryId;
                    CountryManager.toggleFavorite(countryId);
                } else if (viewBtn) {
                    const countryId = viewBtn.dataset.countryId;
                    const countryName = viewBtn.dataset.countryName;
                    const countryCode = viewBtn.dataset.countryCode;
                    CountryManager.showCountryModal(countryId, countryName, countryCode);
                } else if (leaguesBtn) {
                    const countryCode = leaguesBtn.dataset.countryCode;
                    const countryName = leaguesBtn.dataset.countryName;
                    Utils.showToast(`Carregando ligas de ${countryName}...`, 'info');
                    // Aqui você pode implementar uma funcionalidade específica para ligas
                }
            });
        }

        // Modal
        const modal = document.getElementById('country-modal');
        if (modal) {
            const closeBtn = modal.querySelector('.modal-close');
            const backdrop = modal.querySelector('.modal-backdrop');
            
            if (closeBtn) closeBtn.addEventListener('click', CountryManager.closeModal);
            if (backdrop) backdrop.addEventListener('click', CountryManager.closeModal);
        }

        // Tecla ESC para fechar modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                CountryManager.closeModal();
            }
        });

        // Exportar dados
        const exportBtn = document.getElementById('export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', this.exportData);
        }

        // Ver favoritos
        const favoritesBtn = document.getElementById('view-favorites');
        if (favoritesBtn) {
            favoritesBtn.addEventListener('click', this.showFavorites);
        }

        // Refresh stats
        const refreshStatsBtn = document.querySelector('.btn-refresh-stats');
        if (refreshStatsBtn) {
            refreshStatsBtn.addEventListener('click', () => {
                UIManager.updateStats();
                UIManager.updateAPIStatus();
                Utils.showToast('Estatísticas atualizadas', 'success');
            });
        }
    }

    static changeView(view) {
        AppState.currentView = view;
        
        // Atualizar botões ativos
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Atualizar classe do container
        const container = document.getElementById('countries-container');
        if (container) {
            container.className = view === 'list' ? 'countries-list' : 'games-grid';
        }

        Utils.showToast(`Visualização alterada para ${view === 'list' ? 'lista' : 'grade'}`, 'info');
    }

    static exportData() {
        if (AppState.countries.length === 0) {
            Utils.showToast('Nenhum dado para exportar', 'warning');
            return;
        }

        const dataToExport = {
            countries: AppState.countries,
            favorites: [...AppState.favorites],
            exportDate: new Date().toISOString(),
            totalCountries: AppState.countries.length
        };

        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `basquete-paises-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Utils.showToast('Dados exportados com sucesso!', 'success');
    }

    static showFavorites() {
        if (AppState.favorites.size === 0) {
            Utils.showToast('Nenhum país marcado como favorito', 'info');
            return;
        }

        const favoriteCountries = AppState.countries.filter(country => 
            AppState.favorites.has(country.id)
        );

        AppState.filteredCountries = favoriteCountries;
        UIManager.renderCountries();

        // Resetar filtros
        const searchInput = document.getElementById('search-input');
        const regionFilter = document.getElementById('region-filter');
        
        if (searchInput) searchInput.value = '';
        if (regionFilter) regionFilter.value = 'all';

        Utils.showToast(`Exibindo ${favoriteCountries.length} países favoritos`, 'success');
    }
}

// ===================================
// Mobile Menu Manager
// ===================================

class MobileMenu {
    static init() {
        const toggle = document.querySelector('.mobile-menu-toggle');
        const overlay = document.querySelector('.mobile-nav-overlay');
        
        if (!toggle || !overlay) return;

        let isOpen = false;

        const open = () => {
            isOpen = true;
            overlay.classList.add('active');
            toggle.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
        };

        const close = () => {
            isOpen = false;
            overlay.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        };

        toggle.addEventListener('click', () => {
            isOpen ? close() : open();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen) close();
        });

        // Fechar ao clicar em links
        const mobileLinks = overlay.querySelectorAll('.mobile-nav-link, .mobile-btn');
        mobileLinks.forEach(link => {
            link.addEventListener('click', close);
        });
    }
}

// ===================================
// Inicialização da Aplicação
// ===================================

class App {
    static async init() {
        console.log('🏀 Inicializando BasqueteJG...');

        // Verificar se a chave da API foi configurada
        if (API_CONFIG.headers['X-RapidAPI-Key'] === 'SUA_CHAVE_RAPIDAPI_AQUI') {
            Utils.showToast('⚠️ Configure sua chave da RapidAPI no código!', 'warning', 8000);
            UIManager.showError('Chave da API não configurada. Edite o arquivo script.js e adicione sua chave da RapidAPI.');
            return;
        }

        // Inicializar módulos
        EventHandlers.init();
        MobileMenu.init();
        
        // Testar conexão com API
        Utils.showToast('Testando conexão com a API...', 'info');
        
        try {
            const isConnected = await APIManager.testConnection();
            if (isConnected) {
                Utils.showToast('✅ API conectada com sucesso!', 'success');
                UIManager.updateAPIStatus();
            } else {
                throw new Error('Falha na conexão');
            }
        } catch (error) {
            Utils.showToast('❌ Erro ao conectar com a API', 'error');
            UIManager.updateAPIStatus();
            UIManager.showError('Erro de conexão com a API. Verifique sua chave e conexão com internet.');
        }

        // Configurar acessibilidade
        this.setupAccessibility();
        
        console.log('✅ BasqueteJG inicializado!');
    }

    static setupAccessibility() {
        // Navegação por teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

        // Anúncios para leitores de tela
        const announcer = document.createElement('div');
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'visually-hidden';
        announcer.id = 'announcer';
        document.body.appendChild(announcer);
    }
}

// ===================================
// Inicialização quando DOM carregado
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
