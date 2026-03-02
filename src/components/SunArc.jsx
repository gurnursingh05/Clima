import { format } from 'date-fns';

export default function SunArc({ data }) {
    if (!data?.sys) return null;

    const sunrise = new Date(data.sys.sunrise * 1000);
    const sunset = new Date(data.sys.sunset * 1000);
    const now = new Date();

    const totalDaylight = sunset - sunrise;
    const elapsed = Math.max(0, Math.min(now - sunrise, totalDaylight));
    const progress = totalDaylight > 0 ? elapsed / totalDaylight : 0;

    const arcCx = 120, arcCy = 45, arcRx = 95, arcRy = 35;
    const angle = Math.PI - progress * Math.PI;
    const sunX = arcCx + arcRx * Math.cos(angle);
    const sunY = arcCy - arcRy * Math.sin(angle);

    return (
        <div className="side-card sun-card g-card" id="sunrise-sunset">
            <h3>Sunrise & Sunset</h3>
            <div className="sun-arc-vis">
                <div className="sun-time rise">
                    <div className="st-time">{format(sunrise, 'h:mm a')}</div>
                </div>

                <svg className="sun-arc-svg" viewBox="0 0 240 55" fill="none">
                    <path d="M 20 45 Q 120 -20 220 45" stroke="rgba(255,255,255,0.06)" strokeWidth="2" fill="none" strokeDasharray="6 4" />
                    <path d="M 20 45 Q 120 -20 220 45" stroke="url(#sunG)" strokeWidth="2.5" fill="none" strokeDasharray={`${progress * 300} 300`} />
                    <defs>
                        <linearGradient id="sunG" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#fb923c" />
                            <stop offset="100%" stopColor="#a78bfa" />
                        </linearGradient>
                        <filter id="glow2" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="2.5" result="g" />
                            <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    </defs>
                    {progress > 0 && progress < 1 && (
                        <circle cx={sunX} cy={sunY} r="5" fill="#fbbf24" filter="url(#glow2)" />
                    )}
                </svg>

                <div className="sun-time set">
                    <div className="st-time">{format(sunset, 'h:mm a')}</div>
                </div>
            </div>
        </div>
    );
}
