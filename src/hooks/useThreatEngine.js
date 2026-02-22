import { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { ACTIONS, GAME_STATES } from '../constants/gameConstants';
import { applyMovementPattern } from '../utils/threatUtils';
import { applyIntercept } from '../utils/interceptUtils';

export function useThreatEngine() {
    const { state, dispatch } = useGame();
    const requestRef = useRef();
    const lastTimeRef = useRef();
    const lastDispatchRef = useRef(0);

    const update = time => {
        if (lastTimeRef.current !== undefined && state.gameState === GAME_STATES.MAIN_GAME && !state.isPaused) {
            const deltaTime = time - lastTimeRef.current;

            if (state.threats.length > 0) {
                const updatedThreats = [];
                let breaches = 0;
                let breachDamage = 0;

                state.threats.forEach(t => {
                    const newPos = applyMovementPattern(t, deltaTime, { x: 0, y: 0 }); // Center is 0,0 locally in world
                    t.x = newPos.x;
                    t.y = newPos.y;
                    t.timeAlive = newPos.timeAlive;
                    t.jinkTimer = newPos.jinkTimer;
                    t.headingOffsetX = newPos.headingOffsetX;
                    t.headingOffsetY = newPos.headingOffsetY;

                    // Check breach (reached center)
                    if (Math.abs(t.x) < 5 && Math.abs(t.y) < 5) { // 5km tolerance
                        breaches++;
                        breachDamage += t.damage;
                        dispatch({ type: ACTIONS.THREAT_BREACH, payload: { threatId: t.id, damage: t.damage } });
                        // Audio Engine would be triggered here or in component, ideally in effect observing log
                    } else {
                        updatedThreats.push(t);
                    }
                });

                if (updatedThreats.length !== state.threats.length && breaches === 0) {
                    // handled via dispatch inside loop for breaches
                } else {
                    // Throttle position updates to React Context to roughly 30FPS to prevent UI lag
                    if (time - lastDispatchRef.current > 33) {
                        dispatch({ type: ACTIONS.UPDATE_THREAT_POSITIONS, payload: updatedThreats });
                        lastDispatchRef.current = time;
                    }
                }
            }
        }
        lastTimeRef.current = time;
        requestRef.current = requestAnimationFrame(update);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(update);
        return () => cancelAnimationFrame(requestRef.current);
    }, [state.gameState, state.isPaused, state.threats]); // Note: In a real high-perf app, this dependency on threats might cause excessive re-binds.
}
