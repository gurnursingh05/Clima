import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MapPin, Clock } from 'lucide-react';
import { searchCity } from '../lib/weather';

const RECENT_KEY = 'weather_recent_searches';

function getRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; }
    catch { return []; }
}

function saveRecent(city) {
    const recent = getRecent().filter(c => !(c.lat === city.lat && c.lon === city.lon));
    recent.unshift(city);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 8)));
}

export default function SearchBar({ onCitySelect }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        const handle = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowDropdown(false);
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, []);

    const handleSearch = useCallback(async (q) => {
        if (!q.trim()) { setResults([]); return; }
        setLoading(true);
        try { setResults(await searchCity(q)); } catch { setResults([]); }
        setLoading(false);
    }, []);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        setShowDropdown(true);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => handleSearch(val), 350);
    };

    const selectCity = (city) => {
        const selected = { name: city.name, lat: city.lat, lon: city.lon, country: city.country, state: city.state };
        saveRecent(selected);
        onCitySelect(selected);
        setQuery(city.name);
        setShowDropdown(false);
    };

    const handleGeo = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                onCitySelect({ name: 'My Location', lat: pos.coords.latitude, lon: pos.coords.longitude });
                setQuery('My Location');
                setShowDropdown(false);
            },
            () => alert('Could not get your location.')
        );
    };

    const recentSearches = getRecent();

    return (
        <div className="search-dropdown-wrapper" ref={wrapperRef}>
            <div className="search-box">
                <Search size={16} />
                <input
                    type="text"
                    placeholder="Search city..."
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => setShowDropdown(true)}
                    id="city-search-input"
                />
                <button className="icon-btn" onClick={handleGeo} title="Use my location" style={{ width: 30, height: 30 }}>
                    <MapPin size={14} />
                </button>
            </div>

            {showDropdown && (
                <div className="search-dropdown">
                    {loading && <div className="search-dropdown-item"><span className="city-meta">Searching...</span></div>}
                    {!loading && results.length > 0 && results.map((r, i) => (
                        <div className="search-dropdown-item" key={i} onClick={() => selectCity(r)}>
                            <MapPin size={14} />
                            <span className="city-name">{r.name}</span>
                            <span className="city-meta">{[r.state, r.country].filter(Boolean).join(', ')}</span>
                        </div>
                    ))}
                    {!loading && results.length === 0 && query.trim() && (
                        <div className="search-dropdown-item"><span className="city-meta">No results found</span></div>
                    )}
                    {!query.trim() && recentSearches.length > 0 && (
                        <>
                            <div className="search-section-label">Recent</div>
                            {recentSearches.map((r, i) => (
                                <div className="search-dropdown-item" key={i} onClick={() => selectCity(r)}>
                                    <Clock size={14} />
                                    <span className="city-name">{r.name}</span>
                                    <span className="city-meta">{[r.state, r.country].filter(Boolean).join(', ')}</span>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
