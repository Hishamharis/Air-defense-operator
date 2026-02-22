import { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { ACTIONS } from '../constants/gameConstants';
import { useAudio } from '../context/AudioContext';

export function useECM() {
    const { state, dispatch } = useGame();
    const { audio } = useAudio();

    // Handle the active timer tick
    useEffect(() => {
        let interval;
        if (state.ecmActive) {
            interval = setInterval(() => {
                dispatch({ type: ACTIONS.ECM_TICK });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [state.ecmActive, dispatch]);

    // Handle the cooldown timer tick
    useEffect(() => {
        let interval;
        if (!state.ecmActive && state.ecmCooldownTimer > 0) {
            interval = setInterval(() => {
                dispatch({ type: ACTIONS.ECM_COOLDOWN_TICK });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [state.ecmActive, state.ecmCooldownTimer, dispatch]);

    const activateECM = () => {
        if (!state.ecmActive && state.ecmCooldownTimer === 0) {
            dispatch({ type: ACTIONS.TOGGLE_ECM });
            audio.playECMActivate();
            dispatch({ type: ACTIONS.ADD_LOG_ENTRY, payload: { time: new Date().toISOString(), message: 'ECM ACTIVATED', type: 'INFO' } });
        }
    };

    return {
        isActive: state.ecmActive,
        activeTimer: state.ecmActiveTimer,
        cooldownTimer: state.ecmCooldownTimer,
        activateECM
    };
}
