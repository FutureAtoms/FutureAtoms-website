/**
 * FPS Monitor - Runtime performance monitoring with adaptive quality adjustment
 * Tracks rolling FPS average and triggers quality changes when needed
 */

class FPSMonitor {
    constructor(options = {}) {
        this.sampleSize = options.sampleSize || 60; // Rolling window size
        this.degradeThreshold = options.degradeThreshold || 30; // FPS below this triggers downgrade
        this.upgradeThreshold = options.upgradeThreshold || 55; // FPS above this triggers upgrade
        this.degradeTime = options.degradeTime || 3000; // ms below threshold before degrading
        this.upgradeTime = options.upgradeTime || 5000; // ms above threshold before upgrading

        this.samples = [];
        this.lastTime = performance.now();
        this.currentFPS = 60;
        this.averageFPS = 60;

        this.belowThresholdStart = null;
        this.aboveThresholdStart = null;

        this.onDegrade = options.onDegrade || (() => {});
        this.onUpgrade = options.onUpgrade || (() => {});
        this.onFPSUpdate = options.onFPSUpdate || (() => {});

        this.isPaused = false;
        this.isEnabled = true;
    }

    /**
     * Call this at the start of each frame
     */
    tick() {
        if (this.isPaused || !this.isEnabled) return;

        const now = performance.now();
        const delta = now - this.lastTime;
        this.lastTime = now;

        // Calculate instantaneous FPS
        this.currentFPS = delta > 0 ? 1000 / delta : 60;

        // Add to rolling samples
        this.samples.push(this.currentFPS);
        if (this.samples.length > this.sampleSize) {
            this.samples.shift();
        }

        // Calculate rolling average
        this.averageFPS = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;

        // Fire FPS update callback
        this.onFPSUpdate(this.currentFPS, this.averageFPS);

        // Check for quality adjustment triggers
        this._checkThresholds(now);
    }

    _checkThresholds(now) {
        // Check for degrade condition
        if (this.averageFPS < this.degradeThreshold) {
            this.aboveThresholdStart = null; // Reset upgrade timer

            if (this.belowThresholdStart === null) {
                this.belowThresholdStart = now;
            } else if (now - this.belowThresholdStart >= this.degradeTime) {
                this.belowThresholdStart = null;
                this.onDegrade(this.averageFPS);
            }
        } else {
            this.belowThresholdStart = null;
        }

        // Check for upgrade condition
        if (this.averageFPS > this.upgradeThreshold) {
            if (this.aboveThresholdStart === null) {
                this.aboveThresholdStart = now;
            } else if (now - this.aboveThresholdStart >= this.upgradeTime) {
                this.aboveThresholdStart = null;
                this.onUpgrade(this.averageFPS);
            }
        } else {
            this.aboveThresholdStart = null;
        }
    }

    /**
     * Reset all counters (call after quality change)
     */
    reset() {
        this.samples = [];
        this.lastTime = performance.now();
        this.belowThresholdStart = null;
        this.aboveThresholdStart = null;
    }

    /**
     * Pause monitoring (e.g., when tab is hidden)
     */
    pause() {
        this.isPaused = true;
    }

    /**
     * Resume monitoring
     */
    resume() {
        this.isPaused = false;
        this.lastTime = performance.now();
        // Don't reset samples to maintain history
    }

    /**
     * Enable/disable auto quality adjustment
     */
    setAutoAdjust(enabled) {
        this.isEnabled = enabled;
        if (!enabled) {
            this.belowThresholdStart = null;
            this.aboveThresholdStart = null;
        }
    }

    /**
     * Get current stats
     */
    getStats() {
        return {
            currentFPS: Math.round(this.currentFPS),
            averageFPS: Math.round(this.averageFPS),
            minFPS: Math.round(Math.min(...this.samples) || 0),
            maxFPS: Math.round(Math.max(...this.samples) || 0),
            sampleCount: this.samples.length,
            isPaused: this.isPaused,
            isEnabled: this.isEnabled,
            timeTillDegrade: this.belowThresholdStart
                ? Math.max(0, this.degradeTime - (performance.now() - this.belowThresholdStart))
                : null,
            timeTillUpgrade: this.aboveThresholdStart
                ? Math.max(0, this.upgradeTime - (performance.now() - this.aboveThresholdStart))
                : null
        };
    }

    /**
     * Get a performance grade
     */
    getGrade() {
        if (this.averageFPS >= 55) return 'A';
        if (this.averageFPS >= 45) return 'B';
        if (this.averageFPS >= 30) return 'C';
        if (this.averageFPS >= 20) return 'D';
        return 'F';
    }

    /**
     * Get frame time in milliseconds
     */
    getFrameTime() {
        return this.currentFPS > 0 ? 1000 / this.currentFPS : 0;
    }
}

/**
 * Frame Rate Limiter - Cap FPS to prevent unnecessary GPU work
 */
class FrameRateLimiter {
    constructor(targetFPS = 60) {
        this.targetFPS = targetFPS;
        this.frameInterval = 1000 / targetFPS;
        this.lastFrameTime = 0;
        this.enabled = true;
    }

    /**
     * Set target FPS
     */
    setTargetFPS(fps) {
        this.targetFPS = fps;
        this.frameInterval = 1000 / fps;
    }

    /**
     * Check if enough time has passed for next frame
     * @param {number} timestamp - Current timestamp from requestAnimationFrame
     * @returns {boolean} - True if should render this frame
     */
    shouldRender(timestamp) {
        if (!this.enabled) return true;

        const elapsed = timestamp - this.lastFrameTime;
        if (elapsed >= this.frameInterval) {
            this.lastFrameTime = timestamp - (elapsed % this.frameInterval);
            return true;
        }
        return false;
    }

    /**
     * Enable/disable frame limiting
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

// Export for ES6 modules
export { FPSMonitor, FrameRateLimiter };

// Also expose globally for non-module scripts
if (typeof window !== 'undefined') {
    window.FPSMonitor = FPSMonitor;
    window.FrameRateLimiter = FrameRateLimiter;
}
