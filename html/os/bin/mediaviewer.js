// mediaviewer.js - Custom media viewer

export class MediaViewer {
  constructor() {
    this.isOpen = false;
    this.overlay = null;
    this.viewer = null;
    this.media = null;
    this.mediaType = null;
    this.scale = 1;
    this.maxScale = 3;
    this.minScale = 0.5;
  }

  view(fileName, mediaUrl, mediaType = 'image') {
    if (this.isOpen) {
      this.close();
    }

    this.isOpen = true;
    this.mediaType = mediaType;
    this.scale = 1;
    this.createViewerInterface(fileName, mediaUrl, mediaType);
  }

  createViewerInterface(fileName, mediaUrl, mediaType) {
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.9);
      z-index: 10000;
      display: flex;
      justify-content: center;
      align-items: center;
      backdrop-filter: blur(5px);
    `;

    this.viewer = document.createElement('div');
    this.viewer.style.cssText = `
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      align-items: center;
    `;

    const topBar = document.createElement('div');
    topBar.style.cssText = `
      background: rgba(0, 0, 0, 0.8);
      color: #0f0;
      padding: 10px 20px;
      border-radius: 8px 8px 0 0;
      font-family: 'Courier New', Courier, monospace;
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #0f0;
      border-bottom: none;
    `;

    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = `
      font-size: 14px;
      font-weight: bold;
      max-width: 400px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    `;
    titleDiv.textContent = fileName;

    const controlsDiv = document.createElement('div');
    controlsDiv.style.cssText = `
      display: flex;
      gap: 10px;
      align-items: center;
    `;

    if (mediaType === 'image') {
      const zoomOut = document.createElement('button');
      zoomOut.innerHTML = '−';
      zoomOut.style.cssText = this.getButtonStyle();
      zoomOut.addEventListener('click', () => this.zoom(-0.2));

      const zoomReset = document.createElement('button');
      zoomReset.innerHTML = '⌂';
      zoomReset.style.cssText = this.getButtonStyle();
      zoomReset.addEventListener('click', () => this.resetZoom());

      const zoomIn = document.createElement('button');
      zoomIn.innerHTML = '+';
      zoomIn.style.cssText = this.getButtonStyle();
      zoomIn.addEventListener('click', () => this.zoom(0.2));

      controlsDiv.appendChild(zoomOut);
      controlsDiv.appendChild(zoomReset);
      controlsDiv.appendChild(zoomIn);
    }

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      ${this.getButtonStyle()}
      font-size: 18px;
      width: 30px;
      height: 30px;
    `;
    closeBtn.addEventListener('click', () => this.close());

    controlsDiv.appendChild(closeBtn);
    topBar.appendChild(titleDiv);
    topBar.appendChild(controlsDiv);

    const mediaContainer = document.createElement('div');
    mediaContainer.style.cssText = `
      background: #000;
      border: 1px solid #0f0;
      border-top: none;
      border-radius: 0 0 8px 8px;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      position: relative;
      max-width: 90vw;
      max-height: calc(90vh - 60px);
    `;

    if (mediaType === 'image') {
      this.media = document.createElement('img');
      this.media.src = mediaUrl;
      this.media.style.cssText = `
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        transition: transform 0.2s ease;
        cursor: grab;
      `;

      this.media.addEventListener('load', () => {
        this.fitToContainer();
      });

      this.media.addEventListener('error', () => {
        this.showError('Failed to load image');
      });

      this.addDragFunctionality();

    } else if (mediaType === 'video') {
      this.media = document.createElement('video');
      this.media.src = mediaUrl;
      this.media.controls = true;
      this.media.style.cssText = `
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      `;

      this.media.addEventListener('error', () => {
        this.showError('Failed to load video');
      });
    }

    mediaContainer.appendChild(this.media);

    const infoBar = document.createElement('div');
    infoBar.style.cssText = `
      background: rgba(0, 0, 0, 0.8);
      color: #888;
      padding: 8px 20px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      text-align: center;
      border-radius: 0 0 8px 8px;
      width: 100%;
      box-sizing: border-box;
    `;

    if (mediaType === 'image') {
      infoBar.innerHTML = 'Use mouse wheel to zoom • Click and drag to pan • ESC to close';
    } else {
      infoBar.innerHTML = 'ESC to close • Play/Pause: Space/LMB • Audio levels: ↑ ↓ • Seek: <-  ->';
    }

    this.viewer.appendChild(topBar);
    this.viewer.appendChild(mediaContainer);
    this.viewer.appendChild(infoBar);
    this.overlay.appendChild(this.viewer);
    document.body.appendChild(this.overlay);

    this.mediaContainer = mediaContainer;
    this.infoBar = infoBar;

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    this.keyHandler = (e) => {
      if (e.code === 'Escape') {
        this.close();
      } else if (e.code === 'Space' && mediaType === 'video') {
        e.preventDefault();
        this.toggleVideo();
      } else if (mediaType === 'image') {
        if (e.code === 'Equal' || e.code === 'NumpadAdd') {
          e.preventDefault();
          this.zoom(0.2);
        } else if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
          e.preventDefault();
          this.zoom(-0.2);
        } else if (e.code === 'Digit0' || e.code === 'Numpad0') {
          e.preventDefault();
          this.resetZoom();
        }
      }
    };
    document.addEventListener('keydown', this.keyHandler);

    if (mediaType === 'image') {
      this.wheelHandler = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        this.zoom(delta);
      };
      this.overlay.addEventListener('wheel', this.wheelHandler);
    }
  }

  getButtonStyle() {
    return `
      background: #0f0;
      color: #000;
      border: none;
      border-radius: 4px;
      width: 25px;
      height: 25px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: bold;
      transition: all 0.2s ease;
    `;
  }

  addDragFunctionality() {
    let isDragging = false;
    let startX, startY, initialX, initialY;

    this.media.addEventListener('mousedown', (e) => {
      if (this.scale > 1) {
        isDragging = true;
        this.media.style.cursor = 'grabbing';
        startX = e.clientX;
        startY = e.clientY;
        const transform = this.media.style.transform;
        const matrix = new WebKitCSSMatrix(transform);
        initialX = matrix.m41;
        initialY = matrix.m42;
        e.preventDefault();
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        const newX = initialX + deltaX;
        const newY = initialY + deltaY;
        this.media.style.transform = `scale(${this.scale}) translate(${newX}px, ${newY}px)`;
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        this.media.style.cursor = 'grab';
      }
    });
  }

  zoom(delta) {
    if (this.mediaType !== 'image') return;

    const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale + delta));

    if (newScale !== this.scale) {
      this.scale = newScale;
      this.updateTransform();
      this.updateInfo();
    }
  }

  resetZoom() {
    if (this.mediaType !== 'image') return;

    this.scale = 1;
    this.media.style.transform = 'scale(1) translate(0, 0)';
    this.updateInfo();
  }

  fitToContainer() {
    if (this.mediaType !== 'image') return;

    const containerRect = this.mediaContainer.getBoundingClientRect();
    const imageRect = this.media.getBoundingClientRect();

    const scaleX = (containerRect.width * 0.9) / this.media.naturalWidth;
    const scaleY = (containerRect.height * 0.9) / this.media.naturalHeight;
    const optimalScale = Math.min(scaleX, scaleY, 1);

    this.scale = optimalScale;
    this.updateTransform();
    this.updateInfo();
  }

  updateTransform() {
    const currentTransform = this.media.style.transform;
    const translateMatch = currentTransform.match(/translate\(([^)]+)\)/);
    const translatePart = translateMatch ? translateMatch[0] : 'translate(0, 0)';

    this.media.style.transform = `scale(${this.scale}) ${translatePart}`;
  }

  updateInfo() {
    if (this.mediaType === 'image' && this.infoBar) {
      const zoomPercent = Math.round(this.scale * 100);
      this.infoBar.innerHTML = `${zoomPercent}% zoom • Use mouse wheel to zoom • Click and drag to pan • ESC to close`;
    }
  }

  toggleVideo() {
    if (this.mediaType === 'video' && this.media) {
      if (this.media.paused) {
        this.media.play();
      } else {
        this.media.pause();
      }
    }
  }

  showError(message) {
    if (this.mediaContainer) {
      this.mediaContainer.innerHTML = `
        <div style="
          color: #f00;
          text-align: center;
          padding: 40px;
          font-family: 'Courier New', Courier, monospace;
          font-size: 16px;
        ">
          ⚠ Error: ${message}
        </div>
      `;
    }
  }

  close() {
    if (this.overlay) {
      document.body.removeChild(this.overlay);
      this.overlay = null;
    }

    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }

    if (this.wheelHandler) {
      document.removeEventListener('wheel', this.wheelHandler);
      this.wheelHandler = null;
    }

    this.isOpen = false;
    this.viewer = null;
    this.media = null;
    this.mediaContainer = null;
    this.scale = 1;
  }
}

export const mediaViewer = new MediaViewer();