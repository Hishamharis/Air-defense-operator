import { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { ACTIONS, GAME_STATES, SYSTEM_TIERS } from '../constants/gameConstants';
import { useAudio } from '../context/AudioContext';

export function usePointDefense() {
    const { state, dispatch } = useGame();
    const { audio } = useAudio();

    useEffect(() => {
        if (state.gameState !== GAME_STATES.MAIN_GAME || state.isPaused) return;

        const interval = setInterval(() => {
            // Find ready POINT defense systems
            const pointSystems = state.systems.filter(s => s.tier === SYSTEM_TIERS.POINT && s.status === 'READY' && s.magazine > 0);

            if (pointSystems.length === 0) return;

            // Get IDs of threats already being intercepted
            const targetedIds = new Set(state.interceptors.map(i => i.targetId));

            // Find threats within 10km that are not already targeted
            const nearbyThreats = state.threats.filter(t => {
                const dist = Math.sqrt(t.x * t.x + t.y * t.y);
                return dist <= 10 && !t.ignored && !targetedIds.has(t.id);
            });

            if (nearbyThreats.length > 0) {
                // Fire one point defense system at one threat
                const target = nearbyThreats[0];
                const sys = pointSystems[0]; // Just use the first available

                const interceptor = {
                    id: `PD-${Date.now()}-${Math.floor(Math.random() * 100)}`,
                    systemId: sys.id,
                    systemName: sys.name,
                    tier: sys.tier,
                    targetId: target.id,
                    startX: 0,
                    startY: 0,
                    endX: target.x,
                    endY: target.y,
                    progress: 0,
                    duration: 300 // Point defense intercepts fast
                };

                dispatch({ type: ACTIONS.FIRE_INTERCEPTOR, payload: { systemId: sys.id, systemName: sys.name, threatId: target.id, interceptor } });
                audio.playMissileLaunch(); // Using same sound for now, could be a brrrrt sound
            }
        }, 500); // Check every half second

        return () => clearInterval(interval);
    }, [state.gameState, state.isPaused, state.systems, state.threats, state.interceptors, dispatch, audio]);
}
