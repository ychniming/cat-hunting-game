import { Game } from './game.js';
import { createConfig } from './config.js';

let config;
try {
    const { RUNTIME_CONFIG } = await import('./runtime-config.js');
    config = createConfig(RUNTIME_CONFIG);
} catch {
    config = createConfig();
}

new Game(config);
