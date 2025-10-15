class NewMusicPlayer {
  constructor() {
    this.audioPlayer = document.getElementById("audioPlayer");
    this.isPlaying = false;
    this.currentMusic = null;
    this.playlist = [];
    this.currentIndex = 0;
    this.isShuffled = false;
    this.repeatMode = "none";
    this.volume = 0.5;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadSavedSettings();
    this.updateVolumeDisplay();
    this.checkForMusicFromURL();
  }

  setupEventListeners() {
    document
      .getElementById("playPauseBtn")
      .addEventListener("click", () => this.togglePlayPause());
    document
      .getElementById("prevBtn")
      .addEventListener("click", () => this.previousTrack());
    document
      .getElementById("nextBtn")
      .addEventListener("click", () => this.nextTrack());
    document
      .getElementById("shuffleBtn")
      .addEventListener("click", () => this.toggleShuffle());
    document
      .getElementById("repeatBtn")
      .addEventListener("click", () => this.toggleRepeat());

    const progressSlider = document.getElementById("progressSlider");
    progressSlider.addEventListener("input", () =>
      this.seekTo(progressSlider.value)
    );
    progressSlider.addEventListener("change", () =>
      this.seekTo(progressSlider.value)
    );

    const volumeSlider = document.getElementById("volumeSlider");
    volumeSlider.addEventListener("input", () =>
      this.setVolume(volumeSlider.value)
    );

    this.audioPlayer.addEventListener("loadedmetadata", () =>
      this.updateDuration()
    );
    this.audioPlayer.addEventListener("timeupdate", () =>
      this.updateProgress()
    );
    this.audioPlayer.addEventListener("ended", () => this.handleTrackEnd());
    this.audioPlayer.addEventListener("play", () => this.onPlay());
    this.audioPlayer.addEventListener("pause", () => this.onPause());
    this.audioPlayer.addEventListener("error", () => this.onError());

    document.addEventListener("keydown", (e) => this.handleKeyboard(e));

    document.addEventListener("click", (e) => {
      const dropdown = document.getElementById("dropdownMenu");
      const menuBtn = document.querySelector(".menu-btn");
      if (!dropdown.contains(e.target) && !menuBtn.contains(e.target)) {
        dropdown.classList.remove("active");
      }
    });
  }

  loadSavedSettings() {
    const savedVolume = localStorage.getItem("playerVolume");
    if (savedVolume) {
      this.volume = parseFloat(savedVolume);
      document.getElementById("volumeSlider").value = this.volume * 100;
      this.audioPlayer.volume = this.volume;
    }

    const savedRepeat = localStorage.getItem("playerRepeat");
    if (savedRepeat) {
      this.repeatMode = savedRepeat;
      this.updateRepeatButton();
    }

    const savedShuffle = localStorage.getItem("playerShuffle");
    if (savedShuffle === "true") {
      this.isShuffled = true;
      this.updateShuffleButton();
    }
  }

  checkForMusicFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const musicId = urlParams.get("music");

    if (musicId) {
      this.loadMusicById(parseInt(musicId));
    } else {
      const savedMusicState = localStorage.getItem("currentPlayingMusic");
      if (savedMusicState) {
        const { id, currentTime, isPlaying } = JSON.parse(savedMusicState);
        this.loadMusicById(id, currentTime, isPlaying);
        localStorage.removeItem("currentPlayingMusic"); // Limpar o estado salvo
      }
    }
  }

  if(music) {
    this.loadMusic(music, musicas);

    this.audioPlayer.addEventListener('canplaythrough', () => {
      this.audioPlayer.currentTime = initialTime;
      if (shouldPlay) {
        this.audioPlayer.play().catch(error => {
          console.error("Erro ao reproduzir automaticamente:", error);
          this.showError("Erro ao reproduzir música automaticamente");
        });
      }
    }, { once: true })
  }


  async loadMusicById(musicId, initialTime = 0, shouldPlay = false) {
    try {
      const serverUrl = localStorage.getItem("urlServidor");
      if (!serverUrl) {
        this.showError("Servidor não configurado");
        return;
      }

      const response = await fetch(`${serverUrl}/api/musicas`);
      const musicas = await response.json();

      const music = musicas.find(m => m.id === musicId);
      if (music) {
        this.loadMusic(music, musicas);
        this.audioPlayer.currentTime = initialTime;
        if (shouldPlay) {
          this.audioPlayer.play().catch(error => {
            console.error("Erro ao reproduzir automaticamente:", error);
            this.showError("Erro ao reproduzir música automaticamente");
          });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar música:", error);
      this.showError("Erro ao carregar música");
    }
  }


  loadMusic(music, playlist = []) {
    this.currentMusic = music;
    this.playlist = playlist;
    this.currentIndex = playlist.findIndex((m) => m.id === music.id);

    // Atualizar interface
    this.updateMusicInfo();
    this.updateAlbumCover();
    this.updateBackground();

    // Carregar áudio
    const serverUrl = localStorage.getItem("urlServidor");
    this.audioPlayer.src = `${serverUrl}${music.url}`;
    this.audioPlayer.load();

    // Adicionar ao histórico
    if (window.addToMusicHistory) {
      window.addToMusicHistory(music);
    }
  }

  updateMusicInfo() {
    if (!this.currentMusic) return;

    document.getElementById("musicTitle").textContent = this.currentMusic.title;
    document.getElementById("musicArtist").textContent =
      this.currentMusic.artist;
  }

  updateAlbumCover() {
    if (!this.currentMusic) return;

    const serverUrl = localStorage.getItem("urlServidor");
    const coverImage = document.getElementById("coverImage");
    const albumCover = document.getElementById("albumCover");

    coverImage.src = `${serverUrl}${this.currentMusic.imageUrl}`;
    coverImage.onerror = () => {
      coverImage.src = "/static/assets/no-server-stats.png";
    };

    if (this.isPlaying) {
      albumCover.classList.add("playing");
    } else {
      albumCover.classList.remove("playing");
    }
  }

  updateBackground() {
    if (!this.currentMusic) return;

    const serverUrl = localStorage.getItem("urlServidor");
    const backgroundBlur = document.getElementById("backgroundBlur");
    backgroundBlur.style.backgroundImage = `url('${serverUrl}${this.currentMusic.imageUrl}')`;
  }

  togglePlayPause() {
    if (!this.currentMusic) {
      this.showError("Nenhuma música selecionada");
      return;
    }

    if (this.isPlaying) {
      this.audioPlayer.pause();
    } else {
      this.audioPlayer.play().catch((error) => {
        console.error("Erro ao reproduzir:", error);
        this.showError("Erro ao reproduzir música");
      });
    }
  }

  previousTrack() {
    if (this.playlist.length === 0) return;

    if (this.isShuffled) {
      this.currentIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      this.currentIndex =
        (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
    }

    this.loadMusic(this.playlist[this.currentIndex], this.playlist);
    if (this.isPlaying) {
      this.audioPlayer.play();
    }
  }

  nextTrack() {
    if (this.playlist.length === 0) return;

    if (this.isShuffled) {
      this.currentIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    }

    this.loadMusic(this.playlist[this.currentIndex], this.playlist);
    if (this.isPlaying) {
      this.audioPlayer.play();
    }
  }

  toggleShuffle() {
    this.isShuffled = !this.isShuffled;
    localStorage.setItem("playerShuffle", this.isShuffled);
    this.updateShuffleButton();
  }

  toggleRepeat() {
    const modes = ["none", "all", "one"];
    const currentIndex = modes.indexOf(this.repeatMode);
    this.repeatMode = modes[(currentIndex + 1) % modes.length];
    localStorage.setItem("playerRepeat", this.repeatMode);
    this.updateRepeatButton();
  }

  updateShuffleButton() {
    const shuffleBtn = document.getElementById("shuffleBtn");
    if (this.isShuffled) {
      shuffleBtn.classList.add("active");
    } else {
      shuffleBtn.classList.remove("active");
    }
  }

  updateRepeatButton() {
    const repeatBtn = document.getElementById("repeatBtn");
    const icon = repeatBtn.querySelector("i");

    repeatBtn.classList.remove("active");

    switch (this.repeatMode) {
      case "one":
        icon.className = "fas fa-redo";
        repeatBtn.classList.add("active");
        break;
      case "all":
        icon.className = "fas fa-redo";
        repeatBtn.classList.add("active");
        break;
      default:
        icon.className = "fas fa-redo";
        break;
    }
  }

  setVolume(value) {
    this.volume = value / 100;
    this.audioPlayer.volume = this.volume;
    localStorage.setItem("playerVolume", this.volume);
    this.updateVolumeDisplay();
  }

  updateVolumeDisplay() {
    const volumeFill = document.getElementById("volumeFill");
    volumeFill.style.width = `${this.volume * 100}%`;
  }

  seekTo(value) {
    if (!this.audioPlayer.duration) return;

    const time = (value / 100) * this.audioPlayer.duration;
    this.audioPlayer.currentTime = time;
  }

  updateProgress() {
    if (!this.audioPlayer.duration) return;

    const progress =
      (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
    const progressSlider = document.getElementById("progressSlider");
    const progressFill = document.getElementById("progressFill");

    progressSlider.value = progress;
    progressFill.style.width = `${progress}%`;

    // Atualizar tempo
    document.getElementById("currentTime").textContent = this.formatTime(
      this.audioPlayer.currentTime
    );
  }

  updateDuration() {
    document.getElementById("totalTime").textContent = this.formatTime(
      this.audioPlayer.duration
    );
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  handleTrackEnd() {
    if (this.repeatMode === "one") {
      this.audioPlayer.currentTime = 0;
      this.audioPlayer.play();
    } else if (
      this.repeatMode === "all" ||
      this.currentIndex < this.playlist.length - 1
    ) {
      this.nextTrack();
    } else {
      this.onPause();
    }

    // Atualizar duração no histórico
    if (window.updateMusicDuration && this.currentMusic) {
      window.updateMusicDuration(
        this.currentMusic.id,
        this.audioPlayer.duration
      );
    }
  }

  onPlay() {
    this.isPlaying = true;
    const playPauseBtn = document.getElementById("playPauseBtn");
    playPauseBtn.querySelector("i").className = "fas fa-pause";

    const albumCover = document.getElementById("albumCover");
    albumCover.classList.add("playing");

    this.startVisualizer();
  }

  onPause() {
    this.isPlaying = false;
    const playPauseBtn = document.getElementById("playPauseBtn");
    playPauseBtn.querySelector("i").className = "fas fa-play";

    const albumCover = document.getElementById("albumCover");
    albumCover.classList.remove("playing");

    this.stopVisualizer();
  }

  onError() {
    this.showError("Erro ao carregar a música");
    this.onPause();
  }

  startVisualizer() {
    const visualizer = document.getElementById("audioVisualizer");
    visualizer.style.zIndex = "1";
  }

  stopVisualizer() {
    const visualizer = document.getElementById("audioVisualizer");
    visualizer.style.zIndex = "-1";
  }

  handleKeyboard(event) {
    switch (event.code) {
      case "Space":
        event.preventDefault();
        this.togglePlayPause();
        break;
      case "ArrowLeft":
        event.preventDefault();
        this.previousTrack();
        break;
      case "ArrowRight":
        event.preventDefault();
        this.nextTrack();
        break;
      case "ArrowUp":
        event.preventDefault();
        this.setVolume(Math.min(100, this.volume * 100 + 10));
        document.getElementById("volumeSlider").value = this.volume * 100;
        break;
      case "ArrowDown":
        event.preventDefault();
        this.setVolume(Math.max(0, this.volume * 100 - 10));
        document.getElementById("volumeSlider").value = this.volume * 100;
        break;
    }
  }

  showError(message) {
    // Implementar notificação de erro
    console.error(message);
  }
}

// Funções globais para os botões
function goBack() {
  window.history.back();
}

function toggleMenu() {
  const dropdown = document.getElementById("dropdownMenu");
  dropdown.classList.toggle("active");
}

function addToFavorites() {
  console.log("Adicionar aos favoritos");
  toggleMenu();
}

function addToPlaylist() {
  console.log("Adicionar à playlist");
  toggleMenu();
}

function shareMusic() {
  if (player.currentMusic) {
    const shareText = `Ouvindo: ${player.currentMusic.title} - ${player.currentMusic.artist}`;
    if (navigator.share) {
      navigator.share({
        title: "Compartilhar Música",
        text: shareText,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      console.log("Link copiado para a área de transferência");
    }
  }
  toggleMenu();
}

function clearQueue() {
  player.playlist = [];
  console.log("Fila limpa");
}

function goToLibrary() {
  window.location.href = "/";
}

// Inicializar o player
const player = new NewMusicPlayer();

// Expor o player globalmente para outras páginas
window.newMusicPlayer = player;
