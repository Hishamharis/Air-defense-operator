import React from 'react';
import { useGame } from '../../context/GameContext';

export default function KillRatioDisplay() {
    const { state } = useGame();

    const totalSpawned = state.kills + state.breaches + state.threats.length;
    let ratio = 0;
    if (totalSpawned > 0) {
        ratio = ((state.kills / totalSpawned) * 100).toFixed(1);
    }

    return (
        <div className="font-sharetech text-phosphor flex flex-col items-start px-2">
            <span className="text-[10px] opacity-70 tracking-widest leading-none">KILL RATIO</span>
            <span className="text-lg font-bold leading-none">{ratio}%</span>
        </div>
    );
}
