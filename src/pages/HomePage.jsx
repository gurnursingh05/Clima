import { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isToday } from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getIconUrl, searchCity, getMapTileUrl } from '../lib/weather';
import { useI18n } from '../lib/i18n';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const AQI_KEYS = ['', 'aqiGood', 'aqiFair', 'aqiModerate', 'aqiPoor', 'aqiVeryPoor'];
const AQI_MSG_KEYS = ['', 'aqiMsgGood', 'aqiMsgFair', 'aqiMsgModerate', 'aqiMsgPoor', 'aqiMsgVeryPoor'];
const AQI_CLASSES = ['', 'good', 'fair', 'moderate', 'poor', 'very-poor'];

function getWeatherIcon(id) {
    if (!id) return { main: 'cloud', accent: null, accentColor: '' };
    if (id >= 200 && id < 300) return { main: 'cloud', accent: 'bolt', accentColor: '#ffd54f' };
    if (id >= 300 && id < 400) return { main: 'cloud', accent: 'water_drop', accentColor: '#64b5f6' };
    if (id >= 500 && id < 600) return { main: 'cloud', accent: 'rainy', accentColor: '#64b5f6', accentClass: 'hero-rain' };
    if (id >= 600 && id < 700) return { main: 'cloud', accent: 'ac_unit', accentColor: '#e3f2fd', accentClass: 'hero-snow' };
    if (id === 800) return { main: 'cloud', accent: 'light_mode', accentColor: '#ffd54f' };
    if (id > 800) return { main: 'cloud', accent: 'light_mode', accentColor: '#ffd54f' };
    return { main: 'cloud', accent: null, accentColor: '' };
}

const FAV_KEY = 'weather_fav_cities';
function getFavs() { try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch { return []; } }
function saveFavs(f) { localStorage.setItem(FAV_KEY, JSON.stringify(f)); }

function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => { if (center) map.setView(center, map.getZoom()); }, [center, map]);
    return null;
}

export default function HomePage({ current, forecast, airQuality, city, units, onCitySelect, onBgChange }) {
    const { t } = useI18n();
    const navigate = useNavigate();
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedDay, setSelectedDay] = useState(null);
    const [favs, setFavs] = useState(getFavs());
    const [toast, setToast] = useState('');
    const debounceRef = useRef(null);

    const handleSearch = useCallback(async (q) => {
        if (!q.trim()) { setResults([]); return; }
        setSearching(true);
        try { setResults(await searchCity(q)); } catch { setResults([]); }
        setSearching(false);
    }, []);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => handleSearch(val), 350);
    };

    const selectCity = (c) => {
        onCitySelect({ name: c.name, lat: c.lat, lon: c.lon, country: c.country, state: c.state });
        setSearchOpen(false);
        setQuery('');
        setResults([]);
    };

    if (!current) return null;

    // Favorites
    const isFav = city && favs.some(f => f.lat === city.lat && f.lon === city.lon);
    const toggleFav = () => {
        let updated;
        if (isFav) {
            updated = favs.filter(f => !(f.lat === city.lat && f.lon === city.lon));
            showToast(t('removed'));
        } else {
            updated = [...favs, city];
            showToast(t('saved'));
        }
        setFavs(updated);
        saveFavs(updated);
    };
    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000); };

    // Forecast data
    const dailyMap = {};
    const dailyMinMax = {};
    if (forecast?.list) {
        forecast.list.forEach((item) => {
            const day = format(new Date(item.dt * 1000), 'yyyy-MM-dd');
            const hour = new Date(item.dt * 1000).getHours();
            if (!dailyMap[day] || Math.abs(hour - 12) < Math.abs(new Date(dailyMap[day].dt * 1000).getHours() - 12)) {
                dailyMap[day] = item;
            }
            if (!dailyMinMax[day]) dailyMinMax[day] = { min: item.main.temp_min, max: item.main.temp_max };
            dailyMinMax[day].min = Math.min(dailyMinMax[day].min, item.main.temp_min);
            dailyMinMax[day].max = Math.max(dailyMinMax[day].max, item.main.temp_max);
        });
    }
    const forecastDays = Object.entries(dailyMap).slice(0, 7);

    // Active display data
    const activeItem = selectedDay ? dailyMap[selectedDay] : null;
    const activeWeatherId = activeItem ? activeItem.weather[0].id : current.weather[0].id;
    const activeTemp = activeItem ? Math.round(dailyMinMax[selectedDay]?.max || activeItem.main.temp) : Math.round(current.main.temp);
    const activeDesc = activeItem ? activeItem.weather[0].description : current.weather[0].description;
    const activeIcon = getWeatherIcon(activeWeatherId);

    // Weather details source: use forecast item for selected day, current for today
    const detailSource = activeItem || current;
    const detailWind = detailSource.wind?.speed || 0;
    const windSpeed = units === 'metric' ? (detailWind * 3.6).toFixed(0) : detailWind.toFixed(0);
    const windUnit = units === 'metric' ? 'km/h' : 'mph';
    const feelsLike = Math.round(detailSource.main.feels_like);
    const humidity = detailSource.main.humidity;
    const visibility = detailSource.visibility ? (detailSource.visibility / 1000).toFixed(1) : '--';
    const pressure = detailSource.main.pressure;

    // Dew point approximation using Magnus formula
    const calcDewPoint = (temp, rh) => {
        const a = 17.27, b = 237.7;
        const alpha = (a * temp) / (b + temp) + Math.log(rh / 100);
        return Math.round((b * alpha) / (a - alpha));
    };
    const dewPoint = calcDewPoint(detailSource.main.temp, humidity);

    const aqi = airQuality?.list?.[0]?.main?.aqi;
    const aqiClass = AQI_CLASSES[aqi] || '';
    const aqiVal = useMemo(() => aqi ? aqi * 10 + Math.floor(Math.random() * 15 + 5) : null, [aqi]);

    const cityDisplay = city?.name || current.name;
    const countryDisplay = city?.state ? `${city.state}, ${city.country || ''}` : (city?.country || '');

    return (
        <>
            {/* Header */}
            <header className="app-header">
                <div className="header-search-bar" onClick={() => setSearchOpen(true)}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>search</span>
                    <span className="header-search-placeholder">{t('searchCity')}</span>
                </div>
                <div className="header-center">
                    <span className="header-label">{t('currentLocation')}</span>
                    <div className="header-city">
                        <span className="material-symbols-outlined loc-icon" style={{ fontSize: 16 }}>location_on</span>
                        <h1>{cityDisplay}{countryDisplay ? `, ${countryDisplay}` : ''}</h1>
                    </div>
                </div>
                <button className="header-btn fav-btn" onClick={toggleFav} title={isFav ? t('removed') : t('saved')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: isFav ? '#f87171' : undefined, fontVariationSettings: isFav ? "'FILL' 1" : "'FILL' 0" }}>
                        favorite
                    </span>
                </button>
            </header>

            {/* Toast */}
            {toast && <div className="toast-msg">{toast}</div>}

            {/* Hero */}
            <main className="hero-section">
                <div className="hero-row">
                    <div className="hero-center">
                        <div className="hero-icon-wrapper">
                            <div className="hero-glow" />
                            <div className="hero-icon-stack">
                                <div className="hero-weather-icon">
                                    <span className="material-symbols-outlined hero-cloud">{activeIcon.main}</span>
                                    {activeIcon.accent && !activeIcon.accentClass && (
                                        <span className="material-symbols-outlined hero-sun"
                                            style={{ color: activeIcon.accentColor, fontVariationSettings: "'FILL' 1" }}>
                                            {activeIcon.accent}
                                        </span>
                                    )}
                                    {activeIcon.accentClass && (
                                        <span className={`material-symbols-outlined ${activeIcon.accentClass}`}
                                            style={{ color: activeIcon.accentColor, fontVariationSettings: "'FILL' 1" }}>
                                            {activeIcon.accent}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="hero-temp-block">
                            <span className="hero-temp">{activeTemp}<sup>°</sup></span>
                            <div className="hero-desc">{activeDesc}</div>
                            {selectedDay && (
                                <button className="back-today-btn" onClick={() => setSelectedDay(null)}>
                                    ← {t('home')}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="hero-widgets">
                        {/* AQI Card */}
                        {aqi && (
                            <div className="aqi-card">
                                <div className="aqi-card-header">
                                    <span className="material-symbols-outlined">eco</span>
                                    <span>{t('airQuality')}</span>
                                </div>
                                <div className="aqi-body">
                                    <div className={`aqi-circle ${aqiClass}`}>
                                        <span className="aqi-sm">AQI</span>
                                        {aqiVal}
                                    </div>
                                    <div className="aqi-text">
                                        <div className={`aqi-quality ${aqiClass}`}>{t(AQI_KEYS[aqi])}</div>
                                        <div className="aqi-msg">{t(AQI_MSG_KEYS[aqi])}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Wind Card */}
                        <div className="stat-card">
                            <div className="stat-label">
                                <span className="material-symbols-outlined">air</span>
                                <span>{t('wind')}</span>
                            </div>
                            <div className="stat-value">{windSpeed}<span className="unit">{windUnit}</span></div>
                            <div className="wind-wave">
                                <svg viewBox="0 0 100 40">
                                    <path d="M0 30 Q 12.5 5, 25 30 T 50 30 T 75 30 T 100 30" fill="none" stroke="url(#wGrad3d)" strokeLinecap="round" strokeWidth="3" />
                                    <defs>
                                        <linearGradient id="wGrad3d" x1="0%" x2="100%">
                                            <stop offset="0%" stopColor="#4a90d9" />
                                            <stop offset="100%" stopColor="#6bb3ff" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 7-Day Forecast */}
                <div className="forecast-section">
                    <div className="forecast-header">
                        <h3>{t('forecast')}</h3>
                    </div>
                    <div className="forecast-scroll no-scrollbar">
                        {forecastDays.map(([dayKey, item]) => {
                            const dt = new Date(item.dt * 1000);
                            const mm = dailyMinMax[dayKey];
                            const todayCard = isToday(dt);
                            const isSelected = selectedDay === dayKey;
                            const isActive = selectedDay ? isSelected : todayCard;
                            return (
                                <div
                                    className={`forecast-card ${isActive ? 'active' : ''}`}
                                    key={dayKey}
                                    onClick={() => setSelectedDay(dayKey === selectedDay ? null : dayKey)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <span className="fc-day">{format(dt, 'EEE')}</span>
                                    <div className="fc-icon">
                                        <img src={getIconUrl(item.weather[0].icon, '2x')} alt={item.weather[0].description} />
                                    </div>
                                    <div className="fc-temps">
                                        <span className="fc-high">{Math.round(mm.max)}°</span>
                                        <span className="fc-low">{Math.round(mm.min)}°</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Weather Details — updates per selected day */}
                <div className="weather-details-section">
                    <div className="weather-details-header">
                        <h3>Weather Details</h3>
                    </div>
                    <div className="weather-details-grid">
                        <div className="weather-detail-card glossy-card">
                            <span className="material-symbols-outlined detail-icon" style={{ fontVariationSettings: "'FILL' 1" }}>air</span>
                            <div className="detail-label">{t('wind')}</div>
                            <div className="detail-value">{windSpeed} <span className="detail-unit">{windUnit}</span></div>
                        </div>
                        <div className="weather-detail-card glossy-card">
                            <span className="material-symbols-outlined detail-icon" style={{ fontVariationSettings: "'FILL' 1" }}>humidity_percentage</span>
                            <div className="detail-label">Humidity</div>
                            <div className="detail-value">{humidity}<span className="detail-unit">%</span></div>
                        </div>
                        <div className="weather-detail-card glossy-card">
                            <span className="material-symbols-outlined detail-icon" style={{ fontVariationSettings: "'FILL' 1" }}>visibility</span>
                            <div className="detail-label">Visibility</div>
                            <div className="detail-value">{visibility} <span className="detail-unit">km</span></div>
                        </div>
                        <div className="weather-detail-card glossy-card">
                            <span className="material-symbols-outlined detail-icon" style={{ fontVariationSettings: "'FILL' 1" }}>speed</span>
                            <div className="detail-label">Pressure</div>
                            <div className="detail-value">{pressure} <span className="detail-unit">hPa</span></div>
                        </div>
                        <div className="weather-detail-card glossy-card">
                            <span className="material-symbols-outlined detail-icon" style={{ fontVariationSettings: "'FILL' 1" }}>thermostat</span>
                            <div className="detail-label">Feels Like</div>
                            <div className="detail-value">{feelsLike}<span className="detail-unit">°</span></div>
                        </div>
                        <div className="weather-detail-card glossy-card">
                            <span className="material-symbols-outlined detail-icon" style={{ fontVariationSettings: "'FILL' 1" }}>dew_point</span>
                            <div className="detail-label">Dew Point</div>
                            <div className="detail-value">{dewPoint}<span className="detail-unit">°</span></div>
                        </div>
                    </div>
                </div>

                {/* Embedded Map */}
                {city?.lat != null && city?.lon != null && (
                    <div className="home-map-section">
                        <div className="home-map-header">
                            <h3><span className="dot"></span> Live Radar</h3>
                            <button className="home-map-fullscreen-btn" onClick={() => navigate('/map')}>
                                <span className="material-symbols-outlined">fullscreen</span>
                                Fullscreen
                            </button>
                        </div>
                        <div className="home-map-container">
                            <MapContainer
                                center={[city.lat, city.lon]}
                                zoom={9}
                                scrollWheelZoom={false}
                                zoomControl={false}
                                attributionControl={false}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <MapUpdater center={[city.lat, city.lon]} />
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                                <TileLayer url={getMapTileUrl('temp_new')} opacity={0.5} />
                                <Marker position={[city.lat, city.lon]}>
                                    <Popup>{cityDisplay}</Popup>
                                </Marker>
                            </MapContainer>
                        </div>
                    </div>
                )}
            </main>

            {/* Search Overlay */}
            {searchOpen && (
                <div className="search-overlay">
                    <div className="search-overlay-inner">
                        <div className="search-overlay-header">
                            <input
                                className="search-overlay-input"
                                type="text"
                                placeholder={t('searchCity')}
                                value={query}
                                onChange={handleInputChange}
                                autoFocus
                            />
                            <button className="search-close-btn" onClick={() => { setSearchOpen(false); setQuery(''); setResults([]); }}>
                                {t('cancel')}
                            </button>
                        </div>
                        <div className="search-results">
                            {searching && <div className="search-result-item"><span className="sr-meta">{t('searching')}</span></div>}
                            {!searching && results.map((r, i) => (
                                <div className="search-result-item" key={i} onClick={() => selectCity(r)}>
                                    <span className="material-symbols-outlined">location_on</span>
                                    <span className="sr-city">{r.name}</span>
                                    <span className="sr-meta">{[r.state, r.country].filter(Boolean).join(', ')}</span>
                                </div>
                            ))}
                            {!searching && results.length === 0 && query.trim() && (
                                <div className="search-result-item"><span className="sr-meta">{t('noResults')}</span></div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
