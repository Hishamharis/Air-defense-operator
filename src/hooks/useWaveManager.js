import { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { ACTIONS, GAME_STATES, DIFFICULTIES } from '../constants/gameConstants';
import { WAVE_CONFIGS } from '../data/waveConfigs';
import { createThreat } from '../utils/threatUtils';
import { useAudio } from '../context/AudioContext';

export function useWaveManager() {
    const { state, dispatch } = useGame();
    const { audio } = useAudio();
    const waveTimerRef = useRef(null);
    const spawnTimerRef = useRef(null);
    const currentSpawnList = useRef([]);

    useEffect(() => {
        if (state.gameState !== GAME_STATES.MAIN_GAME || state.isPaused) return;

        if (!state.isWaveActive) {
            // Between waves pause logic
            if (state.waveTimer === null) {
                // Init pause
                dispatch({ type: ACTIONS.WAVE_PAUSE_TICK, payload: 10 }); // 10 seconds pause
            } else if (state.waveTimer > 0) {
                waveTimerRef.current = setTimeout(() => {
                    dispatch({ type: ACTIONS.WAVE_PAUSE_TICK, payload: state.waveTimer - 1 });
                }, 1000);
            } else {
                // Start next wave
                const nextWave = state.wave + (state.waveTimer === 0 && state.wave > 1 ? 1 : 0); // first start is wave 1

                if (nextWave > 15) {
                    dispatch({ type: ACTIONS.END_GAME });
                } else {
                    dispatch({ type: ACTIONS.NEXT_WAVE, payload: nextWave });
                    audio.playWaveBanner();

                    // Setup spawn list
                    const config = WAVE_CONFIGS.find(w => w.waveNumber === nextWave);
                    if (config) {
                        let list = [];
                        config.spawnList.forEach(item => {
                            for (let i = 0; i < item.count; i++) {
                                list.push(item.id);
                            }
                        });
                        // Shuffle list
                        list = list.sort(() => Math.random() - 0.5);
                        currentSpawnList.current = list;

                        dispatch({ type: ACTIONS.ADD_LOG_ENTRY, payload: { time: new Date().toISOString(), message: config.introMessage, type: 'WARNING' } });
                    }
                }
            }
        } else {
            // Wave is active, handle spawning
            if (currentSpawnList.current.length > 0) {
                const config = WAVE_CONFIGS.find(w => w.waveNumber === state.wave);
                const interval = config ? config.spawnInterval / DIFFICULTIES[state.difficulty?.id || 'ELEVATED'].spawnMultiplier : 3000;

                spawnTimerRef.current = setTimeout(() => {
                    const typeToSpawn = currentSpawnList.current.pop();
                    const targetDifficulty = DIFFICULTIES[state.difficulty?.id || 'ELEVATED'];
                    // Radar range roughly 150 for spawn distance
                    const newThreat = createThreat(typeToSpawn, Math.floor(Math.random() * 4), 180, state.wave, targetDifficulty);

                    dispatch({ type: ACTIONS.SPAWN_THREAT, payload: newThreat });
                    audio.playThreatDetected();

                }, interval);
            } else if (state.threats.length === 0 && currentSpawnList.current.length === 0) {
                // Wave cleared
                dispatch({ type: ACTIONS.WAVE_PAUSE_TICK, payload: 10 });
            }
        }

        return () => {
            clearTimeout(waveTimerRef.current);
            clearTimeout(spawnTimerRef.current);
        };
    }, [state.gameState, state.isPaused, state.isWaveActive, state.waveTimer, state.threats.length, state.wave, dispatch, audio, state.difficulty]);

    return null;
}
