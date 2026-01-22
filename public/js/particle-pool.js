/**
 * Particle Pool - Object Pooling for Tail Particles
 * Eliminates GC pressure from creating/disposing sprites every frame
 */

class ParticlePool {
    constructor(THREE, scene, smokeTexture, maxSize = 300) {
        this.THREE = THREE;
        this.scene = scene;
        this.smokeTexture = smokeTexture;
        this.maxSize = maxSize;
        this.pool = [];
        this.active = [];

        // Pre-allocate particles
        this._preallocate();
    }

    _preallocate() {
        for (let i = 0; i < this.maxSize; i++) {
            const particle = this._createParticle();
            particle.visible = false;
            this.pool.push(particle);
        }
    }

    _createParticle() {
        const material = new this.THREE.SpriteMaterial({
            map: this.smokeTexture,
            color: 0xffffff,
            transparent: true,
            opacity: 0,
            blending: this.THREE.AdditiveBlending,
            depthWrite: false
        });
        const particle = new this.THREE.Sprite(material);
        particle.scale.setScalar(0.1);
        particle.userData = {
            life: 0,
            maxLife: 0,
            growthRate: 0,
            inUse: false
        };
        this.scene.add(particle);
        return particle;
    }

    /**
     * Acquire a particle from the pool
     * @param {THREE.Vector3} position - Initial position
     * @param {THREE.Color} color - Particle color
     * @param {number} auraFactor - Size multiplier
     * @returns {THREE.Sprite|null} - Particle or null if pool exhausted
     */
    acquire(position, color, auraFactor = 1.0) {
        let particle;

        if (this.pool.length > 0) {
            particle = this.pool.pop();
        } else if (this.active.length < this.maxSize) {
            // Pool exhausted but under max, create new
            particle = this._createParticle();
        } else {
            // Pool exhausted and at max - recycle oldest active
            particle = this.active.shift();
        }

        if (!particle) return null;

        // Reset particle state
        const jitter = 0.1 * auraFactor;
        particle.position.copy(position).add(new this.THREE.Vector3(
            (Math.random() - 0.5) * jitter,
            (Math.random() - 0.5) * jitter,
            (Math.random() - 0.5) * jitter
        ));

        particle.material.color.copy(color);
        particle.material.opacity = 0.25;
        particle.scale.setScalar(0.6 * auraFactor);

        const baseLife = 1.5 + (auraFactor * 0.5);
        particle.userData = {
            life: baseLife,
            maxLife: baseLife,
            growthRate: 0.5 + (Math.random() * 0.5),
            inUse: true
        };

        particle.visible = true;
        this.active.push(particle);

        return particle;
    }

    /**
     * Release a particle back to the pool
     * @param {THREE.Sprite} particle - Particle to release
     */
    release(particle) {
        particle.visible = false;
        particle.userData.inUse = false;

        const index = this.active.indexOf(particle);
        if (index > -1) {
            this.active.splice(index, 1);
        }

        this.pool.push(particle);
    }

    /**
     * Update all active particles
     * @param {number} delta - Time since last frame
     * @param {number} auraFactor - Current aura multiplier
     * @returns {Array} - Array of particles that need color updates (for electron color sync)
     */
    updateAll(delta, auraFactor = 1.0) {
        const toRelease = [];

        for (let i = this.active.length - 1; i >= 0; i--) {
            const p = this.active[i];
            p.userData.life -= delta;

            if (p.userData.life <= 0) {
                toRelease.push(p);
            } else {
                const lifeRatio = 1 - (p.userData.life / p.userData.maxLife);
                const size = (0.6 * auraFactor) + (lifeRatio * 3.0 * p.userData.growthRate * auraFactor);
                p.scale.setScalar(size);
                p.material.opacity = (p.userData.life / p.userData.maxLife) * 0.2;
            }
        }

        // Release dead particles
        toRelease.forEach(p => this.release(p));

        return this.active;
    }

    /**
     * Update color of all active particles (for instant color transitions)
     * @param {THREE.Color} color - New color
     */
    updateAllColors(color) {
        this.active.forEach(p => {
            p.material.color.copy(color);
        });
    }

    /**
     * Get current pool statistics
     */
    getStats() {
        return {
            poolSize: this.pool.length,
            activeCount: this.active.length,
            maxSize: this.maxSize,
            utilizationPercent: ((this.active.length / this.maxSize) * 100).toFixed(1)
        };
    }

    /**
     * Resize the pool (for quality adjustments)
     * @param {number} newMaxSize - New maximum pool size
     */
    resize(newMaxSize) {
        if (newMaxSize < this.active.length) {
            // Need to release excess active particles
            const excess = this.active.length - newMaxSize;
            for (let i = 0; i < excess; i++) {
                const p = this.active.shift();
                p.visible = false;
                this.scene.remove(p);
                p.material.dispose();
            }
        }

        // Adjust pool size
        while (this.pool.length > newMaxSize - this.active.length) {
            const p = this.pool.pop();
            this.scene.remove(p);
            p.material.dispose();
        }

        this.maxSize = newMaxSize;
    }

    /**
     * Clean up all particles
     */
    dispose() {
        [...this.active, ...this.pool].forEach(p => {
            this.scene.remove(p);
            p.material.dispose();
        });
        this.active = [];
        this.pool = [];
    }
}

// Export for ES6 modules
export { ParticlePool };

// Also expose globally for non-module scripts
if (typeof window !== 'undefined') {
    window.ParticlePool = ParticlePool;
}
