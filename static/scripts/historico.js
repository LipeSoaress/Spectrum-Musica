class HistoricoManager {
    constructor() {
        this.history = this.loadHistory();
        this.filteredHistory = [...this.history];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderHistory();
        this.updateStats();
        this.populateArtistFilter();
    }

    setupEventListeners() {
        // Botão limpar histórico
        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            this.clearHistory();
        });

        // Filtros
        document.getElementById('searchFilter').addEventListener('input', (e) => {
            this.applyFilters();
        });

        document.getElementById('artistFilter').addEventListener('change', (e) => {
            this.applyFilters();
        });

        document.getElementById('dateFilter').addEventListener('change', (e) => {
            this.applyFilters();
        });
    }

    loadHistory() {
        const stored = localStorage.getItem('musicHistory');
        return stored ? JSON.parse(stored) : [];
    }

    saveHistory() {
        localStorage.setItem('musicHistory', JSON.stringify(this.history));
    }

    addToHistory(music) {
        const historyItem = {
            ...music,
            playedAt: new Date().toISOString(),
            duration: 0 // Será atualizado quando a música terminar
        };

        // Remove duplicatas recentes (mesma música nos últimos 5 minutos)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        this.history = this.history.filter(item => {
            if (item.id === music.id) {
                const playedAt = new Date(item.playedAt);
                return playedAt < fiveMinutesAgo;
            }
            return true;
        });

        this.history.unshift(historyItem);
        
        // Manter apenas os últimos 100 itens
        if (this.history.length > 100) {
            this.history = this.history.slice(0, 100);
        }

        this.saveHistory();
        this.renderHistory();
        this.updateStats();
        this.populateArtistFilter();
    }

    updateDuration(musicId, duration) {
        const item = this.history.find(h => h.id === musicId);
        if (item) {
            item.duration = duration;
            this.saveHistory();
            this.updateStats();
        }
    }

    clearHistory() {
        if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
            this.history = [];
            this.filteredHistory = [];
            this.saveHistory();
            this.renderHistory();
            this.updateStats();
            this.populateArtistFilter();
        }
    }

    applyFilters() {
        const searchTerm = document.getElementById('searchFilter').value.toLowerCase();
        const artistFilter = document.getElementById('artistFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;

        this.filteredHistory = this.history.filter(item => {
            // Filtro de busca
            const matchesSearch = !searchTerm || 
                item.title.toLowerCase().includes(searchTerm) ||
                item.artist.toLowerCase().includes(searchTerm);

            // Filtro de artista
            const matchesArtist = !artistFilter || item.artist === artistFilter;

            // Filtro de data
            let matchesDate = true;
            if (dateFilter) {
                const playedAt = new Date(item.playedAt);
                const now = new Date();
                
                switch (dateFilter) {
                    case 'today':
                        matchesDate = playedAt.toDateString() === now.toDateString();
                        break;
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        matchesDate = playedAt >= weekAgo;
                        break;
                    case 'month':
                        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        matchesDate = playedAt >= monthAgo;
                        break;
                }
            }

            return matchesSearch && matchesArtist && matchesDate;
        });

        this.renderHistory();
    }

    populateArtistFilter() {
        const artistSelect = document.getElementById('artistFilter');
        const artists = [...new Set(this.history.map(item => item.artist))].sort();
        
        // Limpar opções existentes (exceto a primeira)
        while (artistSelect.children.length > 1) {
            artistSelect.removeChild(artistSelect.lastChild);
        }

        artists.forEach(artist => {
            const option = document.createElement('option');
            option.value = artist;
            option.textContent = artist;
            artistSelect.appendChild(option);
        });
    }

    renderHistory() {
        const historyList = document.getElementById('historyList');
        const emptyState = document.getElementById('emptyState');

        if (this.filteredHistory.length === 0) {
            historyList.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        historyList.style.display = 'block';
        emptyState.style.display = 'none';

        historyList.innerHTML = this.filteredHistory.map(item => {
            const playedAt = new Date(item.playedAt);
            const timeAgo = this.getTimeAgo(playedAt);
            const date = playedAt.toLocaleDateString('pt-BR');
            const time = playedAt.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });

            return `
                <div class="history-item" data-music-id="${item.id}">
                    <img src="${item.imageUrl}" alt="${item.title}" onerror="this.src='/static/assets/default-album.png'">
                    <div class="history-item-info">
                        <div class="history-item-title">${item.title}</div>
                        <div class="history-item-artist">${item.artist}</div>
                    </div>
                    <div class="history-item-meta">
                        <div class="history-item-time">${timeAgo}</div>
                        <div class="history-item-date">${date} às ${time}</div>
                        <button class="play-again-btn" onclick="historicoManager.playAgain(${item.id})">
                            Tocar Novamente  
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateStats() {
        const totalSongs = this.history.length;
        const totalTime = this.calculateTotalTime();
        const favoriteArtist = this.getFavoriteArtist();

        document.getElementById('totalSongs').textContent = totalSongs;
        document.getElementById('totalTime').textContent = totalTime;
        document.getElementById('favoriteArtist').textContent = favoriteArtist;
    }

    calculateTotalTime() {
        const totalSeconds = this.history.reduce((total, item) => {
            return total + (item.duration || 0);
        }, 0);

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    getFavoriteArtist() {
        if (this.history.length === 0) return '-';

        const artistCounts = {};
        this.history.forEach(item => {
            artistCounts[item.artist] = (artistCounts[item.artist] || 0) + 1;
        });

        const sortedArtists = Object.entries(artistCounts)
            .sort(([,a], [,b]) => b - a);

        return sortedArtists[0] ? sortedArtists[0][0] : '-';
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'Agora mesmo';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} min atrás`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours}h atrás`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} dia${days > 1 ? 's' : ''} atrás`;
        }
    }

    playAgain(musicId) {
        // Encontrar a música no histórico
        const music = this.history.find(item => item.id === musicId);
        if (music) {
            // Redirecionar para a página principal com a música selecionada
            window.location.href = `/?play=${musicId}`;
        }
    }
}

// Inicializar o gerenciador de histórico
const historicoManager = new HistoricoManager();

// Função global para adicionar música ao histórico (será chamada de outras páginas)
window.addToMusicHistory = function(music) {
    historicoManager.addToHistory(music);
};

// Função global para atualizar duração (será chamada quando a música terminar)
window.updateMusicDuration = function(musicId, duration) {
    historicoManager.updateDuration(musicId, duration);
};

// Verificar se há uma música para tocar na URL
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const playMusicId = urlParams.get('play');
    
    if (playMusicId) {
        // Remover o parâmetro da URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Redirecionar para a página principal
        setTimeout(() => {
            window.location.href = '/';
        }, 100);
    }
});
