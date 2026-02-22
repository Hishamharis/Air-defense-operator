import React, { useState, useEffect } from 'react';
import { getZuluNow } from '../../utils/timeUtils';

export default function ZuluClock() {
    const [time, setTime] = useState(getZuluNow());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(getZuluNow());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="font-sharetech text-phosphor flex flex-col items-end border border-phosphor bg-black px-3 py-1 pb-1.5 shadow-phosphor">
            <span className="text-[9px] opacity-70 tracking-widest">ZULU TIME</span>
            <span className="text-xl font-bold leading-none">{time}</span>
        </div>
    );
}
