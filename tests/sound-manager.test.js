import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SoundManager } from '../src/sound-manager.js';

class MockGainNode {
    constructor() {
        this.gain = { value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), cancelScheduledValues: vi.fn() };
        this.connect = vi.fn();
        this.disconnect = vi.fn();
    }
}

class MockOscillator {
    constructor() {
        this.type = 'sine';
        this.frequency = { value: 440, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
        this.connect = vi.fn();
        this.disconnect = vi.fn();
        this.start = vi.fn();
        this.stop = vi.fn();
        this.onended = null;
    }
}

class MockBufferSource {
    constructor() {
        this.buffer = null;
        this.loop = false;
        this.connect = vi.fn();
        this.start = vi.fn();
        this.stop = vi.fn();
    }
}

function createMockAudioContext() {
    return {
        sampleRate: 44100,
        currentTime: 0,
        state: 'running',
        destination: {},
        createGain: vi.fn(() => new MockGainNode()),
        createOscillator: vi.fn(() => new MockOscillator()),
        createBufferSource: vi.fn(() => new MockBufferSource()),
        createBuffer: vi.fn((channels, length, sampleRate) => ({
            getChannelData: () => new Float32Array(length)
        })),
        createBiquadFilter: vi.fn(() => ({
            type: 'lowpass',
            frequency: { value: 800 },
            connect: vi.fn(),
            disconnect: vi.fn()
        })),
        resume: vi.fn(),
        close: vi.fn(() => Promise.resolve())
    };
}

describe('SoundManager', () => {
    let manager;
    let mockCtx;
    let origWindow;

    beforeEach(() => {
        manager = new SoundManager();
        mockCtx = createMockAudioContext();
        origWindow = globalThis.window;
        const ctx = mockCtx;
        globalThis.window = {
            AudioContext: function() { return ctx; },
            webkitAudioContext: function() { return ctx; }
        };
    });

    afterEach(() => {
        manager.stopAll();
        if (origWindow !== undefined) {
            globalThis.window = origWindow;
        } else {
            delete globalThis.window;
        }
    });

    describe('constructor', () => {
        it('initializes with null audio context', () => {
            expect(manager.audioCtx).toBeNull();
        });

        it('initializes with default volume 0.5', () => {
            expect(manager.volume).toBe(0.5);
        });

        it('is not playing initially', () => {
            expect(manager.isPlaying).toBe(false);
        });
    });

    describe('init', () => {
        it('creates AudioContext on first call', () => {
            manager.init();
            expect(manager.audioCtx).toBeTruthy();
        });

        it('does not recreate AudioContext on subsequent calls', () => {
            manager.init();
            const ctx = manager.audioCtx;
            manager.init();
            expect(manager.audioCtx).toBe(ctx);
        });
    });

    describe('startBackgroundMusic', () => {
        it('sets isPlaying to true', () => {
            manager.startBackgroundMusic();
            expect(manager.isPlaying).toBe(true);
        });

        it('resumes suspended context', () => {
            mockCtx.state = 'suspended';
            manager.startBackgroundMusic();
            expect(mockCtx.resume).toHaveBeenCalled();
        });

        it('does not start again if already playing', () => {
            manager.startBackgroundMusic();
            const oscCount = mockCtx.createOscillator.mock.calls.length;
            manager.startBackgroundMusic();
            expect(mockCtx.createOscillator.mock.calls.length).toBe(oscCount);
        });
    });

    describe('stopBackgroundMusic', () => {
        it('sets isPlaying to false', () => {
            manager.startBackgroundMusic();
            manager.stopBackgroundMusic();
            expect(manager.isPlaying).toBe(false);
        });
    });

    describe('startCrawlSound', () => {
        it('creates crawl noise source', () => {
            manager.startCrawlSound();
            expect(manager.crawlNoise).toBeTruthy();
            expect(mockCtx.createBufferSource).toHaveBeenCalled();
        });

        it('does not create duplicate crawl sound', () => {
            manager.startCrawlSound();
            const callCount = mockCtx.createBufferSource.mock.calls.length;
            manager.startCrawlSound();
            expect(mockCtx.createBufferSource.mock.calls.length).toBe(callCount);
        });
    });

    describe('stopCrawlSound', () => {
        it('stops and clears crawl noise', () => {
            manager.startCrawlSound();
            const noise = manager.crawlNoise;
            manager.stopCrawlSound();
            expect(noise.stop).toHaveBeenCalled();
            expect(manager.crawlNoise).toBeNull();
        });

        it('disconnects crawl filter', () => {
            manager.startCrawlSound();
            const filter = manager.crawlFilter;
            manager.stopCrawlSound();
            expect(filter.disconnect).toHaveBeenCalled();
            expect(manager.crawlFilter).toBeNull();
        });
    });

    describe('playPauseSound', () => {
        it('creates oscillator for pause sound', () => {
            manager.playPauseSound();
            expect(mockCtx.createOscillator).toHaveBeenCalled();
        });
    });

    describe('playCatchSound', () => {
        it('creates oscillator with combo-based frequency', () => {
            manager.playCatchSound(5);
            expect(mockCtx.createOscillator).toHaveBeenCalled();
        });
    });

    describe('setVolume', () => {
        it('clamps volume between 0 and 1', () => {
            manager.setVolume(-1);
            expect(manager.volume).toBe(0);
            manager.setVolume(2);
            expect(manager.volume).toBe(1);
        });

        it('updates master gain when initialized', () => {
            manager.init();
            manager.setVolume(0.8);
            expect(manager.masterGain.gain.value).toBe(0.8);
        });
    });

    describe('stopAll', () => {
        it('stops both background music and crawl sound', () => {
            manager.startBackgroundMusic();
            manager.startCrawlSound();
            manager.stopAll();
            expect(manager.isPlaying).toBe(false);
            expect(manager.crawlNoise).toBeNull();
        });
    });

    describe('destroy', () => {
        it('disconnects all gain nodes', () => {
            manager.init();
            const master = manager.masterGain;
            const bg = manager.bgMusicGain;
            const sfx = manager.sfxGain;
            manager.destroy();
            expect(master.disconnect).toHaveBeenCalled();
            expect(bg.disconnect).toHaveBeenCalled();
            expect(sfx.disconnect).toHaveBeenCalled();
        });

        it('closes AudioContext', () => {
            manager.init();
            manager.destroy();
            expect(mockCtx.close).toHaveBeenCalled();
        });

        it('sets audioCtx to null', () => {
            manager.init();
            manager.destroy();
            expect(manager.audioCtx).toBeNull();
        });

        it('sets all gain nodes to null', () => {
            manager.init();
            manager.destroy();
            expect(manager.masterGain).toBeNull();
            expect(manager.bgMusicGain).toBeNull();
            expect(manager.sfxGain).toBeNull();
        });
    });

    describe('init error handling', () => {
        it('sets audioCtx to null on creation failure', () => {
            globalThis.window = {
                AudioContext: function() { throw new Error('not supported'); }
            };
            manager.init();
            expect(manager.audioCtx).toBeNull();
        });

        it('clears all gain nodes on creation failure', () => {
            globalThis.window = {
                AudioContext: function() { throw new Error('not supported'); }
            };
            manager.init();
            expect(manager.masterGain).toBeNull();
            expect(manager.bgMusicGain).toBeNull();
            expect(manager.sfxGain).toBeNull();
        });
    });

    describe('null guard after init failure', () => {
        it('startBackgroundMusic returns early when audioCtx is null', () => {
            globalThis.window = {
                AudioContext: function() { throw new Error('not supported'); }
            };
            expect(() => manager.startBackgroundMusic()).not.toThrow();
        });

        it('startCrawlSound returns early when audioCtx is null', () => {
            globalThis.window = {
                AudioContext: function() { throw new Error('not supported'); }
            };
            expect(() => manager.startCrawlSound()).not.toThrow();
        });

        it('playPauseSound returns early when audioCtx is null', () => {
            globalThis.window = {
                AudioContext: function() { throw new Error('not supported'); }
            };
            expect(() => manager.playPauseSound()).not.toThrow();
        });

        it('playCatchSound returns early when audioCtx is null', () => {
            globalThis.window = {
                AudioContext: function() { throw new Error('not supported'); }
            };
            expect(() => manager.playCatchSound(3)).not.toThrow();
        });
    });

    describe('oscillator onended cleanup', () => {
        it('sets onended handler on background music oscillator', () => {
            manager.startBackgroundMusic();
            const osc = mockCtx.createOscillator.mock.results[0].value;
            expect(osc.onended).toBeInstanceOf(Function);
        });

        it('onended disconnects both osc and gain for background music', () => {
            manager.startBackgroundMusic();
            const osc = mockCtx.createOscillator.mock.results[0].value;
            const noteGainIdx = mockCtx.createGain.mock.results.length - 1;
            const gain = mockCtx.createGain.mock.results[noteGainIdx].value;
            osc.onended();
            expect(osc.disconnect).toHaveBeenCalled();
            expect(gain.disconnect).toHaveBeenCalled();
        });

        it('onended disconnects both osc and gain for pause sound', () => {
            manager.init();
            manager.playPauseSound();
            const lastOscIdx = mockCtx.createOscillator.mock.results.length - 1;
            const osc = mockCtx.createOscillator.mock.results[lastOscIdx].value;
            const lastGainIdx = mockCtx.createGain.mock.results.length - 1;
            const gain = mockCtx.createGain.mock.results[lastGainIdx].value;
            osc.onended();
            expect(osc.disconnect).toHaveBeenCalled();
            expect(gain.disconnect).toHaveBeenCalled();
        });

        it('onended disconnects both osc and gain for catch sound', () => {
            manager.init();
            manager.playCatchSound(3);
            const lastOscIdx = mockCtx.createOscillator.mock.results.length - 1;
            const osc = mockCtx.createOscillator.mock.results[lastOscIdx].value;
            const lastGainIdx = mockCtx.createGain.mock.results.length - 1;
            const gain = mockCtx.createGain.mock.results[lastGainIdx].value;
            osc.onended();
            expect(osc.disconnect).toHaveBeenCalled();
            expect(gain.disconnect).toHaveBeenCalled();
        });
    });
});
