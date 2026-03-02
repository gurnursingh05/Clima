import axios from 'axios';

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org';

const api = axios.create({
    baseURL: BASE_URL,
    params: { appid: API_KEY },
});

/**
 * Search for cities by name using the Geocoding API.
 * Returns an array of { name, lat, lon, country, state }.
 */
export async function searchCity(query, limit = 5) {
    const { data } = await api.get('/geo/1.0/direct', {
        params: { q: query, limit },
    });
    return data;
}

/**
 * Reverse geocode lat/lon to a city name.
 */
export async function reverseGeocode(lat, lon) {
    const { data } = await api.get('/geo/1.0/reverse', {
        params: { lat, lon, limit: 1 },
    });
    return data[0] || null;
}

/**
 * Get current weather for a lat/lon.
 */
export async function getCurrentWeather(lat, lon, units = 'metric') {
    const { data } = await api.get('/data/2.5/weather', {
        params: { lat, lon, units },
    });
    return data;
}

/**
 * Get 5-day / 3-hour forecast.
 */
export async function getForecast(lat, lon, units = 'metric') {
    const { data } = await api.get('/data/2.5/forecast', {
        params: { lat, lon, units },
    });
    return data;
}

/**
 * Get Air Quality Index.
 */
export async function getAirQuality(lat, lon) {
    const { data } = await api.get('/data/2.5/air_pollution', {
        params: { lat, lon },
    });
    return data;
}

/**
 * Build an OpenWeatherMap icon URL.
 */
export function getIconUrl(iconCode, size = '4x') {
    return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`;
}

/**
 * Build map tile URL for Leaflet.
 */
export function getMapTileUrl(layer = 'temp_new') {
    return `https://tile.openweathermap.org/map/${layer}/{z}/{x}/{y}.png?appid=${API_KEY}`;
}
