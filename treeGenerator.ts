import * as THREE from 'three';
import { TreeGrowthStage, TreeSpeciesId } from '@/domain/types';
import { TREE_SPECIES_CATALOG } from '@/domain/catalog';

export function getGrowthStageFromProgress(progress: number): TreeGrowthStage {
  const p = Math.max(0, Math.min(1, progress));
  if (p < 0.1) return 'seed';
  if (p < 0.22) return 'roots';
  if (p < 0.38) return 'sprout';
  if (p < 0.6) return 'sapling';
  if (p < 0.85) return 'young';
  return 'mature';
}

function seededRandom(seed: number): () => number {
  let s = Math.floor(seed * 999999) + 12345;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export interface ProceduralTreeBuildOptions {
  speciesId: TreeSpeciesId;
  progress: number; // 0.0 to 1.0 continuous
  seedVariation?: number; // 0.0 to 1.0
  includeSoilMound?: boolean;
  isSelected?: boolean;
}

export function buildProceduralTreeGroup(options: ProceduralTreeBuildOptions): {
  rootGroup: THREE.Group;
  swayTargets: THREE.Object3D[];
} {
  const {
    speciesId,
    progress: rawProgress,
    seedVariation = 0.42,
    includeSoilMound = true,
    isSelected = false,
  } = options;

  const progress = Math.max(0, Math.min(1, rawProgress));
  const rand = seededRandom(seedVariation);
  const meta =
    TREE_SPECIES_CATALOG.find((s) => s.id === speciesId) || TREE_SPECIES_CATALOG[0];

  const rootGroup = new THREE.Group();
  const swayTargets: THREE.Object3D[] = [];

  // 1. Soil Mound & Cutaway Root Bed (for Focus Timer & Collection Inspector)
  if (includeSoilMound) {
    const soilGroup = new THREE.Group();

    // Rich dark soil dome
    const soilGeo = new THREE.CylinderGeometry(1.55, 1.95, 0.55, 24, 1);
    const soilMat = new THREE.MeshStandardMaterial({
      color: '#4A3525',
      roughness: 0.92,
    });
    const soilMesh = new THREE.Mesh(soilGeo, soilMat);
    soilMesh.position.y = -0.27;
    soilMesh.receiveShadow = true;
    soilGroup.add(soilMesh);

    // Mossy top ring
    const mossGeo = new THREE.CylinderGeometry(1.48, 1.56, 0.08, 24);
    const mossMat = new THREE.MeshStandardMaterial({
      color: '#4F7A4E',
      roughness: 0.85,
    });
    const mossMesh = new THREE.Mesh(mossGeo, mossMat);
    mossMesh.position.y = 0.01;
    mossMesh.receiveShadow = true;
    soilGroup.add(mossMesh);

    // Small decorative pebbles around soil
    const pebbleGeo = new THREE.DodecahedronGeometry(0.11, 0);
    const pebbleMat = new THREE.MeshStandardMaterial({
      color: '#8C8D8A',
      roughness: 0.8,
    });
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + rand() * 0.5;
      const dist = 1.15 + rand() * 0.25;
      const pebble = new THREE.Mesh(pebbleGeo, pebbleMat);
      pebble.position.set(Math.cos(angle) * dist, 0.05, Math.sin(angle) * dist);
      pebble.scale.set(1 + rand() * 0.4, 0.65, 1 + rand() * 0.3);
      pebble.rotation.y = rand() * Math.PI;
      soilGroup.add(pebble);
    }

    rootGroup.add(soilGroup);
  }

  // Selection ring in Personal Forest
  if (isSelected) {
    const ringGeo = new THREE.RingGeometry(1.05, 1.25, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#D6B56D',
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    rootGroup.add(ring);
  }

  // 2. STAGE 1: SEED (Visible from 0% to 45%, gradually absorbed into trunk base)
  if (progress < 0.45) {
    const seedPulse = progress < 0.12 ? 1.0 + progress * 2.5 : Math.max(0.2, 1.3 - progress * 2.2);
    const seedGeo = new THREE.SphereGeometry(0.18 * seedPulse, 14, 12);
    seedGeo.scale(1.0, 1.35, 0.9);
    const seedMat = new THREE.MeshStandardMaterial({
      color: speciesId === 'magical' ? '#48C9B0' : '#C89D54',
      emissive: speciesId === 'magical' ? '#1E6B5E' : '#3A2610',
      emissiveIntensity: 0.35,
      roughness: 0.5,
    });
    const seedMesh = new THREE.Mesh(seedGeo, seedMat);
    seedMesh.position.y = 0.11;
    seedMesh.rotation.z = 0.2;
    seedMesh.castShadow = true;
    rootGroup.add(seedMesh);
  }

  // 3. STAGE 2: ROOT DEVELOPMENT (Starts at 8% and remains as structural surface/subsurface roots)
  if (progress >= 0.08) {
    const rootFactor = Math.min(1, (progress - 0.08) / 0.24);
    const numRoots = 6;
    const rootMat = new THREE.MeshStandardMaterial({
      color: meta.trunkColor,
      roughness: 0.88,
    });

    for (let r = 0; r < numRoots; r++) {
      const baseAngle = (r / numRoots) * Math.PI * 2 + (rand() - 0.5) * 0.3;
      const rootLen = (0.45 + rand() * 0.55) * rootFactor;
      const rootRadiusTop = 0.035 + 0.06 * Math.min(1, progress);
      const rootRadiusBottom = 0.012;

      const rGeo = new THREE.CylinderGeometry(
        rootRadiusBottom,
        rootRadiusTop,
        rootLen,
        7
      );
      const rMesh = new THREE.Mesh(rGeo, rootMat);

      // Position radiating outward from base
      const tilt = 1.15 + rand() * 0.2;
      rMesh.position.set(
        Math.cos(baseAngle) * (rootLen * 0.45),
        0.06 - rootLen * 0.12,
        Math.sin(baseAngle) * (rootLen * 0.45)
      );
      rMesh.rotation.y = -baseAngle;
      rMesh.rotation.z = tilt;
      rMesh.castShadow = true;
      rootGroup.add(rMesh);

      // Secondary rootlet offshoots when rootFactor > 0.4
      if (rootFactor > 0.4) {
        const subLen = rootLen * 0.55;
        const subGeo = new THREE.CylinderGeometry(0.008, rootRadiusBottom * 1.4, subLen, 5);
        const subMesh = new THREE.Mesh(subGeo, rootMat);
        const subAngle = baseAngle + (r % 2 === 0 ? 0.45 : -0.45);
        subMesh.position.set(
          Math.cos(subAngle) * (rootLen * 0.72),
          0.03 - subLen * 0.15,
          Math.sin(subAngle) * (rootLen * 0.72)
        );
        subMesh.rotation.y = -subAngle;
        subMesh.rotation.z = 1.25;
        rootGroup.add(subMesh);
      }
    }
  }

  // If still below 18%, return early (Seed + Root Development phase)
  if (progress < 0.18) {
    return { rootGroup, swayTargets };
  }

  // 4. STAGE 3 TO 6: SPROUT -> SAPLING -> YOUNG TREE -> MATURE TREE
  const treeGrowth = Math.min(1, (progress - 0.18) / 0.82); // 0..1 across sprout to mature
  const heightMult = meta.heightScale;
  const maxTrunkHeight = 2.35 * heightMult;
  const currentTrunkHeight = Math.max(0.28, maxTrunkHeight * Math.pow(treeGrowth, 0.85));

  const baseRadius = 0.04 + 0.22 * Math.pow(treeGrowth, 1.1);
  const topRadius = baseRadius * (speciesId === 'redwood' ? 0.52 : 0.42);

  // Color transitions from tender green sprout (treeGrowth < 0.22) to woody bark
  const sproutColor = new THREE.Color('#529466');
  const barkColor = new THREE.Color(meta.trunkColor);
  const currentTrunkColor = sproutColor
    .clone()
    .lerp(barkColor, Math.min(1, treeGrowth * 2.4));

  const trunkMat = new THREE.MeshStandardMaterial({
    color: currentTrunkColor,
    roughness: 0.82,
    emissive: speciesId === 'magical' ? new THREE.Color('#281E46') : new THREE.Color('#000000'),
    emissiveIntensity: speciesId === 'magical' ? 0.4 : 0,
  });

  const treeBodyGroup = new THREE.Group();
  rootGroup.add(treeBodyGroup);
  swayTargets.push(treeBodyGroup);

  // Build Segmented Organic Trunk (4 segments with subtle organic curvature)
  const segments = 4;
  const segHeight = currentTrunkHeight / segments;
  let currentPos = new THREE.Vector3(0, 0, 0);
  let cumulativeTiltX = 0;
  let cumulativeTiltZ = 0;

  for (let s = 0; s < segments; s++) {
    const t0 = s / segments;
    const t1 = (s + 1) / segments;
    const rBottom = THREE.MathUtils.lerp(baseRadius, topRadius, t0);
    const rTop = THREE.MathUtils.lerp(baseRadius, topRadius, t1);

    const segGeo = new THREE.CylinderGeometry(rTop, rBottom, segHeight * 1.05, 10);
    segGeo.translate(0, segHeight / 2, 0);
    const segMesh = new THREE.Mesh(segGeo, trunkMat);
    segMesh.position.copy(currentPos);

    // Subtle organic bend (especially for willow, cherry, sakura, palm)
    const bendScale =
      speciesId === 'palm' || speciesId === 'sakura' || speciesId === 'willow'
        ? 0.08
        : 0.035;
    cumulativeTiltX += (rand() - 0.45) * bendScale;
    cumulativeTiltZ += (rand() - 0.5) * bendScale;

    segMesh.rotation.x = cumulativeTiltX;
    segMesh.rotation.z = cumulativeTiltZ;
    segMesh.castShadow = true;
    segMesh.receiveShadow = true;
    treeBodyGroup.add(segMesh);

    // Birch bark dark horizontal rings
    if (speciesId === 'birch' && treeGrowth > 0.35) {
      const bandGeo = new THREE.CylinderGeometry(
        rTop * 1.02,
        rTop * 1.02,
        segHeight * 0.14,
        10
      );
      const bandMat = new THREE.MeshStandardMaterial({ color: '#3B3632', roughness: 0.9 });
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.position.copy(currentPos).add(new THREE.Vector3(0, segHeight * 0.6, 0));
      treeBodyGroup.add(band);
    }

    // Advance currentPos along tilted segment
    const dir = new THREE.Vector3(0, segHeight, 0).applyEuler(
      new THREE.Euler(cumulativeTiltX, 0, cumulativeTiltZ)
    );
    currentPos.add(dir);
  }

  // Cotyledon Sprout Leaves (Stage 3: Sprout, visible when treeGrowth < 0.45)
  if (treeGrowth < 0.45) {
    const cotScale = Math.min(1, treeGrowth * 3.2) * (1 - treeGrowth * 1.4);
    if (cotScale > 0.05) {
      const leafMat = new THREE.MeshStandardMaterial({
        color: '#6EB369',
        roughness: 0.6,
      });
      for (let side of [-1, 1]) {
        const cotGeo = new THREE.SphereGeometry(0.14 * cotScale, 8, 8);
        cotGeo.scale(1.8, 0.35, 0.9);
        const cot = new THREE.Mesh(cotGeo, leafMat);
        cot.position.copy(currentPos).add(new THREE.Vector3(side * 0.12 * cotScale, -0.04, 0));
        cot.rotation.z = side * -0.45;
        treeBodyGroup.add(cot);
      }
    }
  }

  // 5. STAGE 4 TO 6: PROCEDURAL BRANCHES & SPECIES-SPECIFIC CANOPY (progress >= 0.36)
  if (progress >= 0.36) {
    const branchGrowth = Math.min(1, (progress - 0.36) / 0.64); // 0..1 from sapling to mature
    const leafPrimaryMat = new THREE.MeshStandardMaterial({
      color: meta.leafPrimaryColor,
      roughness: speciesId === 'magical' ? 0.25 : 0.72,
      metalness: speciesId === 'magical' ? 0.35 : 0.05,
      emissive:
        speciesId === 'magical'
          ? new THREE.Color('#196F62')
          : speciesId === 'cherry' || speciesId === 'sakura'
            ? new THREE.Color('#421222')
            : new THREE.Color('#000000'),
      emissiveIntensity: speciesId === 'magical' ? 0.45 : 0.12,
    });

    const leafSecondaryMat = new THREE.MeshStandardMaterial({
      color: meta.leafSecondaryColor,
      roughness: 0.7,
      emissive: speciesId === 'magical' ? new THREE.Color('#6E5219') : new THREE.Color('#000000'),
      emissiveIntensity: speciesId === 'magical' ? 0.4 : 0,
    });

    if (meta.canopyShape === 'conical') {
      // PINE & REDWOOD: Conical tiered needle layers + sub-branches
      const tiers = speciesId === 'redwood' ? 6 : 5;
      const activeTiers = Math.max(2, Math.ceil(tiers * branchGrowth));
      for (let t = 0; t < activeTiers; t++) {
        const tierRatio = t / tiers;
        const yPos = currentTrunkHeight * (0.38 + tierRatio * 0.65);
        const coneRadius =
          (1.15 - tierRatio * 0.68) * branchGrowth * (speciesId === 'redwood' ? 1.15 : 1.0);
        const coneHeight = (0.78 - tierRatio * 0.25) * branchGrowth;

        const coneGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 9);
        const coneMesh = new THREE.Mesh(
          coneGeo,
          t % 2 === 0 ? leafPrimaryMat : leafSecondaryMat
        );
        coneMesh.position.set(
          currentPos.x * (0.4 + tierRatio * 0.6),
          yPos,
          currentPos.z * (0.4 + tierRatio * 0.6)
        );
        coneMesh.castShadow = true;
        coneMesh.receiveShadow = true;
        treeBodyGroup.add(coneMesh);
        swayTargets.push(coneMesh);
      }
    } else if (meta.canopyShape === 'palm') {
      // PALM: Radial arching tropical fronds + coconuts at the crown
      const numFronds = Math.max(4, Math.floor(9 * branchGrowth));
      const crownGroup = new THREE.Group();
      crownGroup.position.copy(currentPos);
      treeBodyGroup.add(crownGroup);
      swayTargets.push(crownGroup);

      // Coconuts when mature
      if (branchGrowth > 0.65) {
        const cocoMat = new THREE.MeshStandardMaterial({ color: '#4E342E', roughness: 0.8 });
        for (let c = 0; c < 3; c++) {
          const cAngle = (c / 3) * Math.PI * 2;
          const coco = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), cocoMat);
          coco.position.set(Math.cos(cAngle) * 0.14, -0.06, Math.sin(cAngle) * 0.14);
          crownGroup.add(coco);
        }
      }

      for (let f = 0; f < numFronds; f++) {
        const fAngle = (f / numFronds) * Math.PI * 2 + rand() * 0.2;
        const frondGroup = new THREE.Group();
        frondGroup.rotation.y = fAngle;

        const frondLen = (1.1 + rand() * 0.25) * branchGrowth;
        const bladeGeo = new THREE.BoxGeometry(frondLen, 0.04, 0.28 * branchGrowth);
        bladeGeo.translate(frondLen / 2, 0, 0);
        const blade = new THREE.Mesh(
          bladeGeo,
          f % 2 === 0 ? leafPrimaryMat : leafSecondaryMat
        );
        blade.rotation.z = -0.28 - 0.22 * branchGrowth;
        blade.castShadow = true;
        frondGroup.add(blade);
        crownGroup.add(frondGroup);
      }
    } else {
      // BIFURCATING PROCEDURAL BRANCH HIERARCHY (Oak, Maple, Birch, Willow, Cherry, Sakura, Magical)
      const numPrimaryBranches = Math.max(3, Math.floor(6 * Math.min(1, branchGrowth * 1.3)));

      for (let b = 0; b < numPrimaryBranches; b++) {
        const bAngle = (b / numPrimaryBranches) * Math.PI * 2 + (rand() - 0.5) * 0.4;
        const attachRatio = 0.58 + (b / numPrimaryBranches) * 0.36;
        const attachY = currentTrunkHeight * attachRatio;

        const branchLen = (0.65 + rand() * 0.45) * branchGrowth * heightMult;
        const bRadiusBottom = topRadius * 0.78;
        const bRadiusTop = bRadiusBottom * 0.45;

        const branchGroup = new THREE.Group();
        branchGroup.position.set(
          currentPos.x * attachRatio,
          attachY,
          currentPos.z * attachRatio
        );
        branchGroup.rotation.y = bAngle;
        branchGroup.rotation.z = -(0.52 + rand() * 0.35);

        const bGeo = new THREE.CylinderGeometry(bRadiusTop, bRadiusBottom, branchLen, 7);
        bGeo.translate(0, branchLen / 2, 0);
        const bMesh = new THREE.Mesh(bGeo, trunkMat);
        bMesh.castShadow = true;
        branchGroup.add(bMesh);
        treeBodyGroup.add(branchGroup);

        // Secondary sub-branch when in Young / Mature stage (branchGrowth > 0.42)
        if (branchGrowth > 0.42) {
          const subScale = (branchGrowth - 0.42) / 0.58;
          const subLen = branchLen * 0.65 * subScale;
          const subGeo = new THREE.CylinderGeometry(
            bRadiusTop * 0.45,
            bRadiusTop * 0.85,
            subLen,
            6
          );
          subGeo.translate(0, subLen / 2, 0);
          const subMesh = new THREE.Mesh(subGeo, trunkMat);
          subMesh.position.set(0, branchLen * 0.65, 0);
          subMesh.rotation.z = 0.55;
          subMesh.rotation.x = (rand() - 0.5) * 0.6;
          branchGroup.add(subMesh);
        }

        // Leaf / Canopy Clusters at Branch Ends
        const clusterScale = Math.pow(branchGrowth, 0.85);
        const clusterRadius = (0.38 + rand() * 0.22) * clusterScale;

        const clusterHolder = new THREE.Group();
        clusterHolder.position.set(0, branchLen, 0);
        branchGroup.add(clusterHolder);
        swayTargets.push(clusterHolder);

        const clusterGeo =
          speciesId === 'magical'
            ? new THREE.OctahedronGeometry(clusterRadius * 1.05, 1)
            : new THREE.DodecahedronGeometry(clusterRadius, 1);

        if (meta.canopyShape === 'spreading') {
          clusterGeo.scale(1.35, 0.78, 1.25);
        }

        const mainCluster = new THREE.Mesh(
          clusterGeo,
          b % 2 === 0 ? leafPrimaryMat : leafSecondaryMat
        );
        mainCluster.castShadow = true;
        mainCluster.receiveShadow = true;
        clusterHolder.add(mainCluster);

        // Secondary puff clusters for lush Mature & Young trees
        if (branchGrowth > 0.35) {
          const puffCount = branchGrowth > 0.75 ? 3 : 2;
          for (let p = 0; p < puffCount; p++) {
            const pAngle = (p / puffCount) * Math.PI * 2;
            const puffGeo =
              speciesId === 'magical'
                ? new THREE.OctahedronGeometry(clusterRadius * 0.72, 0)
                : new THREE.DodecahedronGeometry(clusterRadius * 0.75, 1);
            const puffMesh = new THREE.Mesh(
              puffGeo,
              (b + p) % 2 === 0 ? leafSecondaryMat : leafPrimaryMat
            );
            puffMesh.position.set(
              Math.cos(pAngle) * clusterRadius * 0.65,
              (rand() - 0.3) * clusterRadius * 0.5,
              Math.sin(pAngle) * clusterRadius * 0.65
            );
            puffMesh.castShadow = true;
            clusterHolder.add(puffMesh);
          }
        }

        // WILLOW: Cascading pendulous curtains hanging from branch tips
        if (meta.canopyShape === 'weeping' && branchGrowth > 0.3) {
          const vineCount = 3;
          for (let v = 0; v < vineCount; v++) {
            const vineLen = (0.65 + rand() * 0.55) * branchGrowth;
            const vineGeo = new THREE.CylinderGeometry(0.02, 0.07, vineLen, 5);
            const vineMesh = new THREE.Mesh(
              vineGeo,
              v % 2 === 0 ? leafPrimaryMat : leafSecondaryMat
            );
            // Counter-rotate so curtains hang straight down in world space
            vineMesh.rotation.z = -branchGroup.rotation.z;
            vineMesh.position.set(
              (v - 1) * 0.18,
              -vineLen * 0.45,
              (rand() - 0.5) * 0.18
            );
            clusterHolder.add(vineMesh);
          }
        }
      }

      // Central Crown Canopy Cluster at the apex of the trunk
      const crownScale = Math.pow(branchGrowth, 0.8);
      const crownRadius = (0.52 + rand() * 0.12) * crownScale;
      const crownGeo =
        speciesId === 'magical'
          ? new THREE.OctahedronGeometry(crownRadius, 1)
          : new THREE.DodecahedronGeometry(crownRadius, 1);
      if (meta.canopyShape === 'spreading') {
        crownGeo.scale(1.45, 0.82, 1.45);
      }
      const crownMesh = new THREE.Mesh(crownGeo, leafPrimaryMat);
      crownMesh.position.copy(currentPos).add(new THREE.Vector3(0, crownRadius * 0.4, 0));
      crownMesh.castShadow = true;
      crownMesh.receiveShadow = true;
      treeBodyGroup.add(crownMesh);
      swayTargets.push(crownMesh);

      // STAGE 6 MATURE DETAILS: Blossoms or Magical Crystals when progress >= 0.85
      if (progress >= 0.85 && (meta.blossomColor || speciesId === 'magical')) {
        const matureFactor = (progress - 0.85) / 0.15;
        const blossomMat = new THREE.MeshStandardMaterial({
          color: meta.blossomColor || '#9AF8E8',
          emissive: meta.blossomColor || '#48C9B0',
          emissiveIntensity: speciesId === 'magical' ? 0.8 : 0.35,
          roughness: 0.3,
        });
        const numBlossoms = 12;
        for (let bl = 0; bl < numBlossoms; bl++) {
          const theta = (bl / numBlossoms) * Math.PI * 2;
          const phi = rand() * Math.PI * 0.6;
          const rDist = (0.65 + rand() * 0.55) * crownScale;
          const bGeo = new THREE.OctahedronGeometry(0.065 * (0.5 + 0.5 * matureFactor), 0);
          const bOrb = new THREE.Mesh(bGeo, blossomMat);
          bOrb.position.set(
            currentPos.x + Math.cos(theta) * Math.sin(phi) * rDist,
            currentPos.y - 0.2 + Math.cos(phi) * rDist * 0.8,
            currentPos.z + Math.sin(theta) * Math.sin(phi) * rDist
          );
          treeBodyGroup.add(bOrb);
        }
      }
    }
  }

  return { rootGroup, swayTargets };
}
