import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import { WAVE_CONFIGS } from '../../data/waveConfigs';

export default function WaveIndicator() {
    const { state } = useGame();

    const config = WAVE_CONFIGS.find(w => w.waveNumber === state.wave);
    const msg = config?.introMessage || `WAVE ${state.wave} INCOMING`;

    // Also show a smaller indicator at the top center. The banner drops down when wave starts or is pending

    return (
        <>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-2 flex flex-col items-center pointer-events-none z-30 font-sharetech text-phosphor">
                <div className="text-xl font-bold tracking-[0.2em] border border-phosphor px-6 py-1 bg-black/80 shadow-phosphor">
                    WAVE {state.wave} / 15
                </div>
                {state.waveTimer > 0 && (
                    <div className="mt-1 text-xs opacity-80 bg-black/50 px-2 py-0.5">
                        NEXT INTEL DECODE IN: 00:{state.waveTimer.toString().padStart(2, '0')}
                    </div>
                )}
            </div>

            {/* Big Splash Banner between waves or on wave start */}
            <AnimatePresence>
                {!state.isWaveActive && state.waveTimer > 0 && state.waveTimer < 9 && ( // Show for a few seconds
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute top-1/4 left-0 w-full flex justify-center z-40 pointer-events-none"
                    >
                        <div className="bg-phosphor/20 border-y-4 border-phosphor text-phosphor w-full py-6 text-center shadow-[0_0_20px_#00ff41] px-8 max-w-4xl mx-auto banner-stripes">
                            <h2 className="text-4xl font-bold uppercase tracking-[0.3em] font-sharetech drop-shadow-[0_0_8px_#00ff41]">{msg}</h2>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
