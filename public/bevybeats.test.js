import * as THREE from 'three';

// Mock Three.js components
jest.mock('three', () => ({
  Scene: jest.fn(() => ({
    add: jest.fn(),
  })),
  PerspectiveCamera: jest.fn(() => ({
    position: { set: jest.fn() },
    lookAt: jest.fn(),
    updateProjectionMatrix: jest.fn(),
  })),
  WebGLRenderer: jest.fn(() => ({
    setSize: jest.fn(),
    setPixelRatio: jest.fn(),
    domElement: document.createElement('canvas'),
    render: jest.fn(),
    setClearColor: jest.fn(), // Added for potential default clear color
    setClearAlpha: jest.fn(), // Added for potential default clear alpha
  })),
  PlaneGeometry: jest.fn((width, height, widthSegments, heightSegments) => ({
    attributes: {
      position: {
        count: widthSegments * heightSegments,
        getX: jest.fn(),
        getY: jest.fn(),
        setZ: jest.fn(),
        needsUpdate: true,
      },
    },
  })),
  MeshPhysicalMaterial: jest.fn(() => ({
    emissiveIntensity: 0.2,
  })),
  Mesh: jest.fn(() => ({
    rotation: { x: 0, z: 0 },
  })),
  BufferGeometry: jest.fn(() => ({
    setAttribute: jest.fn(),
    attributes: {
      position: {
        array: new Float32Array(100 * 3), // Mock array for note positions
        needsUpdate: true,
      },
    },
  })),
  PointsMaterial: jest.fn(() => ({})),
  Points: jest.fn(() => ({
    rotation: { y: 0 },
  })),
  PointLight: jest.fn(() => ({
    position: { set: jest.fn() },
  })),
  AdditiveBlending: {}, // Mock AdditiveBlending if used
}));

// Mock DOM elements and interactions
const mockWaveContainer = document.createElement('div');
mockWaveContainer.id = 'wave-container';
document.body.appendChild(mockWaveContainer);

document.getElementById = jest.fn((id) => {
  if (id === 'wave-container') {
    return mockWaveContainer;
  }
  if (id === 'cursorGlow') {
      const cursorGlow = document.createElement('div');
      cursorGlow.style = {};
      return cursorGlow;
  }
  return null;
});


// Mock control buttons
const mockControlBtn1 = document.createElement('button');
mockControlBtn1.className = 'control-btn';
const mockControlBtn2 = document.createElement('button');
mockControlBtn2.className = 'control-btn';
document.body.appendChild(mockControlBtn1);
document.body.appendChild(mockControlBtn2);

document.querySelectorAll = jest.fn((selector) => {
    if (selector === '.control-btn') {
        return [mockControlBtn1, mockControlBtn2];
    }
    return [];
});


// Mock requestAnimationFrame and Date.now
global.requestAnimationFrame = jest.fn(callback => callback());
global.Date.now = jest.fn(() => 0);

// Mock window properties
global.window.innerWidth = 800;
global.window.innerHeight = 600;


// Load the script after mocking
// In a real scenario, you would load the script from the HTML file
// For testing purposes, we can copy the relevant script content here.
const scriptContent = `
        // Scene setup for audio waves
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        document.getElementById('wave-container').appendChild(renderer.domElement);

        // Create audio wave mesh
        const waveGeometry = new THREE.PlaneGeometry(30, 10, 128, 32);
        const waveMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xd4a574,
            emissive: 0xb8860b,
            emissiveIntensity: 0.2,
            metalness: 0.8,
            roughness: 0.2,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });

        const wave = new THREE.Mesh(waveGeometry, waveMaterial);
        wave.rotation.x = -Math.PI / 3;
        scene.add(wave);

        // Add particles for musical notes
        const noteCount = 100;
        const noteGeometry = new THREE.BufferGeometry();
        const notePositions = new Float32Array(noteCount * 3);

        for (let i = 0; i < noteCount; i++) {
            notePositions[i * 3] = (Math.random() - 0.5) * 40;
            notePositions[i * 3 + 1] = Math.random() * 10;
            notePositions[i * 3 + 2] = (Math.random() - 0.5) * 20;
        }

        noteGeometry.setAttribute('position', new THREE.BufferAttribute(notePositions, 3));

        const noteMaterial = new THREE.PointsMaterial({
            color: 0xd4a574,
            size: 0.2,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        const notes = new THREE.Points(noteGeometry, noteMaterial);
        scene.add(notes);

        // Lighting
        const light1 = new THREE.PointLight(0xd4a574, 1, 100);
        light1.position.set(0, 10, 10);
        scene.add(light1);

        const light2 = new THREE.PointLight(0xb8860b, 0.5, 100);
        light2.position.set(-10, -10, 10);
        scene.add(light2);

        camera.position.set(0, 5, 15);
        camera.lookAt(0, 0, 0);

        // Mouse tracking
        let mouseX = 0;
        let mouseY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(e.clientY / window.innerHeight) * 2 + 1;

            // Update cursor glow
            const cursorGlow = document.getElementById('cursorGlow');
            if (cursorGlow) {
                cursorGlow.style.left = e.clientX + 'px';
                cursorGlow.style.top = e.clientY + 'px';
            }
        });

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);

            // Animate wave vertices
            const time = Date.now() * 0.001;
            const vertices = wave.geometry.attributes.position;

            for (let i = 0; i < vertices.count; i++) {
                const x = vertices.getX(i);
                const y = vertices.getY(i);
                const waveHeight = Math.sin(x * 0.5 + time) * Math.cos(y * 0.5 + time) * 2;
                vertices.setZ(i, waveHeight);
            }

            vertices.needsUpdate = true;

            // Rotate wave slightly
            wave.rotation.z = Math.sin(time * 0.2) * 0.1;

            // Animate notes
            notes.rotation.y += 0.001;
            const notePos = notes.geometry.attributes.position.array;
            for (let i = 0; i < noteCount; i++) {
                notePos[i * 3 + 1] += 0.02;
                if (notePos[i * 3 + 1] > 10) {
                    notePos[i * 3 + 1] = -5;
                }
            }
            notes.geometry.attributes.position.needsUpdate = true;

            // Camera movement
            camera.position.x = mouseX * 5;
            camera.position.y = 5 + mouseY * 2;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
        }

        animate();

        // Resize handler
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Control buttons interaction
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                // Trigger wave animation
                waveMaterial.emissiveIntensity = 0.5;
                setTimeout(() => {
                    waveMaterial.emissiveIntensity = 0.2;
                }, 300);
            });
        });
    `;

// Execute the script content in the test environment
const script = document.createElement('script');
script.textContent = scriptContent;
document.body.appendChild(script);


describe('BevyBeats Three.js Animation', () => {

    // Helper function to simulate mouse move
    const simulateMouseMove = (clientX, clientY) => {
        const event = new MouseEvent('mousemove', {
            clientX: clientX,
            clientY: clientY,
        });
        document.dispatchEvent(event);
    };

    // Helper function to simulate window resize
    const simulateWindowResize = (width, height) => {
        global.window.innerWidth = width;
        global.window.innerHeight = height;
        const event = new Event('resize');
        global.dispatchEvent(event);
    };


  test('1. Three.js Scene Setup - Scene, Camera, and Renderer Initialization', () => {
    expect(THREE.Scene).toHaveBeenCalledTimes(1);
    expect(THREE.PerspectiveCamera).toHaveBeenCalledTimes(1);
    expect(THREE.WebGLRenderer).toHaveBeenCalledTimes(1);
    expect(renderer.setSize).toHaveBeenCalledWith(800, 600);
    expect(renderer.setPixelRatio).toHaveBeenCalledWith(window.devicePixelRatio);
    expect(document.getElementById('wave-container').appendChild).toHaveBeenCalledWith(renderer.domElement);
    expect(scene.add).toHaveBeenCalledWith(expect.any(THREE.Mesh)); // Wave mesh
    expect(scene.add).toHaveBeenCalledWith(expect.any(THREE.Points)); // Notes particles
    expect(scene.add).toHaveBeenCalledWith(expect.any(THREE.PointLight)); // Light 1
    expect(scene.add).toHaveBeenCalledWith(expect.any(THREE.PointLight)); // Light 2
    expect(camera.position.set).toHaveBeenCalledWith(0, 5, 15);
    expect(camera.lookAt).toHaveBeenCalledWith(0, 0, 0);
  });

  test('2. Wave Animation - Vertex updates and rotation', () => {
    const initialZ = wave.geometry.attributes.position.getZ(0);
    animate(); // Run one frame of the animation
    const afterAnimationZ = wave.geometry.attributes.position.getZ(0);
    expect(wave.geometry.attributes.position.setZ).toHaveBeenCalled();
    expect(wave.geometry.attributes.position.needsUpdate).toBe(true);
    expect(wave.rotation.z).not.toBe(0); // Should be rotated after animation
  });

  test('3. Particle Animation - Note movement and looping', () => {
    const noteCount = 100;
    const notePositions = notes.geometry.attributes.position.array;
    // Set some notes to be close to the upper bound for testing looping
    for(let i = 0; i < noteCount; i++) {
        notePositions[i * 3 + 1] = 9.9;
    }

    animate(); // Run one frame of the animation

    expect(notes.rotation.y).toBeGreaterThan(0);
    expect(notes.geometry.attributes.position.needsUpdate).toBe(true);

    // Check if notes that went above 10 have looped back
    for(let i = 0; i < noteCount; i++) {
        if (notePositions[i * 3 + 1] > 10) {
             expect(notePositions[i * 3 + 1]).toBeLessThan(0); // Should be reset to -5 or less
        } else {
             expect(notePositions[i * 3 + 1]).toBeGreaterThan(9.9); // Should have moved up
        }
    }
  });

  test('4. Camera Movement - Position updates based on mouse', () => {
    simulateMouseMove(window.innerWidth / 2, window.innerHeight / 2); // Mouse in the center
    animate();
    expect(camera.position.x).toBeCloseTo(0);
    expect(camera.position.y).toBeCloseTo(5);

    simulateMouseMove(window.innerWidth, window.innerHeight); // Mouse in the bottom right
    animate();
    expect(camera.position.x).toBeCloseTo(5); // mouseX = 1 -> x = 1 * 5 = 5
    expect(camera.position.y).toBeCloseTo(5 - 2); // mouseY = -1 -> y = 5 + (-1 * 2) = 3
  });

   test('5. Button Interaction - Emissive intensity change on click', () => {
        const controlButtons = document.querySelectorAll('.control-btn');
        const waveMaterial = wave.material; // Access the mock material instance

        // Mock setTimeout to control the asynchronous part
        jest.useFakeTimers();

        // Check initial state
        expect(waveMaterial.emissiveIntensity).toBe(0.2);

        // Simulate a click
        controlButtons[0].click();

        // Check if intensity increases immediately on click
        expect(waveMaterial.emissiveIntensity).toBe(0.5);

        // Advance timers to simulate the timeout
        jest.advanceTimersByTime(300);

        // Check if intensity returns to original after timeout
        expect(waveMaterial.emissiveIntensity).toBe(0.2);

        jest.useRealTimers(); // Restore real timers
   });


  test('6. Window Resize Handling - Camera aspect and renderer size updates', () => {
    const newWidth = 1024;
    const newHeight = 768;

    simulateWindowResize(newWidth, newHeight);

    expect(camera.aspect).toBe(newWidth / newHeight);
    expect(camera.updateProjectionMatrix).toHaveBeenCalled();
    expect(renderer.setSize).toHaveBeenCalledWith(newWidth, newHeight);
  });
});