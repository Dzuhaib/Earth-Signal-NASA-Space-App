/**
 * EarthSignal — 3D Earth Globe ("Map Ball")
 * Precision Cartographic & Telemetry Edition:
 * - 4K NASA Blue Marble photographic satellite imagery (/assets/earth_hd_4k.jpg)
 * - HD Topographic bump & normal relief maps (/assets/earth_topology_hd.png, /assets/earth_normal_2048.jpg)
 * - Crisp 3D Vector Borders & Rivers (/assets/countries_110m.geojson, /assets/rivers_50m.geojson) + Indus Basin & Provincial boundaries
 * - Real Map Cartographic Labels (Countries, Provinces, Rivers, and Cities with Live NASA Values) projected in real time with Horizon Culling & Zoom LOD
 * - Dynamic Distance-Adaptive Sticky Scaling (pins & halos automatically shrink as you zoom in so cities never overlap)
 * - Instantaneous Full-Viewport & Native Fullscreen Mode (z-[99999] + ResizeObserver + ESC support)
 */

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  Compass,
  Cloud,
  Maximize2,
  Minimize2,
  Waves,
  MapPin,
  X,
  Info,
  Layers,
  Tag,
} from 'lucide-react';
import { GeographicRegion, CityMarker, StatisticalAnalysisResponse } from '../../types/earthsignal';
import { getStoredAnnotations, saveAnnotation, deleteAnnotation, MapAnnotation } from '../../services/annotations/annotationStore';
import {
  ACCURATE_CITIES,
  ENVIRONMENTAL_VARIABLES,
  getCityMetricForVariableAndYear,
  MetricValueResult,
} from '../../services/nasa/nasaRegistry';

interface Earth3DGlobeProps {
  regions: GeographicRegion[];
  selectedRegion: GeographicRegion;
  onSelectRegion: (region: GeographicRegion) => void;
  onSelectCoordinates?: (lat: number, lon: number) => void;
  selectedVariable: string;
  selectedYear?: number;
  isSingleYearMode?: boolean;
  isFloodMode?: boolean;
  onToggleFloodMode?: () => void;
  analysis?: StatisticalAnalysisResponse | null;
  liveCityMetrics?: Record<string, any>;
  livePointMetrics?: Record<string, any>;
  compact?: boolean;
  baseMapStyle?: 'satellite' | 'cartography' | 'analytical';
}

interface CartographicLabelDef {
  id: string;
  name: string;
  lat: number;
  lon: number;
  kind: 'country' | 'province' | 'water' | 'river';
  minZoomZ: number; // Visible when camera.position.z <= minZoomZ
}

/**
 * Real-world cartographic labels for Countries, Provinces, Oceans, and Major Rivers
 */
const CARTOGRAPHIC_MAP_LABELS: CartographicLabelDef[] = [
  // Primary Countries (Visible globally & regionally)
  { id: 'lbl_pakistan', name: 'PAKISTAN', lat: 30.2, lon: 69.3, kind: 'country', minZoomZ: 9.5 },
  { id: 'lbl_india', name: 'INDIA', lat: 22.8, lon: 79.0, kind: 'country', minZoomZ: 9.5 },
  { id: 'lbl_china', name: 'CHINA', lat: 35.8, lon: 103.8, kind: 'country', minZoomZ: 9.5 },
  { id: 'lbl_afghanistan', name: 'AFGHANISTAN', lat: 33.9, lon: 65.7, kind: 'country', minZoomZ: 8.5 },
  { id: 'lbl_iran', name: 'IRAN', lat: 32.4, lon: 53.7, kind: 'country', minZoomZ: 8.5 },
  { id: 'lbl_saudi', name: 'SAUDI ARABIA', lat: 24.0, lon: 45.0, kind: 'country', minZoomZ: 8.5 },
  { id: 'lbl_uae', name: 'U.A.E.', lat: 24.3, lon: 54.4, kind: 'country', minZoomZ: 6.5 },
  { id: 'lbl_oman', name: 'OMAN', lat: 21.5, lon: 57.0, kind: 'country', minZoomZ: 7.0 },
  { id: 'lbl_nepal', name: 'NEPAL', lat: 28.4, lon: 84.1, kind: 'country', minZoomZ: 6.8 },
  { id: 'lbl_bangladesh', name: 'BANGLADESH', lat: 23.7, lon: 90.4, kind: 'country', minZoomZ: 6.8 },
  { id: 'lbl_kazakhstan', name: 'KAZAKHSTAN', lat: 48.0, lon: 66.9, kind: 'country', minZoomZ: 8.5 },
  { id: 'lbl_uzbekistan', name: 'UZBEKISTAN', lat: 41.4, lon: 64.6, kind: 'country', minZoomZ: 6.8 },
  { id: 'lbl_turkmenistan', name: 'TURKMENISTAN', lat: 38.9, lon: 59.6, kind: 'country', minZoomZ: 6.8 },
  { id: 'lbl_turkey', name: 'TURKEY', lat: 39.0, lon: 35.2, kind: 'country', minZoomZ: 8.5 },
  { id: 'lbl_egypt', name: 'EGYPT', lat: 26.8, lon: 30.8, kind: 'country', minZoomZ: 8.5 },
  { id: 'lbl_niger', name: 'NIGER (SAHEL)', lat: 17.6, lon: 8.1, kind: 'country', minZoomZ: 9.0 },
  { id: 'lbl_nigeria', name: 'NIGERIA', lat: 9.1, lon: 8.7, kind: 'country', minZoomZ: 8.0 },
  { id: 'lbl_brazil', name: 'BRAZIL', lat: -10.8, lon: -53.0, kind: 'country', minZoomZ: 9.5 },
  { id: 'lbl_spain', name: 'SPAIN', lat: 40.4, lon: -3.7, kind: 'country', minZoomZ: 9.0 },
  { id: 'lbl_france', name: 'FRANCE', lat: 46.6, lon: 2.2, kind: 'country', minZoomZ: 8.0 },
  { id: 'lbl_svalbard', name: 'SVALBARD (NORWAY)', lat: 78.9, lon: 16.0, kind: 'country', minZoomZ: 9.5 },
  { id: 'lbl_usa', name: 'UNITED STATES', lat: 39.8, lon: -98.6, kind: 'country', minZoomZ: 9.5 },
  { id: 'lbl_australia', name: 'AUSTRALIA', lat: -25.3, lon: 133.8, kind: 'country', minZoomZ: 9.5 },

  // Pakistan Provinces & Autonomous Territories (Visible at regional & close zoom)
  { id: 'lbl_prov_sindh', name: 'SINDH PROVINCE', lat: 26.15, lon: 68.55, kind: 'province', minZoomZ: 6.8 },
  { id: 'lbl_prov_punjab', name: 'PUNJAB', lat: 31.15, lon: 72.65, kind: 'province', minZoomZ: 5.8 },
  { id: 'lbl_prov_balochistan', name: 'BALOCHISTAN', lat: 28.35, lon: 65.15, kind: 'province', minZoomZ: 5.8 },
  { id: 'lbl_prov_kpk', name: 'KHYBER PAKHTUNKHWA', lat: 34.45, lon: 71.85, kind: 'province', minZoomZ: 5.4 },
  { id: 'lbl_prov_gb', name: 'GILGIT-BALTISTAN', lat: 35.85, lon: 75.15, kind: 'province', minZoomZ: 5.4 },

  // Seas & Major Hydrological Features
  { id: 'lbl_arabian_sea', name: 'Arabian Sea', lat: 19.5, lon: 64.5, kind: 'water', minZoomZ: 8.5 },
  { id: 'lbl_bay_bengal', name: 'Bay of Bengal', lat: 15.0, lon: 88.0, kind: 'water', minZoomZ: 8.0 },
  { id: 'lbl_indus_river', name: 'Indus River', lat: 27.1, lon: 68.15, kind: 'river', minZoomZ: 4.9 },
];

/**
 * Converts Latitude & Longitude to 3D Cartesian coordinates on a sphere of radius R
 */
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

/**
 * Converts 3D Cartesian coordinates on a sphere back to Latitude and Longitude
 */
function vector3ToLatLon(v: THREE.Vector3): { lat: number; lon: number } {
  const norm = v.clone().normalize();
  const lat = Math.asin(Math.max(-1, Math.min(1, norm.y))) * (180 / Math.PI);
  let lon = Math.atan2(norm.z, -norm.x) * (180 / Math.PI) - 180;
  if (lon < -180) lon += 360;
  if (lon > 180) lon -= 360;
  return { lat, lon };
}

/**
 * High-precision vector paths for Indus River, tributaries, and Pakistan provincial boundaries
 */
const PAKISTAN_HIGH_RES_VECTORS = {
  indusRiverMain: [
    [35.2, 76.0], [35.8, 74.6], [35.4, 73.2], [34.1, 72.7], [33.0, 71.5],
    [31.6, 71.1], [30.1, 70.9], [28.9, 70.3], [28.4, 69.7], [27.705, 68.857],
    [27.55, 68.28], [26.73, 67.85], [26.24, 68.15], [25.39, 68.32],
    [24.75, 67.92], [24.12, 67.45],
  ],
  chenabSutlejTributary: [
    [32.6, 74.5], [31.5, 73.1], [30.2, 71.5], [29.3, 71.1], [28.9, 70.3],
  ],
  sindhBoundary: [
    [28.5, 69.8], [28.4, 68.0], [27.9, 67.3], [27.1, 67.1], [26.1, 67.2],
    [25.2, 66.7], [24.8, 66.7], [24.1, 67.4], [24.3, 68.8], [24.3, 70.9],
    [25.4, 70.8], [26.5, 70.2], [27.8, 69.6], [28.5, 69.8],
  ],
  punjabBoundary: [
    [33.9, 72.3], [33.0, 71.4], [31.0, 70.2], [28.5, 69.8], [29.0, 71.8],
    [30.2, 73.9], [31.6, 74.5], [32.8, 74.4], [33.9, 72.3],
  ],
  balochistanBoundary: [
    [31.9, 69.9], [31.1, 66.5], [29.8, 66.0], [29.5, 61.0], [25.2, 61.6],
    [25.2, 66.7], [27.1, 67.1], [28.4, 68.0], [30.1, 70.2], [31.9, 69.9],
  ],
};

function createFallbackEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#070b14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let lat = -80; lat <= 80; lat += 20) {
    const y = ((90 - lat) / 180) * canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  for (let lon = -180; lon <= 180; lon += 30) {
    const x = ((lon + 180) / 360) * canvas.width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export const Earth3DGlobe: React.FC<Earth3DGlobeProps> = ({
  regions,
  selectedRegion,
  onSelectRegion,
  onSelectCoordinates,
  selectedVariable,
  selectedYear = 2026,
  isSingleYearMode = true,
  isFloodMode = false,
  onToggleFloodMode,
  analysis,
  liveCityMetrics = {},
  livePointMetrics = {},
  compact = false,
  baseMapStyle = 'satellite',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const labelsContainerRef = useRef<HTMLDivElement>(null);

  // Active Variable Metadata & Real Metric (Prefer live NASA API metric if available)
  const variableMeta = (ENVIRONMENTAL_VARIABLES as any)[selectedVariable];
  const activeMetric: MetricValueResult = useMemo(() => {
    const livePoint = livePointMetrics[selectedVariable];
    if (livePoint && livePoint.formatted) {
      return livePoint;
    }
    const liveCity = liveCityMetrics[selectedRegion.id];
    if (liveCity && liveCity.formatted) {
      return liveCity;
    }
    return getCityMetricForVariableAndYear(selectedRegion, selectedVariable, selectedYear);
  }, [selectedRegion, selectedVariable, selectedYear, livePointMetrics, liveCityMetrics]);

  // Helper to resolve city metric (preferring live NASA API response over model fallback)
  const resolveCityMetric = useCallback(
    (city: CityMarker): MetricValueResult => {
      const live = liveCityMetrics[city.id];
      if (live && live.formatted) {
        return live;
      }
      return getCityMetricForVariableAndYear(city, selectedVariable, selectedYear);
    },
    [liveCityMetrics, selectedVariable, selectedYear]
  );

  // States
  const [autoRotate, setAutoRotate] = useState<boolean>(false); // Static by default
  const [showClouds, setShowClouds] = useState<boolean>(true);
  const [showCities, setShowCities] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [showAffectedDisks, setShowAffectedDisks] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showTransparencyGuide, setShowTransparencyGuide] = useState<boolean>(false);
  // Default zoom at 20%: ((9.5 - 8.12) / (9.5 - 2.58)) * 100 = 20%
  const [zoomDistance, setZoomDistance] = useState<number>(8.12);

  // Hover targets
  const [hoveredRegion, setHoveredRegion] = useState<GeographicRegion | null>(null);
  const [hoveredCity, setHoveredCity] = useState<CityMarker | null>(null);
  const [lastClickedCoords, setLastClickedCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [satelliteLoaded, setSatelliteLoaded] = useState<boolean>(false);

  // Annotation Layer States
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);
  const [annotations, setAnnotations] = useState<MapAnnotation[]>(getStoredAnnotations());
  const [isAddingAnnotation, setIsAddingAnnotation] = useState<boolean>(false);
  const isAddingAnnotationRef = useRef<boolean>(false);
  const [pendingAnnotationCoords, setPendingAnnotationCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState<MapAnnotation | null>(null);
  const [newAnnTitle, setNewAnnTitle] = useState<string>('');
  const [newAnnCategory, setNewAnnCategory] = useState<'Hydrology' | 'Agriculture' | 'Temperature' | 'Ecology' | 'General'>('General');
  const [newAnnNote, setNewAnnNote] = useState<string>('');
  const [newAnnAuthor, setNewAnnAuthor] = useState<string>('NASA Researcher');

  useEffect(() => {
    isAddingAnnotationRef.current = isAddingAnnotation;
  }, [isAddingAnnotation]);

  // References for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const vectorsGroupRef = useRef<THREE.Group | null>(null);
  const markersGroupRef = useRef<THREE.Group | null>(null);
  const citiesGroupRef = useRef<THREE.Group | null>(null);
  const activeTargetGroupRef = useRef<THREE.Group | null>(null);
  const targetRotationRef = useRef<{ x: number; y: number }>({
    x: 26.0 * (Math.PI / 180),
    y: -((68.5 + 180) * (Math.PI / 180)) + Math.PI / 2,
  });
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const autoRotateRef = useRef<boolean>(false);
  const showLabelsRef = useRef<boolean>(true);
  const showCitiesRef = useRef<boolean>(true);
  const lastTouchTimeRef = useRef<number>(0);
  const onSelectCoordinatesRef = useRef(onSelectCoordinates);
  const onSelectRegionRef = useRef(onSelectRegion);
  const earthMeshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!earthMeshRef.current) return;
    const mat = earthMeshRef.current.material as THREE.MeshStandardMaterial;
    if (baseMapStyle === 'analytical') {
      mat.color.setHex(0x06b6d4);
      mat.roughness = 0.2;
      mat.metalness = 0.5;
    } else if (baseMapStyle === 'cartography') {
      mat.color.setHex(0xffffff);
      mat.roughness = 0.5;
      mat.metalness = 0.05;
    } else {
      mat.color.setHex(0xffffff);
      mat.roughness = 0.68;
      mat.metalness = 0.1;
    }
    mat.needsUpdate = true;
  }, [baseMapStyle]);

  useEffect(() => {
    onSelectCoordinatesRef.current = onSelectCoordinates;
  }, [onSelectCoordinates]);

  useEffect(() => {
    onSelectRegionRef.current = onSelectRegion;
  }, [onSelectRegion]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    showLabelsRef.current = showLabels;
  }, [showLabels]);

  useEffect(() => {
    showCitiesRef.current = showCities;
  }, [showCities]);

  const GLOBE_RADIUS = 2.4;

  // Toggle Fullscreen (Supports both Native Browser Fullscreen and Instantaneous 100vw x 100vh Fixed Viewport)
  const handleToggleFullscreen = useCallback(() => {
    const nextState = !isFullscreen;
    setIsFullscreen(nextState);

    if (nextState) {
      document.body.style.overflow = 'hidden';
      if (containerRef.current && containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {
          // In sandboxed iframes where requestFullscreen is restricted, fixed inset-0 z-[99999] handles 100% viewport expansion
        });
      }
    } else {
      document.body.style.overflow = '';
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [isFullscreen]);

  // Sync with native fullscreenchange (e.g., if user presses ESC in native fullscreen)
  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        // Only exit if browser was actually in native fullscreen
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // Main Three.js Scene Setup
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 580;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera initialized at z = 8.12 (20% default zoom magnification)
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.02, 100);
    camera.position.set(0, 0, 8.12);
    cameraRef.current = camera;

    // 3. Renderer with Maximum Anisotropy
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;

    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.98);
    scene.add(ambientLight);

    const sunKeyLight = new THREE.DirectionalLight(0xffffff, 2.1);
    sunKeyLight.position.set(6, 3, 5);
    scene.add(sunKeyLight);

    const softFillLight = new THREE.DirectionalLight(0x93c5fd, 0.85);
    softFillLight.position.set(-6, -2, -4);
    scene.add(softFillLight);

    // 5. Globe Group
    const globeGroup = new THREE.Group();
    globeGroup.rotation.x = targetRotationRef.current.x;
    globeGroup.rotation.y = targetRotationRef.current.y;
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // 6. High-Density 160x160 Earth Sphere Geometry & 4K HD Textures
    const earthGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 160, 160);
    const fallbackTexture = createFallbackEarthTexture();
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    const earthMaterial = new THREE.MeshStandardMaterial({
      map: fallbackTexture,
      roughness: 0.68,
      metalness: 0.1,
      bumpScale: 0.04,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    earthMesh.name = 'earthMesh';
    earthMeshRef.current = earthMesh;
    globeGroup.add(earthMesh);

    const textureLoader = new THREE.TextureLoader();

    // Load 4K HD Blue Marble first, fallback to 2048px if needed
    textureLoader.load(
      '/assets/earth_hd_4k.jpg',
      (hdTexture) => {
        hdTexture.colorSpace = THREE.SRGBColorSpace;
        hdTexture.anisotropy = maxAnisotropy;
        hdTexture.minFilter = THREE.LinearMipmapLinearFilter;
        hdTexture.magFilter = THREE.LinearFilter;
        hdTexture.generateMipmaps = true;
        earthMaterial.map = hdTexture;
        earthMaterial.needsUpdate = true;
        setSatelliteLoaded(true);
      },
      undefined,
      () => {
        textureLoader.load('/assets/earth_satellite_2048.jpg', (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = maxAnisotropy;
          earthMaterial.map = tex;
          earthMaterial.needsUpdate = true;
          setSatelliteLoaded(true);
        });
      }
    );

    // Load HD Topographic Bump Map
    textureLoader.load('/assets/earth_topology_hd.png', (bumpTex) => {
      bumpTex.anisotropy = maxAnisotropy;
      earthMaterial.bumpMap = bumpTex;
      earthMaterial.bumpScale = 0.035;
      earthMaterial.needsUpdate = true;
    });

    // Load Normal Map
    textureLoader.load('/assets/earth_normal_2048.jpg', (normalTexture) => {
      normalTexture.anisotropy = maxAnisotropy;
      earthMaterial.normalMap = normalTexture;
      earthMaterial.normalScale = new THREE.Vector2(0.55, 0.55);
      earthMaterial.needsUpdate = true;
    });

    // 7. Crisp 3D Vector Overlay Group (Borders, Coastlines, Rivers, Indus Basin, Graticules)
    const vectorsGroup = new THREE.Group();
    vectorsGroup.name = 'vectorsGroup';
    globeGroup.add(vectorsGroup);
    vectorsGroupRef.current = vectorsGroup;

    // 7a. Fine Precision Lat/Lon Graticule Grid
    const graticuleMaterial = new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.12,
    });
    for (let lat = -75; lat <= 75; lat += 15) {
      const pts: THREE.Vector3[] = [];
      for (let lon = -180; lon <= 180; lon += 4) {
        pts.push(latLonToVector3(lat, lon, GLOBE_RADIUS * 1.0008));
      }
      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      vectorsGroup.add(new THREE.Line(geom, graticuleMaterial));
    }
    for (let lon = -180; lon < 180; lon += 15) {
      const pts: THREE.Vector3[] = [];
      for (let lat = -80; lat <= 80; lat += 4) {
        pts.push(latLonToVector3(lat, lon, GLOBE_RADIUS * 1.0008));
      }
      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      vectorsGroup.add(new THREE.Line(geom, graticuleMaterial));
    }

    // 7b. High-Precision Pakistan Provinces & Indus River System (Always razor-sharp on zoom)
    const sindhBorderMat = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.88,
    });
    const provBorderMat = new THREE.LineBasicMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.48,
    });
    const indusRiverMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.92,
    });

    const addVectorPath = (coords: number[][], mat: THREE.LineBasicMaterial, alt = 1.0018) => {
      const pts = coords.map(([lat, lon]) => latLonToVector3(lat, lon, GLOBE_RADIUS * alt));
      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      vectorsGroup.add(new THREE.Line(geom, mat));
    };

    addVectorPath(PAKISTAN_HIGH_RES_VECTORS.sindhBoundary, sindhBorderMat, 1.002);
    addVectorPath(PAKISTAN_HIGH_RES_VECTORS.punjabBoundary, provBorderMat, 1.0016);
    addVectorPath(PAKISTAN_HIGH_RES_VECTORS.balochistanBoundary, provBorderMat, 1.0016);
    addVectorPath(PAKISTAN_HIGH_RES_VECTORS.indusRiverMain, indusRiverMat, 1.0022);
    addVectorPath(PAKISTAN_HIGH_RES_VECTORS.chenabSutlejTributary, indusRiverMat, 1.0022);

    // 7c. Load Global Country Borders GeoJSON (/assets/countries_110m.geojson)
    fetch('/assets/countries_110m.geojson')
      .then((r) => r.json())
      .then((geojson) => {
        if (!geojson?.features) return;
        const countryBorderMat = new THREE.LineBasicMaterial({
          color: 0xcbd5e1,
          transparent: true,
          opacity: 0.38,
        });

        geojson.features.forEach((feat: any) => {
          const geom = feat.geometry;
          if (!geom) return;
          const drawRing = (ring: number[][]) => {
            const pts = ring.map(([lon, lat]) => latLonToVector3(lat, lon, GLOBE_RADIUS * 1.0012));
            const lineGeom = new THREE.BufferGeometry().setFromPoints(pts);
            vectorsGroup.add(new THREE.Line(lineGeom, countryBorderMat));
          };
          if (geom.type === 'Polygon') {
            geom.coordinates.forEach(drawRing);
          } else if (geom.type === 'MultiPolygon') {
            geom.coordinates.forEach((poly: number[][][]) => poly.forEach(drawRing));
          }
        });
      })
      .catch(() => {});

    // 7d. Load Global Rivers GeoJSON (/assets/rivers_50m.geojson)
    fetch('/assets/rivers_50m.geojson')
      .then((r) => r.json())
      .then((geojson) => {
        if (!geojson?.features) return;
        const riverLineMat = new THREE.LineBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.45,
        });

        geojson.features.forEach((feat: any) => {
          const geom = feat.geometry;
          if (!geom) return;
          const drawLine = (coords: number[][]) => {
            const pts = coords.map(([lon, lat]) => latLonToVector3(lat, lon, GLOBE_RADIUS * 1.0014));
            const lineGeom = new THREE.BufferGeometry().setFromPoints(pts);
            vectorsGroup.add(new THREE.Line(lineGeom, riverLineMat));
          };
          if (geom.type === 'LineString') {
            drawLine(geom.coordinates);
          } else if (geom.type === 'MultiLineString') {
            geom.coordinates.forEach(drawLine);
          }
        });
      })
      .catch(() => {});

    // 8. Concentric Atmospheric Cloud Layer
    const cloudsGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.012, 96, 96);
    const cloudsMaterial = new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    cloudsMeshRef.current = cloudsMesh;
    globeGroup.add(cloudsMesh);

    textureLoader.load('/assets/earth_clouds_1024.png', (cloudsTexture) => {
      cloudsTexture.anisotropy = maxAnisotropy;
      cloudsMaterial.map = cloudsTexture;
      cloudsMaterial.needsUpdate = true;
    });

    // 9. Atmospheric Outer Rayleigh Glow
    const atmosphereGlowGeom = new THREE.SphereGeometry(GLOBE_RADIUS * 1.028, 64, 64);
    const atmosphereGlowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const atmosphereGlowMesh = new THREE.Mesh(atmosphereGlowGeom, atmosphereGlowMat);
    globeGroup.add(atmosphereGlowMesh);

    // 10. Affected Region Markers Group
    const markersGroup = new THREE.Group();
    markersGroup.name = 'markersGroup';
    globeGroup.add(markersGroup);
    markersGroupRef.current = markersGroup;

    // 11. Accurate Cities Group
    const citiesGroup = new THREE.Group();
    citiesGroup.name = 'citiesGroup';
    globeGroup.add(citiesGroup);
    citiesGroupRef.current = citiesGroup;

    // 11b. Sticky Active Target Pin Group (Locks onto any clicked surface point or city)
    const activeTargetGroup = new THREE.Group();
    activeTargetGroup.name = 'activeTargetGroup';
    globeGroup.add(activeTargetGroup);
    activeTargetGroupRef.current = activeTargetGroup;

    // 12. Mouse & Mobile Touch Interaction (Adaptive drag speed & 2-finger pinch zoom)
    const canvas = renderer.domElement;
    canvas.style.touchAction = 'none';

    const selectPointAtClientCoords = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const mouseX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

      // 1. Check direct city pin click/tap
      if (citiesGroupRef.current) {
        const cityHits = raycaster.intersectObjects(citiesGroupRef.current.children, true);
        const cityObj = cityHits.find((h) => h.object.userData?.city);
        if (cityObj && cityObj.object.userData?.city) {
          const city: CityMarker = cityObj.object.userData.city;
          setLastClickedCoords({ lat: city.latitude, lon: city.longitude });
          if (onSelectCoordinatesRef.current) {
            onSelectCoordinatesRef.current(city.latitude, city.longitude);
          }
          return;
        }
      }

      // 2. Check regional sentinel tip click/tap
      if (markersGroupRef.current) {
        const markerHits = raycaster.intersectObjects(markersGroupRef.current.children, true);
        const hit = markerHits.find((h) => h.object.userData?.region);
        if (hit && hit.object.userData?.region) {
          const reg: GeographicRegion = hit.object.userData.region;
          setLastClickedCoords({ lat: reg.latitude, lon: reg.longitude });
          onSelectRegionRef.current(reg);
          return;
        }
      }

      // 3. Check globe surface click/tap for exact coordinates
      const earthHits = raycaster.intersectObject(earthMesh);
      if (earthHits.length > 0) {
        const point = earthHits[0].point;
        globeGroup.updateMatrixWorld();
        const localPoint = globeGroup.worldToLocal(point.clone());
        const { lat, lon } = vector3ToLatLon(localPoint);

        // If user tapped very close to a known city (< 0.28 deg), snap cleanly to that city's pin
        let nearestCity: CityMarker | null = null;
        let minDegDist = 0.28;
        if (showCitiesRef.current) {
          for (const city of ACCURATE_CITIES) {
            const d = Math.hypot(city.latitude - lat, city.longitude - lon);
            if (d < minDegDist) {
              minDegDist = d;
              nearestCity = city;
            }
          }
        }

        const finalLat = nearestCity ? nearestCity.latitude : lat;
        const finalLon = nearestCity ? nearestCity.longitude : lon;

        if (isAddingAnnotationRef.current) {
          setPendingAnnotationCoords({ lat: finalLat, lon: finalLon });
          setIsAddingAnnotation(false);
          return;
        }

        setLastClickedCoords({ lat: finalLat, lon: finalLon });
        if (onSelectCoordinatesRef.current) {
          onSelectCoordinatesRef.current(finalLat, finalLon);
        }
      }
    };

    let mouseMovedDist = 0;

    const onMouseDown = (e: MouseEvent) => {
      if (Date.now() - lastTouchTimeRef.current < 600) return;
      isDraggingRef.current = true;
      mouseMovedDist = 0;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (Date.now() - lastTouchTimeRef.current < 600) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

      let hitFound = false;

      if (citiesGroupRef.current) {
        const cityHits = raycaster.intersectObjects(citiesGroupRef.current.children, true);
        const cityObj = cityHits.find((h) => h.object.userData?.city);
        if (cityObj && cityObj.object.userData?.city) {
          setHoveredCity(cityObj.object.userData.city);
          setHoveredRegion(null);
          canvas.style.cursor = 'pointer';
          hitFound = true;
        }
      }

      if (!hitFound && markersGroupRef.current) {
        const regionHits = raycaster.intersectObjects(markersGroupRef.current.children, true);
        const regObj = regionHits.find((h) => h.object.userData?.region);
        if (regObj && regObj.object.userData?.region) {
          setHoveredRegion(regObj.object.userData.region);
          setHoveredCity(null);
          canvas.style.cursor = 'pointer';
          hitFound = true;
        }
      }

      if (!hitFound) {
        setHoveredCity(null);
        setHoveredRegion(null);
        canvas.style.cursor = isDraggingRef.current ? 'grabbing' : 'grab';
      }

      if (!isDraggingRef.current) return;

      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;
      mouseMovedDist += Math.hypot(deltaX, deltaY);

      const distFromSurface = Math.max(0.18, camera.position.z - GLOBE_RADIUS);
      const dragSensitivity = Math.min(0.005, Math.max(0.0006, (distFromSurface / 3.6) * 0.0045));

      targetRotationRef.current.y += deltaX * dragSensitivity;
      targetRotationRef.current.x += deltaY * dragSensitivity;
      targetRotationRef.current.x = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, targetRotationRef.current.x));

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onClick = (e: MouseEvent) => {
      if (Date.now() - lastTouchTimeRef.current < 600) return;
      if (mouseMovedDist > 8) return;
      selectPointAtClientCoords(e.clientX, e.clientY);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const distFromSurface = Math.max(0.16, camera.position.z - GLOBE_RADIUS);
      const step = e.deltaY * 0.0012 * Math.max(0.32, distFromSurface);
      camera.position.z = Math.max(2.58, Math.min(9.5, camera.position.z + step));
      setZoomDistance(Number(camera.position.z.toFixed(2)));
    };

    // Mobile Touch Support: 1-finger drag rotation, 2-finger pinch zoom, and tap-to-select without scrolling page
    let touchMovedDist = 0;
    let initialPinchDist = 0;
    let initialPinchZoomZ = camera.position.z;

    const onTouchStart = (e: TouchEvent) => {
      lastTouchTimeRef.current = Date.now();
      if (e.cancelable) e.preventDefault();

      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        touchMovedDist = 0;
        previousMousePositionRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      } else if (e.touches.length === 2) {
        isDraggingRef.current = false;
        touchMovedDist = 999;
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        initialPinchDist = Math.hypot(dx, dy);
        initialPinchZoomZ = camera.position.z;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      lastTouchTimeRef.current = Date.now();
      if (e.cancelable) e.preventDefault();

      if (e.touches.length === 1 && isDraggingRef.current) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - previousMousePositionRef.current.x;
        const deltaY = touch.clientY - previousMousePositionRef.current.y;
        touchMovedDist += Math.hypot(deltaX, deltaY);

        const distFromSurface = Math.max(0.18, camera.position.z - GLOBE_RADIUS);
        const dragSensitivity = Math.min(0.0055, Math.max(0.0007, (distFromSurface / 3.6) * 0.005));

        targetRotationRef.current.y += deltaX * dragSensitivity;
        targetRotationRef.current.x += deltaY * dragSensitivity;
        targetRotationRef.current.x = Math.max(
          -Math.PI / 2.1,
          Math.min(Math.PI / 2.1, targetRotationRef.current.x)
        );

        previousMousePositionRef.current = { x: touch.clientX, y: touch.clientY };
      } else if (e.touches.length === 2 && initialPinchDist > 10) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        const currentDist = Math.max(10, Math.hypot(dx, dy));
        const ratio = initialPinchDist / currentDist;
        const targetSurfaceDist = Math.max(0.18, (initialPinchZoomZ - GLOBE_RADIUS) * ratio);
        camera.position.z = Math.max(2.58, Math.min(9.5, GLOBE_RADIUS + targetSurfaceDist));
        setZoomDistance(Number(camera.position.z.toFixed(2)));
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      lastTouchTimeRef.current = Date.now();
      if (e.cancelable) e.preventDefault();

      if (e.touches.length === 0) {
        if (isDraggingRef.current && touchMovedDist < 14 && e.changedTouches.length > 0) {
          const t = e.changedTouches[0];
          selectPointAtClientCoords(t.clientX, t.clientY);
        }
        isDraggingRef.current = false;
        initialPinchDist = 0;
      } else if (e.touches.length === 1) {
        previousMousePositionRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        isDraggingRef.current = true;
      }
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });

    // Reusable vectors for 60fps cartographic label projection
    const tempLocalPos = new THREE.Vector3();
    const tempWorldPos = new THREE.Vector3();
    const tempNormal = new THREE.Vector3();
    const tempCameraDir = new THREE.Vector3();
    const tempProjected = new THREE.Vector3();

    // 13. Animation Render Loop with Dynamic Sticky Scaling & Real-Time Cartographic Label Projection
    let animationFrameId = 0;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (globeGroupRef.current) {
        if (autoRotateRef.current && !isDraggingRef.current) {
          targetRotationRef.current.y += 0.0015;
          if (cloudsMeshRef.current) {
            cloudsMeshRef.current.rotation.y += 0.0004;
          }
        }

        globeGroupRef.current.rotation.y += (targetRotationRef.current.y - globeGroupRef.current.rotation.y) * 0.12;
        globeGroupRef.current.rotation.x += (targetRotationRef.current.x - globeGroupRef.current.rotation.x) * 0.12;
        globeGroupRef.current.updateMatrixWorld();
      }

      // DYNAMIC ZOOM-ADAPTIVE SCALING FOR STICKIES (CITIES, REGION BEACONS & ACTIVE TARGET PIN)
      const camZ = camera.position.z;
      const distToSurface = Math.max(0.16, camZ - GLOBE_RADIUS);
      const baseSurfaceDist = 3.6;
      const stickyScale = Math.max(0.14, Math.min(1.1, Math.pow(distToSurface / baseSurfaceDist, 0.85)));

      if (citiesGroupRef.current) {
        citiesGroupRef.current.children.forEach((anchor) => {
          anchor.scale.setScalar(stickyScale);
        });
      }

      if (markersGroupRef.current) {
        markersGroupRef.current.children.forEach((anchor) => {
          anchor.scale.setScalar(stickyScale);
        });
      }

      if (activeTargetGroupRef.current) {
        activeTargetGroupRef.current.children.forEach((anchor) => {
          anchor.scale.setScalar(stickyScale);
        });
      }

      // Fade out clouds automatically when zooming in close so satellite terrain & rivers are crystal clear
      if (cloudsMeshRef.current) {
        const cloudMat = cloudsMeshRef.current.material as THREE.MeshStandardMaterial;
        const zoomCloudFactor = Math.max(0.03, Math.min(1.0, (distToSurface - 0.18) / 1.8));
        cloudMat.opacity = 0.25 * zoomCloudFactor;
      }

      renderer.render(scene, camera);

      // PROJECT REAL-TIME CARTOGRAPHIC COUNTRY, PROVINCE & CITY LABELS ONTO SCREEN OVERLAY
      if (labelsContainerRef.current && globeGroupRef.current && mountRef.current) {
        const cw = mountRef.current.clientWidth;
        const ch = mountRef.current.clientHeight;
        const labelNodes = labelsContainerRef.current.children;

        for (let i = 0; i < labelNodes.length; i++) {
          const el = labelNodes[i] as HTMLElement;
          el.style.pointerEvents = 'none';

          if (!showLabelsRef.current) {
            el.style.opacity = '0';
            continue;
          }

          const lat = parseFloat(el.dataset.lat || '0');
          const lon = parseFloat(el.dataset.lon || '0');
          const minZoomZ = parseFloat(el.dataset.minzoom || '9.5');
          const isCityLabel = el.dataset.kind === 'city';

          if (isCityLabel && !showCitiesRef.current) {
            el.style.opacity = '0';
            continue;
          }

          // Check Zoom Level-of-Detail (LOD)
          if (camZ > minZoomZ) {
            el.style.opacity = '0';
            continue;
          }

          // Convert lat/lon to local 3D vector, then to world space
          const phi = (90 - lat) * (Math.PI / 180);
          const theta = (lon + 180) * (Math.PI / 180);
          tempLocalPos.set(
            -(GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta)),
            GLOBE_RADIUS * Math.cos(phi),
            GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta)
          );

          tempWorldPos.copy(tempLocalPos).applyMatrix4(globeGroupRef.current.matrixWorld);
          tempNormal.copy(tempWorldPos).normalize();
          tempCameraDir.copy(camera.position).sub(tempWorldPos).normalize();

          // Horizon / hemisphere culling: only show labels facing the camera
          const facingDot = tempNormal.dot(tempCameraDir);
          const threshold = camZ < 3.8 ? 0.14 : 0.24;

          if (facingDot <= threshold) {
            el.style.opacity = '0';
            continue;
          }

          // Project 3D world position to 2D normalized device coordinates
          tempProjected.copy(tempWorldPos).project(camera);
          const screenX = (tempProjected.x * 0.5 + 0.5) * cw;
          const screenY = (-tempProjected.y * 0.5 + 0.5) * ch;

          // Keep inside viewport bounds
          if (screenX < 20 || screenX > cw - 20 || screenY < 20 || screenY > ch - 20) {
            el.style.opacity = '0';
            continue;
          }

          const edgeFade = Math.min(1, (facingDot - threshold) * 4.5);
          el.style.transform = `translate3d(${screenX.toFixed(1)}px, ${screenY.toFixed(1)}px, 0)`;
          el.style.opacity = edgeFade.toFixed(2);
        }
      }
    };

    animate();

    // 14. ResizeObserver for instant Fullscreen & Window Resizing
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth || window.innerWidth;
      const h = mountRef.current.clientHeight || window.innerHeight;
      if (w > 0 && h > 0) {
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(mountRef.current);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      earthGeometry.dispose();
      earthMaterial.dispose();
      cloudsGeometry.dispose();
      cloudsMaterial.dispose();
      atmosphereGlowGeom.dispose();
      atmosphereGlowMat.dispose();
      fallbackTexture.dispose();
    };
  }, []);

  // Update Accurate Cities on Globe (Anchored at surface so dynamic zoom scaling shrinks them in-place)
  useEffect(() => {
    const citiesGroup = citiesGroupRef.current;
    if (!citiesGroup) return;

    while (citiesGroup.children.length > 0) {
      const obj = citiesGroup.children[0];
      citiesGroup.remove(obj);
    }

    if (!showCities) return;

    ACCURATE_CITIES.forEach((city) => {
      const pos = latLonToVector3(city.latitude, city.longitude, GLOBE_RADIUS);
      const isSindh = city.province === 'Sindh';
      const metric = resolveCityMetric(city);
      const isExtreme = metric.isAnomaly || (isFloodMode && (city.floodRiskLevel === 'extreme' || city.floodRiskLevel === 'high'));
      const isSelectedCity =
        Math.abs(selectedRegion.latitude - city.latitude) < 0.08 &&
        Math.abs(selectedRegion.longitude - city.longitude) < 0.08;

      const anchor = new THREE.Group();
      anchor.position.copy(pos);
      anchor.lookAt(pos.clone().multiplyScalar(2));
      anchor.userData = { city, metric };

      // 1. City Surface Ring
      const ringRadius = isSelectedCity ? 0.072 : isExtreme ? 0.058 : isSindh ? 0.04 : 0.032;
      const ringGeom = new THREE.RingGeometry(ringRadius * 0.7, ringRadius, 28);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isSelectedCity ? 0xffffff : metric.hexColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isSelectedCity ? 0.98 : isExtreme ? 0.9 : 0.75,
        depthWrite: false,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.position.set(0, 0, 0.005);
      ringMesh.userData = { city, metric };
      anchor.add(ringMesh);

      // 2. Crisp City Pin Dot
      const dotRadius = isSelectedCity ? 0.022 : isExtreme ? 0.019 : isSindh ? 0.015 : 0.013;
      const nodeGeom = new THREE.SphereGeometry(dotRadius, 14, 14);
      const nodeMat = new THREE.MeshBasicMaterial({
        color: isSelectedCity || isExtreme ? 0xffffff : metric.hexColor,
      });
      const nodeMesh = new THREE.Mesh(nodeGeom, nodeMat);
      nodeMesh.position.set(0, 0, 0.011);
      nodeMesh.userData = { city, metric };
      anchor.add(nodeMesh);

      // 3. Flood / Anomaly Halo Disk (Visual only — no userData so it never hijacks neighboring clicks)
      if (isExtreme || isSelectedCity) {
        const diskRadius = isSindh ? 0.115 : 0.09;
        const floodDiskGeom = new THREE.CircleGeometry(diskRadius, 32);
        const floodDiskMat = new THREE.MeshBasicMaterial({
          color: metric.hexColor,
          transparent: true,
          opacity: isSelectedCity ? 0.42 : 0.3,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const floodDiskMesh = new THREE.Mesh(floodDiskGeom, floodDiskMat);
        floodDiskMesh.position.set(0, 0, 0.003);
        anchor.add(floodDiskMesh);
      }

      citiesGroup.add(anchor);
    });
  }, [showCities, isFloodMode, selectedVariable, selectedYear, selectedRegion, liveCityMetrics, resolveCityMetric]);

  // Update Affected Region Sentinels on Globe
  useEffect(() => {
    const markersGroup = markersGroupRef.current;
    if (!markersGroup) return;

    while (markersGroup.children.length > 0) {
      const obj = markersGroup.children[0];
      markersGroup.remove(obj);
    }

    if (!showAffectedDisks) return;

    regions.forEach((reg) => {
      const pos = latLonToVector3(reg.latitude, reg.longitude, GLOBE_RADIUS);
      const isSelected = selectedRegion.id === reg.id;
      const isFlagship = !!reg.is_flagship;
      const isCritical = reg.affected_level === 'critical';

      const anchor = new THREE.Group();
      anchor.position.copy(pos);
      anchor.lookAt(pos.clone().multiplyScalar(2));

      const diskRadius = isFlagship ? 0.17 : isCritical ? 0.14 : 0.11;
      const diskGeom = new THREE.CircleGeometry(diskRadius, 32);
      const diskColor = isFlagship ? 0xf59e0b : isCritical ? 0xef4444 : 0x0ea5e9;

      const diskMat = new THREE.MeshBasicMaterial({
        color: diskColor,
        transparent: true,
        opacity: isSelected ? 0.48 : 0.28,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const diskMesh = new THREE.Mesh(diskGeom, diskMat);
      diskMesh.position.set(0, 0, 0.006);
      anchor.add(diskMesh);

      const stemHeight = isFlagship ? 0.22 : isSelected ? 0.18 : 0.12;
      const stemGeom = new THREE.CylinderGeometry(0.007, 0.007, stemHeight, 8);
      stemGeom.rotateX(Math.PI / 2);
      const stemMat = new THREE.MeshBasicMaterial({
        color: diskColor,
        transparent: true,
        opacity: 0.85,
      });
      const stemMesh = new THREE.Mesh(stemGeom, stemMat);
      stemMesh.position.set(0, 0, stemHeight / 2);
      anchor.add(stemMesh);

      const tipGeom = new THREE.SphereGeometry(isFlagship ? 0.034 : 0.024, 12, 12);
      const tipMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0xffffff : diskColor,
      });
      const tipMesh = new THREE.Mesh(tipGeom, tipMat);
      tipMesh.position.set(0, 0, stemHeight);
      tipMesh.userData = { region: reg };
      anchor.add(tipMesh);

      markersGroup.add(anchor);
    });
  }, [regions, selectedRegion, showAffectedDisks]);

  // Render a persistent 3D Sticky Pin at the active selectedRegion / clicked coordinate so the marker always sticks to the exact point on the globe
  useEffect(() => {
    const activeTargetGroup = activeTargetGroupRef.current;
    if (!activeTargetGroup) return;

    while (activeTargetGroup.children.length > 0) {
      const obj = activeTargetGroup.children[0];
      activeTargetGroup.remove(obj);
    }

    if (!selectedRegion) return;

    const pos = latLonToVector3(selectedRegion.latitude, selectedRegion.longitude, GLOBE_RADIUS);
    const anchor = new THREE.Group();
    anchor.position.copy(pos);
    anchor.lookAt(pos.clone().multiplyScalar(2));

    // 1. High-contrast Outer Target Ring locked to surface coordinate
    const outerRingGeom = new THREE.RingGeometry(0.068, 0.092, 36);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    const outerRingMesh = new THREE.Mesh(outerRingGeom, outerRingMat);
    outerRingMesh.position.set(0, 0, 0.008);
    anchor.add(outerRingMesh);

    // 2. Inner Target Halo
    const innerHaloGeom = new THREE.CircleGeometry(0.064, 32);
    const innerHaloMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const innerHaloMesh = new THREE.Mesh(innerHaloGeom, innerHaloMat);
    innerHaloMesh.position.set(0, 0, 0.007);
    anchor.add(innerHaloMesh);

    // 3. Vertical Pin Stem
    const pinHeight = 0.19;
    const pinStemGeom = new THREE.CylinderGeometry(0.006, 0.006, pinHeight, 10);
    pinStemGeom.rotateX(Math.PI / 2);
    const pinStemMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    const pinStemMesh = new THREE.Mesh(pinStemGeom, pinStemMat);
    pinStemMesh.position.set(0, 0, pinHeight / 2);
    anchor.add(pinStemMesh);

    // 4. Pin Head Beacon Sphere
    const pinHeadGeom = new THREE.SphereGeometry(0.032, 16, 16);
    const pinHeadMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
    });
    const pinHeadMesh = new THREE.Mesh(pinHeadGeom, pinHeadMat);
    pinHeadMesh.position.set(0, 0, pinHeight);
    anchor.add(pinHeadMesh);

    // 5. Surface Lock Core Dot
    const coreDotGeom = new THREE.SphereGeometry(0.02, 14, 14);
    const coreDotMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    const coreDotMesh = new THREE.Mesh(coreDotGeom, coreDotMat);
    coreDotMesh.position.set(0, 0, 0.012);
    anchor.add(coreDotMesh);

    activeTargetGroup.add(anchor);
  }, [selectedRegion]);

  // Center globe smoothly on selected region or clicked surface point using exact 1:1 spherical latitude & shortest angular path
  useEffect(() => {
    if (!selectedRegion) return;

    const rawTargetY = -((selectedRegion.longitude + 180) * (Math.PI / 180)) + Math.PI / 2;
    const targetX = Math.max(
      -Math.PI / 2.1,
      Math.min(Math.PI / 2.1, selectedRegion.latitude * (Math.PI / 180))
    );

    const currentY = globeGroupRef.current ? globeGroupRef.current.rotation.y : targetRotationRef.current.y;
    let deltaY = (rawTargetY - currentY) % (2 * Math.PI);
    if (deltaY > Math.PI) deltaY -= 2 * Math.PI;
    if (deltaY < -Math.PI) deltaY += 2 * Math.PI;

    targetRotationRef.current = {
      x: targetX,
      y: currentY + deltaY,
    };

    if (selectedRegion.id?.startsWith('city_') && cameraRef.current) {
      cameraRef.current.position.z = Math.min(cameraRef.current.position.z, 3.65);
      setZoomDistance(Number(cameraRef.current.position.z.toFixed(2)));
    }
  }, [selectedRegion]);

  // Toggle clouds mesh visibility
  useEffect(() => {
    if (cloudsMeshRef.current) {
      cloudsMeshRef.current.visible = showClouds;
    }
  }, [showClouds]);

  // Toggle vector borders & rivers visibility
  useEffect(() => {
    if (vectorsGroupRef.current) {
      vectorsGroupRef.current.visible = showVectors;
    }
  }, [showVectors]);

  // Immediate resize when toggling fullscreen
  useEffect(() => {
    if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
    const updateSize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = isFullscreen ? window.innerWidth : mountRef.current.clientWidth;
      const h = isFullscreen ? window.innerHeight : mountRef.current.clientHeight;
      if (w > 0 && h > 0) {
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      }
    };
    updateSize();
    const t1 = setTimeout(updateSize, 30);
    const t2 = setTimeout(updateSize, 120);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isFullscreen]);

  // ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        document.body.style.overflow = '';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Calculate zoom magnification percentage for UI indicator
  const zoomMagnification = Math.max(10, Math.min(100, Math.round(((9.5 - zoomDistance) / (9.5 - 2.58)) * 100)));

  // Determine which cities are primary (visible from regional/global zoom) vs secondary district cities (visible as you zoom in)
  const PRIMARY_CITY_IDS = new Set([
    'city_karachi',
    'city_sukkur',
    'city_jacobabad',
    'city_hyderabad',
    'city_larkana',
    'city_lahore',
    'city_islamabad',
    'city_quetta',
    'city_peshawar',
    'city_gwadar',
    'city_manaus',
    'city_niamey',
    'city_longyearbyen',
    'city_seville',
  ]);

  return (
    <div
      ref={containerRef}
      className={
        isFullscreen
          ? 'fixed inset-0 z-[99999] bg-[#07090E] w-screen h-[100dvh] flex flex-col select-none overflow-hidden'
          : compact
          ? 'relative w-full h-[420px] sm:h-[520px] bg-[#07090E] rounded-md border border-slate-200 dark:border-[#1E2638] overflow-hidden flex flex-col select-none'
          : 'relative w-full h-[460px] sm:h-[600px] bg-[#07090E] rounded-md border border-slate-200 dark:border-[#1E2638] overflow-hidden flex flex-col select-none'
      }
    >
      {/* 3D WebGL Canvas Mount */}
      <div
        ref={mountRef}
        className="flex-1 w-full h-full min-h-0 cursor-grab active:cursor-grabbing touch-none"
      />

      {/* REAL-TIME 3D PROJECTED CARTOGRAPHIC LABELS LAYER (Countries, Provinces, Rivers & Cities) */}
      <div
        ref={labelsContainerRef}
        className="absolute inset-0 pointer-events-none overflow-hidden z-[5]"
        aria-hidden="true"
      >
        {/* 1. Country, Province, Ocean & River Labels */}
        {CARTOGRAPHIC_MAP_LABELS.map((lbl) => (
          <div
            key={lbl.id}
            data-lat={lbl.lat}
            data-lon={lbl.lon}
            data-minzoom={lbl.minZoomZ}
            data-kind={lbl.kind}
            className="absolute top-0 left-0 opacity-0 -translate-x-1/2 -translate-y-1/2 will-change-transform transition-opacity duration-75 pointer-events-none"
          >
            {lbl.kind === 'country' && (
              <span className="text-[11px] font-bold tracking-[0.22em] text-slate-200/85 uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] whitespace-nowrap">
                {lbl.name}
              </span>
            )}
            {lbl.kind === 'province' && (
              <span className="text-[10px] font-mono font-semibold tracking-[0.16em] text-amber-300/90 uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] whitespace-nowrap">
                {lbl.name}
              </span>
            )}
            {lbl.kind === 'water' && (
              <span className="text-[10px] italic font-medium tracking-[0.14em] text-sky-300/60 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] whitespace-nowrap">
                {lbl.name}
              </span>
            )}
            {lbl.kind === 'river' && (
              <span className="text-[10px] font-mono font-semibold tracking-wider text-cyan-400/95 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] whitespace-nowrap">
                ≈ {lbl.name}
              </span>
            )}
          </div>
        ))}

        {/* 2. Real Map City Names & Live NASA Value Tags (Non-interactive overlay so all touches pass cleanly to 3D globe canvas) */}
        {ACCURATE_CITIES.map((city) => {
          const isSelectedCity =
            Math.abs(selectedRegion.latitude - city.latitude) < 0.08 &&
            Math.abs(selectedRegion.longitude - city.longitude) < 0.08;
          const isPrimary = PRIMARY_CITY_IDS.has(city.id) || isSelectedCity;
          const minZoomForCity = isSelectedCity ? 9.5 : isPrimary ? 8.8 : 5.4;
          const cityMetric = resolveCityMetric(city);

          return (
            <div
              key={`city_lbl_${city.id}`}
              data-lat={city.latitude}
              data-lon={city.longitude}
              data-minzoom={minZoomForCity}
              data-kind="city"
              className="absolute top-0 left-0 opacity-0 translate-x-2 -translate-y-1/2 will-change-transform text-left pointer-events-none select-none"
            >
              <div
                className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-xs transition-colors ${
                  isSelectedCity
                    ? 'bg-cyan-400 text-[#07090E] font-bold shadow-lg'
                    : 'bg-[#07090E]/90 text-white border border-[#1E2638]'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: isSelectedCity ? '#07090E' : cityMetric.color }}
                />
                <span className="text-[10px] font-medium tracking-tight whitespace-nowrap leading-none">
                  {city.name}
                </span>
                <span
                  className={`text-[9px] font-mono tabular-nums whitespace-nowrap leading-none ${
                    isSelectedCity ? 'text-[#07090E] font-bold' : 'text-slate-300'
                  }`}
                >
                  {cityMetric.formatted}
                </span>
              </div>
            </div>
          );
        })}

        {/* 3. Research Annotations Layer */}
        {showAnnotations &&
          annotations.map((ann) => (
            <div
              key={`ann_lbl_${ann.id}`}
              data-lat={ann.latitude}
              data-lon={ann.longitude}
              data-minzoom={3.0}
              data-kind="annotation"
              className="absolute top-0 left-0 opacity-0 translate-x-3 -translate-y-1/2 will-change-transform text-left pointer-events-auto select-none cursor-pointer group z-30"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedAnnotation(ann);
              }}
            >
              <div className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2 py-1 rounded-xs shadow-xl border border-amber-300 transition-transform hover:scale-105">
                <Tag className="w-3 h-3 shrink-0" />
                <span className="text-[10px] tracking-tight whitespace-nowrap">{ann.title}</span>
              </div>
            </div>
          ))}
      </div>

      {/* Active Pin Drop Banner */}
      {isAddingAnnotation && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-md shadow-2xl text-xs flex items-center gap-2 animate-bounce">
          <Tag className="w-4 h-4" />
          <span>Click anywhere on the 3D globe to drop your research pin.</span>
          <button
            type="button"
            onClick={() => setIsAddingAnnotation(false)}
            className="ml-2 bg-slate-950 text-white px-2 py-0.5 rounded text-[10px]"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Create Annotation Modal */}
      {pendingAnnotationCoords && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0D111A] border border-[#1E2638] rounded-lg p-6 max-w-md w-full text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2638]">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                <h3 className="font-display font-bold text-base">Drop Research Pin &amp; Note</h3>
              </div>
              <button
                type="button"
                onClick={() => setPendingAnnotationCoords(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="font-mono text-cyan-400">
                Coordinates: {pendingAnnotationCoords.lat.toFixed(4)}° N, {pendingAnnotationCoords.lon.toFixed(4)}° E
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Research Title</label>
                <input
                  type="text"
                  value={newAnnTitle}
                  onChange={(e) => setNewAnnTitle(e.target.value)}
                  placeholder="e.g., Indus Basin Silt Anomaly"
                  className="w-full bg-[#161D2B] border border-[#1E2638] rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-sans text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Category</label>
                  <select
                    value={newAnnCategory}
                    onChange={(e) => setNewAnnCategory(e.target.value as any)}
                    className="w-full bg-[#161D2B] border border-[#1E2638] rounded px-2.5 py-2 text-white focus:outline-none focus:border-cyan-500 font-sans text-xs"
                  >
                    <option value="General">General</option>
                    <option value="Hydrology">Hydrology</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Temperature">Temperature</option>
                    <option value="Ecology">Ecology</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Researcher / Author</label>
                  <input
                    type="text"
                    value={newAnnAuthor}
                    onChange={(e) => setNewAnnAuthor(e.target.value)}
                    className="w-full bg-[#161D2B] border border-[#1E2638] rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-sans text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Research Notes</label>
                <textarea
                  value={newAnnNote}
                  onChange={(e) => setNewAnnNote(e.target.value)}
                  rows={3}
                  placeholder="Enter observation notes, anomalies, or field measurements..."
                  className="w-full bg-[#161D2B] border border-[#1E2638] rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-sans text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingAnnotationCoords(null)}
                className="px-4 py-2 rounded bg-[#161D2B] text-slate-300 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newAnnTitle.trim()) return;
                  const updated = saveAnnotation({
                    title: newAnnTitle.trim(),
                    category: newAnnCategory,
                    latitude: pendingAnnotationCoords.lat,
                    longitude: pendingAnnotationCoords.lon,
                    note: newAnnNote.trim() || 'No additional notes provided.',
                    author: newAnnAuthor.trim() || 'NASA Researcher',
                  });
                  setAnnotations(updated);
                  setPendingAnnotationCoords(null);
                  setNewAnnTitle('');
                  setNewAnnNote('');
                }}
                className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
              >
                Save Annotation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Annotation Modal */}
      {selectedAnnotation && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0D111A] border border-[#1E2638] rounded-lg p-6 max-w-md w-full text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2638]">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                <h3 className="font-display font-bold text-base">{selectedAnnotation.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnnotation(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-400 font-mono">
                <span className="bg-[#161D2B] px-2 py-0.5 rounded text-amber-400 font-bold">
                  {selectedAnnotation.category}
                </span>
                <span>By {selectedAnnotation.author}</span>
              </div>

              <div className="font-mono text-cyan-400">
                Coordinates: {selectedAnnotation.latitude.toFixed(4)}° N, {selectedAnnotation.longitude.toFixed(4)}° E
              </div>

              <div className="bg-[#161D2B]/50 p-3 rounded border border-[#1E2638] text-slate-200 font-sans leading-relaxed">
                {selectedAnnotation.note}
              </div>

              <div className="text-[10px] text-slate-500 font-mono">
                Saved: {new Date(selectedAnnotation.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#1E2638]">
              <button
                type="button"
                onClick={() => {
                  const updated = deleteAnnotation(selectedAnnotation.id);
                  setAnnotations(updated);
                  setSelectedAnnotation(null);
                }}
                className="px-3 py-1.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold"
              >
                Delete Note
              </button>
              <button
                type="button"
                onClick={() => setSelectedAnnotation(null)}
                className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Top Left: Telemetry Readout Panel (Responsive for Mobile & Desktop) */}
      <div className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 z-10 flex flex-col gap-1.5 max-w-[200px] sm:max-w-[240px] pointer-events-none">
        <div className="bg-[#07090E]/95 border border-[#1E2638] p-2.5 sm:p-3 rounded-sm text-white shadow-xl">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <h2 className="font-display font-bold text-xs sm:text-sm tracking-tight text-white truncate">
              {selectedRegion.name}
            </h2>
            <span className="font-mono text-[10px] sm:text-[11px] text-cyan-400 font-bold tabular-nums shrink-0">
              {selectedYear}
            </span>
          </div>

          <div className="text-[10px] text-slate-400 font-mono tabular-nums mb-1.5 truncate">
            {selectedRegion.latitude.toFixed(2)}° N, {selectedRegion.longitude.toFixed(2)}° E
          </div>

          {/* REAL OBSERVATION METRIC FOR ACTIVE VARIABLE */}
          <div className="border-t border-[#1E2638] pt-1.5 flex items-baseline justify-between gap-2">
            <span className="text-[10px] text-slate-400 font-medium truncate">
              {variableMeta?.short_name || selectedVariable}
            </span>
            <span
              className="font-mono font-bold text-xs sm:text-sm text-white tabular-nums shrink-0"
              style={{ color: activeMetric.color }}
            >
              {activeMetric.formatted}
            </span>
          </div>
        </div>

        {lastClickedCoords && (
          <div className="inline-flex items-center gap-1.5 bg-[#07090E]/95 border border-[#1E2638] px-2.5 py-1 rounded-sm text-[10px] font-mono text-slate-300 tabular-nums">
            <Compass className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="truncate">
              {lastClickedCoords.lat.toFixed(2)}° N, {lastClickedCoords.lon.toFixed(2)}° E
            </span>
          </div>
        )}
      </div>

      {/* Top Right: Zoom Readout & Full Screen Toggle */}
      <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-10 flex items-center gap-1.5">
        <div className="flex items-center gap-1.5 bg-[#07090E]/95 border border-[#1E2638] px-2.5 py-1.5 rounded-sm text-[11px] font-mono text-slate-300">
          <span className="hidden sm:inline text-cyan-400 font-semibold">{satelliteLoaded ? '4K' : '...'}</span>
          <span className="hidden sm:inline text-slate-600">·</span>
          <span className="text-white font-semibold tabular-nums">Zoom {zoomMagnification}%</span>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingAnnotation(!isAddingAnnotation)}
          className={`px-2.5 py-1.5 rounded-sm text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer border ${
            isAddingAnnotation
              ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 animate-pulse'
              : 'bg-[#07090E]/95 hover:bg-[#131926] text-amber-300 border-[#1E2638]'
          }`}
          title="Drop Research Pin on Map"
        >
          <Tag className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isAddingAnnotation ? 'Click Globe...' : 'Drop Pin'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowAnnotations(!showAnnotations)}
          className={`px-2.5 py-1.5 rounded-sm text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer border ${
            showAnnotations
              ? 'bg-[#1E2638] text-white border-slate-700'
              : 'bg-[#07090E]/95 text-slate-400 border-[#1E2638]'
          }`}
          title="Toggle Research Annotations Layer"
        >
          <span>Notes ({annotations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setShowTransparencyGuide(!showTransparencyGuide)}
          className="bg-[#07090E]/95 hover:bg-[#131926] border border-[#1E2638] text-slate-300 hover:text-white px-2 py-1.5 rounded-sm text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
          title="Map Color & Ticker Guide"
        >
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline text-[11px]">Color Guide</span>
        </button>

        <button
          type="button"
          onClick={handleToggleFullscreen}
          className="bg-cyan-500 hover:bg-cyan-400 text-[#07090E] font-bold px-2.5 py-1.5 sm:px-3 rounded-sm text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          title={isFullscreen ? 'Exit Full Screen (ESC)' : 'Expand Map to Full Screen'}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Exit</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Screen</span>
            </>
          )}
        </button>
      </div>

      {/* Hover Tooltip for Cities with Live NASA Values */}
      {hoveredCity && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none z-20 bg-[#07090E]/95 border border-[#1E2638] px-4 py-3 rounded-md text-xs text-white shadow-2xl max-w-sm text-center">
          <div className="flex items-center justify-center gap-1.5 font-display font-bold text-sm text-white mb-0.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>{hoveredCity.name}</span>
            <span className="text-slate-400 font-sans font-normal">({hoveredCity.province || hoveredCity.country})</span>
          </div>

          {(() => {
            const cMetric = resolveCityMetric(hoveredCity);
            return (
              <div className="my-2 p-2.5 bg-[#0D111A] rounded-sm border border-[#1E2638] text-left space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[11px] text-slate-300">
                    {variableMeta?.name || selectedVariable} ({selectedYear}):
                  </span>
                  <span className="font-mono text-sm font-bold tabular-nums" style={{ color: cMetric.color }}>
                    {cMetric.formatted}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                  <span>
                    Status: <strong className="text-slate-200">{cMetric.status}</strong>
                  </span>
                  {cMetric.peakMonth && (
                    <span>
                      Peak: {cMetric.peakMonth} ({cMetric.peakValue})
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="text-[10px] text-slate-400 font-mono tabular-nums">
            {hoveredCity.latitude.toFixed(4)}° N, {hoveredCity.longitude.toFixed(4)}° E · Click to lock target
          </div>
        </div>
      )}

      {/* Hover Tooltip for Regions */}
      {!hoveredCity && hoveredRegion && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none z-20 bg-[#07090E]/95 border border-[#1E2638] px-4 py-2.5 rounded-md text-xs text-white shadow-2xl max-w-sm text-center">
          <div className="font-display font-bold text-white mb-0.5">
            {hoveredRegion.name} ({hoveredRegion.country})
          </div>
          <p className="text-[11px] text-slate-300">{hoveredRegion.affected_description || hoveredRegion.notes}</p>
          <div className="text-[10px] text-cyan-400 mt-1 font-mono">Click to lock target & inspect NASA series</div>
        </div>
      )}

      {/* Map Color & Ticker Guide Modal (Opened via Info icon next to Full Screen button) */}
      {showTransparencyGuide && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#0D111A] border border-[#1E2638] rounded-md p-4 sm:p-5 max-w-md w-full text-slate-200 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto my-auto">
            <div className="sticky top-0 bg-[#0D111A] py-1 flex items-center justify-between pb-3 border-b border-[#1E2638] z-10">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                <h3 className="font-display text-sm font-bold text-white">
                  Map Color &amp; Ticker Guide
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTransparencyGuide(false)}
                className="bg-[#161D2B] hover:bg-[#1E2638] text-white p-2 rounded-sm cursor-pointer border border-[#1E2638] flex items-center justify-center"
                title="Close Guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. City Ticker & Pin Colors */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                City Ticker &amp; Pin Colors
              </div>

              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="flex items-center gap-3 p-2 rounded-sm bg-[#07090E] border border-[#1E2638]">
                  <span className="px-1.5 py-0.5 rounded-xs bg-cyan-400 text-[#07090E] font-mono text-[10px] font-bold shrink-0">
                    Active
                  </span>
                  <span className="text-slate-300">
                    <strong className="text-white">Cyan Highlight Ticker:</strong> Currently selected city or locked surface point.
                  </span>
                </div>

                <div className="flex items-center gap-3 p-2 rounded-sm bg-[#07090E] border border-[#1E2638]">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#ef4444] shrink-0 ring-2 ring-[#ef4444]/30" />
                  <span className="text-slate-300">
                    <strong className="text-white">Red Ticker:</strong> Extreme heatwave (&gt;48°C peak) or critical climate hotspot.
                  </span>
                </div>

                <div className="flex items-center gap-3 p-2 rounded-sm bg-[#07090E] border border-[#1E2638]">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#f59e0b] shrink-0 ring-2 ring-[#f59e0b]/30" />
                  <span className="text-slate-300">
                    <strong className="text-white">Amber / Orange Ticker:</strong> High heat stress (&gt;30°C avg) or dry soil moisture.
                  </span>
                </div>

                <div className="flex items-center gap-3 p-2 rounded-sm bg-[#07090E] border border-[#1E2638]">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#6366f1] shrink-0 ring-2 ring-[#6366f1]/30" />
                  <span className="text-slate-300">
                    <strong className="text-white">Indigo / Deep Blue Ticker:</strong> Extreme flood rainfall (&gt;250 mm) or waterlogged soil.
                  </span>
                </div>

                <div className="flex items-center gap-3 p-2 rounded-sm bg-[#07090E] border border-[#1E2638]">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#38bdf8] shrink-0 ring-2 ring-[#38bdf8]/30" />
                  <span className="text-slate-300">
                    <strong className="text-white">Sky Blue Ticker:</strong> Normal temperature, normal rainfall, or balanced moisture.
                  </span>
                </div>

                <div className="flex items-center gap-3 p-2 rounded-sm bg-[#07090E] border border-[#1E2638]">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#10b981] shrink-0 ring-2 ring-white/80" />
                  <span className="text-slate-300">
                    <strong className="text-white">Green &amp; White 3D Pin:</strong> Exact GPS surface point locked on the globe.
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Map Borders & Lines */}
            <div className="space-y-1.5 pt-1 border-t border-[#1E2638]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Map Borders &amp; Lines
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-amber-400 shrink-0" />
                  <span className="text-slate-300">Sindh Border</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-cyan-400 shrink-0" />
                  <span className="text-slate-300">Major Rivers</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-slate-300 shrink-0" />
                  <span className="text-slate-300">Country Lines</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTransparencyGuide(false)}
                className="w-full sm:w-auto px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-[#07090E] rounded-sm text-xs font-bold transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Control Dock (Horizontally scrollable on narrow mobile screens) */}
      <div className="absolute bottom-2.5 sm:bottom-3.5 left-1/2 -translate-x-1/2 z-10 flex items-center justify-start sm:justify-center gap-1 bg-[#07090E]/95 border border-[#1E2638] px-2 py-1.5 sm:px-3 rounded-sm max-w-[96vw] overflow-x-auto no-scrollbar shadow-xl">
        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-xs text-[11px] font-mono transition-colors whitespace-nowrap ${
            autoRotate
              ? 'bg-cyan-500 text-[#07090E] font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Toggle automatic globe rotation"
        >
          <RotateCw className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '10s' }} />
          <span>{autoRotate ? 'Spin: On' : 'Spin: Off'}</span>
        </button>

        <span className="w-px h-3.5 bg-[#1E2638]" />

        <button
          type="button"
          onClick={() => setShowLabels(!showLabels)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-xs text-[11px] font-mono transition-colors whitespace-nowrap ${
            showLabels
              ? 'bg-[#1E2638] text-white'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Toggle country, province, and city names on the map"
        >
          <Tag className="w-3 h-3" />
          <span>Names ({showLabels ? 'On' : 'Off'})</span>
        </button>

        <button
          type="button"
          onClick={() => setShowCities(!showCities)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-xs text-[11px] font-mono transition-colors whitespace-nowrap ${
            showCities
              ? 'bg-[#1E2638] text-white'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Toggle city pins"
        >
          <MapPin className="w-3 h-3" />
          <span>Cities ({showCities ? 'On' : 'Off'})</span>
        </button>

        <button
          type="button"
          onClick={() => setShowVectors(!showVectors)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-xs text-[11px] font-mono transition-colors whitespace-nowrap ${
            showVectors
              ? 'bg-[#1E2638] text-white'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Toggle borders and rivers"
        >
          <Layers className="w-3 h-3" />
          <span>Borders ({showVectors ? 'On' : 'Off'})</span>
        </button>

        {onToggleFloodMode && (
          <button
            type="button"
            onClick={onToggleFloodMode}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-xs text-[11px] font-mono transition-colors whitespace-nowrap ${
              isFloodMode
                ? 'bg-cyan-500 text-[#07090E] font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle flood anomaly layers"
          >
            <Waves className="w-3 h-3" />
            <span>Flood ({isFloodMode ? 'On' : 'Off'})</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowClouds(!showClouds)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-xs text-[11px] font-mono transition-colors whitespace-nowrap ${
            showClouds
              ? 'bg-[#1E2638] text-white'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Toggle satellite clouds"
        >
          <Cloud className="w-3 h-3" />
          <span>Clouds ({showClouds ? 'On' : 'Off'})</span>
        </button>

        <span className="w-px h-3.5 bg-[#1E2638]" />

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => {
              if (cameraRef.current) {
                const dist = Math.max(0.16, cameraRef.current.position.z - GLOBE_RADIUS);
                cameraRef.current.position.z = Math.max(2.58, cameraRef.current.position.z - dist * 0.35);
                setZoomDistance(Number(cameraRef.current.position.z.toFixed(2)));
              }
            }}
            aria-label="Zoom in"
            className="p-1.5 rounded-xs text-slate-300 hover:text-white hover:bg-[#1E2638] transition-colors"
            title="Zoom In (Show District Cities & Rivers)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (cameraRef.current) {
                const dist = Math.max(0.16, cameraRef.current.position.z - GLOBE_RADIUS);
                cameraRef.current.position.z = Math.min(9.5, cameraRef.current.position.z + dist * 0.45);
                setZoomDistance(Number(cameraRef.current.position.z.toFixed(2)));
              }
            }}
            aria-label="Zoom out"
            className="p-1.5 rounded-xs text-slate-300 hover:text-white hover:bg-[#1E2638] transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
