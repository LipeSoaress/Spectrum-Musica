let currentTrackIndex = 0
let musicas = []
let isLooping = false
let base = ''

const audio = document.getElementById('audio')
const nowPlaying = document.getElementById('nowPlaying')
const playPauseBtn = document.getElementById('playPauseBtn')
const prevBtn = document.getElementById('prevBtn')
const nextBtn = document.getElementById('nextBtn')
const loopBtn = document.getElementById('loopBtn')
const progressBar = document.getElementById('progressBar')
const playerBar = document.getElementById('player-bar')
const cover = document.getElementById('cover')

function juntarUrl(base, relativo) {
  try {
    return new URL(relativo, base).href
  } catch {
    return base.replace(/\/+$/, '') + '/' + relativo.replace(/^\/+/, '')
  }
}

function tocarMusica(baseUrl, musica, index = null) {
  if (index !== null) currentTrackIndex = index
  base = baseUrl

  const urlMusica = juntarUrl(base, musica.url)
  audio.src = urlMusica
  audio.play()

  nowPlaying.textContent = `Tocando: ${musica.title} - ${musica.artist}`
  cover.src = musica.imageUrl.startsWith("http") ? musica.imageUrl : juntarUrl(base, musica.imageUrl)
  playerBar.classList.remove('hidden')
}

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return
  progressBar.value = (audio.currentTime / audio.duration) * 100
})

progressBar.addEventListener('input', () => {
  audio.currentTime = (progressBar.value / 100) * audio.duration
})

playPauseBtn.addEventListener('click', () => {
  if (audio.paused) {
    audio.play()
  } else {
    audio.pause()
  }
})

audio.addEventListener('play', () => {
  playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>'
})

audio.addEventListener('pause', () => {
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>'
})


loopBtn.addEventListener('click', () => {
  isLooping = !isLooping;
  loopBtn.classList.toggle('active', isLooping);
})

audio.addEventListener('ended', () => {
  if (isLooping) {
    audio.currentTime = 0
    audio.play()
  } else {
    tocarProxima()
  }
})

function tocarAnterior() {
  if (musicas.length === 0) return
  currentTrackIndex = (currentTrackIndex - 1 + musicas.length) % musicas.length
  tocarMusica(base, musicas[currentTrackIndex], currentTrackIndex)
}

function tocarProxima() {
  if (musicas.length === 0) return
  currentTrackIndex = (currentTrackIndex + 1) % musicas.length
  tocarMusica(base, musicas[currentTrackIndex], currentTrackIndex)
}

prevBtn.addEventListener('click', tocarAnterior)
nextBtn.addEventListener('click', tocarProxima)

function renderizarMusicas(baseUrl, lista) {
  musicas = lista
  const container = document.querySelector('.lista-musicas')
  container.innerHTML = ''

  lista.forEach((musica, i) => {
    const item = document.createElement('div')
    item.className = 'musica-item'

    const img = document.createElement('img')
    img.src = musica.imageUrl.startsWith("http")
      ? musica.imageUrl
      : juntarUrl(baseUrl, musica.imageUrl)
    img.alt = musica.title

    const info = document.createElement('div')
    info.className = 'info-musica'
    info.innerHTML = `<h3>${musica.title}</h3><p>${musica.artist}</p>`

    item.appendChild(img)
    item.appendChild(info)

    item.addEventListener('click', () => tocarMusica(baseUrl, musica, i))

    container.appendChild(item)
  })
}
