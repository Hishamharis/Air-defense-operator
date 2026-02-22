import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useThreatEngine } from '../../hooks/useThreatEngine';
import { useInterceptEngine } from '../../hooks/useInterceptEngine';
import { useWaveManager } from '../../hooks/useWaveManager';
import { useInputHandler } from '../../hooks/useInputHandler';
import { usePointDefense } from '../../hooks/usePointDefense';

import Header from '../hud/Header';
import LeftSidebar from '../panels/LeftSidebar';
import RightSidebar from '../panels/RightSidebar';
import FireControlPanel from '../panels/FireControlPanel';
import RadarCanvas from '../radar/RadarCanvas';

export default function MainGame() {
    const { state } = useGame();

    // Toggles
    const [showHelp, setShowHelp] = useState(false); // Default hidden

    // Initialize Core Engines
    useGameLoop();
    useThreatEngine();
    useInterceptEngine();
    useWaveManager();
    usePointDefense();

    // Input Binding
    useInputHandler({
        toggleHelp: () => setShowHelp(!showHelp),
        closeHelp: () => setShowHelp(false)
    });

    if (!state.faction) {
        return <div className="text-primary/20 h-screen w-screen flex items-center justify-center bg-background-dark">AWAITING INITIALIZATION...</div>
    }

    return (
        <div className="flex flex-col h-screen w-screen bg-background-dark overflow-hidden relative selection:bg-primary selection:text-black focus:outline-none font-display">

            <Header />

            <main className="flex-1 flex overflow-hidden">

                <LeftSidebar />

                <section className="flex-1 flex flex-col relative bg-black/50 overflow-hidden">

                    {/* Radar Container */}
                    <div className="flex-1 relative flex items-center justify-center overflow-hidden grid-bg">
                        <RadarCanvas />

                        {/* Help Overlay Toggle */}
                        {showHelp && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-panel-dark/95 p-8 border border-primary shadow-[0_0_15px_rgba(84,207,23,0.5)] z-50 w-[500px] text-primary pointer-events-none rounded backdrop-blur-md">
                                <h2 className="text-2xl font-bold mb-4 border-b border-primary/50 pb-2 text-glow">STRATEGIC COMMAND BINDINGS</h2>
                                <div className="grid grid-cols-2 gap-y-2 gap-x-8 text-sm font-mono">
                                    <span className="opacity-70 text-right">SELECT NEXT THREAT</span><span className="font-bold">TAB</span>
                                    <span className="opacity-70 text-right">SELECT PREV THREAT</span><span className="font-bold">SHIFT+TAB</span>
                                    <span className="opacity-70 text-right">DESELECT</span><span className="font-bold">ESC</span>
                                    <span className="col-span-2 border-b border-primary/20 my-1"></span>

                                    <span className="opacity-70 text-right">SELECT TIER 1 SYSTEM</span><span className="font-bold">1</span>
                                    <span className="opacity-70 text-right">SELECT TIER 2 SYSTEM</span><span className="font-bold">2</span>
                                    <span className="opacity-70 text-right">SELECT TIER 3 SYSTEM</span><span className="font-bold">3</span>
                                    <span className="opacity-70 text-right">SELECT TIER 4 SYSTEM</span><span className="font-bold">4</span>
                                    <span className="col-span-2 border-b border-primary/20 my-1"></span>

                                    <span className="opacity-70 text-right">FIRE / INTERCEPT</span><span className="font-bold">SPACE</span>
                                    <span className="opacity-70 text-right">ABORT INTERCEPT</span><span className="font-bold">F</span>
                                    <span className="col-span-2 border-b border-primary/20 my-1"></span>

                                    <span className="opacity-70 text-right">TOGGLE ECM</span><span className="font-bold">E</span>
                                    <span className="opacity-70 text-right">REQUEST SUPPORT</span><span className="font-bold">S</span>
                                    <span className="opacity-70 text-right">PAUSE GAME</span><span className="font-bold">P</span>
                                    <span className="col-span-2 border-b border-primary/20 my-1"></span>

                                    <span className="opacity-70 text-right">ZOOM IN / OUT</span><span className="font-bold">+ / -</span>
                                    <span className="opacity-70 text-right">TOGGLE MUTE</span><span className="font-bold">M</span>

                                    <span className="col-span-2 text-center text-[10px] mt-4 opacity-50">PRESS ? TO TOGGLE HELP SCREEN</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <FireControlPanel />

                </section>

                <RightSidebar />

            </main>

        </div>
    );
}
