import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { ACTIONS, DIFFICULTIES, GAME_STATES } from '../../constants/gameConstants';
import { useAudio } from '../../context/AudioContext';
import { api } from '../../api/client';

const DIFF_MAPPING = [
    {
        id: 'ELEVATED', // Maps to Recon
        title: 'RECON',
        subtitle: 'LOW INTENSITY CONFLICT',
        defcon: 'DEF 4',
        icon: 'visibility',
        color: 'primary',
        labelColor: 'text-primary',
        borderColor: 'border-primary',
        hoverColor: 'hover:border-primary',
        peerCheckedBorder: 'peer-checked:border-primary',
        peerCheckedBg: 'peer-checked:bg-primary/5',
        peerCheckedShadow: 'peer-checked:box-shadow-glow',
        gradientStart: 'from-primary/20',
        waveDensity: 'LOW',
        ecmJamming: 'NONE'
    },
    {
        id: 'CRISIS', // Maps to Front Line
        title: 'FRONT LINE',
        subtitle: 'STANDARD ENGAGEMENT',
        defcon: 'DEF 3',
        icon: 'precision_manufacturing',
        color: 'alert',
        labelColor: 'text-alert',
        borderColor: 'border-alert',
        hoverColor: 'hover:border-alert',
        peerCheckedBorder: 'peer-checked:border-alert',
        peerCheckedBg: 'peer-checked:bg-alert/5',
        peerCheckedShadow: 'peer-checked:shadow-[0_0_15px_rgba(207,174,23,0.15)]',
        gradientStart: 'from-alert/20',
        waveDensity: 'MODERATE',
        ecmJamming: 'INTERMITTENT'
    },
    {
        id: 'WAR', // Maps to Total War
        title: 'TOTAL WAR',
        subtitle: 'MAXIMUM THREAT',
        defcon: 'DEF 1',
        icon: 'warning',
        color: 'danger',
        labelColor: 'text-danger',
        borderColor: 'border-danger',
        hoverColor: 'hover:border-danger',
        peerCheckedBorder: 'peer-checked:border-danger',
        peerCheckedBg: 'peer-checked:bg-danger/5',
        peerCheckedShadow: 'peer-checked:shadow-[0_0_15px_rgba(230,57,70,0.15)]',
        gradientStart: 'from-danger/20',
        waveDensity: 'SATURATION',
        ecmJamming: 'PERSISTENT'
    }
];

export default function DifficultySelect() {
    const { state, dispatch } = useGame();
    const { audio } = useAudio();
    const [selected, setSelected] = useState('CRISIS'); // Default to middle
    const [isStarting, setIsStarting] = useState(false);

    const handleConfirm = async () => {
        setIsStarting(true);
        const selectedObj = DIFFICULTIES[selected];

        try {
            const data = await api.post('/game', {
                faction: state.faction?.id || 'US',
                difficulty: selectedObj.id
            });

            dispatch({ type: 'SET_SESSION_ID', payload: data.session.id });
            dispatch({ type: ACTIONS.SELECT_DIFFICULTY, payload: selectedObj });
            dispatch({ type: ACTIONS.START_GAME, payload: { systems: state.faction.flatSystems, startHP: selectedObj.startHP } });
            audio.playRadarPing();
        } catch (err) {
            console.error("Failed to start session with backend:", err);
            // Fallback: start game anyway in offline mode
            dispatch({ type: ACTIONS.SELECT_DIFFICULTY, payload: selectedObj });
            dispatch({ type: ACTIONS.START_GAME, payload: { systems: state.faction.flatSystems, startHP: selectedObj.startHP } });
            audio.playRadarPing();
        } finally {
            setIsStarting(false);
        }
    };

    return (
        <div className="font-display h-screen flex flex-col relative bg-background-dark selection:bg-primary selection:text-background-dark overflow-hidden">
            <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,rgba(84,207,23,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(84,207,23,0.05)_1px,transparent_1px)] bg-[length:40px_40px]"></div>
            <div className="absolute inset-0 pointer-events-none z-50 opacity-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
            <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(to_bottom,transparent_0%,rgba(84,207,23,0.1)_50%,transparent_100%)] animate-[scan_4s_linear_infinite]" style={{ animationName: 'scan' }}></div>

            <header className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-primary/30 bg-background-dark/80 backdrop-blur-sm">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 text-primary">
                        <span className="material-symbols-outlined text-[28px] animate-spin" style={{ animationDuration: '8s' }}>radar</span>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold tracking-widest leading-none drop-shadow-[0_0_5px_rgba(84,207,23,0.5)]">TACTICAL C2</h1>
                            <span className="text-[10px] tracking-[0.2em] opacity-80">UNCLASSIFIED // FOUO</span>
                        </div>
                    </div>
                    <div className="hidden md:flex h-6 border-l border-primary/30 pl-6 items-center gap-4 text-xs font-mono tracking-wider text-secondary">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                            NET: SECURE
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">satellite_alt</span>
                            LINK: 100%
                        </span>
                    </div>
                </div>
            </header>

            <main className="relative z-10 flex-1 flex flex-col lg:flex-row overflow-hidden p-6 gap-6">
                <aside className="flex flex-col gap-6 w-full lg:w-[320px] shrink-0">
                    <div className="bg-panel-dark border border-primary/30 rounded-lg p-5 flex flex-col gap-5 shadow-[0_0_10px_rgba(84,207,23,0.2),inset_0_0_5px_rgba(84,207,23,0.1)] relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 p-2 opacity-50">
                            <span className="material-symbols-outlined text-4xl text-primary/10">military_tech</span>
                        </div>
                        <div className="flex flex-col gap-1 border-b border-primary/20 pb-3">
                            <span className="text-xs text-secondary tracking-widest">ACTIVE UNIT</span>
                            <div className="flex items-end justify-between">
                                <span className="text-2xl font-bold text-white drop-shadow-[0_0_5px_rgba(84,207,23,0.5)]">{state.faction?.name || "US PATRIOT"}</span>
                                <span className="text-xs text-primary mb-1">ONLINE</span>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center border border-primary/20 bg-background-dark/50 p-4 rounded relative">
                            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle,#54cf17_1px,transparent_1px)] bg-[length:20px_20px]"></div>
                            <span className="material-symbols-outlined text-[80px] text-primary mb-4 opacity-80">rocket_launch</span>
                        </div>

                        <div className="flex flex-col gap-2 mt-auto">
                            <span className="text-xs text-secondary tracking-widest">MISSION BRIEF</span>
                            <p className="text-[11px] leading-relaxed text-secondary/80 font-mono border-l-2 border-primary/50 pl-3">
                                SELECT ENGAGEMENT PARAMETERS. HIGHER THREAT LEVELS INCREASE ENEMY WAVE DENSITY AND JAMMING FREQUENCY BUT YIELD HIGHER INTEL REWARDS.
                            </p>
                        </div>
                        <button onClick={() => dispatch({ type: 'FINISH_BOOT' })} className="w-full group flex items-center justify-center gap-2 bg-panel-dark border border-secondary/30 text-secondary p-3 rounded-lg font-medium tracking-wider hover:bg-secondary/10 hover:text-white transition-colors text-xs mt-2">
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            CHANGE FACTION
                        </button>
                    </div>
                </aside>

                <section className="flex-1 flex flex-col gap-4">
                    <div className="flex items-center justify-between pb-2 border-b border-primary/20">
                        <h2 className="text-xl font-bold tracking-widest text-white">SELECT THREAT LEVEL</h2>
                        <div className="flex gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                            <span className="text-xs text-primary font-mono tracking-widest">AWAITING INPUT</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                        {DIFF_MAPPING.map(mapping => {
                            const isChecked = selected === mapping.id;
                            const diffData = DIFFICULTIES[mapping.id];

                            return (
                                <label key={mapping.id} className="cursor-pointer group relative">
                                    <input
                                        type="radio"
                                        name="difficulty"
                                        className="peer sr-only"
                                        checked={isChecked}
                                        onChange={() => setSelected(mapping.id)}
                                    />
                                    <div className={`h-full bg-panel-dark border border-primary/30 rounded-lg p-5 flex flex-col transition-all duration-300 ${mapping.hoverColor} ${mapping.peerCheckedBorder} ${mapping.peerCheckedBg} ${mapping.peerCheckedShadow}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex flex-col">
                                                <h3 className={`text-lg font-bold tracking-widest group-hover:text-white transition-colors ${mapping.labelColor}`}>{mapping.title}</h3>
                                                <span className="text-[10px] text-secondary tracking-wider">{mapping.subtitle}</span>
                                            </div>
                                            <span className={`text-2xl font-bold font-mono opacity-50 group-hover:opacity-100 transition-opacity ${mapping.labelColor}`}>{mapping.defcon}</span>
                                        </div>

                                        <div className={`h-24 w-full bg-background-dark/50 border rounded mb-4 relative overflow-hidden flex items-center justify-center border-${mapping.color}/20`}>
                                            <div className={`absolute inset-0 opacity-20 bg-[radial-gradient(circle,var(--tw-gradient-stops))] ${mapping.gradientStart} to-transparent`}></div>
                                            <span className={`material-symbols-outlined text-4xl group-hover:text-${mapping.color} transition-colors text-${mapping.color}/40`}>{mapping.icon}</span>
                                        </div>

                                        <div className="space-y-3 mb-6 flex-1">
                                            <div className={`flex justify-between items-center text-xs font-mono border-b pb-1 border-${mapping.color}/10`}>
                                                <span className="text-secondary">WAVE DENSITY</span>
                                                <span className={`text-${mapping.color}`}>{mapping.waveDensity}</span>
                                            </div>
                                            <div className={`flex justify-between items-center text-xs font-mono border-b pb-1 border-${mapping.color}/10`}>
                                                <span className="text-secondary">SPEED MULT</span>
                                                <span className={`text-${mapping.color}`}>{diffData?.speedMultiplier || 1.0}x</span>
                                            </div>
                                            <div className={`flex justify-between items-center text-xs font-mono border-b pb-1 border-${mapping.color}/10`}>
                                                <span className="text-secondary">ECM JAMMING</span>
                                                <span className={`text-${mapping.color}`}>{mapping.ecmJamming}</span>
                                            </div>
                                        </div>

                                        <div className="mt-auto">
                                            <div className={`text-[10px] text-center uppercase tracking-widest opacity-0 peer-checked:opacity-100 transition-opacity animate-pulse text-${mapping.color}/60`}>
                                                &lt;&lt; PARAMETERS ACCEPTED &gt;&gt;
                                            </div>
                                        </div>

                                        <div className={`absolute top-0 right-0 w-0 h-0 border-t-[16px] border-r-[16px] border-t-transparent opacity-0 peer-checked:opacity-100 transition-opacity border-r-${mapping.color}`}></div>
                                    </div>
                                </label>
                            );
                        })}
                    </div>

                    <div className="mt-auto pt-4 border-t border-primary/20 flex justify-end">
                        <button onClick={handleConfirm} disabled={isStarting} className="group relative flex items-center gap-4 bg-alert text-background-dark px-8 py-4 rounded-lg font-bold tracking-widest text-lg hover:bg-white transition-all duration-150 shadow-[0_0_15px_rgba(207,174,23,0.4)] disabled:opacity-50">
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 w-1/2 skew-x-12 opacity-0 group-hover:opacity-100"></div>
                            <span className="material-symbols-outlined">
                                {isStarting ? 'hourglass_empty' : 'check_circle'}
                            </span>
                            {isStarting ? 'ESTABLISHING LINK...' : 'CONFIRM PARAMETERS'}
                            <span className="ml-2 text-xs opacity-70 animate-pulse">&gt;&gt;&gt;</span>
                        </button>
                    </div>
                </section>
            </main>

            <footer className="relative z-10 px-6 py-2 border-t border-primary/20 bg-background-dark text-[10px] text-primary/40 font-mono flex justify-between uppercase tracking-widest">
                <span>© US DEFENSE NETWORK // AUTH: 882-Alpha</span>
                <span className="hidden md:inline">Secure Terminal // Version 4.2.0-RC1</span>
                <span>ID: 9928-3382-XJ</span>
            </footer>
        </div>
    );
}
