import React from 'react';
import { useGame } from '../../context/GameContext';

export default function WatchconDisplay() {
    const { state } = useGame();

    const getWatchconColor = (level) => {
        switch (level) {
            case 4: return 'text-phosphor border-phosphor';
            case 3: return 'text-neutralYellow border-neutralYellow';
            case 2: return 'text-amberWarning border-amberWarning';
            case 1: return 'text-threatRed border-threatRed animate-pulse shadow-threat-glow bg-threatRed/10';
            default: return 'text-phosphor border-phosphor';
        }
    };

    const getDefconColor = (level) => {
        // For flavor, we tie DEFCON to asset HP
        if (state.assetHp > 75) return 'text-neutralYellow border-neutralYellow';
        if (state.assetHp > 40) return 'text-amberWarning border-amberWarning';
        return 'text-threatRed border-threatRed animate-pulse bg-threatRed/10';
    };

    const defcon = state.assetHp > 75 ? 3 : state.assetHp > 40 ? 2 : 1;

    return (
        <div className="flex w-full divide-x-2 divide-phosphor border-b-2 border-phosphor bg-black">
            <div className={`p-4 flex-1 flex flex-col items-center justify-center transition-colors ${getWatchconColor(state.watchcon)} border-b-[4px]`}>
                <span className="text-[10px] opacity-70 mb-1">WARNING CONDITION</span>
                <span className="text-3xl font-bold">WATCHCON {state.watchcon}</span>
            </div>
            <div className={`p-4 flex-1 flex flex-col items-center justify-center transition-colors ${getDefconColor(defcon)} border-b-[4px]`}>
                <span className="text-[10px] opacity-70 mb-1">DEFENSE READINESS</span>
                <span className="text-3xl font-bold">DEFCON {defcon}</span>
            </div>
        </div>
    );
}
