'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { TreeSpeciesId } from '@/domain/types';
import {
  buildProceduralTreeGroup,
  getGrowthStageFromProgress,
} from './treeGenerator';
import { TREE_SPECIES_CATALOG } from '@/domain/catalog';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface ProceduralTreeCanvasProps {
  speciesId: TreeSpeciesId;
  progress: number; // 0.0 to 1.0
  isPaused?: boolean;
  animationsEnabled?: boolean;
  darkMode?: boolean;
  heightClass?: string;
}

export default function ProceduralTreeCanvas({
  speciesId,
  progress,
  isPaused = false,
  animationsEnabled = true,
  darkMode = false,
  heightClass = 'h-[380px] sm:h-[440px]',
}: ProceduralTreeCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  // Camera spherical coordinates for smooth user orbit
  const cameraControlRef = useRef({
    theta: 0.45,
    phi: 1.18,
    radius: 5.2,
    isDragging: false,
    lastX: 0,
    lastY: 0,
  });

  const sceneRefs = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    treeContainer: THREE.Group;
    swayTargets: THREE.Object3D[];
    particles: THREE.Points | null;
  } | null>(null);

  const isPausedRef = useRef(isPaused);
  const animationsRef = useRef(animationsEnabled);
  useEffect(() => {
    isPausedRef.current = isPaused;
    animationsRef.current = animationsEnabled;
  }, [isPaused, animationsEnabled]);

  // Initialize Three.js WebGL scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglSupported(false);
      return;
    }

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);

    // Ambient + Hemisphere + Directional Sun Light
    const hemiLight = new THREE.HemisphereLight(
      darkMode ? '#92C5E8' : '#FFFDF5',
      darkMode ? '#14251B' : '#4A6B49',
      darkMode ? 0.85 : 1.15
    );
    hemiLight.position.set(0, 12, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(
      darkMode ? '#CFE8FF' : '#FFF4D6',
      darkMode ? 1.35 : 1.85
    );
    dirLight.position.set(5, 9, 6);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight('#A9C7A4', 0.55);
    rimLight.position.set(-5, 4, -5);
    scene.add(rimLight);

    // Atmospheric Floating Botanical Pollen / Spores
    const particleCount = 45;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 5.5;
      positions[i * 3 + 1] = Math.random() * 4.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5.5;
    }
    const partGeo = new THREE.BufferGeometry();
    partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const partMat = new THREE.PointsMaterial({
      color: '#D6B56D',
      size: 0.065,
      transparent: true,
      opacity: 0.75,
    });
    const particles = new THREE.Points(partGeo, partMat);
    scene.add(particles);

    const treeContainer = new THREE.Group();
    treeContainer.position.y = -1.05;
    scene.add(treeContainer);

    sceneRefs.current = {
      scene,
      camera,
      renderer,
      treeContainer,
      swayTargets: [],
      particles,
    };

    // Initial Procedural Tree Build
    const built = buildProceduralTreeGroup({
      speciesId,
      progress,
      seedVariation: 0.37,
      includeSoilMound: true,
    });
    treeContainer.add(built.rootGroup);
    sceneRefs.current.swayTargets = built.swayTargets;

    // Animation loop
    let animFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Update camera from spherical coords
      const ctrl = cameraControlRef.current;
      if (!ctrl.isDragging && animationsRef.current && !isPausedRef.current) {
        ctrl.theta += 0.0022; // gentle turntable rotation
      }
      const lookY = 0.25;
      camera.position.x =
        ctrl.radius * Math.sin(ctrl.phi) * Math.sin(ctrl.theta);
      camera.position.y = lookY + ctrl.radius * Math.cos(ctrl.phi);
      camera.position.z =
        ctrl.radius * Math.sin(ctrl.phi) * Math.cos(ctrl.theta);
      camera.lookAt(0, lookY, 0);

      // Gentle procedural wind sway on tree branches/canopy
      if (animationsRef.current && !isPausedRef.current && sceneRefs.current) {
        sceneRefs.current.swayTargets.forEach((obj, idx) => {
          obj.rotation.z = Math.sin(elapsed * 1.6 + idx * 0.7) * 0.025;
          obj.rotation.x = Math.cos(elapsed * 1.3 + idx * 0.5) * 0.018;
        });

        if (sceneRefs.current.particles) {
          sceneRefs.current.particles.rotation.y = elapsed * 0.08;
          sceneRefs.current.particles.position.y =
            Math.sin(elapsed * 0.9) * 0.12;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize observer
    const handleResize = () => {
      if (!container || !sceneRefs.current) return;
      const w = container.clientWidth || 400;
      const h = container.clientHeight || 400;
      sceneRefs.current.camera.aspect = w / h;
      sceneRefs.current.camera.updateProjectionMatrix();
      sceneRefs.current.renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [darkMode]);

  // Rebuild procedural tree geometry whenever `speciesId` or `progress` changes
  useEffect(() => {
    if (!sceneRefs.current) return;
    const { treeContainer } = sceneRefs.current;

    // Dispose old meshes cleanly
    while (treeContainer.children.length > 0) {
      const child = treeContainer.children[0];
      treeContainer.remove(child);
    }

    const built = buildProceduralTreeGroup({
      speciesId,
      progress,
      seedVariation: 0.37,
      includeSoilMound: true,
    });
    treeContainer.add(built.rootGroup);
    sceneRefs.current.swayTargets = built.swayTargets;
  }, [speciesId, progress]);

  // Pointer Orbit Handlers
  const onPointerDown = (e: React.PointerEvent) => {
    cameraControlRef.current.isDragging = true;
    cameraControlRef.current.lastX = e.clientX;
    cameraControlRef.current.lastY = e.clientY;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!cameraControlRef.current.isDragging) return;
    const dx = e.clientX - cameraControlRef.current.lastX;
    const dy = e.clientY - cameraControlRef.current.lastY;
    cameraControlRef.current.lastX = e.clientX;
    cameraControlRef.current.lastY = e.clientY;
    cameraControlRef.current.theta -= dx * 0.008;
    cameraControlRef.current.phi = Math.max(
      0.55,
      Math.min(1.48, cameraControlRef.current.phi - dy * 0.006)
    );
  };
  const onPointerUp = () => {
    cameraControlRef.current.isDragging = false;
  };

  const handleZoom = (delta: number) => {
    cameraControlRef.current.radius = Math.max(
      3.1,
      Math.min(7.8, cameraControlRef.current.radius + delta)
    );
  };
  const handleResetCamera = () => {
    cameraControlRef.current.theta = 0.45;
    cameraControlRef.current.phi = 1.18;
    cameraControlRef.current.radius = 5.2;
  };

  const speciesMeta =
    TREE_SPECIES_CATALOG.find((s) => s.id === speciesId) ||
    TREE_SPECIES_CATALOG[0];
  const stage = getGrowthStageFromProgress(progress);
  const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100);

  if (!webglSupported) {
    // Graceful interactive SVG fallback when WebGL is disabled
    return (
      <div
        className={`relative w-full ${heightClass} rounded-2xl overflow-hidden flex flex-col items-center justify-center bg-gradient-to-b from-[#234B35]/20 to-[#14251B]/40 border border-[#3D7950]/30 p-6`}
      >
        <svg viewBox="0 0 240 240" className="w-56 h-56">
          <ellipse cx="120" cy="200" rx="75" ry="18" fill="#4A3525" />
          {progress >= 0.1 && (
            <path
              d="M120 200 L95 220 M120 200 L145 220 M120 200 L120 225"
              stroke={speciesMeta.trunkColor}
              strokeWidth="3"
            />
          )}
          {progress < 0.35 && (
            <circle cx="120" cy="195" r="8" fill="#D6B56D" />
          )}
          {progress >= 0.2 && (
            <rect
              x={120 - 6 * progress}
              y={200 - 110 * progress}
              width={12 * progress}
              height={110 * progress}
              rx="4"
              fill={speciesMeta.trunkColor}
            />
          )}
          {progress >= 0.38 && (
            <>
              <circle
                cx="120"
                cy={200 - 115 * progress}
                r={42 * progress}
                fill={speciesMeta.leafPrimaryColor}
              />
              <circle
                cx={120 - 25 * progress}
                cy={200 - 95 * progress}
                r={30 * progress}
                fill={speciesMeta.leafSecondaryColor}
              />
              <circle
                cx={120 + 25 * progress}
                cy={200 - 95 * progress}
                r={30 * progress}
                fill={speciesMeta.leafSecondaryColor}
              />
            </>
          )}
        </svg>
        <p className="text-xs opacity-75 mt-2">
          {speciesMeta.scientificName} • {pct}% ({stage.toUpperCase()})
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full ${heightClass} rounded-2xl overflow-hidden select-none cursor-grab active:cursor-grabbing border border-[#3D7950]/25 bg-gradient-to-b ${
        darkMode
          ? 'from-[#102017] via-[#172D20] to-[#1D3828]'
          : 'from-[#DFEFE2] via-[#EAF4EC] to-[#F5F9F3]'
      }`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* 3D WebGL Mount Container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Top Overlay Badge: Growth Progress & Stage */}
      <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
        <div className="px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md bg-[#14251B]/75 text-[#FAF8EF] border border-[#A9C7A4]/30 flex items-center gap-2 shadow-sm">
          <span
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: speciesMeta.leafPrimaryColor }}
          />
          <span>{speciesMeta.scientificName}</span>
          <span className="text-[#D6B56D] font-mono">{pct}%</span>
        </div>

        {/* Camera Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={() => handleZoom(-0.55)}
            title="Zoom In"
            className="p-2 rounded-lg backdrop-blur-md bg-[#14251B]/70 text-[#FAF8EF] hover:bg-[#234B35] transition-colors border border-[#A9C7A4]/25"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(0.55)}
            title="Zoom Out"
            className="p-2 rounded-lg backdrop-blur-md bg-[#14251B]/70 text-[#FAF8EF] hover:bg-[#234B35] transition-colors border border-[#A9C7A4]/25"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetCamera}
            title="Reset 3D View"
            className="p-2 rounded-lg backdrop-blur-md bg-[#14251B]/70 text-[#FAF8EF] hover:bg-[#234B35] transition-colors border border-[#A9C7A4]/25"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom 6-Stage Continuous Growth Progress Bar Indicator */}
      <div className="absolute bottom-3 inset-x-3 pointer-events-none">
        <div className="px-3 py-2 rounded-xl backdrop-blur-md bg-[#14251B]/75 text-[#FAF8EF] border border-[#A9C7A4]/25">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            {(['seed', 'roots', 'sprout', 'sapling', 'young', 'mature'] as const).map(
              (st, idx) => {
                const isActive = stage === st;
                return (
                  <span
                    key={st}
                    className={`uppercase tracking-wider transition-all ${
                      isActive
                        ? 'text-[#D6B56D] font-bold scale-105'
                        : 'text-[#A9C7A4]/65'
                    }`}
                  >
                    {idx + 1}.{st}
                  </span>
                );
              }
            )}
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #3D7950 0%, #A9C7A4 55%, #D6B56D 100%)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
