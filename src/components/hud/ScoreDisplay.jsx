import React from 'react';
import { useGame } from '../../context/GameContext';

export default function ScoreDisplay() {
    const { state } = useGame();

    return (
        <div className="font-sharetech text-phosphor flex flex-col items-start px-2">
            <span className="text-[10px] opacity-70 tracking-widest leading-none">SCORE</span>
            <span className="text-xl font-bold leading-none">{state.score.toLocaleString()}</span>
        </div>
    );
}
