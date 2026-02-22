import React from 'react';
import BatteryStatusPanel from './BatteryStatusPanel';
import { useGame } from '../../context/GameContext';

export default function RightSidebar() {
    const { state } = useGame();

    const activeInterceptors = state.interceptors ? state.interceptors.filter(i => i.systemId !== 'ALLIED-SUPPORT').length : 0;
    const alliedInterceptors = state.interceptors ? state.interceptors.filter(i => i.systemId === 'ALLIED-SUPPORT').length : 0;

    return (
        <aside className="w-80 flex flex-col border-l border-primary/30 bg-panel-dark/95 backdrop-blur-sm z-30 flex-shrink-0 h-full">
            <div className="p-4 border-b border-primary/30 bg-primary/10">
                <h2 className="text-sm font-bold tracking-widest flex items-center gap-2 text-glow">
                    <span className="material-symbols-outlined text-base">shield</span>
                    DEFENSE ASSETS
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                <BatteryStatusPanel />

                {/* Drone/Interceptor Assets Block */}
                <div className="pt-4 border-t border-primary/30">
                    <h3 className="text-xs font-bold text-primary/70 mb-3 tracking-wider">INTERCEPTORS</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-primary/5 border border-primary/20 p-2 rounded flex flex-col items-center">
                            <span className="material-symbols-outlined text-primary mb-1">flight</span>
                            <span className="text-lg font-bold text-primary">{activeInterceptors.toString().padStart(2, '0')}</span>
                            <span className="text-[9px] text-primary/50">IN FLIGHT</span>
                        </div>
                        <div className={`bg-primary/5 border border-primary/20 p-2 rounded flex flex-col items-center ${alliedInterceptors === 0 ? 'opacity-50' : ''}`}>
                            <span className="material-symbols-outlined text-primary/80 mb-1">flight_takeoff</span>
                            <span className="text-lg font-bold text-primary/80">{alliedInterceptors.toString().padStart(2, '0')}</span>
                            <span className="text-[9px] text-primary/50">ALLIED SPT</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sat Comm Status */}
            <div className="p-3 bg-black/40 border-t border-primary/30 flex items-center justify-between text-[10px] font-mono text-primary/60">
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                    SAT LINK: ESTABLISHED
                </div>
                <span>SIG: -45dBm</span>
            </div>
        </aside>
    );
}
