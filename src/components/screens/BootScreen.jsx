import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useAudio } from '../../context/AudioContext';

const INITIAL_LOGS = [
    { text: 'POST Sequence Initiated...', delay: 0 },
    { text: 'Memory Test: 640K OK', delay: 500 },
    { text: 'Initializing Video Adapter...', delay: 1000 },
    { text: 'Checking BIOS interrupts...', delay: 1500 },
    { text: 'LOAD_KERNEL_MAIN...', delay: 2000 },
    { text: 'MOUNTING_RADAR_INTERFACES...', delay: 2800 },
    { text: 'ESTABLISHING_SATCOM_UPLINK...', delay: 3500 },
    { text: 'VERIFYING_SECURITY_TOKENS...', delay: 4200 },
    { text: 'ALLOCATING_MEMORY_BLOCKS_0xFF...', delay: 4800 },
    { text: 'DECRYPTING_TACTICAL_KEYS... [OK]', delay: 5500 }
];

export default function BootScreen() {
    const { dispatch } = useGame();
    const { audio } = useAudio();
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        // Trigger sounds if needed
        let timers = [];

        // Progress bar simulation
        const duration = 6000;
        const interval = 100;
        let elapsed = 0;

        const progressTimer = setInterval(() => {
            elapsed += interval;
            const newProgress = Math.min(100, Math.floor((elapsed / duration) * 100));
            setProgress(newProgress);

            if (newProgress >= 100) {
                clearInterval(progressTimer);
                setTimeout(() => {
                    dispatch({ type: 'FINISH_BOOT' });
                }, 500); // slight pause at 100%
            }
        }, interval);
        timers.push(progressTimer);

        // Logs simulation
        INITIAL_LOGS.forEach(log => {
            const t = setTimeout(() => {
                setLogs(prev => [log.text, ...prev]);
                // Optional: distinct short blip sound here
            }, log.delay);
            timers.push(t);
        });

        return () => {
            timers.forEach(t => clearTimeout(t));
            clearInterval(progressTimer);
        };
    }, [dispatch]);

    const activeSegments = Math.floor((progress / 100) * 20); // 20 segments total

    return (
        <div className="relative w-full h-screen flex flex-col font-display bg-background-dark text-primary selection:bg-primary selection:text-background-dark overflow-hidden">
            {/* CRT Visual Effects */}
            <div className="absolute inset-0 pointer-events-none z-50 mix-blend-overlay opacity-30 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0)_60%,rgba(0,0,0,0.8)_100%)] pointer-events-none z-40"></div>
            <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(84,207,23,0.1)] pointer-events-none"></div>

            {/* Header */}
            <header className="relative z-30 flex items-center justify-between px-8 py-6 border-b border-primary/30 bg-background-dark/80 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-4xl animate-spin text-primary drop-shadow-[0_0_10px_rgba(84,207,23,0.8)]" style={{ animationDuration: '4s' }}>radar</span>
                    <div>
                        <h1 className="text-2xl font-bold tracking-[0.1em] drop-shadow-[0_0_10px_rgba(84,207,23,0.8)]">TACTICAL AIR DEFENSE C2</h1>
                        <p className="text-xs tracking-widest text-primary/70">SECURE TERMINAL ACCESS v4.2.1</p>
                    </div>
                </div>
                {/* Top Right Status */}
                <div className="flex gap-8 text-right font-mono">
                    <div className="flex flex-col">
                        <span className="text-xs text-primary/60 uppercase tracking-widest">System Integrity</span>
                        <span className="text-xl font-bold animate-pulse text-primary drop-shadow-[0_0_10px_rgba(84,207,23,0.8)]">
                            {progress < 100 ? 'CHECKING...' : 'VERIFIED'}
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="relative z-30 flex-1 flex p-8 gap-8 overflow-hidden">
                {/* Left Column: System Logs */}
                <div className="w-1/3 flex flex-col border border-primary/30 bg-primary/5 rounded h-full relative overflow-hidden backdrop-blur-sm">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-primary/30 bg-primary/10">
                        <span className="text-sm font-bold tracking-wider">KERNEL_LOG.SYS</span>
                        <span className="material-symbols-outlined text-sm opacity-70">terminal</span>
                    </div>
                    <div className="p-4 font-mono text-sm leading-relaxed flex flex-col-reverse h-full overflow-hidden text-primary/90">
                        {logs.map((L, i) => (
                            <div key={i} className={`mb-2 ${i === 0 ? '' : 'opacity-' + Math.max(10, 100 - (i * 10))}`}>
                                <span className="text-primary/50 mr-2">&gt;</span>
                                <span className={i === 0 ? 'inline-block overflow-hidden whitespace-nowrap animate-[typing_1s_steps(40,end)]' : ''}>{L}</span>
                            </div>
                        ))}
                    </div>
                    {/* Blinking Cursor */}
                    <div className="absolute bottom-4 left-4 w-2 h-4 bg-primary animate-pulse"></div>
                </div>

                {/* Center/Right: Faction Logo & Status */}
                <div className="flex-1 flex flex-col items-center justify-center relative">
                    {/* Background Grid */}
                    <div className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-[linear-gradient(rgba(84,207,23,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(84,207,23,0.3)_1px,transparent_1px)] bg-[length:40px_40px]"></div>

                    {/* Central Emblem */}
                    <div className="relative z-10 mb-12 flex flex-col items-center">
                        <div className="relative w-64 h-64 flex items-center justify-center">
                            <div className="absolute inset-0 border-2 border-dashed border-primary/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
                            <div className="absolute -inset-4 border border-primary/20 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>

                            <div className="relative w-48 h-48 flex items-center justify-center border-4 border-primary bg-background-dark/90 rounded-full shadow-[0_0_50px_rgba(84,207,23,0.3)]">
                                <span className="material-symbols-outlined text-[100px] text-primary drop-shadow-[0_0_20px_rgba(84,207,23,0.8)]">military_tech</span>
                            </div>
                        </div>

                        <div className="mt-12 text-center">
                            <h2 className="text-2xl font-bold tracking-widest drop-shadow-[0_0_10px_rgba(84,207,23,0.8)]">GLOBAL DEFENSE INITIATIVE</h2>
                            <p className="text-xs text-primary/60 tracking-[0.5em] mt-2">UNIT 734-ALPHA</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 mt-8 opacity-50 pointer-events-none grayscale">
                        <button className="flex items-center gap-2 px-6 py-3 border border-primary text-primary bg-primary/10 rounded uppercase font-bold tracking-wider">
                            <span className="material-symbols-outlined text-sm">terminal</span>
                            Override
                        </button>
                        <button className="flex items-center gap-2 px-6 py-3 border border-primary text-primary bg-primary/10 rounded uppercase font-bold tracking-wider">
                            <span className="material-symbols-outlined text-sm">lock</span>
                            Abort
                        </button>
                    </div>
                </div>
            </main>

            {/* Footer: Progress Bar */}
            <footer className="relative z-30 px-12 pb-12 pt-4">
                <div className="flex flex-col gap-2 w-full max-w-5xl mx-auto">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-lg font-bold tracking-widest animate-pulse drop-shadow-[0_0_10px_rgba(84,207,23,0.8)]">INITIALIZING TACTICAL DATA LINK</span>
                        <span className="font-mono text-2xl font-bold">{progress}%</span>
                    </div>

                    <div className="h-8 w-full border-2 border-primary/50 p-1 flex gap-1 bg-background-dark/50 backdrop-blur">
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className={`h-full flex-1 ${i < activeSegments ? 'bg-primary shadow-[0_0_10px_rgba(84,207,23,0.8)]' : 'bg-primary/10'}`}></div>
                        ))}
                    </div>

                    <div className="flex justify-between text-xs text-primary/60 font-mono mt-1">
                        <span>BAUD RATE: 9600</span>
                        <span>ENCRYPTION: AES-256-GCM</span>
                        <span>PACKET LOSS: 0.002%</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
