import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { ACTIONS } from '../../constants/gameConstants';
import { useAudio } from '../../context/AudioContext';
import { useEngagementLog } from '../../hooks/useEngagementLog';
import { formatZulu } from '../../utils/timeUtils';

export default function FireControlPanel() {
    const { state, dispatch } = useGame();
    const { audio } = useAudio();
    const { log } = useEngagementLog();
    const [isArmed, setIsArmed] = useState(false);

    const selectedThreat = state.threats.find(t => t.id === state.selectedThreatId);
    const selectedSystem = state.systems?.find(s => s.id === state.selectedSystemId);

    const canFire = isArmed && selectedThreat && selectedSystem && selectedSystem.status === 'READY' && selectedSystem.magazine > 0;

    const handleFire = () => {
        if (!canFire) return;
        audio.playMissileLaunch();

        const interceptor = {
            id: `INT-${Date.now()}-${Math.floor(Math.random() * 100)}`,
            systemId: selectedSystem.id,
            systemName: selectedSystem.name,
            targetId: selectedThreat.id,
            startX: 0, startY: 0,
            endX: selectedThreat.x, endY: selectedThreat.y,
            progress: 0, duration: 500
        };

        dispatch({ type: ACTIONS.FIRE_INTERCEPTOR, payload: { systemId: selectedSystem.id, systemName: selectedSystem.name, threatId: selectedThreat.id, interceptor } });
    };

    return (
        <div className="h-32 border-t border-primary/30 bg-panel-dark/95 backdrop-blur-sm flex items-stretch z-30 shrink-0 select-none">

            {/* System Log */}
            <div className="flex-1 border-r border-primary/30 p-3 font-mono text-[10px] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-2 text-primary/50 uppercase tracking-wider text-[10px]">
                    <span>System Log</span>
                    <span>[AUTO-SCROLL]</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-[2px] pr-2 opacity-80 custom-scrollbar flex flex-col-reverse">
                    {[...log].reverse().slice(0, 15).map((entry, idx) => {
                        let color = "text-primary/60";
                        let timeColor = "text-primary/40";
                        if (entry.type === 'SUCCESS') color = "text-primary";
                        if (entry.type === 'INFO') color = "text-warning";
                        if (entry.type === 'WARNING' || entry.type === 'ERROR') {
                            color = "text-danger";
                            timeColor = "text-danger/60";
                        }
                        return (
                            <div key={idx} className={color}>
                                <span className={timeColor}>{formatZulu(entry.time)}</span> &gt; {entry.message}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Controls */}
            <div className="w-[480px] p-4 flex items-center gap-6 justify-between bg-black/20">

                {/* Safety Toggle Area */}
                <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold text-primary/60 tracking-widest uppercase">Master Arm</span>
                    <div className="relative inline-flex cursor-pointer items-center" onClick={() => setIsArmed(!isArmed)}>
                        <div className={`h-14 w-8 rounded-full border-2 transition-all duration-300 ${isArmed ? 'bg-danger/20 border-danger' : 'border-primary/30 bg-black/50'}`}></div>
                        <div className={`absolute left-[4px] h-6 w-6 rounded-full border transition-all duration-300 ${isArmed ? 'translate-y-[26px] bg-danger border-white shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'top-[4px] bg-primary/20 border-primary shadow-[0_0_10px_rgba(84,207,23,0.3)]'}`}></div>
                    </div>
                    <span className={`text-[10px] font-bold text-danger tracking-widest uppercase transition-opacity ${isArmed ? 'opacity-100 text-glow-danger' : 'opacity-0'}`}>
                        ARMED
                    </span>
                </div>

                {/* Status Display */}
                <div className="flex flex-col gap-2 flex-1">
                    <div className="flex justify-between items-center bg-black/40 border border-primary/20 p-2 rounded">
                        <span className="text-[10px] text-primary/60 uppercase tracking-wider">Mode</span>
                        <span className="text-xs font-bold text-primary">AUTO-TRACK</span>
                    </div>
                    <div className="flex justify-between items-center bg-black/40 border border-primary/20 p-2 rounded">
                        <span className="text-[10px] text-primary/60 uppercase tracking-wider">Solution</span>
                        <span className={`text-xs font-bold ${selectedThreat && selectedSystem ? 'text-primary animate-pulse text-glow' : 'text-primary/30'}`}>
                            {selectedThreat && selectedSystem ? 'LOCKED' : 'STANDBY'}
                        </span>
                    </div>
                </div>

                {/* Fire Button */}
                <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold text-primary/60 tracking-widest uppercase">Launch</span>
                    <button
                        onClick={handleFire}
                        disabled={!canFire}
                        className={`group relative flex h-16 w-16 items-center justify-center rounded border-2 overflow-hidden transition-all ${canFire ? 'border-danger/60 bg-danger/10 shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer active:scale-95 hover:bg-danger/20 hover:border-danger' : 'border-primary/10 bg-black/50 cursor-not-allowed opacity-50'}`}
                    >
                        {canFire && <div className="absolute inset-0 opacity-[0.15] bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#ef4444_5px,#ef4444_10px)] pointer-events-none"></div>}
                        <div className="relative z-10 flex flex-col items-center">
                            <span className={`material-symbols-outlined text-3xl transition-colors ${canFire ? 'text-danger group-hover:text-white drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'text-primary/30'}`}>
                                crisis_alert
                            </span>
                        </div>
                    </button>
                </div>
            </div>

        </div>
    );
}
