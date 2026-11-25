'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  DecorationId,
  ForestEnvId,
  ForestSizeId,
  PlantedTreeRecord,
} from '@/domain/types';
import {
  FOREST_ENVIRONMENTS_CATALOG,
  FOREST_SIZES_CATALOG,
} from '@/domain/catalog';
import { buildProceduralTreeGroup } from './treeGenerator';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface PersonalForestCanvasProps {
  forestSizeId: ForestSizeId;
  environmentId: ForestEnvId;
  trees: PlantedTreeRecord[];
  decorations: DecorationId[];
  selectedTreeId: string | null;
  onSelectTree?: (treeId: string) => void;
  wildlifeEnabled?: boolean;
  animationsEnabled?: boolean;
  heightClass?: string;
}

function build3DDecoration(decId: DecorationId): THREE.Group {
  const group = new THREE.Group();
  if (decId === 'stone_lantern') {
    const stoneMat = new THREE.MeshStandardMaterial({ color: '#8A8D8F', roughness: 0.85 });
    const glowMat = new THREE.MeshStandardMaterial({
      color: '#FFE082',
      emissive: '#F5B041',
      emissiveIntensity: 0.85,
    });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.18, 6), stoneMat);
    base.position.y = 0.09;
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.45, 6), stoneMat);
    pillar.position.y = 0.38;
    const lightBox = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), glowMat);
    lightBox.position.y = 0.72;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.22, 6), stoneMat);
    roof.position.y = 0.94;
    group.add(base, pillar, lightBox, roof);
  } else if (decId === 'wooden_bench') {
    const woodMat = new THREE.MeshStandardMaterial({ color: '#7D4E38', roughness: 0.8 });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.08, 0.38), woodMat);
    seat.position.y = 0.32;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.32, 0.06), woodMat);
    back.position.set(0, 0.5, -0.16);
    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.34), woodMat);
    leg1.position.set(-0.38, 0.16, 0);
    const leg2 = leg1.clone();
    leg2.position.set(0.38, 0.16, 0);
    group.add(seat, back, leg1, leg2);
  } else if (decId === 'campfire') {
    const stoneMat = new THREE.MeshStandardMaterial({ color: '#6E7275', roughness: 0.9 });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11, 0), stoneMat);
      rock.position.set(Math.cos(a) * 0.32, 0.08, Math.sin(a) * 0.32);
      group.add(rock);
    }
    const flameMat = new THREE.MeshStandardMaterial({
      color: '#FF7043',
      emissive: '#FF5722',
      emissiveIntensity: 0.9,
    });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.52, 7), flameMat);
    flame.position.y = 0.28;
    group.add(flame);
  } else if (decId === 'torii_gate') {
    const redMat = new THREE.MeshStandardMaterial({ color: '#C83E2B', roughness: 0.65 });
    const darkMat = new THREE.MeshStandardMaterial({ color: '#222021', roughness: 0.8 });
    const leftPost = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.45, 10), redMat);
    leftPost.position.set(-0.55, 0.72, 0);
    const rightPost = leftPost.clone();
    rightPost.position.set(0.55, 0.72, 0);
    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.12, 0.18), darkMat);
    topBeam.position.set(0, 1.42, 0);
    const subBeam = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.09, 0.12), redMat);
    subBeam.position.set(0, 1.15, 0);
    group.add(leftPost, rightPost, topBeam, subBeam);
  } else if (decId === 'crystal_obelisk') {
    const cryMat = new THREE.MeshStandardMaterial({
      color: '#48C9B0',
      emissive: '#1D836F',
      emissiveIntensity: 0.65,
      roughness: 0.2,
    });
    const obelisk = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), cryMat);
    obelisk.scale.set(0.7, 2.2, 0.7);
    obelisk.position.y = 0.85;
    group.add(obelisk);
  } else {
    // Birdhouse / Flower arch / Koi pond generic sculptural ornament
    const mat = new THREE.MeshStandardMaterial({ color: '#D6B56D', roughness: 0.5 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.9, 8), mat);
    post.position.y = 0.45;
    const house = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), mat);
    house.position.y = 0.95;
    group.add(post, house);
  }
  return group;
}

export default function PersonalForestCanvas({
  forestSizeId,
  environmentId,
  trees,
  decorations,
  selectedTreeId,
  onSelectTree,
  wildlifeEnabled = true,
  animationsEnabled = true,
  heightClass = 'h-[440px] sm:h-[520px]',
}: PersonalForestCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglOk, setWebglOk] = useState(true);

  const sizeMeta =
    FOREST_SIZES_CATALOG.find((f) => f.id === forestSizeId) ||
    FOREST_SIZES_CATALOG[0];
  const envMeta =
    FOREST_ENVIRONMENTS_CATALOG.find((e) => e.id === environmentId) ||
    FOREST_ENVIRONMENTS_CATALOG[0];

  const camRef = useRef({
    theta: 0.62,
    phi: 1.05,
    radius: Math.max(12, sizeMeta.terrainRadius * 1.15),
    isDragging: false,
    dragDistance: 0,
    lastX: 0,
    lastY: 0,
  });

  useEffect(() => {
    camRef.current.radius = Math.max(12, sizeMeta.terrainRadius * 1.15);
  }, [sizeMeta.terrainRadius]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setWebglOk(false);
      return;
    }

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 460;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(envMeta.fogColor, 0.015);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 200);

    // Lighting tailored to active biome
    const isNight = environmentId === 'mystical_forest';
    const hemi = new THREE.HemisphereLight(
      envMeta.skyTopColor,
      envMeta.groundColor,
      isNight ? 0.75 : 1.15
    );
    hemi.position.set(0, 25, 0);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(
      isNight ? '#9AD6FF' : '#FFF6E0',
      isNight ? 1.1 : 1.75
    );
    sun.position.set(14, 24, 14);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    scene.add(sun);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // 1. Floating Sanctuary Island Terrain
    const radius = sizeMeta.terrainRadius;
    const topGeo = new THREE.CylinderGeometry(radius, radius * 0.94, 0.9, 36);
    const topMat = new THREE.MeshStandardMaterial({
      color: envMeta.groundColor,
      roughness: 0.88,
    });
    const topMesh = new THREE.Mesh(topGeo, topMat);
    topMesh.position.y = -0.45;
    topMesh.receiveShadow = true;
    worldGroup.add(topMesh);

    const cliffGeo = new THREE.ConeGeometry(radius * 0.94, radius * 0.55, 18);
    cliffGeo.rotateX(Math.PI);
    const cliffMat = new THREE.MeshStandardMaterial({
      color: '#4B3D30',
      roughness: 0.95,
    });
    const cliffMesh = new THREE.Mesh(cliffGeo, cliffMat);
    cliffMesh.position.y = -0.9 - (radius * 0.55) / 2;
    worldGroup.add(cliffMesh);

    // Tranquil Water Stream / Pond near edge of sanctuary
    const pondGeo = new THREE.CylinderGeometry(radius * 0.24, radius * 0.24, 0.08, 24);
    const pondMat = new THREE.MeshStandardMaterial({
      color: envMeta.waterColor,
      roughness: 0.2,
      metalness: 0.25,
    });
    const pondMesh = new THREE.Mesh(pondGeo, pondMat);
    pondMesh.position.set(radius * 0.52, 0.02, radius * 0.42);
    worldGroup.add(pondMesh);

    // Natural boulders, flowers & mushrooms around perimeter
    const rockMat = new THREE.MeshStandardMaterial({
      color: envMeta.secondaryGroundColor,
      roughness: 0.85,
    });
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const rDist = radius * (0.78 + (i % 3) * 0.06);
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.32 + (i % 3) * 0.14, 0),
        rockMat
      );
      rock.position.set(Math.cos(angle) * rDist, 0.18, Math.sin(angle) * rDist);
      rock.scale.y = 0.65;
      rock.castShadow = true;
      worldGroup.add(rock);
    }

    // 2. Grid Slot Coordinates Calculation
    const cols = sizeMeta.gridCols;
    const rows = sizeMeta.gridRows;
    const usableSpan = radius * 1.22;
    const stepX = cols > 1 ? usableSpan / (cols - 1) : 0;
    const stepZ = rows > 1 ? usableSpan / (rows - 1) : 0;

    const getSlotPosition = (slotIdx: number): { x: number; z: number } => {
      const c = slotIdx % cols;
      const r = Math.floor(slotIdx / cols) % rows;
      // Slight organic offset so the forest feels natural rather than rigid
      const jitterX = Math.sin(slotIdx * 7.3) * 0.32;
      const jitterZ = Math.cos(slotIdx * 5.1) * 0.32;
      return {
        x: -usableSpan / 2 + c * stepX + jitterX,
        z: -usableSpan / 2 + r * stepZ + jitterZ,
      };
    };

    // Subtle ground markers for empty slots
    const slotMarkerGeo = new THREE.RingGeometry(0.28, 0.36, 16);
    const slotMarkerMat = new THREE.MeshBasicMaterial({
      color: '#FFFFFF',
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
    });
    const occupiedSlots = new Set(trees.map((t) => t.slotIndex));
    for (let idx = 0; idx < sizeMeta.capacity; idx++) {
      if (!occupiedSlots.has(idx)) {
        const pos = getSlotPosition(idx);
        const marker = new THREE.Mesh(slotMarkerGeo, slotMarkerMat);
        marker.rotation.x = -Math.PI / 2;
        marker.position.set(pos.x, 0.02, pos.z);
        worldGroup.add(marker);
      }
    }

    // 3. Place Cultivated 3D Trees
    const clickableMeshes: { mesh: THREE.Object3D; treeId: string }[] = [];
    const swayTargets: THREE.Object3D[] = [];

    trees.slice(0, sizeMeta.capacity).forEach((tree, index) => {
      const slotIdx =
        typeof tree.slotIndex === 'number' && tree.slotIndex >= 0
          ? tree.slotIndex % sizeMeta.capacity
          : index;
      const pos = getSlotPosition(slotIdx);

      const built = buildProceduralTreeGroup({
        speciesId: tree.speciesId,
        progress: 1.0, // Completed trees in personal forest are mature
        seedVariation: tree.seedVariation || (index + 1) * 0.17,
        includeSoilMound: false,
        isSelected: tree.id === selectedTreeId,
      });

      built.rootGroup.position.set(pos.x, 0, pos.z);
      built.rootGroup.userData = { treeId: tree.id };
      worldGroup.add(built.rootGroup);
      swayTargets.push(...built.swayTargets);

      // Register bounding hit cylinder for easy click selection
      const hitGeo = new THREE.CylinderGeometry(0.95, 0.95, 3.2, 8);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.set(pos.x, 1.5, pos.z);
      hitMesh.userData = { treeId: tree.id };
      worldGroup.add(hitMesh);
      clickableMeshes.push({ mesh: hitMesh, treeId: tree.id });
    });

    // 4. Place Owned 3D Decorations around the sanctuary
    decorations.forEach((decId, idx) => {
      const angle = (idx / Math.max(1, decorations.length)) * Math.PI * 2 + 0.4;
      const dist = radius * 0.62;
      const decGroup = build3DDecoration(decId);
      decGroup.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
      decGroup.rotation.y = -angle;
      worldGroup.add(decGroup);
    });

    // 5. Animated Wildlife (Birds & Butterflies orbiting the canopy)
    const wildlifeGroup = new THREE.Group();
    if (wildlifeEnabled) {
      const birdMat = new THREE.MeshStandardMaterial({ color: '#FAF8EF', roughness: 0.5 });
      const butterflyMat = new THREE.MeshStandardMaterial({
        color: '#D6B56D',
        emissive: '#D6B56D',
        emissiveIntensity: 0.3,
      });

      for (let b = 0; b < 5; b++) {
        const bird = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.42, 4), birdMat);
        bird.rotation.z = Math.PI / 2;
        bird.userData = {
          orbitRadius: radius * (0.35 + (b % 3) * 0.18),
          speed: 0.45 + b * 0.12,
          phase: b * 1.3,
          yBase: 3.4 + (b % 2) * 1.1,
        };
        wildlifeGroup.add(bird);
      }

      for (let f = 0; f < 6; f++) {
        const bfly = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), butterflyMat);
        bfly.userData = {
          orbitRadius: radius * (0.2 + (f % 4) * 0.15),
          speed: 0.8 + f * 0.1,
          phase: f * 0.9,
          yBase: 1.2 + (f % 3) * 0.5,
        };
        wildlifeGroup.add(bfly);
      }
      worldGroup.add(wildlifeGroup);
    }

    // 6. Weather Atmosphere Particles (Petals, Snow, Rain, Fireflies, Sunbeams)
    const pCount = 75;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * radius * 1.8;
      pPos[i * 3 + 1] = Math.random() * 7;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * radius * 1.8;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pColor =
      envMeta.weatherEffect === 'petals'
        ? '#FFB7C5'
        : envMeta.weatherEffect === 'snow'
          ? '#FFFFFF'
          : envMeta.weatherEffect === 'rain'
            ? '#90CAF9'
            : '#D6B56D';
    const pMat = new THREE.PointsMaterial({
      color: pColor,
      size: envMeta.weatherEffect === 'snow' ? 0.14 : 0.11,
      transparent: true,
      opacity: 0.8,
    });
    const weatherPoints = new THREE.Points(pGeo, pMat);
    scene.add(weatherPoints);

    // Raycaster for clicking on 3D trees
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (ev: MouseEvent) => {
      if (camRef.current.dragDistance > 6) return; // Ignore drag release
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(
        clickableMeshes.map((c) => c.mesh),
        false
      );
      if (hits.length > 0 && onSelectTree) {
        const hitTreeId = hits[0].object.userData?.treeId;
        if (hitTreeId) {
          onSelectTree(hitTreeId);
        }
      }
    };
    renderer.domElement.addEventListener('click', handleCanvasClick);

    // Animation loop
    let frameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      const c = camRef.current;
      if (!c.isDragging && animationsEnabled) {
        c.theta += 0.0014;
      }
      camera.position.x = c.radius * Math.sin(c.phi) * Math.sin(c.theta);
      camera.position.y = c.radius * Math.cos(c.phi);
      camera.position.z = c.radius * Math.sin(c.phi) * Math.cos(c.theta);
      camera.lookAt(0, 0.8, 0);

      if (animationsEnabled) {
        swayTargets.forEach((obj, i) => {
          obj.rotation.z = Math.sin(t * 1.4 + i * 0.5) * 0.022;
        });

        wildlifeGroup.children.forEach((critter) => {
          const { orbitRadius, speed, phase, yBase } = critter.userData;
          const angle = t * speed + phase;
          critter.position.x = Math.cos(angle) * orbitRadius;
          critter.position.z = Math.sin(angle) * orbitRadius;
          critter.position.y = yBase + Math.sin(t * 3 + phase) * 0.25;
          critter.rotation.y = -angle;
        });

        weatherPoints.rotation.y = t * 0.05;
      }

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 460;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('click', handleCanvasClick);
      renderer.dispose();
    };
  }, [
    forestSizeId,
    environmentId,
    trees,
    decorations,
    selectedTreeId,
    wildlifeEnabled,
    animationsEnabled,
  ]);

  const onPointerDown = (e: React.PointerEvent) => {
    camRef.current.isDragging = true;
    camRef.current.dragDistance = 0;
    camRef.current.lastX = e.clientX;
    camRef.current.lastY = e.clientY;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!camRef.current.isDragging) return;
    const dx = e.clientX - camRef.current.lastX;
    const dy = e.clientY - camRef.current.lastY;
    camRef.current.dragDistance += Math.abs(dx) + Math.abs(dy);
    camRef.current.lastX = e.clientX;
    camRef.current.lastY = e.clientY;
    camRef.current.theta -= dx * 0.007;
    camRef.current.phi = Math.max(
      0.45,
      Math.min(1.38, camRef.current.phi - dy * 0.006)
    );
  };
  const onPointerUp = () => {
    camRef.current.isDragging = false;
  };

  if (!webglOk) {
    return (
      <div
        className={`w-full ${heightClass} rounded-2xl flex items-center justify-center bg-[#234B35]/20 border border-[#3D7950]/30 p-6`}
      >
        <p className="text-sm font-medium">
          {trees.length} Cultivated Trees in {sizeMeta.name.en} ({envMeta.name.en})
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full ${heightClass} rounded-2xl overflow-hidden select-none cursor-grab active:cursor-grabbing border border-[#3D7950]/30 shadow-inner`}
      style={{
        background: `linear-gradient(180deg, ${envMeta.skyTopColor} 0%, ${envMeta.skyBottomColor} 100%)`,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div ref={mountRef} className="w-full h-full" />

      {/* Top Camera Controls Overlay */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() =>
            (camRef.current.radius = Math.max(7, camRef.current.radius - 2.2))
          }
          className="p-2 rounded-lg backdrop-blur-md bg-[#14251B]/75 text-[#FAF8EF] hover:bg-[#234B35] border border-[#A9C7A4]/30"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() =>
            (camRef.current.radius = Math.min(48, camRef.current.radius + 2.2))
          }
          className="p-2 rounded-lg backdrop-blur-md bg-[#14251B]/75 text-[#FAF8EF] hover:bg-[#234B35] border border-[#A9C7A4]/30"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            camRef.current.theta = 0.62;
            camRef.current.phi = 1.05;
            camRef.current.radius = Math.max(12, sizeMeta.terrainRadius * 1.15);
          }}
          className="p-2 rounded-lg backdrop-blur-md bg-[#14251B]/75 text-[#FAF8EF] hover:bg-[#234B35] border border-[#A9C7A4]/30"
          title="Reset Camera"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
