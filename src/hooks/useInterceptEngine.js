import { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { ACTIONS, GAME_STATES } from '../constants/gameConstants';
import { calculateIntercept } from '../utils/interceptUtils';
import { useAudio } from '../context/AudioContext';

export function useInterceptEngine() {
    const { state, dispatch } = useGame();
    const { audio } = useAudio();
    const requestRef = useRef();
    const lastTimeRef = useRef();
    const lastDispatchRef = useRef(0);

    const update = time => {
        if (lastTimeRef.current !== undefined && state.gameState === GAME_STATES.MAIN_GAME && !state.isPaused) {
            const deltaTime = time - lastTimeRef.current;

            if (state.interceptors.length > 0) {
                const updatedInterceptors = [];

                state.interceptors.forEach(i => {
                    // Progress goes from 0 to 1 over duration
                    const increment = deltaTime / i.duration;
                    i.progress += increment;

                    if (i.progress >= 1) {
                        // Intercept evaluation
                        const target = state.threats.find(t => t.id === i.targetId);
                        const system = state.systems.find(s => s.id === i.systemId);

                        if (target && system) {
                            const success = calculateIntercept(system, target, state.ecmActive, 1.0); // could pass difficultyModifier
                            const bdaInfo = {
                                targetId: target.id,
                                targetType: target.type,
                                systemName: system.name,
                                pk: system.pk,
                                result: success,
                                time: new Date().toISOString()
                            };

                            if (success) {
                                dispatch({ type: ACTIONS.INTERCEPT_SUCCESS, payload: { threatId: target.id, interceptorId: i.id, x: i.endX, y: i.endY, scoreValue: 100, bda: bdaInfo } });
                                audio.playInterceptSuccess();
                            } else {
                                dispatch({ type: ACTIONS.INTERCEPT_FAILURE, payload: { threatId: target.id, interceptorId: i.id, bda: bdaInfo } });
                                audio.playInterceptFailure();
                            }
                        } else {
                            // Target disappeared or invalid, just remove interceptor
                            dispatch({ type: ACTIONS.INTERCEPT_FAILURE, payload: { threatId: i.targetId, interceptorId: i.id, bda: null } });
                        }
                    } else {
                        updatedInterceptors.push(i);
                    }
                });

                // Batch update in-flight
                if (updatedInterceptors.length > 0 || state.interceptors.length > 0) {
                    if (time - lastDispatchRef.current > 33) {
                        dispatch({ type: ACTIONS.UPDATE_INTERCEPTIONS, payload: updatedInterceptors });
                        lastDispatchRef.current = time;
                    }
                }
            }

            // Cleanup Explosions
            if (state.explosions.length > 0) {
                state.explosions.forEach(e => {
                    e.progress += deltaTime / e.duration;
                    if (e.progress >= 1) {
                        dispatch({ type: 'REMOVE_EXPLOSION', payload: e.id });
                    }
                });
            }
        }
        lastTimeRef.current = time;
        requestRef.current = requestAnimationFrame(update);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(update);
        return () => cancelAnimationFrame(requestRef.current);
    }, [state.gameState, state.isPaused, state.interceptors, state.threats, state.explosions]);
}
