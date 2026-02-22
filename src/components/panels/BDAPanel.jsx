import React from 'react';
import { useGame } from '../../context/GameContext';
import { formatZulu } from '../../utils/timeUtils';

export default function BDAPanel() {
    const { state } = useGame();

    if (!state.bda) return (
        <div className="border border-phosphor p-4 bg-black font-sharetech text-phosphor/50 opacity-70">
            <h3 className="text-sm font-bold border-b border-phosphor/30 pb-1 mb-2">BATTLE DAMAGE ASSESSMENT</h3>
            <div className="text-xs">AWAITING ENGAGEMENT DATA</div>
        </div>
    );

    const { targetId, targetType, systemName, pk, result, time } = state.bda;
    const colorClass = result ? 'text-phosphor border-phosphor shadow-phosphor' : 'text-threatRed border-threatRed shadow-threat-glow bg-threatRed/10';

    return (
        <div className={`border p-4 bg-black transition-colors ${colorClass}`}>
            <h3 className="text-sm font-bold border-b border-current pb-1 mb-2 opacity-80">BATTLE DAMAGE ASSESSMENT</h3>

            <div className="grid grid-cols-2 gap-y-1 text-xs">
                <span className="opacity-70">TIME:</span>
                <span>{formatZulu(time)}</span>

                <span className="opacity-70">TARGET:</span>
                <span className="truncate">{targetId} <span className="opacity-50">({targetType})</span></span>

                <span className="opacity-70">SYSTEM:</span>
                <span className="truncate">{systemName}</span>

                <span className="opacity-70">CALC PK:</span>
                <span>{Math.round(pk * 100)}%</span>

                <span className="opacity-70">RESULT:</span>
                <span className={`font-bold text-sm mt-1 border-t border-current pt-1 ${result ? 'animate-pulse' : ''}`}>
                    {result ? 'INTERCEPT CONFIRMED' : 'INTERCEPT FAILED'}
                </span>
            </div>
        </div>
    );
}
