class Creature {
    constructor(canvasWidth, canvasHeight, mode = 'game') {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.mode = mode;
        this.reset();
    }

    reset() {
        const side = Math.floor(Math.random() * 4);
        switch(side) {
            case 0:
                this.x = Math.random() * this.canvasWidth;
                this.y = -50;
                break;
            case 1:
                this.x = this.canvasWidth + 50;
                this.y = Math.random() * this.canvasHeight;
                break;
            case 2:
                this.x = Math.random() * this.canvasWidth;
                this.y = this.canvasHeight + 50;
                break;
            case 3:
                this.x = -50;
                this.y = Math.random() * this.canvasHeight;
                break;
        }

        const targetX = this.canvasWidth * 0.2 + Math.random() * this.canvasWidth * 0.6;
        const targetY = this.canvasHeight * 0.2 + Math.random() * this.canvasHeight * 0.6;
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        const speed = 1.5 + Math.random() * 2.5;

        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = 15 + Math.random() * 10;
        this.tailLength = 40 + Math.random() * 30;
        this.tailSegments = [];
        this.alive = true;
        this.caught = false;
        this.caughtTime = 0;
        this.wigglePhase = Math.random() * Math.PI * 2;
        this.wiggleSpeed = 0.1 + Math.random() * 0.1;
        this.eyeOffset = 0;
        this.blinkTimer = Math.random() * 200;
        this.blinking = false;

        for (let i = 0; i < 8; i++) {
            this.tailSegments.push({ x: this.x, y: this.y });
        }
    }

    update() {
        if (this.caught) {
            this.caughtTime++;
            this.radius *= 0.9;
            return this.caughtTime < 20;
        }

        this.wigglePhase += this.wiggleSpeed;
        this.eyeOffset = Math.sin(this.wigglePhase) * 2;
        this.blinkTimer--;

        if (this.blinkTimer <= 0) {
            this.blinking = true;
            if (this.blinkTimer < -10) {
                this.blinking = false;
                this.blinkTimer = 100 + Math.random() * 300;
            }
        }

        this.x += this.vx;
        this.y += this.vy;

        this.vx += Math.sin(this.wigglePhase * 2) * 0.05;
        this.vy += Math.cos(this.wigglePhase * 1.5) * 0.05;

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const maxSpeed = 4;
        if (speed > maxSpeed) {
            this.vx = (this.vx / speed) * maxSpeed;
            this.vy = (this.vy / speed) * maxSpeed;
        }

        this.tailSegments.unshift({ x: this.x, y: this.y });
        if (this.tailSegments.length > 8) {
            this.tailSegments.pop();
        }

        const margin = 100;
        if (this.x < -margin || this.x > this.canvasWidth + margin ||
            this.y < -margin || this.y > this.canvasHeight + margin) {
            this.alive = false;
        }

        return true;
    }

    draw(ctx) {
        if (this.radius < 1) return;

        ctx.save();

        ctx.strokeStyle = '#1a1a1a';
        ctx.fillStyle = '#1a1a1a';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (this.tailSegments.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.tailSegments[0].x, this.tailSegments[0].y);

            for (let i = 1; i < this.tailSegments.length; i++) {
                const t = i / this.tailSegments.length;
                const wiggle = Math.sin(this.wigglePhase + i * 0.8) * 8 * t;
                const perpX = -this.vy;
                const perpY = this.vx;
                const len = Math.sqrt(perpX * perpX + perpY * perpY);
                if (len > 0) {
                    const wx = (perpX / len) * wiggle;
                    const wy = (perpY / len) * wiggle;
                    ctx.lineTo(this.tailSegments[i].x + wx, this.tailSegments[i].y + wy);
                }
            }

            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f5f0e8';
        const eyeSize = this.radius * 0.35;
        const eyeSpacing = this.radius * 0.3;

        if (!this.blinking) {
            ctx.beginPath();
            ctx.ellipse(this.x - eyeSpacing, this.y - 2, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.ellipse(this.x + eyeSpacing, this.y - 2, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#1a1a1a';
            const pupilSize = eyeSize * 0.5;
            ctx.beginPath();
            ctx.arc(this.x - eyeSpacing + this.eyeOffset, this.y - 2, pupilSize, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(this.x + eyeSpacing + this.eyeOffset, this.y - 2, pupilSize, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.strokeStyle = '#f5f0e8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x - eyeSpacing - eyeSize, this.y - 2);
            ctx.lineTo(this.x - eyeSpacing + eyeSize, this.y - 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(this.x + eyeSpacing - eyeSize, this.y - 2);
            ctx.lineTo(this.x + eyeSpacing + eyeSize, this.y - 2);
            ctx.stroke();
        }

        if (this.caught) {
            ctx.fillStyle = `rgba(255, 200, 50, ${this.caughtTime / 20})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    checkClick(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy) < this.radius * 2;
    }
}

class AnimationCreature {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.reset();
    }

    reset() {
        this.radius = 20 + Math.random() * 20;
        const baseSpeed = 3 - (this.radius - 20) / 20 * 1.5;
        this.speed = baseSpeed + Math.random() * 1;

        const side = Math.floor(Math.random() * 4);
        const margin = 60;

        switch(side) {
            case 0:
                this.x = Math.random() * this.canvasWidth;
                this.y = -margin;
                break;
            case 1:
                this.x = this.canvasWidth + margin;
                this.y = Math.random() * this.canvasHeight;
                break;
            case 2:
                this.x = Math.random() * this.canvasWidth;
                this.y = this.canvasHeight + margin;
                break;
            case 3:
                this.x = -margin;
                this.y = Math.random() * this.canvasHeight;
                break;
        }

        this.targetX = this.canvasWidth * 0.15 + Math.random() * this.canvasWidth * 0.7;
        this.targetY = this.canvasHeight * 0.15 + Math.random() * this.canvasHeight * 0.7;

        this.vx = 0;
        this.vy = 0;
        this.state = 'entering';
        this.stateTimer = 0;
        this.pauseDuration = 120 + Math.random() * 180;
        this.exitDelay = 120 + Math.random() * 180;
        this.totalLife = 600 + Math.random() * 900;
        this.lifeTimer = 0;

        this.wigglePhase = Math.random() * Math.PI * 2;
        this.wiggleSpeed = 0.08 + Math.random() * 0.06;
        this.tailSegments = [];
        const tailAngle = Math.atan2(this.targetY - this.y, this.targetX - this.x) + Math.PI;
        const tailStep = this.radius * 0.8;
        for (let i = 0; i < 12; i++) {
            this.tailSegments.push({
                x: this.x + Math.cos(tailAngle) * tailStep * i,
                y: this.y + Math.sin(tailAngle) * tailStep * i
            });
        }

        this.eyeOffset = 0;
        this.blinkTimer = Math.random() * 200;
        this.blinking = false;
        this.alive = true;
        this.exiting = false;

        this.movePattern = Math.floor(Math.random() * 3);
        this.patternTimer = 0;
        this.patternDuration = 100 + Math.random() * 200;
    }

    update() {
        if (!this.alive) return false;

        this.wigglePhase += this.wiggleSpeed;
        this.eyeOffset = Math.sin(this.wigglePhase) * 2;
        this.blinkTimer--;

        if (this.blinkTimer <= 0) {
            this.blinking = true;
            if (this.blinkTimer < -8) {
                this.blinking = false;
                this.blinkTimer = 80 + Math.random() * 250;
            }
        }

        this.lifeTimer++;

        switch(this.state) {
            case 'entering':
                this.updateEntering();
                break;
            case 'moving':
                this.updateMoving();
                break;
            case 'pausing':
                this.updatePausing();
                break;
            case 'exiting':
                this.updateExiting();
                break;
        }

        this.x += this.vx;
        this.y += this.vy;

        this.tailSegments.unshift({ x: this.x, y: this.y });
        if (this.tailSegments.length > 12) {
            this.tailSegments.pop();
        }

        const margin = 100;
        if (this.exiting &&
            (this.x < -margin || this.x > this.canvasWidth + margin ||
             this.y < -margin || this.y > this.canvasHeight + margin)) {
            this.alive = false;
        }

        return this.alive;
    }

    updateEntering() {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 10 || this.lifeTimer > 120) {
            this.state = 'moving';
            this.patternTimer = 0;
            const angle = Math.random() * Math.PI * 2;
            this.vx = Math.cos(angle) * this.speed;
            this.vy = Math.sin(angle) * this.speed;
            return;
        }

        const angle = Math.atan2(dy, dx);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    updateMoving() {
        this.patternTimer++;

        if (this.patternTimer > this.patternDuration) {
            this.state = 'pausing';
            this.stateTimer = 0;
            this.vx = 0;
            this.vy = 0;
            return;
        }

        if (this.lifeTimer > this.totalLife - this.exitDelay) {
            this.state = 'exiting';
            this.exiting = true;
            return;
        }

        switch(this.movePattern) {
            case 0:
                this.moveWander();
                break;
            case 1:
                this.moveEdgeCrawl();
                break;
            case 2:
                this.moveCrossScreen();
                break;
        }
    }

    moveWander() {
        const noiseX = Math.sin(this.wigglePhase * 2) * 0.3;
        const noiseY = Math.cos(this.wigglePhase * 1.7) * 0.3;

        this.vx += noiseX;
        this.vy += noiseY;

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.speed) {
            this.vx = (this.vx / speed) * this.speed;
            this.vy = (this.vy / speed) * this.speed;
        } else if (speed < this.speed * 0.5) {
            const angle = Math.random() * Math.PI * 2;
            this.vx = Math.cos(angle) * this.speed;
            this.vy = Math.sin(angle) * this.speed;
        }

        if (this.x < 100) this.vx += 0.2;
        if (this.x > this.canvasWidth - 100) this.vx -= 0.2;
        if (this.y < 100) this.vy += 0.2;
        if (this.y > this.canvasHeight - 100) this.vy -= 0.2;
    }

    moveEdgeCrawl() {
        const edgeMargin = 80;
        let targetX, targetY;

        if (this.x < edgeMargin) {
            targetX = edgeMargin;
            targetY = Math.random() * this.canvasHeight;
        } else if (this.x > this.canvasWidth - edgeMargin) {
            targetX = this.canvasWidth - edgeMargin;
            targetY = Math.random() * this.canvasHeight;
        } else if (this.y < edgeMargin) {
            targetX = Math.random() * this.canvasWidth;
            targetY = edgeMargin;
        } else if (this.y > this.canvasHeight - edgeMargin) {
            targetX = Math.random() * this.canvasWidth;
            targetY = this.canvasHeight - edgeMargin;
        } else {
            const edges = [
                { x: edgeMargin, y: this.y },
                { x: this.canvasWidth - edgeMargin, y: this.y },
                { x: this.x, y: edgeMargin },
                { x: this.x, y: this.canvasHeight - edgeMargin }
            ];
            const target = edges[Math.floor(Math.random() * edges.length)];
            targetX = target.x;
            targetY = target.y;
        }

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const angle = Math.atan2(dy, dx);
        this.vx = Math.cos(angle) * this.speed * 0.8;
        this.vy = Math.sin(angle) * this.speed * 0.8;
    }

    moveCrossScreen() {
        const edgeMargin = 100;
        let targetX, targetY;

        const side = Math.floor(Math.random() * 4);
        switch(side) {
            case 0:
                targetX = Math.random() * this.canvasWidth;
                targetY = edgeMargin;
                break;
            case 1:
                targetX = this.canvasWidth - edgeMargin;
                targetY = Math.random() * this.canvasHeight;
                break;
            case 2:
                targetX = Math.random() * this.canvasWidth;
                targetY = this.canvasHeight - edgeMargin;
                break;
            case 3:
                targetX = edgeMargin;
                targetY = Math.random() * this.canvasHeight;
                break;
        }

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const angle = Math.atan2(dy, dx);

        this.vx = Math.cos(angle + Math.sin(this.wigglePhase) * 0.1) * this.speed;
        this.vy = Math.sin(angle + Math.sin(this.wigglePhase) * 0.1) * this.speed;
    }

    updatePausing() {
        this.stateTimer++;
        this.vx *= 0.9;
        this.vy *= 0.9;

        if (this.stateTimer > this.pauseDuration) {
            this.state = 'moving';
            this.patternTimer = 0;
            this.movePattern = Math.floor(Math.random() * 3);
            this.patternDuration = 100 + Math.random() * 200;
        }

        if (this.lifeTimer > this.totalLife - this.exitDelay) {
            this.state = 'exiting';
            this.exiting = true;
        }
    }

    updateExiting() {
        const margin = 100;

        const dists = [
            this.x + margin,
            this.canvasWidth + margin - this.x,
            this.y + margin,
            this.canvasHeight + margin - this.y
        ];

        let minIdx = 0;
        for (let i = 1; i < 4; i++) {
            if (dists[i] < dists[minIdx]) {
                minIdx = i;
            }
        }

        const exitX = minIdx === 0 ? -margin : minIdx === 1 ? this.canvasWidth + margin : this.x;
        const exitY = minIdx === 2 ? -margin : minIdx === 3 ? this.canvasHeight + margin : this.y;

        const dx = exitX - this.x;
        const dy = exitY - this.y;

        if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
            this.vx = this.speed * 1.5;
            this.vy = 0;
        } else {
            const angle = Math.atan2(dy, dx);
            this.vx = Math.cos(angle) * this.speed * 1.5;
            this.vy = Math.sin(angle) * this.speed * 1.5;
        }
    }

    draw(ctx) {
        ctx.save();

        ctx.strokeStyle = '#1a1a1a';
        ctx.fillStyle = '#1a1a1a';
        ctx.lineWidth = Math.max(2, this.radius / 8);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (this.tailSegments.length > 2) {
            ctx.beginPath();
            const tailStart = this.tailSegments[2];
            ctx.moveTo(tailStart.x, tailStart.y);

            for (let i = 3; i < this.tailSegments.length; i++) {
                const t = (i - 2) / (this.tailSegments.length - 2);
                const wiggle = Math.sin(this.wigglePhase + i * 0.6) * this.radius * 2 * t;
                const perpX = -this.vy;
                const perpY = this.vx;
                const len = Math.sqrt(perpX * perpX + perpY * perpY);
                if (len > 0.1) {
                    const wx = (perpX / len) * wiggle;
                    const wy = (perpY / len) * wiggle;
                    ctx.lineTo(this.tailSegments[i].x + wx, this.tailSegments[i].y + wy);
                } else {
                    const fallbackAngle = this.wigglePhase + i * 0.5;
                    const wx = Math.cos(fallbackAngle) * wiggle * 0.5;
                    const wy = Math.sin(fallbackAngle) * wiggle * 0.5;
                    ctx.lineTo(this.tailSegments[i].x + wx, this.tailSegments[i].y + wy);
                }
            }

            ctx.lineWidth = Math.max(3, this.radius / 4);
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f5f0e8';
        const eyeSize = this.radius * 0.3;
        const eyeSpacing = this.radius * 0.25;

        if (!this.blinking) {
            ctx.beginPath();
            ctx.ellipse(this.x - eyeSpacing, this.y - this.radius * 0.1, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.ellipse(this.x + eyeSpacing, this.y - this.radius * 0.1, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#1a1a1a';
            const pupilSize = eyeSize * 0.45;
            ctx.beginPath();
            ctx.arc(this.x - eyeSpacing + this.eyeOffset, this.y - this.radius * 0.1, pupilSize, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(this.x + eyeSpacing + this.eyeOffset, this.y - this.radius * 0.1, pupilSize, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.strokeStyle = '#f5f0e8';
            ctx.lineWidth = Math.max(1.5, this.radius / 12);
            ctx.beginPath();
            ctx.moveTo(this.x - eyeSpacing - eyeSize, this.y - this.radius * 0.1);
            ctx.lineTo(this.x - eyeSpacing + eyeSize, this.y - this.radius * 0.1);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(this.x + eyeSpacing - eyeSize, this.y - this.radius * 0.1);
            ctx.lineTo(this.x + eyeSpacing + eyeSize, this.y - this.radius * 0.1);
            ctx.stroke();
        }

        ctx.restore();
    }

    isMoving() {
        return this.state === 'moving' || this.state === 'entering' || this.state === 'exiting';
    }

    isPausing() {
        return this.state === 'pausing';
    }
}

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
        this.vy += 0.1;
        this.life -= this.decay;
        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = '#ff6b35';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class SoundManager {
    constructor() {
        this.audioCtx = null;
        this.masterGain = null;
        this.bgMusicGain = null;
        this.sfxGain = null;
        this.bgMusicOscillators = [];
        this.crawlNoise = null;
        this.crawlGain = null;
        this.isPlaying = false;
        this.volume = 0.5;
    }

    init() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.audioCtx.destination);

            this.bgMusicGain = this.audioCtx.createGain();
            this.bgMusicGain.gain.value = 0.15;
            this.bgMusicGain.connect(this.masterGain);

            this.sfxGain = this.audioCtx.createGain();
            this.sfxGain.gain.value = 0.3;
            this.sfxGain.connect(this.masterGain);
        }
    }

    startBackgroundMusic() {
        if (!this.audioCtx) this.init();
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        if (this.isPlaying) return;

        this.isPlaying = true;
        const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 349.23, 329.63, 293.66];
        const durations = [2, 2, 2, 2, 3, 2, 2, 3];

        let noteIndex = 0;
        const playNextNote = () => {
            if (!this.isPlaying) return;

            const freq = notes[noteIndex % notes.length];
            const duration = durations[noteIndex % durations.length];

            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.1, this.audioCtx.currentTime + 0.3);
            gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + duration - 0.3);

            osc.connect(gain);
            gain.connect(this.bgMusicGain);

            osc.start(this.audioCtx.currentTime);
            osc.stop(this.audioCtx.currentTime + duration);

            noteIndex++;
            setTimeout(playNextNote, duration * 1000);
        };

        playNextNote();
    }

    stopBackgroundMusic() {
        this.isPlaying = false;
    }

    startCrawlSound() {
        if (!this.audioCtx) this.init();
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        if (this.crawlNoise) return;

        const bufferSize = this.audioCtx.sampleRate * 2;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.1;
        }

        this.crawlNoise = this.audioCtx.createBufferSource();
        this.crawlNoise.buffer = buffer;
        this.crawlNoise.loop = true;

        this.crawlGain = this.audioCtx.createGain();
        this.crawlGain.gain.value = 0.05;

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        this.crawlNoise.connect(filter);
        filter.connect(this.crawlGain);
        this.crawlGain.connect(this.sfxGain);

        this.crawlNoise.start();
    }

    stopCrawlSound() {
        if (this.crawlNoise) {
            this.crawlNoise.stop();
            this.crawlNoise = null;
        }
    }

    playPauseSound() {
        if (!this.audioCtx) this.init();
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.audioCtx.currentTime + 0.5);

        gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(this.audioCtx.currentTime);
        osc.stop(this.audioCtx.currentTime + 0.5);
    }

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }

    playCatchSound(combo) {
        if (!this.audioCtx) this.init();
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800 + combo * 50, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this.audioCtx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(this.audioCtx.currentTime);
        osc.stop(this.audioCtx.currentTime + 0.1);
    }

    stopAll() {
        this.stopBackgroundMusic();
        this.stopCrawlSound();
    }
}

const CONFIG = {
    FPS: 60,
    GAME_DURATION: 60,
    SPAWN_INTERVAL_BASE: 60,
    SPAWN_INTERVAL_MIN: 20,
    SPAWN_ACCELERATION_RATE: 300,
    SPAWN_ACCELERATION_STEP: 5,
    DOUBLE_SPAWN_CHANCE: 0.3,
    DOUBLE_SPAWN_THRESHOLD: 600,
    CREATURE_TAIL_SEGMENTS: 8,
    ANIMATION_CREATURE_TAIL_SEGMENTS: 12,
    ANIMATION_SPAWN_DELAY: 60,
    PARTICLE_COUNT: 8,
    PARTICLE_GRAVITY: 0.1,
    COMBO_DISPLAY_DURATION: 1000,
    CATCH_SOUND_DURATION: 0.1
};

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.creatures = [];
        this.particles = [];
        this.score = 0;
        this.time = CONFIG.GAME_DURATION;
        this.combo = 0;
        this.maxCombo = 0;
        this.running = false;
        this.spawnTimer = 0;
        this.spawnInterval = CONFIG.SPAWN_INTERVAL_BASE;
        this.gameTime = 0;
        this.mode = 'menu';
        this.soundManager = new SoundManager();
        this.comboTimeout = null;

        this.animationCreature = null;
        this.animationSpawnTimer = 0;
        this.animationDuration = Infinity;
        this.animationStartTime = 0;
        this.animationDurationOptions = {
            '30min': 30 * 60 * 1000,
            '1hour': 60 * 60 * 1000,
            'infinite': Infinity
        };

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.canvas.addEventListener('mousedown', (e) => this.handleInput(e.clientX, e.clientY));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.touches.length; i++) {
                this.handleInput(e.touches[i].clientX, e.touches[i].clientY);
            }
        });

        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    startGameMode() {
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'none';
        document.getElementById('animationScreen').style.display = 'none';
        document.getElementById('ui').style.display = 'flex';
        document.getElementById('modeSwitch').style.display = 'block';
        this.mode = 'game';
        this.score = 0;
        this.time = CONFIG.GAME_DURATION;
        this.combo = 0;
        this.maxCombo = 0;
        this.creatures = [];
        this.particles = [];
        this.running = true;
        this.spawnTimer = 0;
        this.gameTime = 0;
        this.comboTimeout = null;
        this.updateUI();
        this.soundManager.stopAll();
    }

    startAnimationMode(duration) {
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'none';
        document.getElementById('animationScreen').style.display = 'none';
        document.getElementById('ui').style.display = 'none';
        document.getElementById('modeSwitch').style.display = 'block';
        this.mode = 'animation';
        this.animationCreature = null;
        this.animationSpawnTimer = 0;
        this.animationDuration = this.animationDurationOptions[duration] || Infinity;
        this.animationStartTime = Date.now();
        this.running = true;
        this.soundManager.startBackgroundMusic();
    }

    restart() {
        if (this.mode === 'game') {
            this.startGameMode();
        }
    }

    switchMode() {
        this.soundManager.stopAll();
        if (this.mode === 'game' || this.mode === 'animation') {
            this.showMenu();
        }
    }

    showMenu() {
        this.mode = 'menu';
        this.running = false;
        this.soundManager.stopAll();
        document.getElementById('startScreen').style.display = 'flex';
        document.getElementById('gameOverScreen').style.display = 'none';
        document.getElementById('animationScreen').style.display = 'none';
        document.getElementById('ui').style.display = 'none';
        document.getElementById('modeSwitch').style.display = 'none';
    }

    showAnimationSettings() {
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('animationScreen').style.display = 'flex';
    }

    gameOver() {
        this.running = false;
        document.getElementById('gameOverScreen').style.display = 'flex';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('maxCombo').textContent = this.maxCombo;
    }

    handleInput(x, y) {
        if (this.mode === 'animation') return;
        if (!this.running) return;

        const rect = this.canvas.getBoundingClientRect();
        const canvasX = x - rect.left;
        const canvasY = y - rect.top;

        let hit = false;
        for (let i = this.creatures.length - 1; i >= 0; i--) {
            const creature = this.creatures[i];
            if (creature.alive && !creature.caught && creature.checkClick(canvasX, canvasY)) {
                creature.caught = true;
                hit = true;
                this.combo++;
                if (this.combo > this.maxCombo) this.maxCombo = this.combo;

                const baseScore = 10;
                const comboMultiplier = Math.min(this.combo, 10);
                const points = baseScore * comboMultiplier;
                this.score += points;

                for (let j = 0; j < CONFIG.PARTICLE_COUNT; j++) {
                    this.particles.push(new Particle(creature.x, creature.y));
                }

                this.showCombo();
                this.playCatchSound();
                break;
            }
        }

        if (!hit) {
            this.combo = 0;
            this.hideCombo();
        }

        this.updateUI();
    }

    showCombo() {
        const display = document.getElementById('comboDisplay');
        if (this.combo >= 2) {
            display.textContent = `${this.combo} 连击!`;
            display.classList.add('show');
            if (this.comboTimeout) clearTimeout(this.comboTimeout);
            this.comboTimeout = setTimeout(() => display.classList.remove('show'), CONFIG.COMBO_DISPLAY_DURATION);
        }
    }

    hideCombo() {
        const display = document.getElementById('comboDisplay');
        display.classList.remove('show');
        if (this.comboTimeout) {
            clearTimeout(this.comboTimeout);
            this.comboTimeout = null;
        }
    }

    playCatchSound() {
        this.soundManager.playCatchSound(this.combo);
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('time').textContent = this.time;
    }

    updateAnimationMode() {
        if (this.animationDuration !== Infinity) {
            const elapsed = Date.now() - this.animationStartTime;
            if (elapsed >= this.animationDuration) {
                this.showMenu();
                return;
            }
        }

        if (!this.animationCreature || !this.animationCreature.alive) {
            this.animationSpawnTimer++;
            if (this.animationSpawnTimer >= CONFIG.ANIMATION_SPAWN_DELAY) {
                this.animationSpawnTimer = 0;
                this.animationCreature = new AnimationCreature(this.canvas.width, this.canvas.height);
            }
        } else {
            const wasMoving = this.animationCreature.isMoving();
            this.animationCreature.update();
            const isMoving = this.animationCreature.isMoving();
            const isPausing = this.animationCreature.isPausing();



            if (wasMoving && !isMoving && isPausing) {
                this.soundManager.stopCrawlSound();
                this.soundManager.playPauseSound();
            } else if (!wasMoving && isMoving) {
                this.soundManager.startCrawlSound();
            }

            if (!this.animationCreature.alive) {
                this.soundManager.stopCrawlSound();
            }
        }
    }

    loop() {
        this.ctx.fillStyle = '#f5f0e8';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.mode === 'game' && this.running) {
            this.gameTime++;

            if (this.gameTime % 60 === 0) {
                this.time--;
                this.updateUI();
                if (this.time <= 0) {
                    this.gameOver();
                }
            }

            this.spawnTimer++;
            const currentInterval = Math.max(CONFIG.SPAWN_INTERVAL_MIN, this.spawnInterval - Math.floor(this.gameTime / CONFIG.SPAWN_ACCELERATION_RATE) * CONFIG.SPAWN_ACCELERATION_STEP);
            if (this.spawnTimer >= currentInterval) {
                this.spawnTimer = 0;
                this.creatures.push(new Creature(this.canvas.width, this.canvas.height));

                if (this.gameTime > CONFIG.DOUBLE_SPAWN_THRESHOLD && Math.random() < CONFIG.DOUBLE_SPAWN_CHANCE) {
                    this.creatures.push(new Creature(this.canvas.width, this.canvas.height));
                }
            }
        }

        if (this.mode === 'animation' && this.running) {
            this.updateAnimationMode();
        }

        if (this.mode === 'game') {
            for (let i = this.creatures.length - 1; i >= 0; i--) {
                const creature = this.creatures[i];
                if (!creature.update()) {
                    this.creatures.splice(i, 1);
                } else {
                    creature.draw(this.ctx);
                }
            }

            for (let i = this.particles.length - 1; i >= 0; i--) {
                const particle = this.particles[i];
                if (!particle.update()) {
                    this.particles.splice(i, 1);
                } else {
                    particle.draw(this.ctx);
                }
            }
        } else if (this.mode === 'animation' && this.animationCreature) {
            this.animationCreature.draw(this.ctx);
        }

        requestAnimationFrame(this.loop);
    }
}

const game = new Game();
