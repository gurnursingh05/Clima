import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2 } from 'lucide-react';
import { getMapTileUrl } from '../lib/weather';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LAYERS = [
    { key: 'precipitation_new', label: 'Rain' },
    { key: 'wind_new', label: 'Wind' },
    { key: 'clouds_new', label: 'Clouds' },
];

function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => { if (center) map.setView(center, map.getZoom()); }, [center, map]);
    return null;
}

export default function WeatherMap({ lat, lon, cityName }) {
    const [layer, setLayer] = useState('precipitation_new');

    if (lat == null || lon == null) return null;

    return (
        <div className="radar-card g-card" id="weather-map">
            <div className="radar-header">
                <div className="radar-label">
                    <span className="dot" />
                    Live Radar
                </div>
                <button className="radar-expand"><Maximize2 size={14} /></button>
            </div>
            <div className="radar-layers">
                {LAYERS.map((l) => (
                    <button
                        key={l.key}
                        className={layer === l.key ? 'active' : ''}
                        onClick={() => setLayer(l.key)}
                    >
                        {l.label}
                    </button>
                ))}
            </div>
            <div className="radar-map">
                <MapContainer
                    center={[lat, lon]}
                    zoom={9}
                    scrollWheelZoom={false}
                    zoomControl={false}
                    attributionControl={false}
                    style={{ height: '100%', width: '100%' }}
                >
                    <MapUpdater center={[lat, lon]} />
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    <TileLayer url={getMapTileUrl(layer)} opacity={0.5} />
                    <Marker position={[lat, lon]}>
                        <Popup>{cityName || 'Location'}</Popup>
                    </Marker>
                </MapContainer>
            </div>
        </div>
    );
}
