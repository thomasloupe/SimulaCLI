// mediaplayer.js - Custom audio player

export class MediaPlayer {
  constructor() {
    this.isOpen = false;
    this.audio = null;
    this.overlay = null;
    this.player = null;
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 0;
    this.volume = 0.8;
  }

  play(fileName, audioUrl) {
    if (this.isOpen) {
      this.close();
    }

    this.isOpen = true;
    this.createPlayerInterface(fileName, audioUrl);
    this.loadAudio(audioUrl);
  }

  createPlayerInterface(fileName, audioUrl) {
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      justify-content: center;
      align-items: center;
      backdrop-filter: blur(5px);
    `;

    this.player = document.createElement('div');
    this.player.style.cssText = `
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      border: 2px solid #0f0;
      border-radius: 15px;
      padding: 25px;
      width: 450px;
      box-shadow: 0 10px 30px rgba(0, 255, 0, 0.3);
      color: #0f0;
      font-family: 'Courier New', Courier, monospace;
      position: relative;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 15px;
      background: none;
      border: none;
      color: #0f0;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    closeBtn.addEventListener('click', () => this.close());

    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = `
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 20px;
      text-align: center;
      padding-right: 30px;
      word-break: break-word;
    `;
    titleDiv.textContent = `♪ ${fileName}`;

    const waveform = document.createElement('div');
    waveform.style.cssText = `
      height: 60px;
      margin: 20px 0;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      gap: 2px;
    `;

    for (let i = 0; i < 50; i++) {
      const bar = document.createElement('div');
      bar.style.cssText = `
        width: 3px;
        background: #0f0;
        height: ${Math.random() * 40 + 10}px;
        transition: height 0.1s ease;
        opacity: 0.7;
      `;
      waveform.appendChild(bar);
    }

    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      margin: 20px 0;
      cursor: pointer;
    `;

    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
      width: 100%;
      height: 6px;
      background: #333;
      border-radius: 3px;
      overflow: hidden;
      border: 1px solid #0f0;
    `;

    const progressFill = document.createElement('div');
    progressFill.style.cssText = `
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #0f0, #0a0);
      transition: width 0.1s ease;
    `;

    progressBar.appendChild(progressFill);
    progressContainer.appendChild(progressBar);

    const timeDisplay = document.createElement('div');
    timeDisplay.style.cssText = `
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-top: 5px;
      color: #888;
    `;
    timeDisplay.innerHTML = '<span id="currentTime">0:00</span><span id="duration">0:00</span>';

    const controls = document.createElement('div');
    controls.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      margin-top: 20px;
    `;

    const playBtn = document.createElement('button');
    playBtn.innerHTML = '▶';
    playBtn.style.cssText = `
      background: #0f0;
      color: #000;
      border: none;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    `;
    playBtn.addEventListener('click', () => this.togglePlay(playBtn));

    const volumeContainer = document.createElement('div');
    volumeContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
    `;

    const volumeIcon = document.createElement('span');
    volumeIcon.innerHTML = '🔊';
    volumeIcon.style.fontSize = '16px';

    const volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.min = '0';
    volumeSlider.max = '100';
    volumeSlider.value = '80';
    volumeSlider.style.cssText = `
      width: 80px;
      accent-color: #0f0;
    `;
    volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value / 100));

    volumeContainer.appendChild(volumeIcon);
    volumeContainer.appendChild(volumeSlider);

    this.player.appendChild(closeBtn);
    this.player.appendChild(titleDiv);
    this.player.appendChild(waveform);
    this.player.appendChild(progressContainer);
    this.player.appendChild(timeDisplay);
    this.player.appendChild(controls);
    controls.appendChild(playBtn);
    controls.appendChild(volumeContainer);

    this.overlay.appendChild(this.player);
    document.body.appendChild(this.overlay);

    this.progressFill = progressFill;
    this.playBtn = playBtn;
    this.waveformBars = waveform.children;
    this.currentTimeEl = timeDisplay.querySelector('#currentTime');
    this.durationEl = timeDisplay.querySelector('#duration');

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    progressContainer.addEventListener('click', (e) => {
      if (this.audio && this.duration) {
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const seekTime = percent * this.duration;
        this.audio.currentTime = seekTime;
      }
    });

    this.keyHandler = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlay(playBtn);
      } else if (e.code === 'Escape') {
        this.close();
      }
    };
    document.addEventListener('keydown', this.keyHandler);

    this.animateWaveform();
  }

  loadAudio(audioUrl) {
    this.audio = new Audio(audioUrl);
    this.audio.volume = this.volume;

    this.audio.addEventListener('loadedmetadata', () => {
      this.duration = this.audio.duration;
      this.durationEl.textContent = this.formatTime(this.duration);
    });

    this.audio.addEventListener('timeupdate', () => {
      this.currentTime = this.audio.currentTime;
      this.updateProgress();
      this.currentTimeEl.textContent = this.formatTime(this.currentTime);
    });

    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.playBtn.innerHTML = '▶';
      this.progressFill.style.width = '0%';
      this.currentTimeEl.textContent = '0:00';
    });

    this.audio.addEventListener('error', () => {
      this.showError('Failed to load audio file');
    });
  }

  togglePlay(playBtn) {
    if (!this.audio) return;

    if (this.isPlaying) {
      this.audio.pause();
      this.isPlaying = false;
      playBtn.innerHTML = '▶';
    } else {
      this.audio.play().then(() => {
        this.isPlaying = true;
        playBtn.innerHTML = '⏸';
      }).catch(() => {
        this.showError('Failed to play audio');
      });
    }
  }

  setVolume(volume) {
    this.volume = volume;
    if (this.audio) {
      this.audio.volume = volume;
    }
  }

  updateProgress() {
    if (this.duration) {
      const percent = (this.currentTime / this.duration) * 100;
      this.progressFill.style.width = `${percent}%`;
    }
  }

  animateWaveform() {
    if (!this.isOpen) return;

    Array.from(this.waveformBars).forEach(bar => {
      const height = this.isPlaying
        ? Math.random() * 40 + 10
        : parseInt(bar.style.height) * 0.95;
      bar.style.height = `${Math.max(height, 5)}px`;
      bar.style.opacity = this.isPlaying ? '1' : '0.3';
    });

    requestAnimationFrame(() => this.animateWaveform());
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  showError(message) {
    if (this.player) {
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        color: #f00;
        text-align: center;
        margin: 10px 0;
        font-size: 14px;
      `;
      errorDiv.textContent = `Error: ${message}`;
      this.player.appendChild(errorDiv);
    }
  }

  close() {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }

    if (this.overlay) {
      document.body.removeChild(this.overlay);
      this.overlay = null;
    }

    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }

    this.isOpen = false;
    this.isPlaying = false;
    this.player = null;
    this.progressFill = null;
    this.playBtn = null;
    this.waveformBars = null;
  }
}

export const mediaPlayer = new MediaPlayer();