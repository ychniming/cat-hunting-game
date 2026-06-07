import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnimationMode } from '../src/animation-mode.js';

/**
 * 创建一个 mock creature 对象，用于精确控制状态和 alive 属性
 */
function createMockCreature(overrides = {}) {
    return {
        alive: true,
        _state: 'moving',
        isMoving: vi.fn(() => true),
        isPausing: vi.fn(() => false),
        update: vi.fn(() => true),
        ...overrides
    };
}

describe('AnimationMode', () => {
    let animMode;

    beforeEach(() => {
        animMode = new AnimationMode(800, 600);
    });

    describe('start', () => {
        it('sets running to true', () => {
            animMode.start('infinite');
            expect(animMode.running).toBe(true);
        });

        it('resets creature to null', () => {
            animMode.creature = {};
            animMode.start('infinite');
            expect(animMode.creature).toBeNull();
        });

        it('sets duration from key', () => {
            animMode.start('30min');
            expect(animMode.duration).toBe(30 * 60 * 1000);
        });

        it('defaults to infinite for unknown key', () => {
            animMode.start('unknown');
            expect(animMode.duration).toBe(Infinity);
        });
    });

    describe('stop', () => {
        it('sets running to false', () => {
            animMode.start('infinite');
            animMode.stop();
            expect(animMode.running).toBe(false);
        });
    });

    describe('update', () => {
        it('returns soundEvents array', () => {
            animMode.start('infinite');
            const result = animMode.update();
            expect(result).toHaveProperty('soundEvents');
            expect(Array.isArray(result.soundEvents)).toBe(true);
        });

        it('spawns creature after delay', () => {
            animMode.start('infinite');
            for (let i = 0; i < 70; i++) {
                animMode.update();
            }
            expect(animMode.creature).not.toBeNull();
        });

        it('returns expired true when duration exceeded', () => {
            animMode.start('30min');
            animMode.startTime = Date.now() - (30 * 60 * 1000 + 1);
            const result = animMode.update();
            expect(result.expired).toBe(true);
        });
    });

    describe('sound events on creature death', () => {
        beforeEach(() => {
            animMode.start('infinite');
        });

        it('creature dying while moving: only stopCrawl, no playPause', () => {
            // 生物在 moving 状态，update() 导致死亡
            const creature = createMockCreature();
            creature.isMoving.mockReturnValue(true);
            creature.isPausing.mockReturnValue(false);
            // update() 调用后，alive 变为 false
            creature.update.mockImplementation(() => {
                creature.alive = false;
                // 死亡后 isMoving 可能返回 false（状态已变）
                creature.isMoving.mockReturnValue(false);
                creature.isPausing.mockReturnValue(false);
                return false;
            });

            animMode.creature = creature;
            const result = animMode.update();

            // 核心断言：死亡时只发 stopCrawl，不应发 playPause
            expect(result.soundEvents).toEqual(['stopCrawl']);
            expect(result.soundEvents).not.toContain('playPause');
        });

        it('creature dying while moving: no duplicate stopCrawl', () => {
            // 如果旧代码先触发 stopCrawl（状态变化）再触发 stopCrawl（死亡），
            // 就会产生重复
            const creature = createMockCreature();
            creature.isMoving.mockReturnValue(true);
            creature.isPausing.mockReturnValue(false);
            creature.update.mockImplementation(() => {
                creature.alive = false;
                // 死亡后状态变为非 moving，模拟 wasMoving && !isMoving 的情况
                creature.isMoving.mockReturnValue(false);
                creature.isPausing.mockReturnValue(true);
                return false;
            });

            animMode.creature = creature;
            const result = animMode.update();

            // 不应有重复的 stopCrawl
            const stopCrawlCount = result.soundEvents.filter(e => e === 'stopCrawl').length;
            expect(stopCrawlCount).toBe(1);
        });

        it('creature dying while pausing: only stopCrawl', () => {
            // 生物在 pausing 状态死亡
            const creature = createMockCreature();
            creature.isMoving.mockReturnValue(false);
            creature.isPausing.mockReturnValue(true);
            creature.update.mockImplementation(() => {
                creature.alive = false;
                return false;
            });

            animMode.creature = creature;
            const result = animMode.update();

            expect(result.soundEvents).toEqual(['stopCrawl']);
        });

        it('creature dying while exiting: only stopCrawl', () => {
            // 生物在 exiting 状态死亡（exiting 也算 isMoving=true）
            const creature = createMockCreature();
            creature.isMoving.mockReturnValue(true);
            creature.isPausing.mockReturnValue(false);
            creature.update.mockImplementation(() => {
                creature.alive = false;
                creature.isMoving.mockReturnValue(false);
                return false;
            });

            animMode.creature = creature;
            const result = animMode.update();

            expect(result.soundEvents).toEqual(['stopCrawl']);
        });

        it('alive creature: normal state change sounds still work', () => {
            // 正常状态变化：moving -> pausing，应产生 stopCrawl + playPause
            const creature = createMockCreature();
            creature.isMoving.mockReturnValue(true);
            creature.isPausing.mockReturnValue(false);
            creature.update.mockImplementation(() => {
                creature.isMoving.mockReturnValue(false);
                creature.isPausing.mockReturnValue(true);
                return true;
            });

            animMode.creature = creature;
            const result = animMode.update();

            expect(result.soundEvents).toEqual(['stopCrawl', 'playPause']);
        });

        it('alive creature: pausing -> moving produces startCrawl', () => {
            // 正常状态变化：pausing -> moving
            const creature = createMockCreature();
            creature.isMoving.mockReturnValue(false);
            creature.isPausing.mockReturnValue(true);
            creature.update.mockImplementation(() => {
                creature.isMoving.mockReturnValue(true);
                creature.isPausing.mockReturnValue(false);
                return true;
            });

            animMode.creature = creature;
            const result = animMode.update();

            expect(result.soundEvents).toEqual(['startCrawl']);
        });

        it('alive creature with no state change: no sound events', () => {
            // 状态没变化，不应产生声音事件
            const creature = createMockCreature();
            creature.isMoving.mockReturnValue(true);
            creature.isPausing.mockReturnValue(false);
            creature.update.mockImplementation(() => true);

            animMode.creature = creature;
            const result = animMode.update();

            expect(result.soundEvents).toEqual([]);
        });
    });

    describe('resize', () => {
        it('updates canvas dimensions', () => {
            animMode.resize(1024, 768);
            expect(animMode.canvasWidth).toBe(1024);
            expect(animMode.canvasHeight).toBe(768);
        });
    });
});
