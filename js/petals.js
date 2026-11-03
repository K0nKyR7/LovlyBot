// Gentle falling rose petals and glowing fairy dust particles
export class PetalEffect {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.petals = [];
    this.isRunning = true;
    this.animationId = null;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initPetals(28);
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  initPetals(count) {
    this.petals = [];
    for (let i = 0; i < count; i++) {
      this.petals.push(this.createPetal(true));
    }
  }

  createPetal(randomY = false) {
    const isHeart = Math.random() > 0.65;
    return {
      x: Math.random() * this.canvas.width,
      y: randomY ? Math.random() * this.canvas.height : -20,
      size: Math.random() * 9 + 6,
      speedY: Math.random() * 0.75 + 0.4,
      speedX: Math.random() * 0.6 - 0.3,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 1.2,
      opacity: Math.random() * 0.45 + 0.25,
      isHeart: isHeart,
      color: isHeart ? '#F43F5E' : (Math.random() > 0.5 ? '#FDA4AF' : '#FECDD3')
    };
  }

  drawHeart(ctx, x, y, size) {
    ctx.beginPath();
    const topCurveHeight = size * 0.3;
    ctx.moveTo(x, y + topCurveHeight);
    // top left curve
    ctx.bezierCurveTo(
      x, y,
      x - size / 2, y,
      x - size / 2, y + topCurveHeight
    );
    // bottom left curve
    ctx.bezierCurveTo(
      x - size / 2, y + (size + topCurveHeight) / 2,
      x, y + (size + topCurveHeight) / 2,
      x, y + size
    );
    // bottom right curve
    ctx.bezierCurveTo(
      x, y + (size + topCurveHeight) / 2,
      x + size / 2, y + (size + topCurveHeight) / 2,
      x + size / 2, y + topCurveHeight
    );
    // top right curve
    ctx.bezierCurveTo(
      x + size / 2, y,
      x, y,
      x, y + topCurveHeight
    );
    ctx.closePath();
    ctx.fill();
  }

  drawPetal(ctx, x, y, size) {
    ctx.beginPath();
    ctx.ellipse(x, y, size, size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  animate() {
    if (!this.isRunning) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let p of this.petals) {
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fillStyle = p.color;

      if (p.isHeart) {
        this.drawHeart(this.ctx, -p.size / 2, -p.size / 2, p.size);
      } else {
        this.drawPetal(this.ctx, 0, 0, p.size);
      }

      this.ctx.restore();

      p.y += p.speedY;
      p.x += Math.sin(p.y * 0.01) * 0.5 + p.speedX;
      p.rotation += p.rotSpeed;

      if (p.y > this.canvas.height + 25) {
        Object.assign(p, this.createPetal(false));
      }
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  toggle() {
    this.isRunning = !this.isRunning;
    if (this.isRunning) {
      this.animate();
    } else {
      cancelAnimationFrame(this.animationId);
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    return this.isRunning;
  }
}
