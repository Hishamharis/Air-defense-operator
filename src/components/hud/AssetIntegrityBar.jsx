import React from 'react';
import { useGame } from '../../context/GameContext';
import { useAssetIntegrity } from '../../hooks/useAssetIntegrity';

export default function AssetIntegrityBar() {
    const { hp, maxHp } = useAssetIntegrity();

    const pct = Math.max(0, (hp / maxHp) * 100);

    let color = 'bg-phosphor shadow-phosphor';
    let textColor = 'text-phosphor';
    if (pct <= 60) {
        color = 'bg-amberWarning shadow-amber-glow';
        textColor = 'text-amberWarning';
    }
    if (pct <= 30) {
        color = 'bg-threatRed shadow-threat-glow animate-pulse';
        textColor = 'text-threatRed';
    }

    return (
        <div className="flex flex-col items-center w-full max-w-[200px]">
            <div className={`text-[10px] mb-1 tracking-widest ${textColor} drop-shadow-sm`}>
                ASSET INTEGRITY
            </div>
            <div className="w-full h-3 bg-black border border-phosphor/50 relative overflow-hidden p-[1px]">
                <div
                    className={`h-full transition-all duration-500 ease-out ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <div className={`mt-1 font-bold font-mono text-sm ${textColor}`}>
                {Math.floor(hp)} / {maxHp}
            </div>
        </div>
    );
}
