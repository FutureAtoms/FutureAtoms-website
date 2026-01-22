/**
 * GPU Detector - Device capability detection for adaptive quality
 * Detects GPU tier based on WebGL capabilities, renderer info, and benchmarks
 */

class GPUDetector {
    constructor() {
        this.tier = null;
        this.info = {};
        this.benchmarkScore = 0;
    }

    /**
     * Detect GPU capabilities and determine quality tier
     * @returns {Object} Detection result with tier and detailed info
     */
    detect() {
        const canvas = document.createElement('canvas');
        let gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

        if (!gl) {
            this.tier = 'none';
            this.info = { webglSupported: false };
            return this._getResult();
        }

        // Gather WebGL info
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = debugInfo
            ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
            : gl.getParameter(gl.RENDERER);
        const vendor = debugInfo
            ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
            : gl.getParameter(gl.VENDOR);

        const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        const maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
        const maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
        const maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
        const isWebGL2 = gl instanceof WebGL2RenderingContext;

        // Check for software renderers
        const isSoftwareRenderer = this._isSoftwareRenderer(renderer, vendor);

        // Check for mobile/low-power indicators
        const isMobile = this._isMobileDevice();
        const isLowPower = this._isLowPowerGPU(renderer);

        // Check for high-end indicators
        const isHighEnd = this._isHighEndGPU(renderer);
        const isAppleSilicon = this._isAppleSilicon(renderer);

        this.info = {
            webglSupported: true,
            webgl2: isWebGL2,
            renderer,
            vendor,
            maxTextureSize,
            maxViewportDims,
            maxVertexAttribs,
            maxTextureUnits,
            isSoftwareRenderer,
            isMobile,
            isLowPower,
            isHighEnd,
            isAppleSilicon,
            devicePixelRatio: window.devicePixelRatio || 1,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            hardwareConcurrency: navigator.hardwareConcurrency || 4,
            deviceMemory: navigator.deviceMemory || 4
        };

        // Determine tier based on collected info
        this.tier = this._determineTier();

        // Clean up
        const loseContext = gl.getExtension('WEBGL_lose_context');
        if (loseContext) loseContext.loseContext();

        return this._getResult();
    }

    /**
     * Run a quick GPU benchmark
     * @returns {Promise<number>} Benchmark score (higher = faster)
     */
    async runBenchmark() {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');

            if (!gl) {
                this.benchmarkScore = 0;
                resolve(0);
                return;
            }

            // Simple benchmark: measure time to draw many triangles
            const vertexShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertexShader, `
                attribute vec2 position;
                void main() {
                    gl_Position = vec4(position, 0.0, 1.0);
                }
            `);
            gl.compileShader(vertexShader);

            const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragmentShader, `
                precision mediump float;
                void main() {
                    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
                }
            `);
            gl.compileShader(fragmentShader);

            const program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            gl.useProgram(program);

            // Create buffer with many vertices
            const vertices = [];
            for (let i = 0; i < 10000; i++) {
                vertices.push(
                    Math.random() * 2 - 1, Math.random() * 2 - 1,
                    Math.random() * 2 - 1, Math.random() * 2 - 1,
                    Math.random() * 2 - 1, Math.random() * 2 - 1
                );
            }

            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

            const positionLocation = gl.getAttribLocation(program, 'position');
            gl.enableVertexAttribArray(positionLocation);
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

            // Time the drawing
            const iterations = 10;
            const start = performance.now();

            for (let i = 0; i < iterations; i++) {
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
                gl.finish();
            }

            const elapsed = performance.now() - start;
            const score = Math.round((iterations * 10000) / elapsed);

            this.benchmarkScore = score;
            this.info.benchmarkScore = score;

            // Clean up
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            gl.deleteProgram(program);
            gl.deleteBuffer(buffer);

            resolve(score);
        });
    }

    _isSoftwareRenderer(renderer, vendor) {
        const softwareIndicators = [
            'swiftshader',
            'llvmpipe',
            'software',
            'microsoft basic render',
            'vmware',
            'virtualbox',
            'mesa'
        ];

        const lowerRenderer = renderer.toLowerCase();
        const lowerVendor = vendor.toLowerCase();

        return softwareIndicators.some(indicator =>
            lowerRenderer.includes(indicator) || lowerVendor.includes(indicator)
        );
    }

    _isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
    }

    _isLowPowerGPU(renderer) {
        const lowPowerIndicators = [
            'intel hd graphics 4',
            'intel hd graphics 5',
            'intel hd graphics 6',
            'intel uhd graphics 6',
            'intel iris',
            'adreno 3',
            'adreno 4',
            'adreno 5',
            'mali-4',
            'mali-t',
            'powervr',
            'geforce 7',
            'geforce 8',
            'geforce 9',
            'geforce gt',
            'radeon hd 4',
            'radeon hd 5',
            'radeon hd 6'
        ];

        const lowerRenderer = renderer.toLowerCase();
        return lowPowerIndicators.some(indicator => lowerRenderer.includes(indicator));
    }

    _isHighEndGPU(renderer) {
        const highEndIndicators = [
            'rtx 30',
            'rtx 40',
            'rtx 50',
            'geforce gtx 10',
            'geforce gtx 16',
            'geforce gtx 20',
            'radeon rx 5',
            'radeon rx 6',
            'radeon rx 7',
            'arc a7',
            'arc a5',
            'apple m1 max',
            'apple m1 ultra',
            'apple m2 max',
            'apple m2 ultra',
            'apple m3 max',
            'apple m3 ultra',
            'apple m4 max',
            'apple m4 ultra',
            'apple m4 pro',
            'apple m3 pro',
            'apple m2 pro',
            'nvidia a100',
            'nvidia h100',
            'quadro rtx'
        ];

        const lowerRenderer = renderer.toLowerCase();
        return highEndIndicators.some(indicator => lowerRenderer.includes(indicator));
    }

    _isAppleSilicon(renderer) {
        const lowerRenderer = renderer.toLowerCase();
        return lowerRenderer.includes('apple m') ||
            lowerRenderer.includes('apple gpu');
    }

    _determineTier() {
        const { isSoftwareRenderer, isMobile, isLowPower, isHighEnd, isAppleSilicon,
            maxTextureSize, webgl2, deviceMemory, hardwareConcurrency } = this.info;

        // Software renderer = lowest tier
        if (isSoftwareRenderer) return 'low';

        // High-end desktop GPUs
        if (isHighEnd) return 'ultra';

        // Apple Silicon (all M-series chips are quite capable)
        if (isAppleSilicon) {
            // M1/M2/M3/M4 base models = high, Pro/Max/Ultra = ultra
            const lowerRenderer = this.info.renderer.toLowerCase();
            if (lowerRenderer.includes('max') ||
                lowerRenderer.includes('ultra') ||
                lowerRenderer.includes('pro')) {
                return 'ultra';
            }
            return 'high';
        }

        // Low power GPU
        if (isLowPower) return 'low';

        // Mobile devices
        if (isMobile) {
            // High-end mobile
            if (deviceMemory >= 8 && hardwareConcurrency >= 6) return 'medium';
            return 'low';
        }

        // Desktop with good specs but not high-end
        if (webgl2 && maxTextureSize >= 8192 && deviceMemory >= 8) return 'high';
        if (webgl2 && maxTextureSize >= 4096) return 'medium';

        // Default to medium
        return 'medium';
    }

    _getResult() {
        return {
            tier: this.tier,
            info: this.info,
            benchmarkScore: this.benchmarkScore,
            presets: this._getPresetsForTier()
        };
    }

    _getPresetsForTier() {
        const presets = {
            none: {
                pixelRatio: 1.0,
                cloudParticles: 0,
                bloom: { enabled: false, strength: 0, radius: 0 },
                trailMaxPerElectron: 0,
                nucleusSpheres: 0,
                antialias: false,
                useInstancing: false,
                targetFPS: 30,
                useCSSFallback: true
            },
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

        return presets[this.tier] || presets.medium;
    }

    /**
     * Get a user-friendly description of the detected tier
     */
    getTierDescription() {
        const descriptions = {
            none: 'WebGL not supported - using CSS fallback',
            low: 'Basic - optimized for older hardware',
            medium: 'Balanced - good visuals with stable performance',
            high: 'High quality - full effects enabled',
            ultra: 'Maximum quality - all effects at highest settings'
        };
        return descriptions[this.tier] || 'Unknown';
    }
}

// Export for ES6 modules
export { GPUDetector };

// Also expose globally for non-module scripts
if (typeof window !== 'undefined') {
    window.GPUDetector = GPUDetector;
}
