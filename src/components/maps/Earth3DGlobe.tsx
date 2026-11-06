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
  const [zoomDistance, setZoomDistance] = useState<number>(5.6);

  // Hover targets
  const [hoveredRegion, setHoveredRegion] = useState<GeographicRegion | null>(null);
  const [hoveredCity, setHoveredCity] = useState<CityMarker | null>(null);
  const [lastClickedCoords, setLastClickedCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [satelliteLoaded, setSatelliteLoaded] = useState<boolean>(false);

  // References for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const vectorsGroupRef = useRef<THREE.Group | null>(null);
  const markersGroupRef = useRef<THREE.Group | null>(null);
  const citiesGroupRef = useRef<THREE.Group | null>(null);
  const targetRotationRef = useRef<{ x: number; y: number }>({ x: 0.21, y: -2.06 });
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const autoRotateRef = useRef<boolean>(false);
  const showLabelsRef = useRef<boolean>(true);
  const showCitiesRef = useRef<boolean>(true);

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

    // 2. Camera (Allows ultra-close HD zoom down to z = 2.58, just 0.18 units above surface)
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.02, 100);
    camera.position.set(0, 0, 5.6);
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

    // 12. Mouse & Touch Interaction (Adaptive drag speed based on zoom level)
    const canvas = renderer.domElement;

    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

      let hitFound = false;

      // Check cities first
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

      // Check regional sentinels next
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

      // Slower, finer pan control when zoomed in close to cities
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
      const rect = canvas.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

      // Check city click
      if (citiesGroupRef.current) {
        const cityHits = raycaster.intersectObjects(citiesGroupRef.current.children, true);
        const cityObj = cityHits.find((h) => h.object.userData?.city);
        if (cityObj && cityObj.object.userData?.city) {
          const city: CityMarker = cityObj.object.userData.city;
          if (onSelectCoordinates) onSelectCoordinates(city.latitude, city.longitude);
          return;
        }
      }

      // Check regional sentinel click
      if (markersGroupRef.current) {
        const markerHits = raycaster.intersectObjects(markersGroupRef.current.children, true);
        const hit = markerHits.find((h) => h.object.userData?.region);
        if (hit && hit.object.userData?.region) {
          onSelectRegion(hit.object.userData.region);
          return;
        }
      }

      // Check globe surface click for exact coordinates
      const earthHits = raycaster.intersectObject(earthMesh);
      if (earthHits.length > 0) {
        const point = earthHits[0].point;
        const localPoint = globeGroup.worldToLocal(point.clone());
        const { lat, lon } = vector3ToLatLon(localPoint);
        setLastClickedCoords({ lat, lon });
        if (onSelectCoordinates) {
          onSelectCoordinates(lat, lon);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const distFromSurface = Math.max(0.16, camera.position.z - GLOBE_RADIUS);
      const step = e.deltaY * 0.0012 * Math.max(0.32, distFromSurface);
      camera.position.z = Math.max(2.58, Math.min(9.5, camera.position.z + step));
      setZoomDistance(Number(camera.position.z.toFixed(2)));
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('wheel', onWheel, { passive: false });

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

        globeGroupRef.current.rotation.y += (targetRotationRef.current.y - globeGroupRef.current.rotation.y) * 0.1;
        globeGroupRef.current.rotation.x += (targetRotationRef.current.x - globeGroupRef.current.rotation.x) * 0.1;
        globeGroupRef.current.updateMatrixWorld();
      }

      // DYNAMIC ZOOM-ADAPTIVE SCALING FOR STICKIES (CITIES & REGION BEACONS)
      const camZ = camera.position.z;
      const distToSurface = Math.max(0.16, camZ - GLOBE_RADIUS);
      const baseSurfaceDist = 3.6;
      const stickyScale = Math.max(0.12, Math.min(1.1, Math.pow(distToSurface / baseSurfaceDist, 0.88)));

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
          if (!showLabelsRef.current) {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            continue;
          }

          const lat = parseFloat(el.dataset.lat || '0');
          const lon = parseFloat(el.dataset.lon || '0');
          const minZoomZ = parseFloat(el.dataset.minzoom || '9.5');
          const isCityLabel = el.dataset.kind === 'city';

          if (isCityLabel && !showCitiesRef.current) {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            continue;
          }

          // Check Zoom Level-of-Detail (LOD)
          if (camZ > minZoomZ) {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
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
            el.style.pointerEvents = 'none';
            continue;
          }

          // Project 3D world position to 2D normalized device coordinates
          tempProjected.copy(tempWorldPos).project(camera);
          const screenX = (tempProjected.x * 0.5 + 0.5) * cw;
          const screenY = (-tempProjected.y * 0.5 + 0.5) * ch;

          // Keep inside viewport bounds
          if (screenX < 20 || screenX > cw - 20 || screenY < 20 || screenY > ch - 20) {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            continue;
          }

          const edgeFade = Math.min(1, (facingDot - threshold) * 4.5);
          el.style.transform = `translate3d(${screenX.toFixed(1)}px, ${screenY.toFixed(1)}px, 0)`;
          el.style.opacity = edgeFade.toFixed(2);
          el.style.pointerEvents = isCityLabel ? 'auto' : 'none';
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

      // 3. Flood / Anomaly Halo Disk
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
        floodDiskMesh.userData = { city, metric };
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
      anchor.userData = { region: reg };

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
      diskMesh.userData = { region: reg };
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
      stemMesh.userData = { region: reg };
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

  // Center globe smoothly on selected region using shortest angular path
  useEffect(() => {
    if (!selectedRegion) return;
    if (selectedRegion.id?.startsWith('coord_') || selectedRegion.country === 'Surface Probe') {
      return;
    }

    const rawTargetY = -((selectedRegion.longitude + 180) * (Math.PI / 180)) + Math.PI / 2;
    const targetX = selectedRegion.latitude * (Math.PI / 180) * 0.48;

    const currentY = globeGroupRef.current ? globeGroupRef.current.rotation.y : targetRotationRef.current.y;
    let deltaY = (rawTargetY - currentY) % (2 * Math.PI);
    if (deltaY > Math.PI) deltaY -= 2 * Math.PI;
    if (deltaY < -Math.PI) deltaY += 2 * Math.PI;

    targetRotationRef.current = {
      x: targetX,
      y: currentY + deltaY,
    };

    if (selectedRegion.id?.startsWith('city_') && cameraRef.current) {
      cameraRef.current.position.z = Math.min(cameraRef.current.position.z, 3.45);
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
          ? 'fixed inset-0 z-[99999] bg-[#06080e] w-screen h-screen flex flex-col select-none overflow-hidden'
          : 'relative w-full h-[600px] bg-[#06080e] rounded-xl border border-slate-800 overflow-hidden flex flex-col select-none'
      }
    >
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full min-h-0 cursor-grab active:cursor-grabbing" />

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
            style={{ opacity: 0, left: 0, top: 0 }}
            className="absolute -translate-x-1/2 -translate-y-1/2 will-change-transform transition-opacity duration-75"
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
              <span className="text-[10px] font-mono font-semibold tracking-wider text-sky-400/95 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] whitespace-nowrap">
                ≈ {lbl.name}
              </span>
            )}
          </div>
        ))}

        {/* 2. Real Map City Names & Live NASA Value Tags */}
        {ACCURATE_CITIES.map((city) => {
          const isSelectedCity =
            Math.abs(selectedRegion.latitude - city.latitude) < 0.08 &&
            Math.abs(selectedRegion.longitude - city.longitude) < 0.08;
          const isPrimary = PRIMARY_CITY_IDS.has(city.id) || isSelectedCity;
          const minZoomForCity = isSelectedCity ? 9.5 : isPrimary ? 6.4 : 4.45;
          const cityMetric = resolveCityMetric(city);

          return (
            <button
              key={`city_lbl_${city.id}`}
              type="button"
              data-lat={city.latitude}
              data-lon={city.longitude}
              data-minzoom={minZoomForCity}
              data-kind="city"
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectCoordinates) {
                  onSelectCoordinates(city.latitude, city.longitude);
                }
              }}
              style={{ opacity: 0, left: 0, top: 0 }}
              className="absolute translate-x-2 -translate-y-1/2 will-change-transform group text-left focus:outline-none"
            >
              <div
                className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded transition-colors ${
                  isSelectedCity
                    ? 'bg-white text-slate-950 font-bold shadow-lg'
                    : 'bg-[#07090e]/85 hover:bg-[#0f1420] text-white border border-white/15 backdrop-blur-xs'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: isSelectedCity ? '#0284c7' : cityMetric.color }}
                />
                <span className="text-[10px] font-medium tracking-tight whitespace-nowrap leading-none">
                  {city.name}
                </span>
                <span
                  className={`text-[9px] font-mono tabular-nums whitespace-nowrap leading-none ${
                    isSelectedCity ? 'text-slate-700 font-semibold' : 'text-slate-300'
                  }`}
                >
                  {cityMetric.formatted}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Top Left: Telemetry Readout Panel */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-xs sm:max-w-sm pointer-events-none">
        <div className="bg-[#0b0e17]/95 border border-slate-800 backdrop-blur-xl p-4 rounded-xl shadow-2xl text-white">
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: activeMetric.color }} />
              <h2 className="font-semibold text-sm tracking-tight text-white truncate">{selectedRegion.name}</h2>
            </div>
            <span className="font-mono text-[11px] text-sky-400 font-semibold shrink-0">
              {selectedYear} · NASA LIVE
            </span>
          </div>

          <div className="text-[11px] text-slate-400 font-mono mb-3">
            {selectedRegion.latitude.toFixed(2)}° N, {selectedRegion.longitude.toFixed(2)}° E · {selectedRegion.country}
          </div>

          {/* REAL OBSERVATION METRIC FOR ACTIVE VARIABLE */}
          <div className="border-t border-slate-800/90 pt-2.5 space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-slate-300 font-medium truncate">
                {variableMeta?.name || selectedVariable}
              </span>
              <span
                className="font-mono font-bold text-sm text-white tabular-nums shrink-0"
                style={{ color: activeMetric.color }}
              >
                {activeMetric.formatted}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>
                {activeMetric.peakMonth
                  ? `Peak: ${activeMetric.peakMonth} (${activeMetric.peakValue})`
                  : 'NASA POWER / GISTEMP'}
              </span>
              <span className="font-semibold" style={{ color: activeMetric.color }}>
                {activeMetric.status}
              </span>
            </div>
          </div>
        </div>

        {lastClickedCoords && (
          <div className="inline-flex items-center gap-1.5 bg-[#0b0e17]/90 border border-slate-800 backdrop-blur-xl px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300">
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span>
              Probe: {lastClickedCoords.lat.toFixed(2)}° N, {lastClickedCoords.lon.toFixed(2)}° E
            </span>
          </div>
        )}
      </div>

      {/* Top Right: 4K HD Status, Zoom Readout & Full Screen Toggle */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 bg-[#0b0e17]/90 border border-slate-800 backdrop-blur-xl px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300">
          <span>{satelliteLoaded ? '4K Satellite + Vectors' : 'Loading 4K Map...'}</span>
          <span className="text-slate-600">·</span>
          <span className="text-sky-400 tabular-nums">Zoom {zoomMagnification}%</span>
        </div>

        {/* Data Sources Info Button */}
        <button
          type="button"
          onClick={() => setShowTransparencyGuide(!showTransparencyGuide)}
          className="bg-[#0b0e17]/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white backdrop-blur-xl px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
          title="Inspect NASA satellite & cartographic sources"
        >
          <Info className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden md:inline">Specifications</span>
        </button>

        {/* Fullscreen Toggle Button */}
        <button
          type="button"
          onClick={handleToggleFullscreen}
          className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-md whitespace-nowrap"
          title={isFullscreen ? 'Exit Full Screen (ESC)' : 'Expand Map to Full Screen'}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Full Screen</span>
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
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none z-20 bg-[#0b0e17]/95 border border-slate-700 backdrop-blur-2xl px-4 py-3 rounded-xl text-xs text-white shadow-2xl max-w-sm text-center">
          <div className="flex items-center justify-center gap-1.5 font-bold text-sm text-white mb-0.5">
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            <span>{hoveredCity.name}</span>
            <span className="text-slate-400 font-normal">({hoveredCity.province || hoveredCity.country})</span>
          </div>

          {(() => {
            const cMetric = resolveCityMetric(hoveredCity);
            return (
              <div className="my-2 p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 text-left space-y-1">
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

          <div className="text-[10px] text-slate-400 font-mono">
            {hoveredCity.latitude.toFixed(4)}° N, {hoveredCity.longitude.toFixed(4)}° E · Click to inspect series
          </div>
        </div>
      )}

      {/* Hover Tooltip for Regions */}
      {!hoveredCity && hoveredRegion && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none z-20 bg-[#0b0e17]/95 border border-slate-700 backdrop-blur-xl px-4 py-2.5 rounded-xl text-xs text-white shadow-2xl max-w-sm text-center">
          <div className="font-semibold text-white mb-0.5">
            {hoveredRegion.name} ({hoveredRegion.country})
          </div>
          <p className="text-[11px] text-slate-300">{hoveredRegion.affected_description || hoveredRegion.notes}</p>
          <div className="text-[10px] text-sky-400 mt-1 font-mono">Click to focus & inspect NASA series</div>
        </div>
      )}

      {/* Specifications Modal */}
      {showTransparencyGuide && (
        <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0e17] border border-slate-800 rounded-2xl p-6 max-w-md w-full text-slate-200 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">NASA Telemetry & Cartographic Specifications</h3>
              <button
                type="button"
                onClick={() => setShowTransparencyGuide(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="border-b border-slate-800/80 pb-3">
                <span className="font-semibold text-white block mb-0.5">Live NASA POWER & GISTEMP API</span>
                <p className="text-slate-400">
                  All 8 environmental variables are fetched dynamically from the live NASA Langley POWER REST API
                  (`power.larc.nasa.gov/api/temporal/monthly/point`) and NASA GISS LOTI dataset.
                </p>
              </div>

              <div className="border-b border-slate-800/80 pb-3">
                <span className="font-semibold text-white block mb-0.5">4K HD Imagery & Real Map Labels</span>
                <p className="text-slate-400">
                  Combines 4K NASA Blue Marble imagery, topographic relief bump maps, Natural Earth 3D vector borders,
                  and real-time 3D projected country, province, river, and city names.
                </p>
              </div>

              <div>
                <span className="font-semibold text-white block mb-0.5">Adaptive Zoom LOD & Sticky Scaling</span>
                <p className="text-slate-400">
                  City pins, flood halos, and secondary district labels automatically adjust as you zoom closer to a
                  region so neighboring hubs in Sindh remain clear and legible.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTransparencyGuide(false)}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Control Dock */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-wrap items-center justify-center gap-1.5 bg-[#0b0e17]/95 border border-slate-800 backdrop-blur-xl px-3.5 py-2 rounded-xl shadow-2xl max-w-[96vw]">
        {/* Auto Spin Toggle */}
        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
            autoRotate
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Toggle automatic globe rotation"
        >
          <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '10s' }} />
          <span>{autoRotate ? 'Spin: ON' : 'Spin: OFF'}</span>
        </button>

        <span className="w-px h-4 bg-slate-800" />

        {/* Country & City Map Names Toggle */}
        <button
          type="button"
          onClick={() => setShowLabels(!showLabels)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
            showLabels
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Toggle country, province, and city names on the map"
        >
          <Tag className="w-3.5 h-3.5 text-sky-400" />
          <span>Map Names ({showLabels ? 'On' : 'Off'})</span>
        </button>

        {/* Cities Pins Toggle */}
        <button
          type="button"
          onClick={() => setShowCities(!showCities)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
            showCities
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Toggle landmark city markers (Karachi, Sukkur, Larkana, etc.)"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Cities ({showCities ? 'On' : 'Off'})</span>
        </button>

        {/* Vector Borders & Rivers Toggle */}
        <button
          type="button"
          onClick={() => setShowVectors(!showVectors)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
            showVectors
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Toggle HD vector borders, provinces, and Indus River lines"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Borders ({showVectors ? 'On' : 'Off'})</span>
        </button>

        {/* Flood Mode Filter Toggle */}
        {onToggleFloodMode && (
          <button
            type="button"
            onClick={onToggleFloodMode}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
              isFloodMode
                ? 'bg-sky-500 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Inspect flood anomaly records and inundation halos"
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Flood Layer ({isFloodMode ? `${selectedYear}` : 'Off'})</span>
          </button>
        )}

        {/* Clouds Toggle */}
        <button
          type="button"
          onClick={() => setShowClouds(!showClouds)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
            showClouds
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Toggle NASA satellite clouds"
        >
          <Cloud className="w-3.5 h-3.5" />
          <span>Clouds ({showClouds ? 'On' : 'Off'})</span>
        </button>

        <span className="w-px h-4 bg-slate-800" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
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
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
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
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
