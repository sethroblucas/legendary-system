import { create } from 'zustand';

export interface SatelliteData {
  name: string;
  noradId: number;
  type: 'satellite' | 'debris' | 'station';
  intlDesignator: string;
  tle1: string;
  tle2: string;
  position?: { x: number; y: number; z: number };
  lat?: number;
  lon?: number;
  alt?: number;
  velocity?: number;
}

interface SatelliteStore {
  satellites: SatelliteData[];
  selectedSatellite: SatelliteData | null;
  satelliteCount: number;
  debrisCount: number;
  stationCount: number;
  isLoading: boolean;
  setSatellites: (satellites: SatelliteData[]) => void;
  selectSatellite: (satellite: SatelliteData | null) => void;
  setLoading: (loading: boolean) => void;
  updateSatellitePosition: (
    noradId: number,
    position: { x: number; y: number; z: number },
    lat: number,
    lon: number,
    alt: number,
    velocity: number
  ) => void;
}

export const useSatelliteStore = create<SatelliteStore>((set) => ({
  satellites: [],
  selectedSatellite: null,
  satelliteCount: 0,
  debrisCount: 0,
  stationCount: 0,
  isLoading: true,
  setSatellites: (satellites) =>
    set({
      satellites,
      satelliteCount: satellites.filter((s) => s.type === 'satellite').length,
      debrisCount: satellites.filter((s) => s.type === 'debris').length,
      stationCount: satellites.filter((s) => s.type === 'station').length,
      isLoading: false,
    }),
  selectSatellite: (satellite) => set({ selectedSatellite: satellite }),
  setLoading: (isLoading) => set({ isLoading }),
  updateSatellitePosition: (noradId, position, lat, lon, alt, velocity) =>
    set((state) => {
      const idx = state.satellites.findIndex((s) => s.noradId === noradId);
      if (idx === -1) return state;
      const updated = [...state.satellites];
      updated[idx] = { ...updated[idx], position, lat, lon, alt, velocity };
      // Also update selectedSatellite if it matches
      const selectedSatellite =
        state.selectedSatellite?.noradId === noradId
          ? { ...state.selectedSatellite, position, lat, lon, alt, velocity }
          : state.selectedSatellite;
      return { satellites: updated, selectedSatellite };
    }),
}));
