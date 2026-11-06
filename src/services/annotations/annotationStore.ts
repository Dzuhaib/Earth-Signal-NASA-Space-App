/**
 * EarthSignal — Research Annotation Store (LocalStorage Persistent)
 */

export interface MapAnnotation {
  id: string;
  title: string;
  category: 'Hydrology' | 'Agriculture' | 'Temperature' | 'Ecology' | 'General';
  latitude: number;
  longitude: number;
  note: string;
  author: string;
  createdAt: string;
}

const STORAGE_KEY = 'earthsignal_research_annotations_v1';

export function getStoredAnnotations(): MapAnnotation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Default initial annotation for Sindh floodplain / Jacobabad heat anomaly
      const defaults: MapAnnotation[] = [
        {
          id: 'ann_default_1',
          title: 'Jacobabad Thermal Apex',
          category: 'Temperature',
          latitude: 28.2812,
          longitude: 68.4513,
          note: 'Recorded frequent wet-bulb temperature stress thresholds exceeding 35°C during summer peak.',
          author: 'NASA Earth Lab',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'ann_default_2',
          title: 'Indus Upstream Barrage Surge',
          category: 'Hydrology',
          latitude: 27.705,
          longitude: 68.857,
          note: 'Key monitoring station for upstream monsoon discharge anomalies and seasonal silt accumulation.',
          author: 'Hydrology Taskforce',
          createdAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load annotations:', err);
    return [];
  }
}

export function saveAnnotation(annotation: Omit<MapAnnotation, 'id' | 'createdAt'>): MapAnnotation[] {
  const current = getStoredAnnotations();
  const newAnn: MapAnnotation = {
    ...annotation,
    id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [newAnn, ...current];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save annotation:', err);
  }
  return updated;
}

export function deleteAnnotation(id: string): MapAnnotation[] {
  const current = getStoredAnnotations();
  const updated = current.filter((a) => a.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete annotation:', err);
  }
  return updated;
}
