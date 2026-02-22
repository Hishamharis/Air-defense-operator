import React from 'react';
import { useGame } from '../../context/GameContext';
import { ACTIONS } from '../../constants/gameConstants';
import { useAudio } from '../../context/AudioContext';
import { FACTIONS } from '../../data/factions';

export default function FactionSelect() {
    const { dispatch } = useGame();
    const { audio } = useAudio();

    const handleSelect = (faction) => {
        const clonedSystems = faction.systems.flatMap(tierGroup =>
            tierGroup.systems.map(sys => ({
                ...sys,
                maxMagazine: sys.magazine,
                status: 'READY',
                reloadTimer: 0
            }))
        );

        dispatch({ type: ACTIONS.SELECT_FACTION, payload: { ...faction, flatSystems: clonedSystems } });
        audio.playRadarPing();
    };

    return (
        <div className="font-mono h-screen flex flex-col relative bg-background-dark selection:bg-primary selection:text-background-dark overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,rgba(23,34,17,0.5)_1px,transparent_1px),linear-gradient(to_bottom,rgba(23,34,17,0.5)_1px,transparent_1px)] bg-[length:40px_40px]"></div>
            <div className="absolute inset-0 pointer-events-none z-50 opacity-30 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
            <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(to_bottom,transparent_0%,rgba(84,207,23,0.05)_50%,transparent_100%)] animate-[scan_6s_linear_infinite]" style={{ animationName: 'scan' }}></div>

            <header className="relative z-10 flex flex-col items-center justify-center pt-8 pb-4 shrink-0">
                <div className="flex justify-between w-full px-8 absolute top-4 text-[10px] text-primary/30 font-display tracking-widest uppercase z-50">
                    <span>SYS_BOOT</span>
                    <button
                        onClick={() => dispatch({ type: 'VIEW_LEADERBOARD' })}
                        className="hover:text-primary transition-colors cursor-pointer border border-primary/20 px-3 py-1 bg-black/50"
                    >
                        [ VIEW GLOBAL LEADERBOARDS ]
                    </button>
                    <span>STRATEGIC COMMAND</span>
                </div>

                <h1 className="text-5xl md:text-6xl font-display font-bold tracking-[0.15em] text-primary uppercase mb-2 text-center drop-shadow-[0_0_10px_rgba(84,207,23,0.8)]">
                    Air Defense Command
                </h1>

                <div className="w-64 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 mb-3"></div>

                <p className="text-alert text-sm tracking-[0.2em] font-medium uppercase opacity-90">
                    Global Strategic Threat Intercept Interface
                </p>

                {/* Loading blips */}
                <div className="mt-6 w-32 h-1 bg-primary/20 flex gap-1 justify-center">
                    <div className="h-full w-1 bg-primary animate-pulse"></div>
                    <div className="h-full w-1 bg-primary animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="h-full w-1 bg-primary animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                </div>
            </header>

            <main className="relative z-10 flex-1 w-full overflow-hidden px-4 md:px-8 py-4">
                <div className="h-full w-full grid grid-cols-1 md:grid-cols-5 gap-4 overflow-y-auto custom-scrollbar pb-12">

                    {FACTIONS.map((faction, idx) => (
                        <div
                            key={faction.id}
                            onClick={() => handleSelect(faction)}
                            className="group relative border border-primary/20 bg-background-dark/50 p-5 flex flex-col gap-4 cursor-pointer h-full transition-all duration-300 hover:z-20 hover:border-primary hover:bg-primary/5 hover:shadow-[0_0_15px_rgba(84,207,23,0.2),inset_0_0_20px_rgba(84,207,23,0.1)]"
                        >
                            <div className="flex items-baseline justify-between border-b border-primary/20 pb-2 mb-2">
                                <span className="text-3xl font-display font-bold text-primary">{faction.id.toUpperCase().substring(0, 2)}</span>
                                <span className="text-sm tracking-widest text-primary font-bold">{faction.name.toUpperCase()}</span>
                            </div>

                            <p className="text-[11px] leading-relaxed text-primary/80 italic border-l-2 border-primary/30 pl-3 mb-2 min-h-[60px]">
                                "{faction.lore}"
                            </p>

                            <div className="mt-auto flex flex-col gap-4">
                                <div className="text-[10px] text-alert font-bold tracking-widest uppercase mb-1">Arsenal Layout:</div>

                                <div className="flex gap-3 h-full relative">
                                    <div className="flex-1 flex flex-col gap-3 text-xs">
                                        {faction.systems.map(tier => (
                                            <div key={tier.tier}>
                                                <span className="text-[9px] text-secondary/70 block mb-0.5">{tier.tier} TIER</span>
                                                {tier.systems.slice(0, 2).map((sys, i) => (
                                                    <span key={sys.id} className={`block ${i === 0 ? 'text-primary group-hover:drop-shadow-[0_0_8px_rgba(84,207,23,0.8)]' : 'text-secondary'}`}>
                                                        {sys.name}
                                                    </span>
                                                ))}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Abstract bar graphic */}
                                    <div className="w-1.5 h-full min-h-[100px] bg-primary/10 relative rounded-sm overflow-hidden">
                                        <div className="absolute bottom-0 left-0 w-full bg-primary/60 group-hover:bg-primary transition-all duration-500" style={{ height: `${70 + (idx * 5)}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-primary/30 text-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                [ CLICK TO INITIALIZE COMMAND ]
                            </div>
                        </div>
                    ))}

                </div>
            </main>

            <footer className="relative z-10 px-6 py-4 border-t border-primary/20 bg-background-dark flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                    <span className="text-xs text-secondary font-mono tracking-widest uppercase animate-pulse">Awaiting Selection...</span>
                </div>
                <div className="text-[10px] text-primary/30 font-display tracking-[0.2em] uppercase">
                    AUTH REQD
                </div>
            </footer>
        </div>
    );
}
