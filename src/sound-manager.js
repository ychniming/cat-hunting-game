import { CONFIG } from './config.js';

class SoundManager {
    constructor() {
        this.audioCtx = null;
        this.masterGain = null;
        this.bgMusicGain = null;
        this.sfxGain = null;
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
        this.bgMusicGain.gain.cancelScheduledValues(this.audioCtx.currentTime);
        this.bgMusicGain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
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

            this._bgMusicTimeout = setTimeout(playNextNote, duration * 1000);

            noteIndex++;
        };

        playNextNote();
    }

    stopBackgroundMusic() {
        this.isPlaying = false;
        if (this._bgMusicTimeout) {
            clearTimeout(this._bgMusicTimeout);
            this._bgMusicTimeout = null;
        }
        if (this.bgMusicGain) {
            this.bgMusicGain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.1);
        }
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
            try {
                this.crawlNoise.stop();
            } catch (e) {
                // already stopped
            }
            this.crawlNoise = null;
        }
        if (this.crawlGain) {
            this.crawlGain.disconnect();
            this.crawlGain = null;
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

        const clampedCombo = Math.min(combo, 10);
        const startFreq = 600 + clampedCombo * 80;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(startFreq, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this.audioCtx.currentTime + CONFIG.audio.catchSoundDuration);

        gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + CONFIG.audio.catchSoundDuration);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(this.audioCtx.currentTime);
        osc.stop(this.audioCtx.currentTime + CONFIG.audio.catchSoundDuration);
    }

    stopAll() {
        this.stopBackgroundMusic();
        this.stopCrawlSound();
    }
}

export { SoundManager };
