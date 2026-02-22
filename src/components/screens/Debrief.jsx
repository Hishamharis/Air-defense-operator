import React from 'react';
import { useGame } from '../../context/GameContext';
import { ACTIONS } from '../../constants/gameConstants';
import { api } from '../../api/client';
import { useEffect, useState } from 'react';

export default function Debrief() {
    const { state, dispatch } = useGame();

    const isSuccess = state.assetHp > 0;

    const handleRestart = () => {
        dispatch({ type: ACTIONS.SELECT_FACTION, payload: null });
        window.location.reload();
    };

    const totalSpawned = state.kills + state.breaches + state.threats.length;
    const ratio = totalSpawned > 0 ? Math.round((state.kills / totalSpawned) * 100) : 0;
    const startHp = state.difficulty?.startHP || 100;
    const hpPercent = Math.max(0, Math.round((state.assetHp / startHp) * 100));

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState('UPLINKING TO CENTRAL COMMAND _');

    useEffect(() => {
        const submitStats = async () => {
            if (!state.sessionId || isSubmitting) return;
            setIsSubmitting(true);

            try {
                // Mock submission for frontend-only
                await new Promise(resolve => setTimeout(resolve, 800));
                setSubmissionStatus('LOCAL UPLINK SECURE // LOG FILED (OFFLINE) _');
            } catch (err) {
                console.error("Failed to submit game stats:", err);
                setSubmissionStatus('UPLINK FAILED // LOGGED TO LOCAL BLACK BOX _');
            }
        };

        submitStats();
    }, [state.sessionId]);

    // Determine colors based on success
    const mainColor = isSuccess ? 'primary' : 'danger';
    const mainTextClass = isSuccess ? 'text-primary' : 'text-danger';
    const mainShadowClass = isSuccess ? 'shadow-[0_0_10px_rgba(84,207,23,0.5)]' : 'shadow-[0_0_10px_rgba(207,23,23,0.5)]';
    const mainTextShadowClass = isSuccess ? 'drop-shadow-[0_0_5px_rgba(84,207,23,0.8)]' : 'drop-shadow-[0_0_5px_rgba(207,23,23,0.8)]';

    return (
        <div className="font-display h-screen flex flex-col relative bg-background-dark selection:bg-primary selection:text-background-dark overflow-hidden">
            <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,rgba(84,207,23,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(84,207,23,0.05)_1px,transparent_1px)] bg-[length:40px_40px]"></div>
            <div className="absolute inset-0 pointer-events-none z-50 opacity-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
            <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(to_bottom,transparent_0%,rgba(84,207,23,0.1)_50%,transparent_100%)] animate-[scan_6s_linear_infinite]" style={{ animationName: 'scan' }}></div>

            <header className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-primary/30 bg-background-dark/80 backdrop-blur-sm">
                <div className={`flex items-center gap-4 ${mainTextClass}`}>
                    <span className="material-symbols-outlined text-3xl">military_tech</span>
                    <div className="flex flex-col">
                        <h1 className={`text-xl font-mono font-bold tracking-widest leading-none ${mainTextShadowClass}`}>AAR: AFTER ACTION REPORT</h1>
                        <span className="text-[10px] tracking-[0.3em] opacity-80 uppercase">Session ID: #9928-XA</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-3 py-1 border border-primary/20 bg-primary/5 rounded text-xs font-mono tracking-widest text-secondary">
                        DEBRIEFING_MODE
                    </div>
                    <div className={`w-2 h-2 rounded-full bg-${mainColor} animate-pulse`}></div>
                </div>
            </header>

            <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 gap-8 overflow-y-auto">
                <div className="w-full max-w-5xl text-center relative py-6">
                    <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                        <div className={`w-full h-[1px] bg-${mainColor}`}></div>
                    </div>
                    <h1 className={`text-6xl md:text-8xl font-black tracking-tighter uppercase ${mainTextClass} ${mainTextShadowClass} relative z-10 bg-background-dark inline-block px-8`}>
                        {isSuccess ? 'MISSION SUCCESS' : 'MISSION FAILED'}
                    </h1>
                    <p className="text-secondary font-mono tracking-[0.5em] text-sm mt-2 uppercase">
                        {isSuccess ? 'Objectives Achieved // Airspace Secure' : 'Catastrophic Asset Loss // Airspace Compromised'}
                    </p>
                </div>

                <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 h-full lg:h-auto">
                    {/* Tactical Summary */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                        <div className={`bg-panel-dark border border-${mainColor}/30 p-5 rounded-sm shadow-[0_0_10px_rgba(84,207,23,0.2),inset_0_0_5px_rgba(84,207,23,0.1)] flex flex-col gap-4 h-full`}>
                            <div className={`flex items-center justify-between border-b border-${mainColor}/20 pb-2`}>
                                <span className="text-xs font-mono text-secondary tracking-widest">TACTICAL SUMMARY</span>
                                <span className={`material-symbols-outlined text-${mainColor}/50 text-sm`}>analytics</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className={`bg-black/40 p-3 border-l-2 border-${mainColor}`}>
                                    <span className="block text-[10px] text-secondary/70 uppercase">Faction</span>
                                    <span className="block text-lg font-bold text-white tracking-wide">{state.faction?.id.toUpperCase() || 'UNKNOWN'}</span>
                                </div>
                                <div className="bg-black/40 p-3 border-l-2 border-alert">
                                    <span className="block text-[10px] text-secondary/70 uppercase">Difficulty</span>
                                    <span className="block text-lg font-bold text-alert tracking-wide">{state.difficulty?.id || 'UNKNOWN'}</span>
                                </div>
                            </div>
                            <div className="mt-2">
                                <div className="flex justify-between text-xs mb-1 font-mono">
                                    <span className="text-secondary">BASE INTEGRITY</span>
                                    <span className={`font-bold ${isSuccess ? 'text-primary' : 'text-danger'}`}>{hpPercent}%</span>
                                </div>
                                <div className={`w-full h-4 bg-black border border-${mainColor}/30 p-[2px] relative`}>
                                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJub25lIi8+CjxwYXRoIGQ9Ik0wIDBMNCA0Wk00IDBMMCA0WiIgc3Ryb2tlPSJyZ2JhKDAsIDAsIDAsIDAuMikiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] z-20 opacity-50"></div>
                                    <div className={`h-full bg-${mainColor} shadow-[0_0_10px_rgba(84,207,23,0.5)]`} style={{ width: `${hpPercent}%` }}></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-center py-6 relative">
                                <svg className="w-32 h-32 transform -rotate-90">
                                    <circle cx="64" cy="64" fill="transparent" r="60" stroke="#172211" strokeWidth="8"></circle>
                                    <circle cx="64" cy="64" fill="transparent" r="60" stroke={isSuccess ? "#54cf17" : "#ef4444"} strokeDasharray="377" strokeDashoffset={377 - (377 * ratio / 100)} strokeWidth="8"></circle>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-white">{ratio}%</span>
                                    <span className="text-[10px] font-mono text-secondary">KILL RATIO</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Threat Report */}
                    <div className="lg:col-span-5 flex flex-col gap-4">
                        <div className={`bg-panel-dark border border-${mainColor}/30 p-5 rounded-sm shadow-[0_0_10px_rgba(84,207,23,0.2),inset_0_0_5px_rgba(84,207,23,0.1)] h-full relative overflow-hidden`}>
                            <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                                <span className={`material-symbols-outlined text-[120px] text-${mainColor}`}>crisis_alert</span>
                            </div>
                            <div className={`flex items-center justify-between border-b border-${mainColor}/20 pb-2 mb-4`}>
                                <span className="text-xs font-mono text-secondary tracking-widest">THREAT NEUTRALIZATION REPORT</span>
                                <span className={`material-symbols-outlined text-${mainColor}/50 text-sm`}>target</span>
                            </div>
                            <div className="space-y-6 relative z-10">
                                <div className="flex items-center justify-between group">
                                    <div className="flex flex-col">
                                        <span className="text-3xl font-display font-bold text-white group-hover:text-primary transition-colors">{totalSpawned}</span>
                                        <span className="text-[10px] font-mono text-secondary uppercase tracking-wider">Total Threats Spawned</span>
                                    </div>
                                    <div className="h-px flex-1 mx-4 bg-primary/20 border-b border-dashed border-primary/30"></div>
                                </div>
                                <div className="flex items-center justify-between group">
                                    <div className="flex flex-col">
                                        <span className="text-3xl font-display font-bold text-primary group-hover:text-white transition-colors">{state.kills}</span>
                                        <span className="text-[10px] font-mono text-secondary uppercase tracking-wider">Threats Intercepted</span>
                                    </div>
                                    <div className="h-px flex-1 mx-4 bg-primary/20 border-b border-dashed border-primary/30"></div>
                                    <span className="material-symbols-outlined text-primary opacity-50">check_circle</span>
                                </div>
                                <div className="flex items-center justify-between group">
                                    <div className="flex flex-col">
                                        <span className="text-3xl font-display font-bold text-danger group-hover:text-white transition-colors">{state.breaches}</span>
                                        <span className="text-[10px] font-mono text-secondary uppercase tracking-wider">Defense Breaches</span>
                                    </div>
                                    <div className="h-px flex-1 mx-4 bg-danger/20 border-b border-dashed border-danger/30"></div>
                                    <span className="material-symbols-outlined text-danger opacity-50">warning</span>
                                </div>
                            </div>

                            <div className="mt-8 p-3 bg-black/40 border border-primary/10 rounded font-mono text-xs text-secondary/80 leading-relaxed">
                                <p className="animate-[typing_2s_steps(40,end)] overflow-hidden whitespace-nowrap">&gt; COMPILING FINAL METRICS...</p>
                                <p className="animate-[typing_2s_steps(40,end)_1s_both] overflow-hidden whitespace-nowrap">&gt; INTERCEPT EFFICIENCY: {ratio > 80 ? 'OPTIMAL' : ratio > 50 ? 'MARGINAL' : 'SUB-OPTIMAL'}</p>
                                <p className="animate-[typing_2s_steps(40,end)_2s_both] overflow-hidden whitespace-nowrap">&gt; CIVILIAN CASUALTIES: {state.breaches * 15000}</p>
                                <p className="animate-[typing_2s_steps(40,end)_3s_both] overflow-hidden whitespace-nowrap">&gt; {submissionStatus}</p>
                            </div>
                        </div>
                    </div>

                    {/* Systems expended */}
                    <div className="lg:col-span-3 flex flex-col gap-4">
                        <div className={`bg-panel-dark border border-${mainColor}/30 p-5 rounded-sm shadow-[0_0_10px_rgba(84,207,23,0.2),inset_0_0_5px_rgba(84,207,23,0.1)] h-full flex flex-col`}>
                            <div className={`flex items-center justify-between border-b border-${mainColor}/20 pb-2 mb-4`}>
                                <span className="text-xs font-mono text-secondary tracking-widest">SYSTEMS STATUS</span>
                                <span className={`material-symbols-outlined text-${mainColor}/50 text-sm`}>battery_alert</span>
                            </div>
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                                {state.systems && state.systems.map((sys, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-black/20 border border-primary/10 hover:bg-primary/5 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-white font-mono">{sys.name}</span>
                                            <span className="text-[10px] text-secondary">{sys.tier} TIER</span>
                                        </div>
                                        <span className={`text-[10px] font-bold border px-1 py-0.5 rounded ${sys.status === 'WINCHESTER' ? 'text-alert border-alert/50' : 'text-primary border-primary/50'}`}>
                                            {sys.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-lg mt-4 z-20">
                    <button onClick={handleRestart} className={`group relative w-full overflow-hidden bg-${mainColor} text-background-dark py-5 px-8 font-bold text-xl tracking-[0.2em] transition-all duration-200 shadow-[0_0_10px_rgba(84,207,23,0.5)]`}>
                        <span className="absolute inset-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSJub25lIi8+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSJyZ2JhKDAsIDAsIDAsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] opacity-20 group-hover:opacity-40"></span>
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            <span className="material-symbols-outlined text-2xl animate-pulse">restart_alt</span>
                            PLAY AGAIN
                        </span>
                        <div className="absolute bottom-0 left-0 h-1 bg-black/20 w-full">
                            <div className="h-full bg-white/50 w-0 group-hover:w-full transition-all duration-500 ease-out"></div>
                        </div>
                    </button>
                    <div className="flex justify-between mt-3 px-2">
                        <button onClick={handleRestart} className="text-xs font-mono text-secondary hover:text-white hover:underline decoration-primary underline-offset-4 transition-colors uppercase tracking-wider">
                            [ Return to Main Menu ]
                        </button>
                    </div>
                </div>
            </main>

            <footer className="relative z-10 px-6 py-2 border-t border-primary/20 bg-background-dark text-[10px] text-primary/40 font-mono flex justify-between uppercase tracking-widest">
                <span>© US DEFENSE NETWORK // DEBRIEFING MODULE</span>
                <span>SECURE LOG: 882-Alpha-End</span>
            </footer>
        </div>
    );
}
