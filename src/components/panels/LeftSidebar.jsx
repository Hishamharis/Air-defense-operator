import React from 'react';
import ThreatQueue from './ThreatQueue';
import { useAssetIntegrity } from '../../hooks/useAssetIntegrity';

export default function LeftSidebar() {
    const { hp, maxHp } = useAssetIntegrity();
    const integrityPct = Math.max(0, (hp / maxHp) * 100);

    return (
        <aside className="w-80 flex flex-col border-r border-primary/30 bg-panel-dark/95 backdrop-blur-sm z-30 flex-shrink-0 h-full">
            <div className="p-4 border-b border-primary/30 bg-primary/10">
                <h2 className="text-sm font-bold tracking-widest flex items-center gap-2 text-glow">
                    <span className="material-symbols-outlined text-base">warning</span>
                    THREAT PRIORITY QUEUE
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                <ThreatQueue />
            </div>

            <div className="p-4 border-t border-primary/30 bg-primary/5">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-primary/70">SYSTEM INTEGRITY</span>
                    <span className={`text-xs font-bold ${integrityPct < 30 ? 'text-danger' : 'text-primary'}`}>{Math.floor(integrityPct)}%</span>
                </div>
                <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                    <div
                        className={`h-full shadow-[0_0_10px_rgba(84,207,23,0.5)] transition-all duration-500 ease-out ${integrityPct < 30 ? 'bg-danger shadow-danger' : 'bg-primary shadow-primary'}`}
                        style={{ width: `${integrityPct}%` }}
                    ></div>
                </div>
            </div>
        </aside>
    );
}
