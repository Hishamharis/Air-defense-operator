import { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { ACTIONS, GAME_STATES } from '../constants/gameConstants';

export function useGameLoop() {
    const { state, dispatch } = useGame();
    const requestRef = useRef();
    const previousTimeRef = useRef();

    const tick = time => {
        if (previousTimeRef.current != undefined && state.gameState === GAME_STATES.MAIN_GAME && !state.isPaused) {
            const deltaTime = time - previousTimeRef.current;

            // Update timers (reloads, ECM cooldown)
            dispatch({ type: ACTIONS.TICK_TIMERS, payload: { deltaTime: deltaTime / 1000 } });

        }
        previousTimeRef.current = time;
        requestRef.current = requestAnimationFrame(tick);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(requestRef.current);
    }, [state.gameState, state.isPaused]); // Depend on state to capture current state in closure, or use refs. Actually tick needs latest state, so React might warning stale closures. 
    // We'll manage state updates mostly through targeted effect dependencies in other hooks. 
    // useGameLoop can dispatch a simple TICK action that other components react to, or the reducer handles delta.
}
