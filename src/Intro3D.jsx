import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FastForward, Play, ShieldCheck, Sparkles } from 'lucide-react';

export default function Intro3D({ onComplete }) {
  const mountRef = useRef(null);
  const [fadingOut, setFadingOut] = useState(false);
  const [stepText, setStepText] = useState(0); // 0: initial, 1: title, 2: subtitle, 3: badges

  // Handle completion with smooth transition
  const handleFinish = () => {
    sessionStorage.setItem('ps001_intro_seen', 'true');
    setFadingOut(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 700);
  };

  useEffect(() => {
    // Check for reduced motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      handleFinish();
      return;
    }

    // WebGL support check
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        handleFinish();
        return;
      }
    } catch (e) {
      handleFinish();
      return;
    }

    // Keydown listener to skip on Escape
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.code === 'Space') {
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Timing triggers for typography reveals
    const timer1 = setTimeout(() => setStepText(1), 1200);
    const timer2 = setTimeout(() => setStepText(2), 2400);
    const timer3 = setTimeout(() => setStepText(3), 3600);
    const timerAuto = setTimeout(() => handleFinish(), 6200);

    // =========================================================================
    // Three.js Scene Setup
    // =========================================================================
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.035);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 1.5, 26);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x030712, 1);
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.5);
    scene.add(ambientLight);

    const blueLight = new THREE.PointLight(0x0070f3, 10, 40);
    blueLight.position.set(12, 8, 12);
    scene.add(blueLight);

    const cyanLight = new THREE.PointLight(0x00f2fe, 8, 40);
    cyanLight.position.set(-12, -6, 10);
    scene.add(cyanLight);

    const centralLight = new THREE.PointLight(0x38bdf8, 6, 25);
    centralLight.position.set(0, 0, 2);
    scene.add(centralLight);

    // =========================================================================
    // 1. Particle Generator for "PS-001" Metallic Logo Assembly
    // =========================================================================
    // Generate soft circular glow texture dynamically
    const createParticleTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.3, 'rgba(0, 200, 255, 0.8)');
      grad.addColorStop(0.8, 'rgba(0, 112, 243, 0.2)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(canvas);
    };

    const particleTexture = createParticleTexture();

    // Geometric point sampler for "PS-001"
    const targetPoints = [];
    const addLinePoints = (x1, y1, x2, y2, z, count) => {
      for (let i = 0; i <= count; i++) {
        const t = i / count;
        targetPoints.push(new THREE.Vector3(
          x1 + (x2 - x1) * t + (Math.random() - 0.5) * 0.15,
          y1 + (y2 - y1) * t + (Math.random() - 0.5) * 0.15,
          z + (Math.random() - 0.5) * 0.2
        ));
      }
    };

    const addArcPoints = (cx, cy, r, startA, endA, z, count) => {
      for (let i = 0; i <= count; i++) {
        const a = startA + (endA - startA) * (i / count);
        targetPoints.push(new THREE.Vector3(
          cx + Math.cos(a) * r + (Math.random() - 0.5) * 0.15,
          cy + Math.sin(a) * r + (Math.random() - 0.5) * 0.15,
          z + (Math.random() - 0.5) * 0.2
        ));
      }
    };

    // Draw 'P'
    addLinePoints(-7.5, -2, -7.5, 2.5, 0, 60);
    addLinePoints(-7.5, 2.5, -5.8, 2.5, 0, 30);
    addLinePoints(-7.5, 0.5, -5.8, 0.5, 0, 30);
    addArcPoints(-5.8, 1.5, 1.0, -Math.PI / 2, Math.PI / 2, 0, 50);

    // Draw 'S'
    addArcPoints(-3.2, 1.4, 1.1, Math.PI * 0.2, Math.PI * 1.5, 0, 60);
    addArcPoints(-3.2, -0.6, 1.1, -Math.PI * 0.8, Math.PI * 0.5, 0, 60);

    // Draw '-'
    addLinePoints(-1.2, 0.4, -0.2, 0.4, 0, 25);

    // Draw first '0'
    addArcPoints(1.5, 0.4, 1.3, 0, Math.PI * 2, 0, 80);
    addLinePoints(1.5, -1.2, 1.5, 2.0, 0, 30);

    // Draw second '0'
    addArcPoints(4.5, 0.4, 1.3, 0, Math.PI * 2, 0, 80);
    addLinePoints(4.5, -1.2, 4.5, 2.0, 0, 30);

    // Draw '1'
    addLinePoints(7.5, -1.8, 7.5, 2.5, 0, 60);
    addLinePoints(6.5, 1.7, 7.5, 2.5, 0, 25);
    addLinePoints(6.5, -1.8, 8.5, -1.8, 0, 30);

    // Total particle count
    const particleCount = targetPoints.length + 800; // Extra ambient star dust
    const positions = new Float32Array(particleCount * 3);
    const origins = new Float32Array(particleCount * 3);
    const targets = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const cBlue = new THREE.Color(0x0070f3);
    const cCyan = new THREE.Color(0x38bdf8);
    const cWhite = new THREE.Color(0xffffff);

    for (let i = 0; i < particleCount; i++) {
      // Starting random dispersed nebula cloud
      const rTheta = Math.random() * Math.PI * 2;
      const rPhi = Math.acos(Math.random() * 2 - 1);
      const rRadius = 14 + Math.random() * 20;

      const ox = rRadius * Math.sin(rPhi) * Math.cos(rTheta);
      const oy = rRadius * Math.sin(rPhi) * Math.sin(rTheta);
      const oz = rRadius * Math.cos(rPhi);

      origins[i * 3] = ox;
      origins[i * 3 + 1] = oy;
      origins[i * 3 + 2] = oz;

      positions[i * 3] = ox;
      positions[i * 3 + 1] = oy;
      positions[i * 3 + 2] = oz;

      // Target position
      if (i < targetPoints.length) {
        targets[i * 3] = targetPoints[i].x;
        targets[i * 3 + 1] = targetPoints[i].y;
        targets[i * 3 + 2] = targetPoints[i].z;

        const mixColor = Math.random() > 0.6 ? cCyan : (Math.random() > 0.3 ? cBlue : cWhite);
        colors[i * 3] = mixColor.r;
        colors[i * 3 + 1] = mixColor.g;
        colors[i * 3 + 2] = mixColor.b;
      } else {
        // Floating ambient particles around the scene
        targets[i * 3] = (Math.random() - 0.5) * 32;
        targets[i * 3 + 1] = (Math.random() - 0.5) * 18;
        targets[i * 3 + 2] = (Math.random() - 0.5) * 16;

        colors[i * 3] = cBlue.r * 0.6;
        colors[i * 3 + 1] = cBlue.g * 0.6;
        colors[i * 3 + 2] = cBlue.b * 0.6;
      }
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.35,
      map: particleTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // =========================================================================
    // 2. Holographic AI Core & Agent Nodes
    // =========================================================================
    const coreGroup = new THREE.Group();
    coreGroup.position.set(0, 0.4, -3);

    // Inner glowing sphere
    const innerCoreGeo = new THREE.SphereGeometry(1.4, 32, 32);
    const innerCoreMat = new THREE.MeshBasicMaterial({
      color: 0x00d2ff,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const innerCore = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    coreGroup.add(innerCore);

    // Outer wireframe icosahedron
    const outerCoreGeo = new THREE.IcosahedronGeometry(2.3, 1);
    const outerCoreMat = new THREE.MeshBasicMaterial({
      color: 0x0070f3,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const outerCore = new THREE.Mesh(outerCoreGeo, outerCoreMat);
    coreGroup.add(outerCore);

    scene.add(coreGroup);

    // Surrounding Agent Nodes
    const nodeCoords = [
      { name: 'Planner', pos: new THREE.Vector3(-8.5, 3.5, -2), color: 0x38bdf8 },
      { name: 'Developer', pos: new THREE.Vector3(8.5, 3.5, -2), color: 0x818cf8 },
      { name: 'Reviewer', pos: new THREE.Vector3(-7.5, -4.0, -2), color: 0x34d399 },
      { name: 'Tester', pos: new THREE.Vector3(7.5, -4.0, -2), color: 0xfbbf24 },
    ];

    const nodeMeshes = [];
    const curveStreams = [];

    nodeCoords.forEach((node) => {
      const nodeGeo = new THREE.SphereGeometry(0.5, 16, 16);
      const nodeMat = new THREE.MeshBasicMaterial({
        color: node.color,
        wireframe: true,
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.copy(node.pos);
      scene.add(nodeMesh);
      nodeMeshes.push(nodeMesh);

      // Light beam curve from AI core to node
      const curve = new THREE.QuadraticBezierCurve3(
        coreGroup.position,
        new THREE.Vector3((node.pos.x) * 0.5, node.pos.y + 1, -2.5),
        node.pos
      );
      curveStreams.push(curve);

      const curvePoints = curve.getPoints(30);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const lineMat = new THREE.LineBasicMaterial({
        color: node.color,
        transparent: true,
        opacity: 0.2,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);
    });

    // =========================================================================
    // 3. Subtle Floor Grid
    // =========================================================================
    const gridHelper = new THREE.GridHelper(50, 40, 0x1e293b, 0x0a101f);
    gridHelper.position.y = -6;
    scene.add(gridHelper);

    // =========================================================================
    // Animation Loop
    // =========================================================================
    let startTime = performance.now();
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsed = (performance.now() - startTime) / 1000;

      // Eased assembly progress (0 -> 1 over 2.8s)
      const t = Math.min(1.0, elapsed / 2.8);
      const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      // Interpolate particle positions
      const posAttr = particleGeometry.attributes.position;
      const posArray = posAttr.array;

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const ox = origins[idx];
        const oy = origins[idx + 1];
        const oz = origins[idx + 2];

        const tx = targets[idx];
        const ty = targets[idx + 1];
        const tz = targets[idx + 2];

        // Assembly + subtle floating motion
        const floatX = Math.sin(elapsed * 1.5 + i) * 0.04 * (1 - easeT * 0.7);
        const floatY = Math.cos(elapsed * 1.8 + i) * 0.04 * (1 - easeT * 0.7);

        posArray[idx] = ox + (tx - ox) * easeT + floatX;
        posArray[idx + 1] = oy + (ty - oy) * easeT + floatY;
        posArray[idx + 2] = oz + (tz - oz) * easeT;
      }
      posAttr.needsUpdate = true;

      // Rotate AI core
      innerCore.rotation.y = elapsed * 0.6;
      innerCore.rotation.x = elapsed * 0.3;
      outerCore.rotation.y = -elapsed * 0.4;
      outerCore.rotation.z = elapsed * 0.2;

      // Core pulse
      const corePulse = 1 + Math.sin(elapsed * 4) * 0.06;
      coreGroup.scale.set(corePulse, corePulse, corePulse);

      // Rotate node rings
      nodeMeshes.forEach((mesh, index) => {
        mesh.rotation.y = elapsed * 1.2 + index;
        mesh.rotation.x = elapsed * 0.8;
      });

      // Camera dolly-in movement
      camera.position.z = 26 - Math.min(8.5, elapsed * 1.5);
      camera.position.x = Math.sin(elapsed * 0.25) * 1.2;
      camera.lookAt(0, 0.2, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timerAuto);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#030712',
        opacity: fadingOut ? 0 : 1,
        transition: 'opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: fadingOut ? 'none' : 'auto',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* 3D Canvas Mounting Container */}
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* Skip Intro Button */}
      <button
        onClick={handleFinish}
        style={{
          position: 'absolute',
          top: '24px',
          right: '28px',
          zIndex: 10001,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'rgba(15, 23, 42, 0.65)',
          color: '#94a3b8',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '9999px',
          backdropFilter: 'blur(12px)',
          fontSize: '0.82rem',
          fontWeight: '500',
          cursor: 'pointer',
          letterSpacing: '0.04em',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#ffffff';
          e.currentTarget.style.borderColor = '#0070f3';
          e.currentTarget.style.backgroundColor = 'rgba(0, 112, 243, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#94a3b8';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
          e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.65)';
        }}
      >
        <span>Skip intro</span>
        <FastForward size={14} />
      </button>

      {/* Typography Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: '12%',
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          pointerEvents: 'none',
          padding: '0 20px',
        }}
      >
        {/* Title */}
        <h1
          style={{
            margin: '0 0 10px 0',
            fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
            fontWeight: 800,
            letterSpacing: '0.12em',
            background: 'linear-gradient(135deg, #ffffff 30%, #38bdf8 70%, #0070f3 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 30px rgba(0, 112, 243, 0.45)',
            opacity: stepText >= 1 ? 1 : 0,
            transform: stepText >= 1 ? 'translateY(0)' : 'translateY(18px)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          PS-001
        </h1>

        {/* Subtitle */}
        <p
          style={{
            margin: '0 0 20px 0',
            fontSize: 'clamp(1.0rem, 2.2vw, 1.35rem)',
            fontWeight: 400,
            color: '#94a3b8',
            letterSpacing: '0.04em',
            fontStyle: 'italic',
            opacity: stepText >= 2 ? 1 : 0,
            transform: stepText >= 2 ? 'translateY(0)' : 'translateY(14px)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          Your Autonomous AI Software Development Team
        </p>

        {/* Agent workflow badges */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            opacity: stepText >= 3 ? 1 : 0,
            transform: stepText >= 3 ? 'translateY(0)' : 'translateY(12px)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {['Plan', 'Code', 'Test', 'Review'].map((step, idx) => (
            <span
              key={step}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                background: 'rgba(15, 23, 42, 0.75)',
                color: idx === 0 ? '#38bdf8' : idx === 1 ? '#818cf8' : idx === 2 ? '#fbbf24' : '#34d399',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'currentColor',
                }}
              />
              {step}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

