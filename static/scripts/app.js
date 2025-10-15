const elementoStatus = document.getElementById('status')

function juntarUrl(base, relativo) {
  try {
    return new URL(relativo, base).href
  } catch {
    return base.replace(/\/+$/, '') + '/' + relativo.replace(/^\/+/, '')
  }
}

async function buscarJSON(url) {
  const resposta = await fetch(url)
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
  return resposta.json()
}

function definirStatus(mensagem) {
  if (elementoStatus) elementoStatus.textContent = mensagem
}

async function conectarComServidorSalvo() {
  const base = localStorage.getItem('urlServidor')
  if (!base) {
    definirStatus('Servidor não configurado. Vá para as configurações.')
    mostrarPlaceholderAlbuns()
    return
  }

  definirStatus('Conectando ao servidor...')
  try {
    const saude = await buscarJSON(juntarUrl(base, '/api/saude'))
    definirStatus(`Conectado. ${saude.count} músicas disponíveis.`)

    const musicas = await buscarJSON(juntarUrl(base, '/api/musicas'))

    renderizarMusicas(base, musicas)
    renderizarAlbuns(base, musicas)
  } catch (erro) {
    definirStatus('Erro ao conectar ao servidor.')
    mostrarPlaceholderAlbuns()
    console.error(erro)
  }
}

function mostrarPlaceholderAlbuns() {
  const listaAlbum = document.getElementById('lista-album')
  if (listaAlbum) {
    listaAlbum.innerHTML = `
      <div class="no-server-placeholder">
        <img src="/static/assets/no-server-stats.png" alt="Aguardando conexão com servidor">
        <p>Conecte-se ao servidor para ver os álbuns</p>
      </div>
    `
  }
}

function renderizarAlbuns(base, musicas) {
  const listaAlbum = document.getElementById('lista-album')
  if (!listaAlbum) return

  // Agrupar músicas por artista para criar álbuns únicos
  const albumsPorArtista = {}
  musicas.forEach(musica => {
    if (!albumsPorArtista[musica.artist]) {
      albumsPorArtista[musica.artist] = {
        artist: musica.artist,
        imageUrl: musica.imageUrl,
        musicas: []
      }
    }
    albumsPorArtista[musica.artist].musicas.push(musica)
  })

  const albuns = Object.values(albumsPorArtista)
  
  listaAlbum.innerHTML = albuns.map(album => `
    <div class="album-placeholder quadrado" onclick="tocarAlbum('${album.artist}')">
      <img class="quadrado" src="${juntarUrl(base, album.imageUrl)}" alt="${album.artist}" 
           onerror="this.src='/static/assets/no-server-stats.png'">
    </div>
  `).join('')
}

function tocarAlbum(artista) {
  console.log('Tocando álbum do artista:', artista)
}

function tratarErroImagem(img) {
  img.onerror = null; // Previne loop infinito
  img.src = '/static/assets/no-server-stats.png';
}

function obterImagemSegura(base, imageUrl) {
  if (!imageUrl || imageUrl === '' || imageUrl === 'null' || imageUrl === 'undefined') {
    return '/static/assets/no-server-stats.png';
  }
  
  if (imageUrl.includes('no-server-stats.png')) {
    return imageUrl;
  }
  
  try {
    return juntarUrl(base, imageUrl);
  } catch {
    return '/static/assets/no-server-stats.png';
  }
}

function renderizarMusicas(base, musicas) {
  const listaMusicas = document.querySelector(".lista-musicas");
  if (!listaMusicas) return;

  listaMusicas.innerHTML = musicas.map((musica) => {
    const imagemSegura = obterImagemSegura(base, musica.imageUrl);
    return `
      <div class="musica-item" onclick="tocarMusica(${musica.id})">
        <img src="${imagemSegura}" 
             alt="${musica.title}" 
             onerror="tratarErroImagem(this)">
        <div class="info-musica">
          <h3>${musica.title}</h3>
          <p>${musica.artist}</p>
        </div>
      </div>
    `;
  }).join("");
}

function verificarImagemPadrao() {
  const img = new Image();
  img.onload = function() {
    console.log('Imagem padrão carregada com sucesso');
  };
  img.onerror = function() {
    console.error('Erro: Imagem padrão não encontrada em /static/assets/no-server-stats.png');
  };
  img.src = '/static/assets/no-server-stats.png';
}

document.addEventListener('DOMContentLoaded', function() {
  verificarImagemPadrao();
  conectarComServidorSalvo();
});

conectarComServidorSalvo();

