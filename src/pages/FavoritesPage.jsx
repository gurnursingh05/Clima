import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { getCurrentWeather, getIconUrl } from '../lib/weather';
import { useI18n } from '../lib/i18n';

const FAV_KEY = 'weather_fav_cities';
function getFavs() { try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch { return []; } }
function saveFavs(favs) { localStorage.setItem(FAV_KEY, JSON.stringify(favs)); }

export default function FavoritesPage({ currentCity, onCitySelect, units }) {
    const { t } = useI18n();
    const [favs, setFavs] = useState(getFavs());
    const [favData, setFavData] = useState({});
    const alreadyFav = currentCity && favs.some(f => f.lat === currentCity.lat && f.lon === currentCity.lon);

    useEffect(() => {
        favs.forEach(async (city) => {
            const key = `${city.lat},${city.lon}`;
            if (favData[key]) return;
            try {
                const data = await getCurrentWeather(city.lat, city.lon, units);
                setFavData(prev => ({ ...prev, [key]: { temp: Math.round(data.main.temp), desc: data.weather[0].description, icon: data.weather[0].icon } }));
            } catch { }
        });
    }, [favs, units]);

    const addCurrent = () => { if (!currentCity || alreadyFav) return; const u = [...favs, currentCity]; setFavs(u); saveFavs(u); };
    const remove = (idx, e) => { e.stopPropagation(); const u = favs.filter((_, i) => i !== idx); setFavs(u); saveFavs(u); };
    const tempUnit = units === 'metric' ? '°' : '°F';

    return (
        <div className="fav-page">
            <h2>
                <span className="material-symbols-outlined" style={{ color: '#f87171', fontVariationSettings: "'FILL' 1", fontSize: 24 }}>favorite</span>
                {t('favoritesCities')}
            </h2>
            <div className="fav-grid">
                {favs.map((city, i) => {
                    const key = `${city.lat},${city.lon}`;
                    const d = favData[key];
                    return (
                        <div className="fav-card" key={i} onClick={() => onCitySelect(city)}>
                            <div className="fav-card-icon">
                                {d?.icon ? <img src={getIconUrl(d.icon, '2x')} alt="" /> : <span style={{ fontSize: 28 }}>🌍</span>}
                            </div>
                            <div className="fav-card-info">
                                <div className="fav-card-city">{city.name}</div>
                                <div className="fav-card-desc">{d?.desc || t('loading')}</div>
                            </div>
                            {d && <span className="fav-card-temp">{d.temp}{tempUnit}</span>}
                            <button className="fav-card-remove" onClick={(e) => remove(i, e)}><X size={16} /></button>
                        </div>
                    );
                })}
                {currentCity && !alreadyFav && (
                    <div className="fav-add-btn" onClick={addCurrent}>
                        <Plus size={18} /> {t('addFavorite')} {currentCity.name}
                    </div>
                )}
                {favs.length === 0 && (currentCity ? alreadyFav : true) && (
                    <div className="fav-add-btn" style={{ cursor: 'default' }}>
                        {t('noFavorites')}
                    </div>
                )}
            </div>
        </div>
    );
}
