/**
 * Quality Manager - Central orchestration for adaptive rendering quality
 * Combines GPU detection, FPS monitoring, and quality presets
 */

import { GPUDetector } from './gpu-detector.js';
import { FPSMonitor, FrameRateLimiter } from './fps-monitor.js';
import { ParticlePool } from './particle-pool.js';

class QualityManager {
    constructor(options = {}) {
        // Core components
        this.gpuDetector = new GPUDetector();
        this.fpsMonitor = null;
        this.frameLimiter = null;
        this.particlePool = null;

        // State
        this.currentTier = 'medium';
        this.currentPreset = null;
        this.isInitialized = false;
        this.autoAdjustEnabled = true;

        // Callbacks
        this.onQualityChange = options.onQualityChange || (() => { });
        this.onFPSUpdate = options.onFPSUpdate || (() => { });

        // Settings storage key
        this.storageKey = 'futureAtoms_qualitySettings';

        // Tier order for upgrades/downgrades
        this.tierOrder = ['low', 'medium', 'high', 'ultra'];

        // Tab visibility handling
        this._setupVisibilityHandler();
    }

    /**
     * Initialize the quality system
     * @returns {Object} Initial detection result
     */
    async initialize() {
        // Check for saved preferences
        const saved = this._loadSettings();

        // Detect GPU capabilities
        const detection = this.gpuDetector.detect();

        // Use saved tier or detected tier
        if (saved && saved.tier && !saved.autoDetect) {
            this.currentTier = saved.tier;
        } else {
            this.currentTier = detection.tier;
        }

        // Handle 'none' tier - show CSS fallback
        if (this.currentTier === 'none') {
            this.currentPreset = detection.presets;
            this.isInitialized = true;
            return {
                tier: 'none',
                preset: this.currentPreset,
                useCSSFallback: true,
                detection
            };
        }

        // Get preset for current tier
        this.currentPreset = this._getPresetForTier(this.currentTier);

        // Initialize FPS monitor
        this.fpsMonitor = new FPSMonitor({
            onDegrade: (fps) => this._handleDegrade(fps),
            onUpgrade: (fps) => this._handleUpgrade(fps),
            onFPSUpdate: (current, avg) => this.onFPSUpdate(current, avg)
        });

        // Initialize frame limiter
        this.frameLimiter = new FrameRateLimiter(this.currentPreset.targetFPS);

        // Handle reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this._applyReducedMotion();
        }

        this.isInitialized = true;

        return {
            tier: this.currentTier,
            preset: this.currentPreset,
            useCSSFallback: false,
            detection
        };
    }

    /**
     * Initialize particle pool (call after Three.js scene is ready)
     */
    initializeParticlePool(THREE, scene, smokeTexture) {
        const maxParticles = this.currentPreset.trailMaxPerElectron * 8; // 8 electrons
        this.particlePool = new ParticlePool(THREE, scene, smokeTexture, maxParticles);
        return this.particlePool;
    }

    /**
     * Call at start of each animation frame
     */
    beginFrame(timestamp) {
        if (!this.isInitialized) return true;

        // Check frame limiter
        if (this.frameLimiter && !this.frameLimiter.shouldRender(timestamp)) {
            return false;
        }

        // Update FPS monitor
        if (this.fpsMonitor) {
            this.fpsMonitor.tick();
        }

        return true;
    }

    /**
     * Manually set quality tier
     */
    setTier(tier) {
        if (!this.tierOrder.includes(tier) && tier !== 'none') {
            console.warn(`Invalid tier: ${tier}`);
            return;
        }

        const oldTier = this.currentTier;
        this.currentTier = tier;
        this.currentPreset = this._getPresetForTier(tier);

        if (this.fpsMonitor) {
            this.fpsMonitor.reset();
        }

        if (this.frameLimiter) {
            this.frameLimiter.setTargetFPS(this.currentPreset.targetFPS);
        }

        if (this.particlePool && tier !== 'none') {
            this.particlePool.resize(this.currentPreset.trailMaxPerElectron * 8);
        }

        this._saveSettings();
        this.onQualityChange(oldTier, tier, this.currentPreset);
    }

    /**
     * Enable/disable auto quality adjustment
     */
    setAutoAdjust(enabled) {
        this.autoAdjustEnabled = enabled;
        if (this.fpsMonitor) {
            this.fpsMonitor.setAutoAdjust(enabled);
        }
        this._saveSettings();
    }

    /**
     * Get current quality state
     */
    getState() {
        return {
            tier: this.currentTier,
            preset: this.currentPreset,
            autoAdjust: this.autoAdjustEnabled,
            fpsStats: this.fpsMonitor ? this.fpsMonitor.getStats() : null,
            poolStats: this.particlePool ? this.particlePool.getStats() : null
        };
    }

    /**
     * Pause rendering (tab hidden)
     */
    pause() {
        if (this.fpsMonitor) {
            this.fpsMonitor.pause();
        }
    }

    /**
     * Resume rendering (tab visible)
     */
    resume() {
        if (this.fpsMonitor) {
            this.fpsMonitor.resume();
        }
    }

    /**
     * Clean up resources
     */
    dispose() {
        if (this.particlePool) {
            this.particlePool.dispose();
        }
    }

    // Private methods

    _setupVisibilityHandler() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
    }

    _handleDegrade(fps) {
        if (!this.autoAdjustEnabled) return;

        const currentIndex = this.tierOrder.indexOf(this.currentTier);
        if (currentIndex > 0) {
            const newTier = this.tierOrder[currentIndex - 1];
            console.log(`Quality degrading: ${this.currentTier} -> ${newTier} (avg FPS: ${fps.toFixed(1)})`);
            this.setTier(newTier);
        }
    }

    _handleUpgrade(fps) {
        if (!this.autoAdjustEnabled) return;

        const currentIndex = this.tierOrder.indexOf(this.currentTier);
        const detectedIndex = this.tierOrder.indexOf(this.gpuDetector.tier);

        // Don't upgrade beyond detected tier
        if (currentIndex < detectedIndex) {
            const newTier = this.tierOrder[currentIndex + 1];
            console.log(`Quality upgrading: ${this.currentTier} -> ${newTier} (avg FPS: ${fps.toFixed(1)})`);
            this.setTier(newTier);
        }
    }

    _getPresetForTier(tier) {
        const presets = {
            low: {
                pixelRatio: 1.0,
                cloudParticles: 500,
                bloom: { enabled: false, strength: 0, radius: 0 },
                trailMaxPerElectron: 10,
                nucleusSpheres: 8,
                antialias: false,
                useInstancing: true,
                targetFPS: 30,
                useCSSFallback: false
            },
            medium: {
                pixelRatio: 1.5,
                cloudParticles: 1000,
                bloom: { enabled: true, strength: 0.8, radius: 0.5 },
                trailMaxPerElectron: 30,
                nucleusSpheres: 15,
                antialias: true,
                useInstancing: true,
                targetFPS: 45,
                useCSSFallback: false
            },
            high: {
                pixelRatio: 2.0,
                cloudParticles: 2000,
                bloom: { enabled: true, strength: 1.2, radius: 0.7 },
                trailMaxPerElectron: 60,
                nucleusSpheres: 20,
                antialias: true,
                useInstancing: true,
                targetFPS: 60,
                useCSSFallback: false
            },
            ultra: {
                pixelRatio: Math.min(window.devicePixelRatio, 3),
                cloudParticles: 3000,
                bloom: { enabled: true, strength: 1.8, radius: 0.7 },
                trailMaxPerElectron: 100,
                nucleusSpheres: 25,
                antialias: true,
                useInstancing: true,
                targetFPS: 60,
                useCSSFallback: false
            }
        };

        return presets[tier] || presets.medium;
    }

    _applyReducedMotion() {
        // For reduced motion preference, use low settings with minimal animation
        this.currentTier = 'low';
        this.currentPreset = this._getPresetForTier('low');
        this.currentPreset.reducedMotion = true;
    }

    _saveSettings() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify({
                tier: this.currentTier,
                autoDetect: this.autoAdjustEnabled,
                timestamp: Date.now()
            }));
        } catch (e) {
            // localStorage not available
        }
    }

    _loadSettings() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                // Expire settings after 30 days
                if (Date.now() - data.timestamp < 30 * 24 * 60 * 60 * 1000) {
                    return data;
                }
            }
        } catch (e) {
            // localStorage not available
        }
        return null;
    }
}

/**
 * Create and inject quality settings UI
 */
function createQualitySettingsUI(qualityManager) {
    // Create settings panel
    const panel = document.createElement('div');
    panel.id = 'quality-settings-panel';
    panel.innerHTML = `
        <style>
            #quality-settings-panel {
                position: fixed;
                bottom: 80px;
                left: 20px;
                z-index: 1000;
            }
            #quality-toggle-btn {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: rgba(0, 20, 30, 0.8);
                border: 1px solid rgba(0, 255, 255, 0.3);
                color: rgba(0, 255, 255, 0.7);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }
            #quality-toggle-btn:hover {
                background: rgba(0, 40, 60, 0.9);
                border-color: rgba(0, 255, 255, 0.6);
                color: rgba(0, 255, 255, 1);
            }
            #quality-menu {
                position: absolute;
                bottom: 50px;
                left: 0;
                background: rgba(0, 20, 30, 0.95);
                border: 1px solid rgba(0, 255, 255, 0.3);
                border-radius: 8px;
                padding: 12px;
                min-width: 180px;
                display: none;
                backdrop-filter: blur(10px);
            }
            #quality-menu.visible {
                display: block;
            }
            #quality-menu h4 {
                color: rgba(0, 255, 255, 0.8);
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin: 0 0 10px 0;
                padding-bottom: 6px;
                border-bottom: 1px solid rgba(0, 255, 255, 0.2);
            }
            .quality-option {
                display: flex;
                align-items: center;
                padding: 6px 8px;
                margin: 2px 0;
                border-radius: 4px;
                cursor: pointer;
                color: rgba(255, 255, 255, 0.7);
                font-size: 12px;
                transition: all 0.2s ease;
            }
            .quality-option:hover {
                background: rgba(0, 255, 255, 0.1);
                color: white;
            }
            .quality-option.active {
                background: rgba(0, 255, 255, 0.2);
                color: #00ffff;
            }
            .quality-option input {
                margin-right: 8px;
            }
            #fps-display {
                margin-top: 10px;
                padding-top: 8px;
                border-top: 1px solid rgba(0, 255, 255, 0.2);
                font-size: 10px;
                color: rgba(255, 255, 255, 0.5);
                font-family: monospace;
            }
            #auto-adjust-toggle {
                margin-top: 8px;
                display: flex;
                align-items: center;
                font-size: 11px;
                color: rgba(255, 255, 255, 0.6);
            }
            #auto-adjust-toggle input {
                margin-right: 6px;
            }
        </style>
        <button id="quality-toggle-btn" title="Quality Settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
        </button>
        <div id="quality-menu">
            <h4>Graphics Quality</h4>
            <label class="quality-option" data-tier="low">
                <input type="radio" name="quality" value="low">
                Low (Basic)
            </label>
            <label class="quality-option" data-tier="medium">
                <input type="radio" name="quality" value="medium">
                Medium (Balanced)
            </label>
            <label class="quality-option" data-tier="high">
                <input type="radio" name="quality" value="high">
                High (Quality)
            </label>
            <label class="quality-option" data-tier="ultra">
                <input type="radio" name="quality" value="ultra">
                Ultra (Maximum)
            </label>
            <div id="auto-adjust-toggle">
                <input type="checkbox" id="auto-adjust-checkbox" checked>
                <label for="auto-adjust-checkbox">Auto-adjust quality</label>
            </div>
            <div id="fps-display">FPS: --</div>
        </div>
    `;

    document.body.appendChild(panel);

    // Event handlers
    const toggleBtn = document.getElementById('quality-toggle-btn');
    const menu = document.getElementById('quality-menu');
    const fpsDisplay = document.getElementById('fps-display');
    const autoCheckbox = document.getElementById('auto-adjust-checkbox');

    toggleBtn.addEventListener('click', () => {
        menu.classList.toggle('visible');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target)) {
            menu.classList.remove('visible');
        }
    });

    // Quality option selection
    document.querySelectorAll('.quality-option').forEach(option => {
        option.addEventListener('click', () => {
            const tier = option.dataset.tier;
            qualityManager.setTier(tier);
            updateUI();
        });
    });

    // Auto-adjust toggle
    autoCheckbox.addEventListener('change', () => {
        qualityManager.setAutoAdjust(autoCheckbox.checked);
    });

    // Update UI to reflect current state
    function updateUI() {
        const state = qualityManager.getState();

        document.querySelectorAll('.quality-option').forEach(option => {
            const isActive = option.dataset.tier === state.tier;
            option.classList.toggle('active', isActive);
            option.querySelector('input').checked = isActive;
        });

        autoCheckbox.checked = state.autoAdjust;
    }

    // FPS display update
    qualityManager.onFPSUpdate = (current, avg) => {
        fpsDisplay.textContent = `FPS: ${Math.round(avg)} (${qualityManager.currentTier})`;
    };

    // Quality change handler
    const originalOnChange = qualityManager.onQualityChange;
    qualityManager.onQualityChange = (...args) => {
        originalOnChange(...args);
        updateUI();
    };

    // Initial update
    updateUI();

    return panel;
}

// Export for ES6 modules
export { QualityManager, createQualitySettingsUI };

// Also expose globally for non-module scripts
if (typeof window !== 'undefined') {
    window.QualityManager = QualityManager;
    window.createQualitySettingsUI = createQualitySettingsUI;
}
