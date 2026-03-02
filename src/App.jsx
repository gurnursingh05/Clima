import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { I18nProvider, useI18n } from './lib/i18n';
import { renderCanvas, stopCanvas } from './lib/canvas';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import FavoritesPage from './pages/FavoritesPage';
import SettingsPage from './pages/SettingsPage';
import {
    getCurrentWeather, getForecast, getAirQuality, reverseGeocode,
} from './lib/weather';

/* Google Material Symbols */
if (!document.querySelector('link[href*="Material+Symbols"]')) {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
}

function BottomNav() {
    const location = useLocation();
    const { t } = useI18n();
    const items = [
        { icon: 'home', to: '/' },
        { icon: 'map', to: '/map' },
        { icon: 'favorite', to: '/favorites' },
        { icon: 'settings', to: '/settings' },
    ];
    return (
        <div className="bottom-nav">
            <div className="bottom-nav-pill">
                {items.map((item) => {
                    const isActive = item.to === '/'
                        ? location.pathname === '/'
                        : location.pathname.startsWith(item.to);
                    return (
                        <NavLink key={item.to} to={item.to} className={`bnav-item ${isActive ? 'active' : ''}`}>
                            <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                {item.icon}
                            </span>
                        </NavLink>
                    );
                })}
            </div>
        </div>
    );
}

function AppInner() {
    const { t } = useI18n();
    const [city, setCity] = useState(null);
    const [units, setUnits] = useState('metric');
    const [current, setCurrent] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [airQuality, setAirQuality] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchAll = useCallback(async (lat, lon, u) => {
        setLoading(true);
        setError(null);
        try {
            const [cw, fc, aq] = await Promise.all([
                getCurrentWeather(lat, lon, u),
                getForecast(lat, lon, u),
                getAirQuality(lat, lon),
            ]);
            setCurrent(cw);
            setForecast(fc);
            setAirQuality(aq);
        } catch (err) {
            setError(t('error'));
            console.error(err);
        }
        setLoading(false);
    }, [t]);

    useEffect(() => { if (city) fetchAll(city.lat, city.lon, units); }, [city]);
    useEffect(() => { if (city) fetchAll(city.lat, city.lon, units); }, [units]);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    try {
                        const geo = await reverseGeocode(latitude, longitude);
                        setCity({ name: geo?.name || 'My Location', lat: latitude, lon: longitude, country: geo?.country, state: geo?.state });
                    } catch {
                        setCity({ name: 'My Location', lat: latitude, lon: longitude });
                    }
                },
                () => setCity({ name: 'London', lat: 51.5074, lon: -0.1278, country: 'GB' })
            );
        } else {
            setCity({ name: 'London', lat: 51.5074, lon: -0.1278, country: 'GB' });
        }
    }, []);

    // Canvas mouse-trail animation
    useEffect(() => {
        renderCanvas();
        return () => stopCanvas();
    }, []);

    const handleCitySelect = (c) => {
        setCity(c);
        navigate('/');
    };

    return (
        <div className="app-shell">
            {/* Canvas mouse-trail animation */}
            <canvas
                id="canvas-trail"
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1,
                    pointerEvents: 'none',
                }}
            />

            {/* 3D Atmospheric Background */}
            <div className="atmo-bg">
                <div className="atmo-glow-1" />
                <div className="atmo-glow-2" />
            </div>

            {/* 3D Floating Cloud Decorations */}
            <div className="cloud-3d cloud-3d-1">
                <span className="material-symbols-outlined">cloud</span>
            </div>
            <div className="cloud-3d cloud-3d-2">
                <span className="material-symbols-outlined">cloud</span>
            </div>
            <div className="cloud-3d cloud-3d-3">
                <span className="material-symbols-outlined">cloud</span>
            </div>
            <div className="cloud-3d cloud-3d-4">
                <span className="material-symbols-outlined">cloud</span>
            </div>

            {error && <div className="error-banner">{error}</div>}

            {loading && (
                <div className="loading-wrapper">
                    <div className="spinner" />
                    <div className="loading-text">{t('loading')}</div>
                </div>
            )}

            {!loading && current && (
                <Routes>
                    <Route path="/" element={
                        <HomePage
                            current={current}
                            forecast={forecast}
                            airQuality={airQuality}
                            city={city}
                            units={units}
                            onCitySelect={handleCitySelect}
                        />
                    } />
                    <Route path="/map" element={
                        <MapPage lat={city?.lat} lon={city?.lon} cityName={city?.name} />
                    } />
                    <Route path="/favorites" element={
                        <FavoritesPage currentCity={city} onCitySelect={handleCitySelect} units={units} />
                    } />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={
                        <HomePage
                            current={current}
                            forecast={forecast}
                            airQuality={airQuality}
                            city={city}
                            units={units}
                            onCitySelect={handleCitySelect}
                        />
                    } />
                </Routes>
            )}

            <BottomNav />
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <I18nProvider>
                <AppInner />
            </I18nProvider>
        </BrowserRouter>
    );
}
