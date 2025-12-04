import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { Home } from 'lucide-react';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

const PARTICLE_COUNT = 15000;
const PARTICLE_SIZE = 0.45;

// === Shape Generation Functions ===
const getSpherePoints = (count, radius) => {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = radius * Math.cbrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    arr[i * 3 + 2] = r * Math.cos(phi);
  }
  return arr;
};

const getHeartPoints = (count) => {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const t = Math.random() * 2 * Math.PI;
    // Heart formula
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    const z = (Math.random() - 0.5) * 5; // Thinner Z for clearer 2D profile
    
    // Scale down
    const s = 0.8;
    // Add some volume internal points
    const r = Math.random();
    const vol = r > 0.8 ? 1 : Math.cbrt(r); // Mostly on shell
    
    arr[i * 3] = x * s * vol;
    arr[i * 3 + 1] = y * s * vol;
    arr[i * 3 + 2] = z * vol;
  }
  return arr;
};

const getFlowerPoints = (count) => {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // 5 petals
    const theta = Math.random() * 2 * Math.PI;
    const petal = Math.sin(5 * theta); 
    const rBase = 5 + 10 * Math.abs(petal); // Petal shape
    const r = rBase * Math.sqrt(Math.random()); // Fill
    const z = (Math.random() - 0.5) * 4 * (1 - r/15); // Taper at edges
    
    arr[i * 3] = r * Math.cos(theta);
    arr[i * 3 + 1] = r * Math.sin(theta);
    arr[i * 3 + 2] = z;
  }
  return arr;
};

const getSaturnPoints = (count) => {
  const arr = new Float32Array(count * 3);
  const planetCount = Math.floor(count * 0.4);
  const ringCount = count - planetCount;
  let idx = 0;

  // Planet
  for (let i = 0; i < planetCount; i++) {
    const r = 8 * Math.cbrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    arr[idx++] = r * Math.sin(phi) * Math.cos(theta);
    arr[idx++] = r * Math.sin(phi) * Math.sin(theta);
    arr[idx++] = r * Math.cos(phi);
  }

  // Rings
  for (let i = 0; i < ringCount; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const r = 12 + Math.random() * 8; // Ring gap from 8 to 12
    const x = r * Math.cos(theta);
    const y = (Math.random() - 0.5) * 0.5; // Thin rings
    const z = r * Math.sin(theta);

    const tilt = Math.PI / 6;
    arr[idx++] = x * Math.cos(tilt) - y * Math.sin(tilt);
    arr[idx++] = x * Math.sin(tilt) + y * Math.cos(tilt);
    arr[idx++] = z;
  }
  return arr;
};

const getBuddhaPoints = (count) => {
  // Simplified Meditating Figure
  const arr = new Float32Array(count * 3);
  let idx = 0;
  
  const headR = 3.5;
  const bodyW = 7;
  const bodyH = 8;
  
  for (let i = 0; i < count; i++) {
    const part = Math.random();
    if (part < 0.2) { // Head
      const r = headR * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[idx++] = r * Math.sin(phi) * Math.cos(theta);
      arr[idx++] = r * Math.sin(phi) * Math.sin(theta) + 6; // Shift up
      arr[idx++] = r * Math.cos(phi);
    } else if (part < 0.8) { // Body (Cone/Triangle ish)
      const h = Math.random() * bodyH; // 0 to 8
      const w = bodyW * (1 - h/bodyH) + 2; // Wider at bottom
      const r = w * Math.sqrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      arr[idx++] = r * Math.cos(theta);
      arr[idx++] = h - 4; // Center Y
      arr[idx++] = r * Math.sin(theta) * 0.6; // Flatten Z
    } else { // Aura/Base
      const theta = Math.random() * 2 * Math.PI;
      const r = 8 + Math.random() * 4;
      arr[idx++] = r * Math.cos(theta);
      arr[idx++] = r * Math.sin(theta);
      arr[idx++] = (Math.random() - 0.5) * 2 - 2; // Behind
    }
  }
  return arr;
};

const getFireworksPoints = (count) => {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Explosion sphere shell
    const r = 15 * Math.cbrt(Math.random()); // Solid sphere
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    
    // Add trails? Just simple expansion for now
    arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    arr[i * 3 + 2] = r * Math.cos(phi);
  }
  return arr;
};

const getShapePoints = (shape, count) => {
  switch (shape) {
    case 'sphere': return getSpherePoints(count, 12);
    case 'heart': return getHeartPoints(count);
    case 'flower': return getFlowerPoints(count);
    case 'saturn': return getSaturnPoints(count);
    case 'buddha': return getBuddhaPoints(count);
    case 'fireworks': return getFireworksPoints(count);
    case 'earth': return getSpherePoints(count, 15); // Background stars/particles for Earth
    default: return getSpherePoints(count, 12);
  }
};

export default function ParticleShaper() {
  const navigate = useNavigate();
  const canvasContainerRef = useRef(null);
  const videoRef = useRef(null);
  const outputCanvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const particlesRef = useRef(null);
  const earthRef = useRef(null); // Ref for Earth mesh
  const geometryRef = useRef(null);
  const materialRef = useRef(null);
  const targetPositionsRef = useRef(null);
  const timeRef = useRef(0);
  const handExpansionFactorRef = useRef(1.0);
  const handRotationRef = useRef({ x: 0, y: 0 }); // For Earth rotation
  const isHandDetectedRef = useRef(false);
  const animationFrameRef = useRef(null);
  const handsRef = useRef(null);
  const cameraUtilRef = useRef(null);

  const currentShapeRef = useRef('sphere');
  const [currentShape, setCurrentShape] = useState('sphere');
  const [particleColor, setParticleColor] = useState('#FFD700'); // Default Gold
  const [isLoading, setIsLoading] = useState(true);
  const [statusConnected, setStatusConnected] = useState(false);
  const [mediapipeError, setMediapipeError] = useState(false);
  const [expansionDisplay, setExpansionDisplay] = useState(1.0);

  // === Three.js Setup ===
  const createTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.5)'); // Softer core
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
  };

  const initThree = () => {
    if (!canvasContainerRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.02); // Darker fog
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 40;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    canvasContainerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // === Earth Mesh ===
    const earthGeometry = new THREE.SphereGeometry(10, 64, 64);
    const textureLoader = new THREE.TextureLoader();
    // High res earth texture
    const earthTexture = textureLoader.load('https://upload.wikimedia.org/wikipedia/commons/8/83/Equirectangular_projection_SW.jpg'); 
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.5,
      metalness: 0.1,
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.visible = false; // Hidden by default
    scene.add(earth);
    earthRef.current = earth;

    // Create particles
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const targetPositions = new Float32Array(PARTICLE_COUNT * 3);

    const spherePoints = getSpherePoints(PARTICLE_COUNT, 12);

    for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
      positions[i] = spherePoints[i];
      targetPositions[i] = spherePoints[i];
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometryRef.current = geometry;
    targetPositionsRef.current = targetPositions;

    const material = new THREE.PointsMaterial({
      color: 0xFFD700, // Gold default
      size: PARTICLE_SIZE,
      map: createTexture(),
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    materialRef.current = material;

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 10, 10);
    scene.add(dirLight);

    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  };

  // === MediaPipe Setup ===
  // === MediaPipe Setup ===
  const processHandData = (results) => {
    const landmarks = results.multiHandLandmarks;

    if (landmarks && landmarks.length > 0) {
      isHandDetectedRef.current = true;
      setStatusConnected(true);

      // Calculate hand center for Earth rotation
      const hand = landmarks[0];
      const wrist = hand[0];
      
      // Map hand position (0-1) to rotation angles
      // Center is 0.5, 0.5
      const centerX = 0.5;
      const centerY = 0.5;
      
      // Sensitivity
      const sensitivity = 2.0;
      
      handRotationRef.current = {
        y: (wrist.x - centerX) * sensitivity * Math.PI, // Left/Right -> Rotate Y
        x: (wrist.y - centerY) * sensitivity * Math.PI  // Up/Down -> Rotate X
      };

      if (landmarks.length === 2) {
        // 雙手模式
        const wrist1 = landmarks[0][0];
        const wrist2 = landmarks[1][0];
        const dx = wrist1.x - wrist2.x;
        const dy = wrist1.y - wrist2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const newFactor = Math.max(0.2, dist * 3.0);
        handExpansionFactorRef.current = newFactor;
        setExpansionDisplay(newFactor);
      } else {
        // 單手模式
        const tips = [4, 8, 12, 16, 20];
        let totalDist = 0;

        tips.forEach(idx => {
          const tip = hand[idx];
          totalDist += Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2));
        });

        const avgDist = totalDist / 5;
        const newFactor = Math.max(0.3, (avgDist - 0.1) * 6.0);
        handExpansionFactorRef.current = newFactor;
        setExpansionDisplay(newFactor);
      }
    } else {
      isHandDetectedRef.current = false;
      setStatusConnected(false);
      const newFactor = THREE.MathUtils.lerp(handExpansionFactorRef.current, 1.0, 0.05);
      handExpansionFactorRef.current = newFactor;
      setExpansionDisplay(newFactor);
      
      // Reset rotation slowly
      handRotationRef.current = {
        x: THREE.MathUtils.lerp(handRotationRef.current.x, 0, 0.05),
        y: THREE.MathUtils.lerp(handRotationRef.current.y, 0, 0.05)
      };
    }
  };

  const setupMediaPipe = async () => {
    try {
      const videoElement = videoRef.current;
      const canvasElement = outputCanvasRef.current;
      if (!videoElement || !canvasElement) return;

      const canvasCtx = canvasElement.getContext('2d');

      const hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
        }
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      hands.onResults((results) => {
        setIsLoading(false);
        setMediapipeError(false);

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.translate(canvasElement.width, 0);
        canvasCtx.scale(-1, 1);
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

        if (results.multiHandLandmarks) {
          for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
            drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1, radius: 2 });
          }
        }
        canvasCtx.restore();
        processHandData(results);
      });

      handsRef.current = hands;

      const camera = new Camera(videoElement, {
        onFrame: async () => {
          await hands.send({ image: videoElement });
        },
        width: 640,
        height: 480
      });

      cameraUtilRef.current = camera;
      await camera.start();
      
      console.log('MediaPipe initialized successfully');
    } catch (err) {
      console.error('MediaPipe setup error:', err);
      setIsLoading(false);
      setMediapipeError(true);
    }
  };

  // === Animation Loop ===
  // === Animation Loop ===
  const animate = () => {
    try {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      timeRef.current += 0.005;

      // Toggle visibility based on mode
      const isEarthMode = currentShapeRef.current === 'earth';
      
      if (earthRef.current) {
        earthRef.current.visible = isEarthMode;
        if (isEarthMode) {
          // Earth Animation
          // Auto rotation
          earthRef.current.rotation.y += 0.001;
          
          // Hand control rotation
          const targetRotX = handRotationRef.current.x;
          const targetRotY = handRotationRef.current.y;
          
          earthRef.current.rotation.x = THREE.MathUtils.lerp(earthRef.current.rotation.x, targetRotX, 0.1);
          earthRef.current.rotation.y += targetRotY * 0.05; // Add to continuous rotation
          
          // Hand control scale
          const scale = THREE.MathUtils.lerp(earthRef.current.scale.x, handExpansionFactorRef.current, 0.1);
          earthRef.current.scale.set(scale, scale, scale);
        }
      }

      if (particlesRef.current) {
        particlesRef.current.visible = !isEarthMode;
        
        if (!isEarthMode && geometryRef.current && targetPositionsRef.current) {
          const positions = geometryRef.current.attributes.position.array;
          const targetPositions = targetPositionsRef.current;
          const lerpSpeed = 0.08;

          for (let i = 0; i < PARTICLE_COUNT; i++) {
            const px = positions[i * 3];
            const py = positions[i * 3 + 1];
            const pz = positions[i * 3 + 2];

            const tx = targetPositions[i * 3];
            const ty = targetPositions[i * 3 + 1];
            const tz = targetPositions[i * 3 + 2];

            let targetXWithHand = tx * handExpansionFactorRef.current;
            let targetYWithHand = ty * handExpansionFactorRef.current;
            let targetZWithHand = tz * handExpansionFactorRef.current;

            if (currentShapeRef.current === 'fireworks') {
              const gravity = (Math.sin(timeRef.current + i) + 1) * 2;
              targetYWithHand -= gravity;
            }

            const noise = Math.sin(timeRef.current * 2 + i) * 0.15;
            targetXWithHand += noise;
            targetYWithHand += noise;
            targetZWithHand += noise;

            positions[i * 3] = THREE.MathUtils.lerp(px, targetXWithHand, lerpSpeed);
            positions[i * 3 + 1] = THREE.MathUtils.lerp(py, targetYWithHand, lerpSpeed);
            positions[i * 3 + 2] = THREE.MathUtils.lerp(pz, targetZWithHand, lerpSpeed);
          }

          geometryRef.current.attributes.position.needsUpdate = true;
          particlesRef.current.rotation.y += 0.002;
          particlesRef.current.rotation.y += (handExpansionFactorRef.current - 1) * 0.005;
        }
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    } catch (error) {
      console.error('Animation loop error:', error);
    }
    
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // === Shape Change Handler ===
  const handleShapeChange = (shape) => {
    setCurrentShape(shape);
    currentShapeRef.current = shape; // Update ref
    if (!targetPositionsRef.current) return;

    const newPoints = getShapePoints(shape, PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
      targetPositionsRef.current[i] = newPoints[i];
    }
  };

  // === Color Change Handler ===
  const handleColorChange = (e) => {
    const color = e.target.value;
    setParticleColor(color);
    if (materialRef.current) {
      materialRef.current.color.set(color);
    }
  };

  // === Lifecycle ===
  // === Lifecycle ===
  useEffect(() => {
    const cleanup = initThree();
    animate();
    setupMediaPipe();
    
    const container = canvasContainerRef.current;

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current && container && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      if (cameraUtilRef.current && cameraUtilRef.current.stop) {
        try {
          cameraUtilRef.current.stop();
        } catch (e) {
          console.log('Camera stop error:', e);
        }
      }
      if (handsRef.current && handsRef.current.close) {
        try {
          handsRef.current.close();
        } catch (e) {
          console.log('Hands close error:', e);
        }
      }
      if (cleanup) {
        cleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shapes = [
    { id: 'sphere', name: '球體', color: 'bg-blue-500' },
    { id: 'heart', name: '愛心', color: 'bg-red-500' },
    { id: 'flower', name: '花朵', color: 'bg-pink-500' },
    { id: 'saturn', name: '土星', color: 'bg-yellow-500' },
    { id: 'buddha', name: '禪修', color: 'bg-orange-400' },
    { id: 'fireworks', name: '煙火', color: 'bg-purple-500' },
    { id: 'earth', name: '地球', color: 'bg-blue-600' }
  ];

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* 3D Canvas Container */}
      <div ref={canvasContainerRef} className="absolute inset-0 z-1" />

      {/* Hidden Video Element */}
      <video ref={videoRef} style={{ display: 'none' }} />

      {/* Loading Screen */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-90 transition-opacity duration-500">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-xl font-light tracking-widest text-white">初始化 AI 視覺系統</h2>
          <p className="text-sm text-gray-400 mt-2">請允許使用相機以進行手勢控制</p>
        </div>
      )}

      {/* Error Message */}
      {mediapipeError && !isLoading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-red-900/80 backdrop-blur-md border border-red-500 rounded-2xl p-6 max-w-md text-center">
          <h3 className="text-xl font-bold text-white mb-2">⚠️ 手勢追蹤暫時無法使用</h3>
          <p className="text-sm text-gray-300 mb-4">
            MediaPipe 載入失敗，但您仍可以使用左側控制面板切換形狀和顏色
          </p>
          <p className="text-xs text-gray-400">
            粒子系統會以自動模式運行
          </p>
        </div>
      )}

      {/* Controls UI */}
      <div className="absolute top-6 left-6 z-20 w-72 bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
        {/* Header with Home Button */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Particle Shaper
            </h1>
            <p className="text-xs text-gray-400 mt-1">互動式 3D 手勢粒子系統</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="ml-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title="回到首頁"
          >
            <Home className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Shape Selectors */}
        <div className="space-y-3 mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">形狀模板</p>
          <div className="grid grid-cols-2 gap-2">
            {shapes.map((shape) => (
              <button
                key={shape.id}
                onClick={() => handleShapeChange(shape.id)}
                className={`w-full py-2 px-3 rounded-lg text-sm border text-left flex items-center gap-2 transition-all ${
                  currentShape === shape.id
                    ? 'bg-white/20 border-white/50 transform -translate-y-0.5'
                    : 'border-transparent hover:bg-white/10'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${shape.color}`}></span>
                <span className="text-white">{shape.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Color Control */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">粒子顏色</p>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={particleColor}
              onChange={handleColorChange}
              className="w-10 h-10 rounded cursor-pointer border-none bg-transparent"
            />
            <span className="text-sm font-mono text-gray-300">{particleColor.toUpperCase()}</span>
          </div>
        </div>

        {/* Status */}
        <div className="pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">手勢追蹤</span>
            <span
              className={`w-2 h-2 rounded-full transition-all ${
                statusConnected
                  ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                  : mediapipeError
                  ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]'
                  : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
              }`}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 italic">
            {mediapipeError 
              ? '自動模式運行中' 
              : statusConnected 
              ? '偵測到手勢控制中' 
              : '張開手掌以擴散，握拳以收縮'}
          </p>
          {/* 顯示當前擴張係數 */}
          <div className="mt-3 p-2 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">擴張係數</span>
              <span className="text-white font-mono font-bold">{expansionDisplay.toFixed(2)}x</span>
            </div>
            <div className="mt-1 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-200"
                style={{ width: `${Math.min(100, (expansionDisplay / 2.5) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Camera Preview */}
      {!mediapipeError && (
        <canvas
          ref={outputCanvasRef}
          width={640}
          height={480}
          className="fixed bottom-4 right-4 w-48 h-36 rounded-xl bg-gray-900/60 backdrop-blur-md border border-gray-700 opacity-80 z-20"
        />
      )}
    </div>
  );
}
