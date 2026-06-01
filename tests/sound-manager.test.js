import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SoundManager } from '../src/sound-manager.js';

class MockGainNode {
    constructor() {
        this.gain = { value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
        this.connect = vi.fn();
    }
}

class MockOscillator {
    constructor() {
        this.type = 'sine';
        this.frequency = { value: 440, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
        this.connect = vi.fn();
        this.start = vi.fn();
        this.stop = vi.fn();
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
            connect: vi.fn()
        })),
        resume: vi.fn()
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
});
