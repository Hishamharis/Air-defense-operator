import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { ACTIONS } from '../../constants/gameConstants';

export default function ThreatQueue() {
    const { state, dispatch } = useGame();
    const [dragId, setDragId] = useState(null);

    const handleDragStart = (id) => setDragId(id);
    const handleDragOver = (e, index) => e.preventDefault();
    const handleDrop = (e, targetIndex) => {
        e.preventDefault();
        if (!dragId) return;
        const draggedIndex = state.threats.findIndex(t => t.id === dragId);
        if (draggedIndex === -1 || targetIndex === draggedIndex) return;
        const newArr = [...state.threats];
        const [removed] = newArr.splice(draggedIndex, 1);
        newArr.splice(targetIndex, 0, removed);
        dispatch({ type: ACTIONS.REORDER_QUEUE, payload: newArr });
        setDragId(null);
    };

    if (!state.threats || state.threats.length === 0) {
        return <div className="p-4 opacity-50 text-sm font-mono">NO ACTIVE THREATS</div>;
    }

    return (
        <div className="space-y-3">
            {state.threats.map((threat, idx) => {
                const tti = Math.floor(Math.sqrt(threat.x * threat.x + threat.y * threat.y) / threat.baseSpeed);
                const isSelected = threat.id === state.selectedThreatId;

                // Style mapping based on threat type/velocity
                let typeColor = 'primary';
                if (threat.baseSpeed > 3) typeColor = 'danger'; // Ballistic/Hypersonic
                else if (threat.baseSpeed > 1) typeColor = 'warning'; // Cruise/Fighter

                if (threat.ignored) typeColor = 'primary'; // Muted

                const borderClass = isSelected ? `border-${typeColor}` : `border-${typeColor}/50`;
                const bgClass = isSelected ? `bg-${typeColor}/20` : `bg-${typeColor}/5 hover:bg-${typeColor}/10`;
                const opacityClass = threat.ignored ? 'opacity-40' : '';

                return (
                    <div
                        key={threat.id}
                        draggable
                        onDragStart={() => handleDragStart(threat.id)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={(e) => handleDrop(e, idx)}
                        onClick={() => dispatch({ type: ACTIONS.SELECT_THREAT, payload: threat.id })}
                        onContextMenu={(e) => { e.preventDefault(); dispatch({ type: ACTIONS.IGNORE_THREAT, payload: threat.id }) }}
                        className={`group border ${borderClass} ${bgClass} p-3 rounded-lg transition-colors cursor-pointer relative overflow-hidden ${opacityClass}`}
                    >
                        {isSelected && typeColor === 'danger' && (
                            <div className="absolute top-0 right-0 p-1">
                                <span className="material-symbols-outlined text-danger text-sm animate-blink-fast">notifications_active</span>
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-${typeColor} font-bold text-lg tracking-wider ${isSelected ? `text-glow${typeColor === 'primary' ? '' : '-' + typeColor}` : ''}`}>
                                {threat.id.split('-').slice(0, 2).join('-')}
                            </span>
                            <span className={`text-xs font-bold ${typeColor === 'danger' ? 'bg-danger text-black' : typeColor === 'warning' ? 'bg-warning/20 text-warning border border-warning/30' : 'bg-primary/20 text-primary border border-primary/30'} px-1.5 py-0.5 rounded uppercase`}>
                                {threat.type.replace('_', ' ')}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                            <div className={`text-${typeColor}/70`}>SPEED: <span className={`text-${typeColor} font-mono`}>M {(threat.baseSpeed / 1.5).toFixed(1)}</span></div>
                            <div className={`text-${typeColor}/70`}>ALT: <span className={`text-${typeColor} font-mono`}>{Math.floor(threat.z)}k FT</span></div>
                        </div>

                        <div className={`border-t border-${typeColor}/30 pt-2 flex justify-between items-center`}>
                            <span className={`text-[10px] text-${typeColor}/70 uppercase tracking-wider`}>Impact In</span>
                            <span className={`text-xl font-mono font-bold text-${typeColor} ${tti < 60 && typeColor === 'danger' ? 'animate-pulse' : ''}`}>
                                {Math.floor(tti / 60).toString().padStart(2, '0')}:{(tti % 60).toString().padStart(2, '0')}
                            </span>
                        </div>
                    </div>
                )
            })}
        </div>
    );
}
