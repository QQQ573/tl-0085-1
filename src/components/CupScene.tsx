import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useCupStore, CupLayer, BaseType } from '../store/cupStore';

const SCALE = 0.8;
const RADIAL_SEGMENTS = 48;

export default function CupScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cupGroupRef = useRef<THREE.Group | null>(null);
  const baseGroupRef = useRef<THREE.Group | null>(null);
  const cupShellGroupRef = useRef<THREE.Group | null>(null);
  const liquidGroupRef = useRef<THREE.Group | null>(null);
  const toppingsGroupRef = useRef<THREE.Group | null>(null);
  const foamGroupRef = useRef<THREE.Group | null>(null);
  const iceGroupRef = useRef<THREE.Group | null>(null);
  const measurementLineRef = useRef<THREE.Group | null>(null);
  const rotationRef = useRef({ x: -0.4, y: 0.5 });
  const zoomRef = useRef(1);
  const isDraggingRef = useRef(false);
  const previousMouseRef = useRef({ x: 0, y: 0 });
  const touchStartRef = useRef<{ distance: number; rotation: { x: number; y: number } } | null>(null);
  const animationIdRef = useRef<number>(0);

  const {
    currentPreset,
    baseType,
    crossSectionMode,
    crossSectionLayer,
    getVisibleLayers,
    getTotalHeight,
  } = useCupStore();

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f4f8);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 60, 180);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(80, 120, 80);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 500;
    mainLight.shadow.camera.left = -100;
    mainLight.shadow.camera.right = 100;
    mainLight.shadow.camera.top = 100;
    mainLight.shadow.camera.bottom = -100;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xe8f4ff, 0.4);
    fillLight.position.set(-60, 40, -60);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xfff0e0, 0.5, 300);
    rimLight.position.set(0, 100, -100);
    scene.add(rimLight);

    const cupGroup = new THREE.Group();
    cupGroupRef.current = cupGroup;
    scene.add(cupGroup);

    const baseGroup = new THREE.Group();
    baseGroupRef.current = baseGroup;
    cupGroup.add(baseGroup);

    const cupShellGroup = new THREE.Group();
    cupShellGroupRef.current = cupShellGroup;
    cupGroup.add(cupShellGroup);

    const liquidGroup = new THREE.Group();
    liquidGroupRef.current = liquidGroup;
    cupGroup.add(liquidGroup);

    const toppingsGroup = new THREE.Group();
    toppingsGroupRef.current = toppingsGroup;
    cupGroup.add(toppingsGroup);

    const foamGroup = new THREE.Group();
    foamGroupRef.current = foamGroup;
    cupGroup.add(foamGroup);

    const iceGroup = new THREE.Group();
    iceGroupRef.current = iceGroup;
    cupGroup.add(iceGroup);

    const measurementLineGroup = new THREE.Group();
    measurementLineRef.current = measurementLineGroup;
    cupGroup.add(measurementLineGroup);

    const groundGeometry = new THREE.CircleGeometry(150, 64);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8eef5,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    scene.add(ground);

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      if (cupGroupRef.current) {
        cupGroupRef.current.rotation.x = rotationRef.current.x;
        cupGroupRef.current.rotation.y = rotationRef.current.y;
      }
      if (cameraRef.current) {
        const targetZ = 180 / zoomRef.current;
        cameraRef.current.position.z += (targetZ - cameraRef.current.position.z) * 0.1;
        cameraRef.current.lookAt(0, 60, 0);
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationIdRef.current);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    const { setRotation, setZoom, rotation: storeRotation, zoom: storeZoom } = useCupStore.getState();
    rotationRef.current = { ...storeRotation };
    zoomRef.current = storeZoom;
    
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMouseRef.current.x;
      const deltaY = e.clientY - previousMouseRef.current.y;
      previousMouseRef.current = { x: e.clientX, y: e.clientY };
      
      rotationRef.current.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 4, rotationRef.current.x + deltaY * 0.01));
      rotationRef.current.y += deltaX * 0.01;
      setRotation(rotationRef.current.x, rotationRef.current.y);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      zoomRef.current = Math.max(0.5, Math.min(3, zoomRef.current * delta));
      setZoom(zoomRef.current);
    };

    const getTouchDistance = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        previousMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        touchStartRef.current = {
          distance: getTouchDistance(e.touches),
          rotation: { ...rotationRef.current },
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && isDraggingRef.current) {
        const deltaX = e.touches[0].clientX - previousMouseRef.current.x;
        const deltaY = e.touches[0].clientY - previousMouseRef.current.y;
        previousMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        
        rotationRef.current.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 4, rotationRef.current.x + deltaY * 0.01));
        rotationRef.current.y += deltaX * 0.01;
        setRotation(rotationRef.current.x, rotationRef.current.y);
      } else if (e.touches.length === 2 && touchStartRef.current) {
        const newDistance = getTouchDistance(e.touches);
        const scale = newDistance / touchStartRef.current.distance;
        zoomRef.current = Math.max(0.5, Math.min(3, zoomRef.current * scale));
        setZoom(zoomRef.current);
        touchStartRef.current.distance = newDistance;
      }
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
      touchStartRef.current = null;
    };

    const domElement = rendererRef.current?.domElement;
    if (!domElement) return;

    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });
    domElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    domElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    domElement.addEventListener('touchend', handleTouchEnd);

    return () => {
      domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domElement.removeEventListener('wheel', handleWheel);
      domElement.removeEventListener('touchstart', handleTouchStart);
      domElement.removeEventListener('touchmove', handleTouchMove);
      domElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  useEffect(() => {
    if (!baseGroupRef.current || !sceneRef.current) return;

    const baseGroup = baseGroupRef.current;
    while (baseGroup.children.length > 0) {
      const child = baseGroup.children[0];
      baseGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }

    if (baseType === 'holder') {
      createCupHolder(baseGroup);
    } else {
      createTakeoutBag(baseGroup);
    }
  }, [baseType]);

  useEffect(() => {
    if (!cupShellGroupRef.current) return;

    const group = cupShellGroupRef.current;
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        } else if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        }
      }
    }

    const cupHeight = currentPreset.cupHeight * SCALE;
    const cupTopRadius = currentPreset.cupTopRadius * SCALE;
    const cupBottomRadius = currentPreset.cupBottomRadius * SCALE;

    createCupShell(group, cupHeight, cupTopRadius, cupBottomRadius);
  }, [currentPreset]);

  useEffect(() => {
    if (!liquidGroupRef.current || !toppingsGroupRef.current || !foamGroupRef.current || !iceGroupRef.current) return;

    const clearGroup = (group: THREE.Group) => {
      while (group.children.length > 0) {
        const child = group.children[0];
        group.remove(child);
        if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          } else if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          }
        }
      }
    };

    clearGroup(liquidGroupRef.current);
    clearGroup(toppingsGroupRef.current);
    clearGroup(foamGroupRef.current);
    clearGroup(iceGroupRef.current);

    const visibleLayers = getVisibleLayers();
    let currentY = 20;
    const cupHeight = currentPreset.cupHeight * SCALE;
    const cupTopRadius = currentPreset.cupTopRadius * SCALE;
    const cupBottomRadius = currentPreset.cupBottomRadius * SCALE;

    if (crossSectionMode && crossSectionLayer) {
      const crossSectionIndex = visibleLayers.findIndex((l) => l.id === crossSectionLayer);
      if (crossSectionIndex >= 0) {
        for (let i = 0; i <= crossSectionIndex; i++) {
          const layer = visibleLayers[i];
          const layerHeight = layer.height * SCALE;
          const isCrossSection = i === crossSectionIndex;
          
          if (layer.type === 'topping') {
            createToppingLayer(toppingsGroupRef.current, layer, currentY, layerHeight, cupTopRadius, cupBottomRadius, cupHeight, isCrossSection);
          } else if (layer.type === 'foam') {
            createFoamLayer(foamGroupRef.current, layer, currentY, layerHeight, cupTopRadius, cupBottomRadius, cupHeight, isCrossSection);
          } else if (layer.type === 'ice') {
            createIceLayer(iceGroupRef.current, layer, currentY, layerHeight, cupTopRadius, cupBottomRadius, cupHeight, isCrossSection);
          } else {
            createLiquidLayer(liquidGroupRef.current, layer, currentY, layerHeight, cupTopRadius, cupBottomRadius, cupHeight, isCrossSection);
          }
          
          if (!isCrossSection) {
            currentY += layerHeight;
          }
        }
      }
    } else {
      visibleLayers.forEach((layer) => {
        const layerHeight = layer.height * SCALE;
        
        if (layer.type === 'topping') {
          createToppingLayer(toppingsGroupRef.current, layer, currentY, layerHeight, cupTopRadius, cupBottomRadius, cupHeight, false);
        } else if (layer.type === 'foam') {
          createFoamLayer(foamGroupRef.current, layer, currentY, layerHeight, cupTopRadius, cupBottomRadius, cupHeight, false);
        } else if (layer.type === 'ice') {
          createIceLayer(iceGroupRef.current, layer, currentY, layerHeight, cupTopRadius, cupBottomRadius, cupHeight, false);
        } else {
          createLiquidLayer(liquidGroupRef.current, layer, currentY, layerHeight, cupTopRadius, cupBottomRadius, cupHeight, false);
        }
        
        currentY += layerHeight;
      });
    }

    updateMeasurementLine(currentY);
  }, [currentPreset, getVisibleLayers, crossSectionMode, crossSectionLayer, getTotalHeight]);

  const createCupShell = (
    group: THREE.Group,
    cupHeight: number,
    cupTopRadius: number,
    cupBottomRadius: number
  ) => {
    const cupGeometry = new THREE.CylinderGeometry(
      cupTopRadius + 2,
      cupBottomRadius + 2,
      cupHeight + 8,
      RADIAL_SEGMENTS,
      1,
      true
    );
    const cupMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.9,
      thickness: 0.5,
      ior: 1.5,
    });
    const cupMesh = new THREE.Mesh(cupGeometry, cupMaterial);
    cupMesh.position.y = cupHeight / 2 + 16;
    cupMesh.castShadow = true;
    cupMesh.receiveShadow = true;
    group.add(cupMesh);

    const rimGeometry = new THREE.TorusGeometry(cupTopRadius + 2, 2.5, 12, RADIAL_SEGMENTS);
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.2,
    });
    const rimMesh = new THREE.Mesh(rimGeometry, rimMaterial);
    rimMesh.position.y = cupHeight + 20;
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.castShadow = true;
    group.add(rimMesh);

    const bottomGeometry = new THREE.CircleGeometry(cupBottomRadius + 2, RADIAL_SEGMENTS);
    const bottomMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const bottomMesh = new THREE.Mesh(bottomGeometry, bottomMaterial);
    bottomMesh.rotation.x = -Math.PI / 2;
    bottomMesh.position.y = 20;
    group.add(bottomMesh);
  };

  const createLiquidLayer = (
    group: THREE.Group,
    layer: CupLayer,
    y: number,
    height: number,
    topRadius: number,
    bottomRadius: number,
    cupHeight: number,
    isCrossSection: boolean
  ) => {
    const progress = (y - 20) / (cupHeight - 20);
    const nextProgress = (y + height - 20) / (cupHeight - 20);
    const layerTopRadius = bottomRadius + (topRadius - bottomRadius) * Math.min(1, Math.max(0, nextProgress));
    const layerBottomRadius = bottomRadius + (topRadius - bottomRadius) * Math.min(1, Math.max(0, progress));

    let geometry: THREE.BufferGeometry;
    if (isCrossSection) {
      geometry = new THREE.CylinderGeometry(
        layerTopRadius * 0.92,
        layerBottomRadius * 0.92,
        height,
        RADIAL_SEGMENTS,
        1,
        false,
        -Math.PI / 2,
        Math.PI
      );
    } else {
      geometry = new THREE.CylinderGeometry(
        layerTopRadius * 0.92,
        layerBottomRadius * 0.92,
        height,
        RADIAL_SEGMENTS
      );
    }

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(layer.color),
      transparent: true,
      opacity: isCrossSection ? 0.7 : 0.9,
      roughness: 0.2,
      metalness: 0.1,
      side: isCrossSection ? THREE.DoubleSide : THREE.FrontSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = y + height / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { layerId: layer.id, layerName: layer.name };
    group.add(mesh);

    const topGeometry = new THREE.CircleGeometry(layerTopRadius * 0.92, RADIAL_SEGMENTS);
    const topMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(layer.color).clone().multiplyScalar(1.2),
      roughness: 0.1,
      metalness: 0.2,
    });
    const topMesh = new THREE.Mesh(topGeometry, topMaterial);
    topMesh.rotation.x = -Math.PI / 2;
    topMesh.position.y = y + height;
    if (isCrossSection) {
      topMesh.scale.x = 0.5;
      topMesh.position.x = -layerTopRadius * 0.92 / 2;
    }
    group.add(topMesh);
  };

  const createToppingLayer = (
    group: THREE.Group,
    layer: CupLayer,
    y: number,
    height: number,
    topRadius: number,
    bottomRadius: number,
    cupHeight: number,
    isCrossSection: boolean
  ) => {
    const progress = (y - 20) / (cupHeight - 20);
    const layerBottomRadius = bottomRadius + (topRadius - bottomRadius) * Math.min(1, Math.max(0, progress));

    const baseGeometry = new THREE.CylinderGeometry(
      layerBottomRadius * 0.85,
      layerBottomRadius * 0.9,
      height * 0.6,
      RADIAL_SEGMENTS
    );
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(layer.color),
      roughness: 0.6,
      metalness: 0.1,
    });
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.y = y + height * 0.3;
    baseMesh.castShadow = true;
    group.add(baseMesh);

    const pearlCount = 12;
    for (let i = 0; i < pearlCount; i++) {
      const angle = (i / pearlCount) * Math.PI * 2;
      const radius = layerBottomRadius * 0.5 + Math.random() * layerBottomRadius * 0.25;
      const pearlSize = 3 + Math.random() * 2;
      const pearlGeometry = new THREE.SphereGeometry(pearlSize, 12, 12);
      const pearlMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(layer.color).multiplyScalar(0.7),
        roughness: 0.3,
        metalness: 0.2,
      });
      const pearl = new THREE.Mesh(pearlGeometry, pearlMaterial);
      pearl.position.set(
        Math.cos(angle) * radius,
        y + height * 0.5 + Math.random() * height * 0.3,
        Math.sin(angle) * radius
      );
      pearl.castShadow = true;
      group.add(pearl);
    }

    const fruitCount = 5;
    for (let i = 0; i < fruitCount; i++) {
      const angle = (i / fruitCount) * Math.PI * 2 + Math.random() * 0.5;
      const radius = layerBottomRadius * 0.4 + Math.random() * layerBottomRadius * 0.3;
      const fruitGeometry = new THREE.IcosahedronGeometry(4 + Math.random() * 3, 1);
      const fruitMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(layer.color).clone().offsetHSL(Math.random() * 0.1 - 0.05, 0, 0.1),
        roughness: 0.5,
        metalness: 0.1,
      });
      const fruit = new THREE.Mesh(fruitGeometry, fruitMaterial);
      fruit.position.set(
        Math.cos(angle) * radius,
        y + height * 0.7 + Math.random() * height * 0.2,
        Math.sin(angle) * radius
      );
      fruit.rotation.set(Math.random(), Math.random(), Math.random());
      fruit.castShadow = true;
      group.add(fruit);
    }
  };

  const createFoamLayer = (
    group: THREE.Group,
    layer: CupLayer,
    y: number,
    height: number,
    topRadius: number,
    bottomRadius: number,
    cupHeight: number,
    isCrossSection: boolean
  ) => {
    const progress = (y - 20) / (cupHeight - 20);
    const layerTopRadius = bottomRadius + (topRadius - bottomRadius) * Math.min(1, Math.max(0, progress + 0.2));
    const layerBottomRadius = bottomRadius + (topRadius - bottomRadius) * Math.min(1, Math.max(0, progress));

    const foamGeometry = new THREE.CylinderGeometry(
      layerTopRadius * 0.95,
      layerBottomRadius * 0.9,
      height,
      RADIAL_SEGMENTS,
      4
    );
    
    const positions = foamGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const yPos = positions.getY(i);
      if (yPos > 0) {
        const noise = (Math.random() - 0.5) * 4;
        positions.setY(i, yPos + noise);
        const xPos = positions.getX(i);
        const zPos = positions.getZ(i);
        const dist = Math.sqrt(xPos * xPos + zPos * zPos);
        if (dist > 0) {
          const scale = (dist + (Math.random() - 0.5) * 3) / dist;
          positions.setX(i, xPos * scale);
          positions.setZ(i, zPos * scale);
        }
      }
    }
    foamGeometry.computeVertexNormals();

    const foamMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(layer.color),
      transparent: true,
      opacity: isCrossSection ? 0.7 : 0.95,
      roughness: 0.8,
      metalness: 0.05,
      side: isCrossSection ? THREE.DoubleSide : THREE.FrontSide,
    });

    const foamMesh = new THREE.Mesh(foamGeometry, foamMaterial);
    foamMesh.position.y = y + height / 2;
    foamMesh.castShadow = true;
    foamMesh.receiveShadow = true;
    group.add(foamMesh);

    const bubbleCount = 20;
    for (let i = 0; i < bubbleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * layerTopRadius * 0.7;
      const bubbleSize = 1.5 + Math.random() * 3;
      const bubbleGeometry = new THREE.SphereGeometry(bubbleSize, 8, 8);
      const bubbleMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
        roughness: 0.1,
        metalness: 0.3,
      });
      const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
      bubble.position.set(
        Math.cos(angle) * radius,
        y + height + Math.random() * 3,
        Math.sin(angle) * radius
      );
      group.add(bubble);
    }

    const peakCount = 6;
    for (let i = 0; i < peakCount; i++) {
      const angle = (i / peakCount) * Math.PI * 2;
      const radius = layerTopRadius * 0.6;
      const peakHeight = height * 0.3 + Math.random() * height * 0.2;
      const peakGeometry = new THREE.ConeGeometry(5 + Math.random() * 3, peakHeight, 8);
      const peakMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(layer.color),
        roughness: 0.7,
        metalness: 0.05,
      });
      const peak = new THREE.Mesh(peakGeometry, peakMaterial);
      peak.position.set(
        Math.cos(angle) * radius,
        y + height + peakHeight / 2,
        Math.sin(angle) * radius
      );
      peak.castShadow = true;
      group.add(peak);
    }
  };

  const createIceLayer = (
    group: THREE.Group,
    layer: CupLayer,
    y: number,
    height: number,
    topRadius: number,
    bottomRadius: number,
    cupHeight: number,
    isCrossSection: boolean
  ) => {
    const progress = (y - 20) / (cupHeight - 20);
    const layerBottomRadius = bottomRadius + (topRadius - bottomRadius) * Math.min(1, Math.max(0, progress));

    const iceCount = 15;
    for (let i = 0; i < iceCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * layerBottomRadius * 0.6;
      const iceSize = 5 + Math.random() * 4;
      const iceGeometry = new THREE.BoxGeometry(iceSize, iceSize * (0.8 + Math.random() * 0.4), iceSize);
      const iceMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xe8f4ff,
        transparent: true,
        opacity: 0.7,
        roughness: 0.05,
        metalness: 0.1,
        transmission: 0.5,
        thickness: 1,
        ior: 1.3,
      });
      const ice = new THREE.Mesh(iceGeometry, iceMaterial);
      ice.position.set(
        Math.cos(angle) * radius,
        y + Math.random() * height,
        Math.sin(angle) * radius
      );
      ice.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      ice.castShadow = true;
      group.add(ice);
    }

    const waterGeometry = new THREE.CylinderGeometry(
      layerBottomRadius * 0.9,
      layerBottomRadius * 0.92,
      height * 0.4,
      RADIAL_SEGMENTS
    );
    const waterMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xd4f0ff,
      transparent: true,
      opacity: 0.4,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.8,
      thickness: 1,
    });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.y = y + height * 0.2;
    water.receiveShadow = true;
    group.add(water);
  };

  const createCupHolder = (group: THREE.Group) => {
    const holderGeometry = new THREE.CylinderGeometry(40, 46, 12, RADIAL_SEGMENTS);
    const holderMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.85,
      metalness: 0.1,
    });
    const holderMesh = new THREE.Mesh(holderGeometry, holderMaterial);
    holderMesh.position.y = 6;
    holderMesh.castShadow = true;
    holderMesh.receiveShadow = true;
    group.add(holderMesh);

    const saucerGeometry = new THREE.CylinderGeometry(48, 44, 4, RADIAL_SEGMENTS);
    const saucerMaterial = new THREE.MeshStandardMaterial({
      color: 0xa0522d,
      roughness: 0.8,
      metalness: 0.1,
    });
    const saucerMesh = new THREE.Mesh(saucerGeometry, saucerMaterial);
    saucerMesh.position.y = 2;
    saucerMesh.castShadow = true;
    saucerMesh.receiveShadow = true;
    group.add(saucerMesh);

    const indentGeometry = new THREE.CylinderGeometry(35, 35, 4, RADIAL_SEGMENTS);
    const indentMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.9,
    });
    const indentMesh = new THREE.Mesh(indentGeometry, indentMaterial);
    indentMesh.position.y = 12;
    group.add(indentMesh);

    const handleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 15, 42),
      new THREE.Vector3(0, 35, 50),
      new THREE.Vector3(0, 50, 42),
    ]);
    const handleGeometry = new THREE.TubeGeometry(handleCurve, 20, 4, 12, false);
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0xa0522d,
      roughness: 0.8,
    });
    const handleMesh = new THREE.Mesh(handleGeometry, handleMaterial);
    handleMesh.castShadow = true;
    group.add(handleMesh);
  };

  const createTakeoutBag = (group: THREE.Group) => {
    const bagWidth = 85;
    const bagHeight = 85;
    const bagDepth = 55;

    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(-bagWidth / 2, 0);
    bodyShape.lineTo(-bagWidth / 2 + 5, bagHeight);
    bodyShape.lineTo(bagWidth / 2 - 5, bagHeight);
    bodyShape.lineTo(bagWidth / 2, 0);
    bodyShape.lineTo(-bagWidth / 2, 0);

    const extrudeSettings = {
      depth: bagDepth,
      bevelEnabled: true,
      bevelThickness: 1,
      bevelSize: 1,
      bevelSegments: 2,
    };

    const bodyGeometry = new THREE.ExtrudeGeometry(bodyShape, extrudeSettings);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xfff8dc,
      roughness: 0.95,
      side: THREE.DoubleSide,
    });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.rotation.x = 0;
    bodyMesh.position.z = -bagDepth / 2;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    const topGeometry = new THREE.BoxGeometry(bagWidth - 5, 10, bagDepth + 6);
    const topMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5deb3,
      roughness: 0.9,
    });
    const topMesh = new THREE.Mesh(topGeometry, topMaterial);
    topMesh.position.y = bagHeight + 5;
    topMesh.castShadow = true;
    group.add(topMesh);

    const handle1Geometry = new THREE.TorusGeometry(18, 3.5, 12, 20, Math.PI);
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0xd2691e,
      roughness: 0.8,
    });
    const handle1 = new THREE.Mesh(handle1Geometry, handleMaterial);
    handle1.rotation.set(0, 0, 0);
    handle1.position.set(-18, bagHeight + 25, 0);
    handle1.castShadow = true;
    group.add(handle1);

    const handle2 = new THREE.Mesh(handle1Geometry, handleMaterial);
    handle2.rotation.set(0, 0, 0);
    handle2.position.set(18, bagHeight + 25, 0);
    handle2.castShadow = true;
    group.add(handle2);

    const cupHolderGeometry = new THREE.CylinderGeometry(32, 35, 20, RADIAL_SEGMENTS);
    const cupHolderMaterial = new THREE.MeshStandardMaterial({
      color: 0xdeb887,
      roughness: 0.9,
    });
    const cupHolder = new THREE.Mesh(cupHolderGeometry, cupHolderMaterial);
    cupHolder.position.y = bagHeight - 5;
    cupHolder.castShadow = true;
    cupHolder.receiveShadow = true;
    group.add(cupHolder);

    const rimGeometry = new THREE.TorusGeometry(32, 3, 8, RADIAL_SEGMENTS);
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xd2691e,
      roughness: 0.8,
    });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = bagHeight + 5;
    rim.castShadow = true;
    group.add(rim);

    const labelGeometry = new THREE.PlaneGeometry(45, 35);
    const labelMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6347,
      roughness: 0.7,
    });
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.set(0, bagHeight / 2 + 20, bagDepth / 2 + 2);
    group.add(label);

    const logoGeometry = new THREE.CircleGeometry(12, 24);
    const logoMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
    });
    const logo = new THREE.Mesh(logoGeometry, logoMaterial);
    logo.position.set(0, bagHeight / 2 + 20, bagDepth / 2 + 2.1);
    group.add(logo);

    const bottomGeometry = new THREE.BoxGeometry(bagWidth + 6, 4, bagDepth + 6);
    const bottomMaterial = new THREE.MeshStandardMaterial({
      color: 0xdeb887,
      roughness: 0.9,
    });
    const bottomMesh = new THREE.Mesh(bottomGeometry, bottomMaterial);
    bottomMesh.position.y = 2;
    bottomMesh.receiveShadow = true;
    group.add(bottomMesh);
  };

  const updateMeasurementLine = (totalHeight: number) => {
    if (!measurementLineRef.current) return;

    const group = measurementLineRef.current;
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    }

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff6b35, linewidth: 2 });
    const points = [
      new THREE.Vector3(65, 20, 0),
      new THREE.Vector3(65, totalHeight + 20, 0),
    ];
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(lineGeometry, lineMaterial);
    group.add(line);

    const arrowTopGeometry = new THREE.ConeGeometry(4, 10, 8);
    const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xff6b35 });
    const arrowTop = new THREE.Mesh(arrowTopGeometry, arrowMaterial);
    arrowTop.position.set(65, totalHeight + 25, 0);
    arrowTop.rotation.z = Math.PI;
    group.add(arrowTop);

    const arrowBottom = new THREE.Mesh(arrowTopGeometry, arrowMaterial);
    arrowBottom.position.set(65, 15, 0);
    group.add(arrowBottom);

    const tickMaterial = new THREE.LineBasicMaterial({ color: 0xff6b35 });
    for (let h = 0; h <= totalHeight; h += 20 * SCALE) {
      const tickPoints = [
        new THREE.Vector3(60, 20 + h, 0),
        new THREE.Vector3(70, 20 + h, 0),
      ];
      const tickGeometry = new THREE.BufferGeometry().setFromPoints(tickPoints);
      const tick = new THREE.Line(tickGeometry, tickMaterial);
      group.add(tick);
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-xl overflow-hidden"
      style={{ touchAction: 'none', cursor: 'grab' }}
    />
  );
}
