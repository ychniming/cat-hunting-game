import { CONFIG } from './config.js';

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 1;
        this.decay = 0.02 + Math.random() * 0.03;
        this.size = 3 + Math.random() * 5;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += CONFIG.visual.particleGravity;
        this.life -= this.decay;
        return this.life > 0;
    }

    draw(ctx) {
        const alpha = Math.max(0, this.life);
        const scale = Math.max(0, this.life);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ff6b35';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export { Particle };
