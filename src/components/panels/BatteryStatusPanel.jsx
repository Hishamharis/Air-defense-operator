import React from 'react';
import { useGame } from '../../context/GameContext';
import { ACTIONS } from '../../constants/gameConstants';

export default function BatteryStatusPanel() {
    const { state, dispatch } = useGame();

    const handleSelect = (sysId) => {
        const sys = state.systems.find(s => s.id === sysId);
        if (sys && sys.status === 'READY') {
            dispatch({ type: ACTIONS.SELECT_SYSTEM, payload: sysId });
        }
    };

    if (!state.systems) return null;

    return (
        <div className="space-y-4">
            {state.systems.map(sys => {
                const isSelected = sys.id === state.selectedSystemId;

                let statusColor = 'text-primary bg-primary/20 border-primary/30';
                let statusLabel = sys.status;
                let barColor = 'bg-primary';

                if (sys.status === 'WINCHESTER') {
                    statusColor = 'bg-zinc-800 text-zinc-400 border-zinc-700';
                    barColor = 'bg-primary/5'; // Dimmed
                } else if (sys.status === 'RELOADING') {
                    statusColor = 'bg-warning/20 text-warning border-warning/30';
                    barColor = 'bg-warning';
                    statusLabel = 'ENGAGING'; // Per prototype style loosely matching 'reloading/engaging' vibe
                }

                if (isSelected) {
                    statusColor = 'bg-primary text-black font-bold';
                }

                const isReady = sys.status === 'READY';
                const ammoRatio = sys.magazine / sys.maxMagazine;
                const boxes = [0, 1, 2, 3]; // 4 visual blocks representing ammo

                return (
                    <div
                        key={sys.id}
                        onClick={() => handleSelect(sys.id)}
                        className={`space-y-2 cursor-pointer transition-opacity ${!isReady && !isSelected ? 'opacity-60' : 'opacity-100'} p-2 rounded hover:bg-primary/5 ${isSelected ? 'ring-1 ring-primary/50 bg-primary/10' : ''}`}
                    >
                        <div className="flex justify-between items-end">
                            <span className={`text-xs font-bold ${isSelected ? 'text-primary text-glow' : 'text-primary/80'}`}>{sys.name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusColor} ${sys.status === 'RELOADING' ? 'animate-pulse' : ''}`}>
                                {isSelected ? 'SELECTED' : statusLabel}
                            </span>
                        </div>

                        <div className="grid grid-cols-4 gap-1 h-2">
                            {boxes.map(i => {
                                // Fill blocks based on ammo ratio: 1.0 = 4, 0.75 = 3, etc
                                const threshold = (i + 1) / 4;
                                const isFilled = ammoRatio >= (threshold - 0.1); // bit of fuzziness
                                return (
                                    <div
                                        key={i}
                                        className={`h-full rounded-sm ${isFilled ? barColor : 'bg-primary/5 border border-primary/10'}`}
                                    ></div>
                                )
                            })}
                        </div>

                        <div className="flex justify-between text-[10px] text-primary/50 font-mono">
                            <span className={sys.status === 'RELOADING' ? 'text-warning' : ''}>AMMO: {Math.floor(ammoRatio * 100)}%</span>
                            <span className={sys.status === 'RELOADING' ? 'text-warning animate-pulse' : ''}>
                                {sys.status === 'RELOADING' ? 'RELOADING...' : 'RADAR: ON'}
                            </span>
                        </div>
                    </div>
                )
            })}
        </div>
    );
}
