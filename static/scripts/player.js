// --- ELEMENTOS DO DOM ---
const elementoStatus = document.getElementById('status');
const listaMusicasEl = document.getElementById('lista-musicas');
const listaAlbumEl = document.getElementById('lista-album');

// Elementos do Player
const playerBar = document.getElementById('player-bar');
const audioEl = document.getElementById('audio');
const coverEl = document.getElementById('cover');
const nowPlayingEl = document.getElementById('nowPlaying');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const loopBtn = document.getElementById('loopBtn');
const newPlayerBtn = document.getElementById('newPlayerBtn');
const progressBar = document.getElementById('progressBar');

// --- ESTADO DO PLAYER ---
let allSongs = []; // Guarda a lista de todas as músicas recebidas do servidor
let currentSongIndex = -1; // Índice da música que está tocando no array 'allSongs'
let serverBaseUrl = ''; // Guarda a URL base do servidor
let isLooping = false;

// --- FUNÇÕES DE API ---
function juntarUrl(base, relativo) {
    try {
        return new URL(relativo, base).href;
    } catch {
        return base.replace(/\/+$/, '') + '/' + relativo.replace(/^\/+/, '');
    }
}

async function buscarJSON(url) {
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    return resposta.json();
}

// --- FUNÇÕES DE RENDERIZAÇÃO E UI ---
function definirStatus(mensagem) {
    if (elementoStatus) elementoStatus.textContent = mensagem;
}

function tratarErroImagem(img) {
    img.onerror = null;
    img.src = '/static/assets/no-server-stats.png';
}

function obterImagemSegura(base, imageUrl) {
    if (!imageUrl || imageUrl === '' || imageUrl === 'null' || imageUrl === 'undefined') {
        return '/static/assets/no-server-stats.png';
    }
    return juntarUrl(base, imageUrl);
}

function renderizarMusicas(musicas) {
    if (!listaMusicasEl) return;
    listaMusicasEl.innerHTML = musicas.map((musica, index) => {
        const imagemSegura = obterImagemSegura(serverBaseUrl, musica.imageUrl);
        return `
      <div class="musica-item" data-index="${index}">
        <img src="${imagemSegura}" alt="${musica.title}" onerror="tratarErroImagem(this)">
        <div class="info-musica">
          <h3>${musica.title}</h3>
          <p>${musica.artist}</p>
        </div>
      </div>
    `;
    }).join("");
}

function renderizarAlbuns(musicas) {
    if (!listaAlbumEl) return;
    const albumsPorArtista = {};
    musicas.forEach(musica => {
        if (!albumsPorArtista[musica.artist]) {
            albumsPorArtista[musica.artist] = {
                artist: musica.artist,
                imageUrl: musica.imageUrl,
            };
        }
    });
    const albuns = Object.values(albumsPorArtista);
    listaAlbumEl.innerHTML = albuns.map(album => {
        const imagemSegura = obterImagemSegura(serverBaseUrl, album.imageUrl);
        return `
      <div class="album-placeholder quadrado">
        <img class="quadrado" src="${imagemSegura}" alt="${album.artist}" onerror="tratarErroImagem(this)">
      </div>
    `;
    }).join('');
}

function mostrarPlaceholder() {
    const placeholderHTML = `
    <div class="no-server-placeholder">
      <img src="/static/assets/no-server-stats.png" alt="Aguardando conexão com servidor">
      <p>Conecte-se ao servidor para ver o conteúdo</p>
    </div>
  `;
    if (listaAlbumEl) listaAlbumEl.innerHTML = placeholderHTML;
    if (listaMusicasEl) listaMusicasEl.innerHTML = "";
}

// --- FUNÇÕES DE LÓGICA (DO PLAYER.JS) ---

function ajustarPaddingBody() {
    if (playerBar && !playerBar.classList.contains("hidden")) {
        document.body.style.paddingBottom = playerBar.offsetHeight + "px";
    } else {
        document.body.style.paddingBottom = "0px";
    }
}

function adicionarAoHistorico(musica) {
    try {
        let historico = JSON.parse(localStorage.getItem('musicHistory') || '[]');
        const itemHistorico = { ...musica, playedAt: new Date().toISOString(), duration: 0 };

        const cincoMinutosAtras = new Date(Date.now() - 5 * 60 * 1000);
        historico = historico.filter(item => !(item.id === musica.id && new Date(item.playedAt) > cincoMinutosAtras));

        historico.unshift(itemHistorico);
        if (historico.length > 100) {
            historico = historico.slice(0, 100);
        }
        localStorage.setItem('musicHistory', JSON.stringify(historico));
    } catch (error) {
        console.error('Erro ao adicionar música ao histórico:', error);
    }
}

function atualizarDuracaoHistorico(musicaId, duracao) {
    try {
        let historico = JSON.parse(localStorage.getItem('musicHistory') || '[]');
        const item = historico.find(h => h.id === musicaId);
        if (item) {
            item.duration = duracao;
            localStorage.setItem('musicHistory', JSON.stringify(historico));
        }
    } catch (error) {
        console.error('Erro ao atualizar duração no histórico:', error);
    }
}


// --- LÓGICA DO PLAYER ---
function tocarMusica(index) {
    if (index < 0 || index >= allSongs.length) return;

    currentSongIndex = index;
    const song = allSongs[index];

    nowPlayingEl.textContent = `${song.title} - ${song.artist}`;
    coverEl.src = obterImagemSegura(serverBaseUrl, song.imageUrl);
    audioEl.src = juntarUrl(serverBaseUrl, song.url); // Usa 'url' em vez de 'path'

    audioEl.play();
    playerBar.classList.remove('hidden');
    adicionarAoHistorico(song);
    ajustarPaddingBody();
}

function togglePlayPause() {
    if (audioEl.src) {
        if (audioEl.paused) {
            audioEl.play();
        } else {
            audioEl.pause();
        }
    }
}

function tocarProxima() {
    if (allSongs.length === 0) return;
    const nextIndex = (currentSongIndex + 1) % allSongs.length;
    tocarMusica(nextIndex);
}

function tocarAnterior() {
    if (allSongs.length === 0) return;
    const prevIndex = (currentSongIndex - 1 + allSongs.length) % allSongs.length;
    tocarMusica(prevIndex);
}

function toggleLoop() {
    isLooping = !isLooping;
    if (loopBtn) loopBtn.classList.toggle('active', isLooping);
}

// --- FUNÇÃO PRINCIPAL E INICIALIZAÇÃO ---
async function conectarComServidorSalvo() {
    serverBaseUrl = localStorage.getItem('urlServidor');
    if (!serverBaseUrl) {
        definirStatus('Servidor não configurado. Vá para as configurações.');
        mostrarPlaceholder();
        return;
    }

    definirStatus('Conectando ao servidor...');
    try {
        const saude = await buscarJSON(juntarUrl(serverBaseUrl, '/api/saude'));
        definirStatus(`Conectado. ${saude.count} músicas disponíveis.`);

        const musicas = await buscarJSON(juntarUrl(serverBaseUrl, '/api/musicas'));
        allSongs = musicas;

        renderizarMusicas(allSongs);
        renderizarAlbuns(allSongs);

    } catch (erro) {
        definirStatus('Erro ao conectar ao servidor.');
        mostrarPlaceholder();
        console.error(erro);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    conectarComServidorSalvo();

    // Listeners dos botões do player
    if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
    if (nextBtn) nextBtn.addEventListener('click', tocarProxima);
    if (prevBtn) prevBtn.addEventListener('click', tocarAnterior);
    if (loopBtn) loopBtn.addEventListener('click', toggleLoop);

    if (newPlayerBtn) {
        newPlayerBtn.addEventListener("click", () => {
            const currentSong = allSongs[currentSongIndex];
            if (currentSong) {
                localStorage.setItem("currentPlayingMusic", JSON.stringify({
                    id: currentSong.id,
                    currentTime: audioEl.currentTime,
                    isPlaying: !audioEl.paused
                }));
                window.location.href = `newplayer.html?music=${currentSong.id}`;
            } else {
                window.location.href = "newplayer.html";
            }
        });
    }

    if (listaMusicasEl) {
        listaMusicasEl.addEventListener('click', (event) => {
            const item = event.target.closest('.musica-item');
            if (item) {
                const index = parseInt(item.dataset.index, 10);
                tocarMusica(index);
            }
        });
    }

    // Listeners do elemento de áudio
    audioEl.addEventListener('play', () => {
        if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    });
    audioEl.addEventListener('pause', () => {
        if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    });
    audioEl.addEventListener('timeupdate', () => {
        if (progressBar) progressBar.value = (audioEl.currentTime / audioEl.duration) * 100 || 0;
    });
    audioEl.addEventListener('ended', () => {
        const currentSong = allSongs[currentSongIndex];
        if (currentSong && audioEl.duration) {
            atualizarDuracaoHistorico(currentSong.id, audioEl.duration);
        }
        if (isLooping) {
            audioEl.currentTime = 0;
            audioEl.play();
        } else {
            tocarProxima();
        }
    });

    if (progressBar) {
        progressBar.addEventListener('input', () => {
            if (audioEl.duration) {
                audioEl.currentTime = (progressBar.value / 100) * audioEl.duration;
            }
        });
    }
    
    // Ajustar padding inicial e em redimensionamento da tela
    ajustarPaddingBody();
    window.addEventListener('resize', ajustarPaddingBody);
});

