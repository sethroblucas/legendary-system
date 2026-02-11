import Scene from './components/Scene';
import HUDOverlay from './components/HUDOverlay';
import DataCard from './components/DataCard';
import { useSatelliteData } from './hooks/useSatelliteData';
import './App.css';

function App() {
  useSatelliteData();

  return (
    <div className="app">
      <div className="scene-container">
        <Scene />
      </div>
      <div className="hud-overlay">
        <HUDOverlay />
      </div>
      <div className="data-card-container">
        <DataCard />
      </div>
    </div>
  );
}

export default App;
