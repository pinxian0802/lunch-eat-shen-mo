import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { Home } from 'lucide-react';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

const PARTICLE_COUNT = 15000;
const PARTICLE_SIZE = 0.45;

// === Gesture Detection Utilities ===
const getPalmCenter = (landmarks) => {
  // Use landmarks 0, 5, 9, 13, 17 (wrist and finger bases)
  const indices = [0, 5, 9, 13, 17];
  let x = 0, y = 0, z = 0;
  indices.forEach(i => {
    x += landmarks[i].x;
    y += landmarks[i].y;
    z += landmarks[i].z || 0;
  });
  return { x: x / 5, y: y / 5, z: z / 5 };
};

const getFingerTip = (landmarks, fingerIndex) => {
  // Finger tips: thumb=4, index=8, middle=12, ring=16, pinky=20
  const tipIndices = [4, 8, 12, 16, 20];
  const idx = tipIndices[fingerIndex];
  return landmarks[idx];
};

const isFingerExtended = (landmarks, fingerIndex) => {
  // Check if finger is extended by comparing tip Y to base Y
  const tipIndices = [4, 8, 12, 16, 20];
  const pipIndices = [3, 6, 10, 14, 18]; // PIP joints
  const tip = landmarks[tipIndices[fingerIndex]];
  const pip = landmarks[pipIndices[fingerIndex]];
  // For thumb, use X comparison; for others, use Y
  if (fingerIndex === 0) {
    return Math.abs(tip.x - landmarks[0].x) > Math.abs(pip.x - landmarks[0].x);
  }
  return tip.y < pip.y; // Lower Y = higher on screen
};

const detectGesture = (landmarks) => {
  const extended = [0, 1, 2, 3, 4].map(i => isFingerExtended(landmarks, i));
  const extendedCount = extended.filter(Boolean).length;

  // Open palm: all fingers extended
  if (extendedCount >= 4) return 'open';

  // Fist: no fingers extended
  if (extendedCount === 0) return 'fist';

  // OK gesture: thumb and index form circle, others extended
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const dist = Math.sqrt(
    Math.pow(thumbTip.x - indexTip.x, 2) +
    Math.pow(thumbTip.y - indexTip.y, 2)
  );
  if (dist < 0.05 && extended[2] && extended[3]) return 'ok';

  // Peace/V sign: index and middle extended
  if (extended[1] && extended[2] && !extended[3] && !extended[4]) return 'peace';

  // Thumbs up: only thumb extended
  if (extended[0] && !extended[1] && !extended[2] && !extended[3] && !extended[4]) return 'thumbsUp';

  // Pointing: only index extended
  if (!extended[0] && extended[1] && !extended[2] && !extended[3] && !extended[4]) return 'pointing';

  return 'unknown';
};

const getHandOrientation = (landmarks) => {
  // Calculate hand orientation using wrist and middle finger base
  const wrist = landmarks[0];
  const middleBase = landmarks[9];
  const indexBase = landmarks[5];

  // Direction vector
  const dir = {
    x: middleBase.x - wrist.x,
    y: middleBase.y - wrist.y,
    z: (middleBase.z || 0) - (wrist.z || 0)
  };

  // Calculate roll from index to pinky
  const pinkyBase = landmarks[17];
  const roll = Math.atan2(pinkyBase.y - indexBase.y, pinkyBase.x - indexBase.x);

  return { dir, roll };
};


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
    const z = (Math.random() - 0.5) * 4 * (1 - r / 15); // Taper at edges

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
      const w = bodyW * (1 - h / bodyH) + 2; // Wider at bottom
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

  // === New Refs for 8 Effect Modes ===
  const energyBallRef = useRef(null);
  const magicCircleRef = useRef(null);
  const weaponRef = useRef(null);
  const drawingLinesRef = useRef([]);
  const currentLineRef = useRef(null);
  const summonedObjectsRef = useRef([]);
  const handRigRef = useRef({ joints: [], bones: [] });
  const palmPositionRef = useRef({ x: 0.5, y: 0.5, z: 0 });
  const currentGestureRef = useRef('unknown');
  const lastGestureRef = useRef('unknown');
  const fingerParticlesRef = useRef([]);

  const currentShapeRef = useRef('sphere');
  const [currentShape, setCurrentShape] = useState('sphere');
  const [particleColor, setParticleColor] = useState('#FFD700'); // Default Gold
  const [isLoading, setIsLoading] = useState(true);
  const [statusConnected, setStatusConnected] = useState(false);
  const [mediapipeError, setMediapipeError] = useState(false);
  const [expansionDisplay, setExpansionDisplay] = useState(1.0);

  // === New State for Effect Modes ===
  const [effectMode, setEffectMode] = useState('particles'); // 'particles' | 'effects'
  const [activeEffect, setActiveEffect] = useState('energyBall');
  const [weaponType, setWeaponType] = useState('sword');
  const [currentGesture, setCurrentGesture] = useState('unknown');
  const [isDrawing, setIsDrawing] = useState(false);
  const activeEffectRef = useRef('energyBall');

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

    // === Effect 1: Energy Ball ===
    const energyBallGeometry = new THREE.SphereGeometry(3, 32, 32);
    const energyBallMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color('#ff6600') },
        color2: { value: new THREE.Color('#ffff00') }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          float noise = sin(vPosition.x * 3.0 + time * 2.0) * 
                        sin(vPosition.y * 3.0 + time * 1.5) * 
                        sin(vPosition.z * 3.0 + time);
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
          vec3 color = mix(color1, color2, noise * 0.5 + 0.5);
          float alpha = fresnel * 0.8 + 0.4;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const energyBall = new THREE.Mesh(energyBallGeometry, energyBallMaterial);
    energyBall.visible = false;
    scene.add(energyBall);
    energyBallRef.current = energyBall;

    // === Effect 2: Magic Circle ===
    const magicCircleGeometry = new THREE.RingGeometry(2, 5, 64);
    const magicCircleCanvas = document.createElement('canvas');
    magicCircleCanvas.width = 512;
    magicCircleCanvas.height = 512;
    const mgCtx = magicCircleCanvas.getContext('2d');
    // Draw magic circle pattern
    mgCtx.fillStyle = 'transparent';
    mgCtx.fillRect(0, 0, 512, 512);
    mgCtx.strokeStyle = '#00ffff';
    mgCtx.lineWidth = 2;
    mgCtx.beginPath();
    mgCtx.arc(256, 256, 200, 0, Math.PI * 2);
    mgCtx.stroke();
    mgCtx.beginPath();
    mgCtx.arc(256, 256, 150, 0, Math.PI * 2);
    mgCtx.stroke();
    // Draw runes
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const x = 256 + Math.cos(angle) * 175;
      const y = 256 + Math.sin(angle) * 175;
      mgCtx.font = '24px serif';
      mgCtx.fillStyle = '#00ffff';
      mgCtx.fillText('✦', x - 8, y + 8);
    }
    // Draw star
    mgCtx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const x = 256 + Math.cos(angle) * 120;
      const y = 256 + Math.sin(angle) * 120;
      if (i === 0) mgCtx.moveTo(x, y);
      else mgCtx.lineTo(x, y);
    }
    mgCtx.closePath();
    mgCtx.stroke();

    const magicCircleTexture = new THREE.CanvasTexture(magicCircleCanvas);
    const magicCircleMaterial = new THREE.MeshBasicMaterial({
      map: magicCircleTexture,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const magicCircle = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), magicCircleMaterial);
    magicCircle.visible = false;
    scene.add(magicCircle);
    magicCircleRef.current = magicCircle;

    // === Effect 3: Weapons ===
    const weaponGroup = new THREE.Group();
    // Sword
    const swordBlade = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 8, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.1 })
    );
    swordBlade.position.y = 4;
    const swordHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    swordHandle.position.y = -0.5;
    const swordGuard = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.2, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.8 })
    );
    swordGuard.position.y = 0.2;
    weaponGroup.add(swordBlade, swordHandle, swordGuard);

    // Add lightsaber glow effect
    const lightsaberBlade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 8),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.9 })
    );
    lightsaberBlade.position.y = 4;
    lightsaberBlade.visible = false;
    weaponGroup.add(lightsaberBlade);

    weaponGroup.visible = false;
    weaponGroup.scale.set(0.5, 0.5, 0.5);
    scene.add(weaponGroup);
    weaponRef.current = weaponGroup;

    // === Effect 8: Hand Rig (21 joints) ===
    const handRigGroup = new THREE.Group();
    const joints = [];
    const bones = [];
    const jointMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const boneMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });

    for (let i = 0; i < 21; i++) {
      const joint = new THREE.Mesh(new THREE.SphereGeometry(0.15), jointMaterial);
      joint.visible = false;
      joints.push(joint);
      handRigGroup.add(joint);
    }

    // Create bone connections
    const boneConnections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index
      [0, 9], [9, 10], [10, 11], [11, 12], // Middle
      [0, 13], [13, 14], [14, 15], [15, 16], // Ring
      [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [5, 9], [9, 13], [13, 17] // Palm connections
    ];

    boneConnections.forEach(([start, end]) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      const line = new THREE.Line(geometry, boneMaterial);
      line.userData = { start, end };
      bones.push(line);
      handRigGroup.add(line);
    });

    handRigGroup.visible = false;
    scene.add(handRigGroup);
    handRigRef.current = { joints, bones, group: handRigGroup };

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
  const processHandData = (results) => {
    const landmarks = results.multiHandLandmarks;

    if (landmarks && landmarks.length > 0) {
      isHandDetectedRef.current = true;
      setStatusConnected(true);

      const hand = landmarks[0];
      const wrist = hand[0];

      // Update palm position for effects
      const palmCenter = getPalmCenter(hand);
      palmPositionRef.current = palmCenter;

      // Detect gesture
      const gesture = detectGesture(hand);
      if (gesture !== currentGestureRef.current) {
        lastGestureRef.current = currentGestureRef.current;
        currentGestureRef.current = gesture;
        setCurrentGesture(gesture);

        // Handle gesture-based summoning (Effect 5)
        if (activeEffectRef.current === 'summon' && sceneRef.current) {
          handleGestureSummon(gesture, palmCenter);
        }
      }

      // Map hand position (0-1) to rotation angles
      const centerX = 0.5;
      const centerY = 0.5;
      const sensitivity = 2.0;

      handRotationRef.current = {
        y: (wrist.x - centerX) * sensitivity * Math.PI,
        x: (wrist.y - centerY) * sensitivity * Math.PI
      };

      // Handle air drawing (Effect 4)
      if (activeEffectRef.current === 'airDraw' && gesture === 'pointing') {
        const indexTip = getFingerTip(hand, 1);
        handleAirDrawing(indexTip, true);
        setIsDrawing(true);
      } else if (activeEffectRef.current === 'airDraw') {
        handleAirDrawing(null, false);
        setIsDrawing(false);
      }

      // Update hand rig (Effect 8)
      if (activeEffectRef.current === 'handRig') {
        updateHandRig(hand);
      }

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

      handRotationRef.current = {
        x: THREE.MathUtils.lerp(handRotationRef.current.x, 0, 0.05),
        y: THREE.MathUtils.lerp(handRotationRef.current.y, 0, 0.05)
      };

      // Stop drawing when hand lost
      if (isDrawing) {
        handleAirDrawing(null, false);
        setIsDrawing(false);
      }
    }
  };

  // === Effect 4: Air Drawing ===
  const handleAirDrawing = (indexTip, isActive) => {
    if (!sceneRef.current) return;

    if (isActive && indexTip) {
      // Convert screen coords to 3D space
      const x = (indexTip.x - 0.5) * 40;
      const y = -(indexTip.y - 0.5) * 30;
      const z = (indexTip.z || 0) * 20;

      if (!currentLineRef.current) {
        // Start new line
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(1000 * 3);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setDrawRange(0, 0);

        const material = new THREE.LineBasicMaterial({
          color: particleColor,
          linewidth: 2
        });

        const line = new THREE.Line(geometry, material);
        line.userData.pointCount = 0;
        sceneRef.current.add(line);
        currentLineRef.current = line;
        drawingLinesRef.current.push(line);
      }

      // Add point to current line
      const line = currentLineRef.current;
      const positions = line.geometry.attributes.position.array;
      const count = line.userData.pointCount;

      if (count < 1000) {
        positions[count * 3] = x;
        positions[count * 3 + 1] = y;
        positions[count * 3 + 2] = z;
        line.userData.pointCount = count + 1;
        line.geometry.setDrawRange(0, count + 1);
        line.geometry.attributes.position.needsUpdate = true;
      }
    } else {
      // End current line
      currentLineRef.current = null;
    }
  };

  // === Effect 5: Gesture Summon ===
  const handleGestureSummon = (gesture, palmCenter) => {
    if (!sceneRef.current) return;

    const x = (palmCenter.x - 0.5) * 30;
    const y = -(palmCenter.y - 0.5) * 25;
    const z = 0;

    let object = null;

    if (gesture === 'ok') {
      // Spawn cube
      object = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff })
      );
    } else if (gesture === 'peace') {
      // Spawn star
      const starShape = new THREE.Shape();
      const outerRadius = 2, innerRadius = 1, points = 5;
      for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (i === 0) starShape.moveTo(px, py);
        else starShape.lineTo(px, py);
      }
      starShape.closePath();
      object = new THREE.Mesh(
        new THREE.ExtrudeGeometry(starShape, { depth: 0.5, bevelEnabled: false }),
        new THREE.MeshStandardMaterial({ color: 0xffd700 })
      );
    } else if (gesture === 'thumbsUp') {
      // Particle explosion - create many small spheres
      for (let i = 0; i < 20; i++) {
        const particle = new THREE.Mesh(
          new THREE.SphereGeometry(0.2),
          new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff })
        );
        particle.position.set(x, y, z);
        particle.userData.velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5
        );
        particle.userData.lifetime = 60;
        sceneRef.current.add(particle);
        summonedObjectsRef.current.push(particle);
      }
      return;
    } else if (gesture === 'fist') {
      // Clear all summoned objects
      summonedObjectsRef.current.forEach(obj => {
        sceneRef.current.remove(obj);
      });
      summonedObjectsRef.current = [];
      return;
    }

    if (object) {
      object.position.set(x, y, z);
      object.userData.velocity = new THREE.Vector3(0, 0, 0);
      object.userData.rotationSpeed = new THREE.Vector3(
        Math.random() * 0.02,
        Math.random() * 0.02,
        0
      );
      sceneRef.current.add(object);
      summonedObjectsRef.current.push(object);
    }
  };

  // === Effect 8: Update Hand Rig ===
  const updateHandRig = (hand) => {
    if (!handRigRef.current.joints) return;

    const { joints, bones } = handRigRef.current;

    // Update joint positions
    hand.forEach((landmark, i) => {
      if (joints[i]) {
        const x = (landmark.x - 0.5) * 30;
        const y = -(landmark.y - 0.5) * 25;
        const z = (landmark.z || 0) * 15;
        joints[i].position.set(x, y, z);
        joints[i].visible = true;
      }
    });

    // Update bone lines
    bones.forEach(bone => {
      const { start, end } = bone.userData;
      const startJoint = joints[start];
      const endJoint = joints[end];
      const positions = bone.geometry.attributes.position.array;
      positions[0] = startJoint.position.x;
      positions[1] = startJoint.position.y;
      positions[2] = startJoint.position.z;
      positions[3] = endJoint.position.x;
      positions[4] = endJoint.position.y;
      positions[5] = endJoint.position.z;
      bone.geometry.attributes.position.needsUpdate = true;
    });
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
  const animate = () => {
    try {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      timeRef.current += 0.016;
      const isEffectsMode = effectMode === 'effects';
      const isEarthMode = currentShapeRef.current === 'earth';

      // Hide all effects by default when in particles mode
      if (!isEffectsMode) {
        if (energyBallRef.current) energyBallRef.current.visible = false;
        if (magicCircleRef.current) magicCircleRef.current.visible = false;
        if (weaponRef.current) weaponRef.current.visible = false;
        if (handRigRef.current?.group) handRigRef.current.group.visible = false;
      }

      // === Effects Mode Animations ===
      if (isEffectsMode && isHandDetectedRef.current) {
        const palm = palmPositionRef.current;
        const x = (palm.x - 0.5) * 35;
        const y = -(palm.y - 0.5) * 28;
        const z = (palm.z || 0) * 15;
        const gesture = currentGestureRef.current;

        // Effect 1: Energy Ball
        if (activeEffectRef.current === 'energyBall' && energyBallRef.current) {
          energyBallRef.current.visible = true;
          energyBallRef.current.position.set(x, y, z);
          energyBallRef.current.material.uniforms.time.value = timeRef.current;
          const scale = 0.5 + handExpansionFactorRef.current * 0.5;
          energyBallRef.current.scale.set(scale, scale, scale);
        }

        // Effect 2: Magic Circle
        if (activeEffectRef.current === 'magicCircle' && magicCircleRef.current) {
          if (gesture === 'open') {
            magicCircleRef.current.visible = true;
            magicCircleRef.current.position.set(x, y, z - 2);
            magicCircleRef.current.rotation.z += 0.02;
            const scale = handExpansionFactorRef.current;
            magicCircleRef.current.scale.set(scale, scale, scale);
          } else if (gesture === 'fist') {
            magicCircleRef.current.visible = false;
          }
        }

        // Effect 3: Weapon
        if (activeEffectRef.current === 'weapon' && weaponRef.current) {
          weaponRef.current.visible = true;
          weaponRef.current.position.set(x, y, z);
          const orientation = getHandOrientation(results?.multiHandLandmarks?.[0] || []);
          if (orientation) {
            weaponRef.current.rotation.z = orientation.roll + Math.PI / 2;
          }
        }

        // Effect 6: Particle FX (using existing particle system)
        if (activeEffectRef.current === 'particleFx' && particlesRef.current) {
          particlesRef.current.visible = true;
          particlesRef.current.position.set(x * 0.3, y * 0.3, 0);
        }

        // Effect 8: Hand Rig
        if (activeEffectRef.current === 'handRig' && handRigRef.current?.group) {
          handRigRef.current.group.visible = true;
        }
      } else if (isEffectsMode) {
        // Effects mode but no hand detected - hide all effects
        if (energyBallRef.current) energyBallRef.current.visible = false;
        if (magicCircleRef.current) magicCircleRef.current.visible = false;
        if (weaponRef.current) weaponRef.current.visible = false;
        if (handRigRef.current?.group) {
          handRigRef.current.group.visible = false;
          handRigRef.current.joints.forEach(j => j.visible = false);
        }
      }

      // Update summoned objects (Effect 5)
      summonedObjectsRef.current.forEach((obj, index) => {
        if (obj.userData.velocity) {
          obj.position.add(obj.userData.velocity);
          if (obj.userData.lifetime !== undefined) {
            obj.userData.lifetime--;
            if (obj.userData.lifetime <= 0) {
              sceneRef.current.remove(obj);
              summonedObjectsRef.current.splice(index, 1);
            }
          }
        }
        if (obj.userData.rotationSpeed) {
          obj.rotation.x += obj.userData.rotationSpeed.x;
          obj.rotation.y += obj.userData.rotationSpeed.y;
        }
      });

      // === Original Particle Shape Mode ===
      if (!isEffectsMode) {
        if (earthRef.current) {
          earthRef.current.visible = isEarthMode;
          if (isEarthMode) {
            earthRef.current.rotation.y += 0.001;
            const targetRotX = handRotationRef.current.x;
            const targetRotY = handRotationRef.current.y;
            earthRef.current.rotation.x = THREE.MathUtils.lerp(earthRef.current.rotation.x, targetRotX, 0.1);
            earthRef.current.rotation.y += targetRotY * 0.05;
            const scale = THREE.MathUtils.lerp(earthRef.current.scale.x, handExpansionFactorRef.current, 0.1);
            earthRef.current.scale.set(scale, scale, scale);
          }
        }

        if (particlesRef.current) {
          particlesRef.current.visible = !isEarthMode;
          particlesRef.current.position.set(0, 0, 0);

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

  // === Effect Mode Handlers ===
  const handleEffectModeChange = (mode) => {
    setEffectMode(mode);
    // Reset visibility when switching modes
    if (mode === 'particles') {
      if (energyBallRef.current) energyBallRef.current.visible = false;
      if (magicCircleRef.current) magicCircleRef.current.visible = false;
      if (weaponRef.current) weaponRef.current.visible = false;
      if (handRigRef.current?.group) handRigRef.current.group.visible = false;
    }
  };

  const handleActiveEffectChange = (effect) => {
    setActiveEffect(effect);
    activeEffectRef.current = effect;
    // Hide all effects first
    if (energyBallRef.current) energyBallRef.current.visible = false;
    if (magicCircleRef.current) magicCircleRef.current.visible = false;
    if (weaponRef.current) weaponRef.current.visible = false;
    if (handRigRef.current?.group) {
      handRigRef.current.group.visible = false;
      handRigRef.current.joints.forEach(j => j.visible = false);
    }
  };

  const clearDrawings = () => {
    drawingLinesRef.current.forEach(line => {
      if (sceneRef.current) sceneRef.current.remove(line);
    });
    drawingLinesRef.current = [];
    currentLineRef.current = null;
  };

  const clearSummonedObjects = () => {
    summonedObjectsRef.current.forEach(obj => {
      if (sceneRef.current) sceneRef.current.remove(obj);
    });
    summonedObjectsRef.current = [];
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
      <div className="absolute top-6 left-6 z-20 w-80 bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header with Home Button */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Particle Shaper
            </h1>
            <p className="text-xs text-gray-400 mt-1">互動式 3D 手勢魔法系統</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="ml-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title="回到首頁"
          >
            <Home className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleEffectModeChange('particles')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${effectMode === 'particles'
              ? 'bg-blue-500/30 border border-blue-400/50 text-blue-300'
              : 'bg-white/5 border border-transparent text-gray-400 hover:bg-white/10'
              }`}
          >
            ✨ 粒子形狀
          </button>
          <button
            onClick={() => handleEffectModeChange('effects')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${effectMode === 'effects'
              ? 'bg-purple-500/30 border border-purple-400/50 text-purple-300'
              : 'bg-white/5 border border-transparent text-gray-400 hover:bg-white/10'
              }`}
          >
            🪄 魔法特效
          </button>
        </div>

        {/* Particles Mode Content */}
        {effectMode === 'particles' && (
          <>
            <div className="space-y-3 mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">形狀模板</p>
              <div className="grid grid-cols-2 gap-2">
                {shapes.map((shape) => (
                  <button
                    key={shape.id}
                    onClick={() => handleShapeChange(shape.id)}
                    className={`w-full py-2 px-3 rounded-lg text-sm border text-left flex items-center gap-2 transition-all ${currentShape === shape.id
                      ? 'bg-white/20 border-white/50'
                      : 'border-transparent hover:bg-white/10'
                      }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${shape.color}`}></span>
                    <span className="text-white">{shape.name}</span>
                  </button>
                ))}
              </div>
            </div>

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
          </>
        )}

        {/* Effects Mode Content */}
        {effectMode === 'effects' && (
          <>
            <div className="space-y-3 mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">選擇特效</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'energyBall', name: '能量球', icon: '🌟' },
                  { id: 'magicCircle', name: '魔法陣', icon: '🪄' },
                  { id: 'weapon', name: '武器', icon: '🗡️' },
                  { id: 'airDraw', name: '空中繪畫', icon: '🎨' },
                  { id: 'summon', name: '召喚物件', icon: '✨' },
                  { id: 'particleFx', name: '粒子特效', icon: '🔥' },
                  { id: 'ui3d', name: '3D UI', icon: '📐' },
                  { id: 'handRig', name: '手部驅動', icon: '🤚' },
                ].map((effect) => (
                  <button
                    key={effect.id}
                    onClick={() => handleActiveEffectChange(effect.id)}
                    className={`w-full py-2 px-3 rounded-lg text-sm border text-left flex items-center gap-2 transition-all ${activeEffect === effect.id
                      ? 'bg-purple-500/30 border-purple-400/50'
                      : 'border-transparent hover:bg-white/10'
                      }`}
                  >
                    <span>{effect.icon}</span>
                    <span className="text-white text-xs">{effect.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Effect-specific hints */}
            <div className="bg-white/5 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-400">
                {activeEffect === 'energyBall' && '🌟 能量球：張開或握拳控制大小'}
                {activeEffect === 'magicCircle' && '🪄 魔法陣：張開手掌顯示，握拳消失'}
                {activeEffect === 'weapon' && '🗡️ 武器：手持武器自動跟隨移動'}
                {activeEffect === 'airDraw' && '🎨 空中繪畫：伸出食指開始畫線'}
                {activeEffect === 'summon' && '✨ 召喚：OK=方塊 ✌️=星星 👍=爆炸 ✊=清除'}
                {activeEffect === 'particleFx' && '🔥 粒子：粒子跟隨手掌移動'}
                {activeEffect === 'ui3d' && '📐 3D UI：手勢控制虛擬介面（開發中）'}
                {activeEffect === 'handRig' && '🤚 手部驅動：即時同步手部骨架'}
              </p>
            </div>

            {/* Air Draw Clear Button */}
            {activeEffect === 'airDraw' && (
              <button
                onClick={clearDrawings}
                className="w-full py-2 px-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm hover:bg-red-500/30 transition-colors mb-4"
              >
                🗑️ 清除所有線條
              </button>
            )}

            {/* Summon Clear Button */}
            {activeEffect === 'summon' && (
              <button
                onClick={clearSummonedObjects}
                className="w-full py-2 px-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm hover:bg-red-500/30 transition-colors mb-4"
              >
                🗑️ 清除所有物件
              </button>
            )}

            {/* Current Gesture Display */}
            <div className="bg-white/5 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">當前手勢</span>
                <span className="text-white font-mono text-sm">
                  {currentGesture === 'open' && '✋ 張開'}
                  {currentGesture === 'fist' && '✊ 握拳'}
                  {currentGesture === 'ok' && '👌 OK'}
                  {currentGesture === 'peace' && '✌️ 和平'}
                  {currentGesture === 'thumbsUp' && '👍 讚'}
                  {currentGesture === 'pointing' && '👆 指向'}
                  {currentGesture === 'unknown' && '❓ 未知'}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Status */}
        <div className="pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">手勢追蹤</span>
            <span
              className={`w-2 h-2 rounded-full transition-all ${statusConnected
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
                : '等待手勢輸入...'}
          </p>
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
