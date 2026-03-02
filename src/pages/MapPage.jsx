import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getMapTileUrl } from '../lib/weather';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LAYERS = [
    { key: 'temp_new', label: 'Temp', icon: 'thermostat' },
    { key: 'precipitation_new', label: 'Rain', icon: 'rainy' },
    { key: 'clouds_new', label: 'Clouds', icon: 'cloud' },
    { key: 'wind_new', label: 'Wind', icon: 'air' },
];

function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => { if (center) map.setView(center, map.getZoom()); }, [center, map]);
    return null;
}

export default function MapPage({ lat, lon, cityName }) {
    const [layer, setLayer] = useState('temp_new');
    if (lat == null || lon == null) return (
        <div className="map-page">
            <p style={{ padding: 40, textAlign: 'center', color: '#556b8e' }}>No location selected.</p>
        </div>
    );

    return (
        <div className="map-page">
            <div className="map-header">
                <h2>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
                    Weather Map
                </h2>
                <div className="map-layers">
                    {LAYERS.map(l => (
                        <button key={l.key} className={layer === l.key ? 'active' : ''} onClick={() => setLayer(l.key)}>
                            {l.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="map-full">
                <MapContainer center={[lat, lon]} zoom={8} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
                    <MapUpdater center={[lat, lon]} />
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    <TileLayer url={getMapTileUrl(layer)} opacity={0.55} />
                    <Marker position={[lat, lon]}><Popup>{cityName || 'Location'}</Popup></Marker>
                </MapContainer>
            </div>
        </div>
    );
}
