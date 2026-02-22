import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { getZuluNow } from '../../utils/timeUtils';
import AbortModal from '../screens/AbortModal';

export default function Header() {
    const { state } = useGame();
    const [time, setTime] = useState(getZuluNow());
    const [showAbortModal, setShowAbortModal] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(getZuluNow());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const defcon = state.assetHp > 75 ? 3 : state.assetHp > 40 ? 2 : 1;
    const watchcon = state.watchcon || 4;

    const handleAbort = () => {
        // Equivalent to restart in Debrief
        window.location.reload();
    };

    return (
        <>
            <AbortModal
                isOpen={showAbortModal}
                onClose={() => setShowAbortModal(false)}
                onConfirm={handleAbort}
            />
            <header className="flex items-center justify-between border-b border-primary/30 bg-panel-dark px-6 py-3 shrink-0 z-40 shadow-lg shadow-black/50">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-3xl animate-pulse-slow">radar</span>
                        <div>
                            <h1 className="text-xl font-bold tracking-widest text-glow">ADCC // TACTICAL</h1>
                            <p className="text-xs text-primary/60 tracking-[0.2em] uppercase">Sector Alpha Command</p>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-primary/30"></div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary/60">SYSTEM STATUS:</span>
                        <span className="text-sm font-bold text-primary tracking-wider">ONLINE_</span>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2 px-3 py-1 rounded border border-primary/20 bg-primary/5">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        <span className="text-sm font-mono font-bold">{time}</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end leading-none">
                            <span className="text-[10px] text-primary/60 font-bold tracking-widest">DEFCON</span>
                            <span className={`text-2xl font-bold ${defcon < 3 ? 'text-warning animate-pulse drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]' : 'text-primary'}`}>{defcon}</span>
                        </div>

                        <div className="flex flex-col items-end leading-none">
                            <span className="text-[10px] text-primary/60 font-bold tracking-widest">WATCHCON</span>
                            <span className={`text-2xl font-bold ${watchcon < 4 ? 'text-danger animate-pulse drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]' : 'text-primary'}`}>{watchcon}</span>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-primary/30"></div>

                    <button
                        onClick={() => setShowAbortModal(true)}
                        className="group flex items-center gap-2 px-4 py-2 border-2 border-danger/60 bg-danger/5 hover:bg-danger/20 transition-all active:scale-95 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.1),inset_-1px_-1px_0px_rgba(0,0,0,0.5)] relative"
                    >
                        <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#ef4444_5px,#ef4444_10px)]"></div>
                        <span className="material-symbols-outlined text-danger text-lg font-bold z-10">power_settings_new</span>
                        <div className="flex flex-col items-start z-10">
                            <span className="text-[10px] text-danger/80 leading-none font-bold uppercase tracking-tighter">Exit System</span>
                            <span className="text-sm font-bold text-danger leading-none tracking-widest drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">ABORT MISSION</span>
                        </div>
                        <div className="ml-1 flex gap-0.5 z-10">
                            <div className="w-1 h-1 bg-danger animate-pulse"></div>
                        </div>
                    </button>
                </div>
            </header>
        </>
    );
}
