const musicListContainer = document.querySelector('.lista-musicas')
const playerBar = document.getElementById('player-bar')

const params = new URLSearchParams(window.location.search);
const query = params.get('q') ? params.get('q').toLowerCase() : ''

let musics = [];

function juntarUrl(base, relativo) {
    try {
        return new URL(relativo, base).href;
    } catch {
        return base.replace(/\/+$/, '') + '/' + relativo.replace(/^\/+/, '');
    }
}

function renderSearchResults(filteredMusics) {
    musicListContainer.innerHTML = '';
    if (filteredMusics.length === 0) {
        musicListContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>Nenhuma música encontrada</h3>
                <p>Tente usar outros termos de pesquisa</p>
            </div>
        `;
        return;
    }

    filteredMusics.forEach((music, index) => {
        const div = document.createElement('div');
        div.classList.add('musica-item');
        div.innerHTML = `
            <img src="${music.imageUrl}" alt="Capa" class="musica-cover">
            <div class="info-musica">
                <h3>${music.title}</h3>
                <p>${music.artist}</p>
            </div>
            <button class="play-btn" onclick="playMusic('${music.url}', '${music.imageUrl}', '${music.title.replace(/'/g, "\\'")}', '${music.artist.replace(/'/g, "\\'")}')">
                <i class="fas fa-play"></i>
            </button>
        `;

        div.addEventListener('click', (e) => {
            if (!e.target.closest('.play-btn')) {
                playMusic(music.url, music.imageUrl, music.title, music.artist);
            }
        });

        musicListContainer.appendChild(div);
    });
}

function playMusic(url, coverUrl, title, artist) {
    const base = localStorage.getItem('urlServidor')
    if (!base) {
        alert("Servidor não configurado.")
        return
    }

    const audioEl = document.getElementById('audio')
    const cover = document.getElementById('cover')
    const nowPlaying = document.getElementById('nowPlaying')
    const playerBar = document.getElementById('player-bar')

    audioEl.pause();

    audioEl.src = juntarUrl(base, url)
    cover.src = coverUrl.startsWith("http") ? coverUrl : juntarUrl(base, coverUrl)
    nowPlaying.innerHTML = `<span class="song-title">${title}</span><span class="song-artist">${artist}</span>`

    audioEl.play().catch(error => {
        console.error("Erro ao reproduzir:", error);
        alert("Erro ao reproduzir a música. Verifique o servidor.");
    });

    playerBar.classList.remove('hidden')

    highlightCurrentPlaying(title, artist);
}

function highlightCurrentPlaying(title, artist) {
    document.querySelectorAll('.musica-item').forEach(item => {
        item.classList.remove('playing', 'highlight');
    });

    document.querySelectorAll('.musica-item').forEach(item => {
        const itemTitle = item.querySelector('h3')?.textContent;
        const itemArtist = item.querySelector('p')?.textContent;

        if (itemTitle === title && itemArtist === artist) {
            item.classList.add('playing', 'highlight');

            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const base = localStorage.getItem('urlServidor')
        if (!base) {
            musicListContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-server"></i>
                    <h3>Servidor não configurado</h3>
                    <p>Configure o servidor na página inicial</p>
                </div>
            `;
            return
        }

        musicListContainer.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <p>Carregando músicas...</p>
            </div>
        `;

        const response = await fetch(juntarUrl(base, '/api/musicas'))
        if (!response.ok) throw new Error('Erro ao carregar músicas');

        musics = await response.json()
        console.log("Músicas carregadas:", musics)

        const filtered = musics.filter(m =>
            m.title.toLowerCase().includes(query) ||
            m.artist.toLowerCase().includes(query)
        )

        renderSearchResults(filtered)

        updateResultsHeader(filtered.length);

    } catch (err) {
        console.error("Erro ao carregar músicas:", err)
        musicListContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erro ao carregar músicas</h3>
                <p>Verifique a conexão com o servidor</p>
            </div>
        `;
    }
})

function updateResultsHeader(count) {
    const existingHeader = document.querySelector('.results-header');
    if (existingHeader) {
        existingHeader.remove();
    }

    const header = document.createElement('div');
    header.className = 'results-header';
    header.innerHTML = `
        <h2>Resultados para "${query}"</h2>
        <div class="results-count">${count} música${count !== 1 ? 's' : ''} encontrada${count !== 1 ? 's' : ''}</div>
    `;

    musicListContainer.parentNode.insertBefore(header, musicListContainer);
}

if (playerBar) {
    playerBar.addEventListener("click", () => {
        const audioEl = document.getElementById('audio')
        if (audioEl.src && audioEl.src !== '') {
            const currentTime = audioEl.currentTime
            const isPlaying = !audioEl.paused

            localStorage.setItem("currentPlayingMusic", JSON.stringify({
                url: audioEl.src,
                currentTime: currentTime,
                isPlaying: isPlaying,
                id: musicas[currentPlayingMusic].id,
                cover: document.getElementById('cover').src,
                title: document.querySelector('.song-title')?.textContent || '',
                artist: document.querySelector('.song-artist')?.textContent || ''
            }))

            window.location.href = `newplayer.html?music=${musicas[currentPlayingMusic].id}`
        } else {
            window.location.href = "newplayer.html"
        }
    })
}

document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.querySelector('.barra-busca')
    if (searchInput) {
        searchInput.value = query;

        searchInput.addEventListener('input', function () {
            const currentQuery = this.value.toLowerCase()
            if (musics.length > 0) {
                const filtered = musics.filter(m =>
                    m.title.toLowerCase().includes(currentQuery) ||
                    m.artist.toLowerCase().includes(currentQuery)
                )
                renderSearchResults(filtered)
                updateResultsHeader(filtered.length)
            }
        })
    }
})