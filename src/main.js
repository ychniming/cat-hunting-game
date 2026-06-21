import { Game } from './game.js';
import { createConfig } from './config.js';

// Polyfill Element.prototype.matches for old WebViews
if (typeof Element !== 'undefined' && !Element.prototype.matches) {
    Element.prototype.matches =
        Element.prototype.webkitMatchesSelector ||
        Element.prototype.msMatchesSelector ||
        function (selector) {
            var matches = (this.document || this.ownerDocument).querySelectorAll(selector);
            var i = matches.length;
            while (--i >= 0 && matches[i] !== this) {}
            return i > -1;
        };
}

// Polyfill Element.prototype.closest for old WebViews (Android 5.1 / Chrome < 41)
if (typeof Element !== 'undefined' && !Element.prototype.closest) {
    Element.prototype.closest = function (selector) {
        var el = this;
        do {
            if (el.matches && el.matches(selector)) return el;
            el = el.parentElement || el.parentNode;
        } while (el && el.nodeType === 1);
        return null;
    };
}

function getConfig() {
    try {
        if (typeof window !== 'undefined' && window.__CAT_GAME_CONFIG__) {
            return createConfig(window.__CAT_GAME_CONFIG__);
        }
    } catch (e) {
        console.warn('Failed to load runtime config:', e);
    }
    return createConfig();
}

function isDebugEnabled() {
    if (typeof window === 'undefined') return false;
    // Cordova builds inject window.__CAT_DEBUG__ via index.html.
    // Defaults to true so browser development still shows the debug panel.
    if (typeof window.__CAT_DEBUG__ !== 'undefined') return window.__CAT_DEBUG__;
    return true;
}

function debugLog(message) {
    if (!isDebugEnabled()) return;
    if (typeof console !== 'undefined' && console.log) {
        console.log('CatHuntingGame: ' + message);
    }
    if (typeof document === 'undefined') return;
    const el = document.getElementById('debugLog');
    if (!el) return;
    el.style.display = 'block';
    const line = document.createElement('div');
    line.textContent = new Date().toLocaleTimeString() + ' ' + message;
    el.appendChild(line);
    if (el.childNodes.length > 30) {
        el.removeChild(el.firstChild);
    }
}

function startGame() {
    try {
        debugLog('startGame called');
        const config = getConfig();
        new Game(config);
        debugLog('Game initialized.');
    } catch (e) {
        debugLog('Failed to start game: ' + (e && e.message ? e.message : String(e)));
        if (typeof console !== 'undefined' && console.error) {
            console.error('CatHuntingGame: Failed to start game:', e);
        }
    }
}

function runWhenReady() {
    debugLog('runWhenReady (readyState=' + document.readyState + ')');
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startGame);
    } else {
        startGame();
    }
}

// Capture global JS errors so they are visible on the device screen.
if (typeof window !== 'undefined') {
    window.onerror = function (message, source, lineno, colno, error) {
        if (isDebugEnabled()) {
            debugLog('JS ERROR: ' + message + ' @' + lineno + ':' + colno);
        }
        return false;
    };
}

// In Cordova, wait for deviceready so the native bridge is initialized before
// any game code that might touch device APIs runs.
if (typeof window !== 'undefined' && window.cordova) {
    debugLog('cordova detected, waiting for deviceready');
    document.addEventListener('deviceready', runWhenReady, false);
} else {
    debugLog('no cordova, running immediately');
    runWhenReady();
}
