import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { GAME_STATES } from '../../constants/gameConstants';
import { api } from '../../api/client';
import { Trophy, RefreshCw, ChevronLeft } from 'lucide-react';

export default function LeaderboardScreen() {
    const { dispatch } = useGame();
    const [period, setPeriod] = useState('ALLTIME');
    const [leaderboard, setLeaderboard] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLeaderboard = async () => {
        setIsLoading(true);
        try {
            const data = await api.get(`/leaderboard?period=${period}`);
            setLeaderboard(data.leaderboard || []);
        } catch (err) {
            console.error('Failed to load leaderboard', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, [period]);

    return (
        <div className="font-display h-screen flex flex-col relative bg-background-dark selection:bg-primary selection:text-background-dark overflow-hidden">
            <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,rgba(84,207,23,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(84,207,23,0.05)_1px,transparent_1px)] bg-[length:40px_40px]"></div>

            <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-primary/30 bg-background-dark/80 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <Trophy className="w-8 h-8 text-alert" />
                    <div>
                        <h1 className="text-xl font-bold tracking-widest leading-none text-white shadow-alert">GLOBAL LEADERBOARDS</h1>
                        <span className="text-[10px] tracking-[0.2em] opacity-80 text-primary">TOP TACTICAL COMMANDERS</span>
                    </div>
                </div>
                <button
                    onClick={() => dispatch({ type: 'FINISH_BOOT' })} // FINISH_BOOT routes to FACTION_SELECT
                    className="flex items-center gap-2 text-xs font-mono tracking-wider text-secondary hover:text-white transition-colors border border-primary/30 px-4 py-2 rounded bg-primary/10"
                >
                    <ChevronLeft className="w-4 h-4" />
                    RETURN TO C2
                </button>
            </header>

            <main className="relative z-10 flex-1 flex flex-col p-6 gap-6 overflow-hidden max-w-5xl mx-auto w-full">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2 font-mono text-xs">
                        {['DAILY', 'WEEKLY', 'MONTHLY', 'ALLTIME'].map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-2 border flex items-center gap-2 transition-colors duration-200 ${period === p
                                        ? 'bg-alert/20 border-alert text-alert shadow-[0_0_10px_rgba(207,174,23,0.3)]'
                                        : 'bg-black/50 border-primary/20 text-secondary hover:border-primary/50'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={fetchLeaderboard}
                        className="text-primary hover:text-white transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="flex-1 bg-black/60 border border-primary/30 rounded-sm overflow-hidden flex flex-col shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-primary/20 bg-primary/10 font-mono text-xs text-secondary font-bold tracking-wider">
                        <div className="col-span-1 text-center">RANK</div>
                        <div className="col-span-5">CALLSIGN</div>
                        <div className="col-span-3 text-right">SCORE</div>
                        <div className="col-span-3 text-right">WAVES CLEARED</div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center text-primary/50 font-mono animate-pulse">
                                QUERYING SECURE DATABANK...
                            </div>
                        ) : leaderboard.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-secondary font-mono">
                                NO RECORDS FOUND FOR THIS CYCLE
                            </div>
                        ) : (
                            leaderboard.map((entry, index) => {
                                const isTop3 = index < 3;
                                const colors = [
                                    'text-alert border-alert/50 bg-alert/5 shadow-[0_0_10px_rgba(207,174,23,0.2)]', // 1st
                                    'text-gray-300 border-gray-400/50 bg-gray-400/5', // 2nd
                                    'text-amber-600 border-amber-600/50 bg-amber-600/5' // 3rd
                                ];
                                const style = isTop3 ? colors[index] : 'text-primary border-primary/10 bg-black/40';

                                return (
                                    <div key={index} className={`grid grid-cols-12 gap-4 p-4 items-center border rounded-sm font-mono ${style} hover:bg-white/5 transition-colors`}>
                                        <div className="col-span-1 text-center font-bold text-lg">
                                            #{index + 1}
                                        </div>
                                        <div className="col-span-5 flex items-center gap-3">
                                            <span className="font-bold text-lg tracking-wider">{entry.username || 'CLASSIFIED'}</span>
                                            {isTop3 && <Trophy className="w-4 h-4 opacity-50" />}
                                        </div>
                                        <div className="col-span-3 text-right text-xl font-bold font-display">
                                            {(entry.score || 0).toLocaleString()}
                                        </div>
                                        <div className="col-span-3 text-right opacity-80">
                                            {entry.wavesReached || 0}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
