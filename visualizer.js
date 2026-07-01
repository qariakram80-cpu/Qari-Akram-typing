class AudioVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.canvasCtx = this.canvas.getContext('2d');
    this.analyser = null;
    this.dataArray = null;
    this.animationId = null;
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.offsetWidth * window.devicePixelRatio;
    this.canvas.height = this.canvas.offsetHeight * window.devicePixelRatio;
    this.canvasCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  setAnalyser(analyser) {
    this.analyser = analyser;
    this.dataArray = new Uint8Array(analyser.frequencyBinCount);
  }

  start() {
    this.draw();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.clear();
  }

  draw() {
    this.animationId = requestAnimationFrame(() => this.draw());

    if (!this.analyser) return;

    this.analyser.getByteFrequencyData(this.dataArray);

    const width = this.canvas.offsetWidth;
    const height = this.canvas.offsetHeight;

    this.canvasCtx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg');
    this.canvasCtx.fillRect(0, 0, width, height);

    const barWidth = (width / this.dataArray.length) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < this.dataArray.length; i++) {
      barHeight = (this.dataArray[i] / 255) * height;

      const hue = (i / this.dataArray.length) * 360;
      this.canvasCtx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      this.canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }
  }

  clear() {
    const width = this.canvas.offsetWidth;
    const height = this.canvas.offsetHeight;
    this.canvasCtx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg');
    this.canvasCtx.fillRect(0, 0, width, height);
  }
}

const audioVisualizer = new AudioVisualizer('visualizer');