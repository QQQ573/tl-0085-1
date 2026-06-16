import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useCupStore, CupLayer, BaseType } from '../store/cupStore';

const SCALE = 0.5;
const RADIAL_SEGMENTS = 32;

export default function CupScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cupGroupRef = useRef<THREE.Group | null>(null);
  const baseGroupRef = useRef<THREE.Group | null>(null);
  const layersGroupRef = useRef<THREE.Group | null>(null);
  const measurementLineRef = useRef<THREE.Group | null>(null);
  const isDraggingRef = useRef(false);
  const previousMouseRef = useRef({ x: 0, y: 0 });
  const touchStartRef = useRef<{ distance: number; rotation: { x: number; y: number } } | null>(null);
  const animationIdRef = useRef<number>(0);

  const {
    currentPreset,
    baseType,
    rotation,
    zoom,
    crossSectionMode,
    crossSectionLayer,
    getVisibleLayers,
    getTotalHeight,
    setRotation,
    setZoom,
  } = useCupStore();

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 80, 200);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.4);
    pointLight.position.set(-50, 50, -50);
    scene.add(pointLight);

    const cupGroup = new THREE.Group();
    cupGroupRef.current = cupGroup;
    scene.add(cupGroup);

    const baseGroup = new THREE.Group();
    baseGroupRef.current = baseGroup;
    cupGroup.add(baseGroup);

    const layersGroup = new THREE.Group();
    layersGroupRef.current = layersGroup;
    cupGroup.add(layersGroup);

    const measurementLineGroup = new THREE.Group();
    measurementLineRef.current = measurementLineGroup;
    cupGroup.add(measurementLineGroup);

    const gridHelper = new THREE.GridHelper(300, 30, 0xe2e8f0, 0xf1f5f9);
    gridHelper.position.y = -5;
    scene.add(gridHelper);

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      if (cupGroupRef.current) {
        cupGroupRef.current.rotation.x = rotation.x;
        cupGroupRef.current.rotation.y = rotation.y;
      }
      if (cameraRef.current) {
        const targetZ = 200 / zoom;
        cameraRef.current.position.z = targetZ;
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
    if (cupGroupRef.current) {
      cupGroupRef.current.rotation.x = rotation.x;
      cupGroupRef.current.rotation.y = rotation.y;
    }
  }, [rotation]);

  useEffect(() => {
    if (cameraRef.current) {
      const targetZ = 200 / zoom;
      cameraRef.current.position.z = targetZ;
    }
  }, [zoom]);

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
    if (!layersGroupRef.current || !cupGroupRef.current) return;

    const layersGroup = layersGroupRef.current;
    while (layersGroup.children.length > 0) {
      const child = layersGroup.children[0];
      layersGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }

    const visibleLayers = getVisibleLayers();
    let currentY = 20;
    const cupHeight = currentPreset.cupHeight * SCALE;
    const cupTopRadius = currentPreset.cupTopRadius * SCALE;
    const cupBottomRadius = currentPreset.cupBottomRadius * SCALE;

    createCupShell(layersGroup, cupHeight, cupTopRadius, cupBottomRadius);

    if (crossSectionMode && crossSectionLayer) {
      const crossSectionIndex = visibleLayers.findIndex((l) => l.id === crossSectionLayer);
      if (crossSectionIndex >= 0) {
        for (let i = 0; i <= crossSectionIndex; i++) {
          const layer = visibleLayers[i];
          const layerHeight = layer.height * SCALE;
          const isCrossSection = i === crossSectionIndex;
          createLiquidLayer(
            layersGroup,
            layer,
            currentY,
            layerHeight,
            cupTopRadius,
            cupBottomRadius,
            cupHeight,
            isCrossSection
          );
          if (!isCrossSection) {
            currentY += layerHeight;
          }
        }
      }
    } else {
      visibleLayers.forEach((layer) => {
        const layerHeight = layer.height * SCALE;
        createLiquidLayer(
          layersGroup,
          layer,
          currentY,
          layerHeight,
          cupTopRadius,
          cupBottomRadius,
          cupHeight,
          false
        );
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
      cupHeight + 10,
      RADIAL_SEGMENTS,
      1,
      true
    );
    const cupMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      roughness: 0.1,
      metalness: 0.1,
    });
    const cupMesh = new THREE.Mesh(cupGeometry, cupMaterial);
    cupMesh.position.y = cupHeight / 2 + 15;
    cupMesh.castShadow = true;
    cupMesh.receiveShadow = true;
    group.add(cupMesh);

    const rimGeometry = new THREE.TorusGeometry(cupTopRadius + 2, 2, 8, RADIAL_SEGMENTS);
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.3,
    });
    const rimMesh = new THREE.Mesh(rimGeometry, rimMaterial);
    rimMesh.position.y = cupHeight + 20;
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.castShadow = true;
    group.add(rimMesh);
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
    const progress = y / (cupHeight * SCALE);
    const layerTopRadius = bottomRadius + (topRadius - bottomRadius) * Math.min(1, (y + height) / cupHeight);
    const layerBottomRadius = bottomRadius + (topRadius - bottomRadius) * progress;

    let geometry: THREE.BufferGeometry;
    if (isCrossSection) {
      geometry = new THREE.CylinderGeometry(
        layerTopRadius * 0.8,
        layerBottomRadius * 0.8,
        height,
        RADIAL_SEGMENTS,
        1,
        false,
        0,
        Math.PI
      );
    } else {
      geometry = new THREE.CylinderGeometry(
        layerTopRadius * 0.95,
        layerBottomRadius * 0.95,
        height,
        RADIAL_SEGMENTS
      );
    }

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(layer.color),
      transparent: true,
      opacity: isCrossSection ? 0.6 : 0.85,
      roughness: 0.3,
      metalness: 0.1,
      side: isCrossSection ? THREE.DoubleSide : THREE.FrontSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = y + height / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { layerId: layer.id, layerName: layer.name };
    group.add(mesh);

    const edgeGeometry = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.2,
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edges.position.copy(mesh.position);
    group.add(edges);
  };

  const createCupHolder = (group: THREE.Group) => {
    const holderGeometry = new THREE.CylinderGeometry(45, 50, 15, RADIAL_SEGMENTS);
    const holderMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
      metalness: 0.1,
    });
    const holderMesh = new THREE.Mesh(holderGeometry, holderMaterial);
    holderMesh.position.y = 7.5;
    holderMesh.castShadow = true;
    holderMesh.receiveShadow = true;
    group.add(holderMesh);

    const indentGeometry = new THREE.CylinderGeometry(38, 38, 5, RADIAL_SEGMENTS);
    const indentMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.9,
    });
    const indentMesh = new THREE.Mesh(indentGeometry, indentMaterial);
    indentMesh.position.y = 15;
    group.add(indentMesh);

    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const supportGeometry = new THREE.BoxGeometry(8, 30, 8);
      const supportMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.8,
      });
      const supportMesh = new THREE.Mesh(supportGeometry, supportMaterial);
      supportMesh.position.set(Math.cos(angle) * 40, 15, Math.sin(angle) * 40);
      supportMesh.castShadow = true;
      group.add(supportMesh);
    }
  };

  const createTakeoutBag = (group: THREE.Group) => {
    const bagShape = new THREE.Shape();
    bagShape.moveTo(-45, 0);
    bagShape.lineTo(-40, 50);
    bagShape.quadraticCurveTo(0, 55, 40, 50);
    bagShape.lineTo(45, 0);
    bagShape.lineTo(-45, 0);

    const bagExtrudeSettings = {
      depth: 25,
      bevelEnabled: true,
      bevelThickness: 2,
      bevelSize: 2,
      bevelSegments: 2,
    };

    const bagGeometry = new THREE.ExtrudeGeometry(bagShape, bagExtrudeSettings);
    const bagMaterial = new THREE.MeshStandardMaterial({
      color: 0xfff8dc,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });
    const bagMesh = new THREE.Mesh(bagGeometry, bagMaterial);
    bagMesh.rotation.x = -Math.PI / 2;
    bagMesh.position.z = -12.5;
    bagMesh.castShadow = true;
    bagMesh.receiveShadow = true;
    group.add(bagMesh);

    const handleGeometry = new THREE.TorusGeometry(15, 3, 8, 16, Math.PI);
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0xd2691e,
      roughness: 0.7,
    });
    const handleMesh = new THREE.Mesh(handleGeometry, handleMaterial);
    handleMesh.rotation.set(0, 0, Math.PI);
    handleMesh.position.y = 55;
    handleMesh.castShadow = true;
    group.add(handleMesh);

    const baseGeometry = new THREE.BoxGeometry(90, 5, 30);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5deb3,
      roughness: 0.9,
    });
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.y = 2.5;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);
  };

  const updateMeasurementLine = (totalHeight: number) => {
    if (!measurementLineRef.current) return;

    const group = measurementLineRef.current;
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    }

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff4444, linewidth: 2 });
    const points = [
      new THREE.Vector3(70, 20, 0),
      new THREE.Vector3(70, totalHeight + 20, 0),
    ];
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(lineGeometry, lineMaterial);
    group.add(line);

    const arrowTopGeometry = new THREE.ConeGeometry(3, 8, 8);
    const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xff4444 });
    const arrowTop = new THREE.Mesh(arrowTopGeometry, arrowMaterial);
    arrowTop.position.set(70, totalHeight + 24, 0);
    arrowTop.rotation.z = Math.PI;
    group.add(arrowTop);

    const arrowBottom = new THREE.Mesh(arrowTopGeometry, arrowMaterial);
    arrowBottom.position.set(70, 16, 0);
    group.add(arrowBottom);

    const tickMaterial = new THREE.LineBasicMaterial({ color: 0xff4444 });
    for (let h = 0; h <= totalHeight; h += 20 * SCALE) {
      const tickPoints = [
        new THREE.Vector3(65, 20 + h, 0),
        new THREE.Vector3(75, 20 + h, 0),
      ];
      const tickGeometry = new THREE.BufferGeometry().setFromPoints(tickPoints);
      const tick = new THREE.Line(tickGeometry, tickMaterial);
      group.add(tick);
    }
  };

  useEffect(() => {
    if (!containerRef.current || !rendererRef.current) return;

    const domElement = rendererRef.current.domElement;

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMouseRef.current.x;
      const deltaY = e.clientY - previousMouseRef.current.y;
      previousMouseRef.current = { x: e.clientX, y: e.clientY };
      setRotation(
        Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rotation.x + deltaY * 0.01)),
        rotation.y + deltaX * 0.01
      );
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(zoom * delta);
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
          rotation: { ...rotation },
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && isDraggingRef.current) {
        const deltaX = e.touches[0].clientX - previousMouseRef.current.x;
        const deltaY = e.touches[0].clientY - previousMouseRef.current.y;
        previousMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        setRotation(
          Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rotation.x + deltaY * 0.01)),
          rotation.y + deltaX * 0.01
        );
      } else if (e.touches.length === 2 && touchStartRef.current) {
        const newDistance = getTouchDistance(e.touches);
        const scale = newDistance / touchStartRef.current.distance;
        setZoom(zoom * scale);
      }
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
      touchStartRef.current = null;
    };

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
  }, [rotation, zoom, setRotation, setZoom]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-xl overflow-hidden shadow-lg"
      style={{ touchAction: 'none' }}
    />
  );
}
