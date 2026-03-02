import { useI18n } from '../lib/i18n';

const LANG_OPTIONS = [
    { code: 'en', label: 'english', native: 'English', flag: '🇺🇸' },
    { code: 'hi', label: 'hindi', native: 'हिन्दी', flag: '🇮🇳' },
    { code: 'mr', label: 'marathi', native: 'मराठी', flag: '🇮🇳' },
];

export default function SettingsPage() {
    const { lang, setLang, t } = useI18n();

    return (
        <div className="settings-page">
            <h2>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: 24 }}>settings</span>
                {t('settings')}
            </h2>

            {/* Language Section */}
            <div className="settings-section">
                <h3>{t('selectLanguage')}</h3>
                <div className="lang-options">
                    {LANG_OPTIONS.map((opt) => (
                        <button
                            key={opt.code}
                            className={`lang-option ${lang === opt.code ? 'active' : ''}`}
                            onClick={() => setLang(opt.code)}
                        >
                            <span className="lang-flag">{opt.flag}</span>
                            <div className="lang-info">
                                <span className="lang-native">{opt.native}</span>
                                <span className="lang-sub">{t(opt.label)}</span>
                            </div>
                            {lang === opt.code && (
                                <span className="material-symbols-outlined lang-check" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    check_circle
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* About */}
            <div className="settings-section">
                <h3>{t('about')}</h3>
                <div className="settings-about">
                    <p>SkyCast Weather Dashboard</p>
                    <p className="settings-version">{t('version')}</p>
                    <p className="settings-version">Powered by OpenWeatherMap API</p>
                </div>
            </div>
        </div>
    );
}
