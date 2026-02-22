import { useEffect, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { ACTIONS, KEYBINDINGS, GAME_STATES, SYSTEM_TIERS } from '../constants/gameConstants';
import { useAudio } from '../context/AudioContext';
import { useECM } from './useECM';

export function useInputHandler(togglePanelsFn) {
    const { state, dispatch } = useGame();
    const { toggleMute } = useAudio();
    const { activateECM } = useECM();

    const handleKeyDown = useCallback((e) => {
        if (state.gameState !== GAME_STATES.MAIN_GAME) return;

        // Prevent default scrolling for Space etc if needed
        if ([' ', 'Tab'].includes(e.key)) {
            e.preventDefault();
        }

        // Special exact matches (like Shift+Tab for cycle prev)
        const isShift = e.shiftKey;
        const isCtrl = e.ctrlKey;
        const key = e.key;

        // Complex binds
        if (isShift && key === 'Tab') {
            cycleThreat(-1);
            return;
        }

        if (isCtrl && key.toLowerCase() === 'd') {
            if (togglePanelsFn?.toggleDebug) togglePanelsFn.toggleDebug();
            return;
        }

        switch (key) {
            case KEYBINDINGS.FIRE:
                handleFire();
                break;
            case KEYBINDINGS.CYCLE_NEXT:
                cycleThreat(1);
                break;
            case KEYBINDINGS.SELECT_TIER_1:
                selectSystemByTier(SYSTEM_TIERS.LONG);
                break;
            case KEYBINDINGS.SELECT_TIER_2:
                selectSystemByTier(SYSTEM_TIERS.MID);
                break;
            case KEYBINDINGS.SELECT_TIER_3:
                selectSystemByTier(SYSTEM_TIERS.SHORT);
                break;
            case KEYBINDINGS.SELECT_TIER_4:
                selectSystemByTier(SYSTEM_TIERS.POINT);
                break;
            case KEYBINDINGS.TOGGLE_ECM:
            case KEYBINDINGS.TOGGLE_ECM.toUpperCase():
                activateECM();
                break;
            case KEYBINDINGS.TOGGLE_PAUSE:
            case KEYBINDINGS.TOGGLE_PAUSE.toUpperCase():
                if (state.isPaused) dispatch({ type: ACTIONS.RESUME_GAME });
                else dispatch({ type: ACTIONS.PAUSE_GAME });
                break;
            case KEYBINDINGS.REQUEST_SUPPORT:
            case KEYBINDINGS.REQUEST_SUPPORT.toUpperCase():
                dispatch({ type: ACTIONS.REQUEST_SUPPORT });
                break;
            case KEYBINDINGS.DESELECT:
                dispatch({ type: ACTIONS.DESELECT_THREAT });
                dispatch({ type: ACTIONS.SELECT_SYSTEM, payload: null });
                if (togglePanelsFn?.closeHelp) togglePanelsFn.closeHelp();
                break;
            case 'f':
            case 'F':
                // Abort intercept - find an interceptor for the selected threat or just abort all?
                // Let's abort the last fired interceptor if possible, or interceptor for selected threat
                if (state.selectedThreatId) {
                    const inFlight = state.interceptors.find(i => i.targetId === state.selectedThreatId);
                    if (inFlight) dispatch({ type: ACTIONS.ABORT_INTERCEPT, payload: inFlight.id });
                }
                break;
            case KEYBINDINGS.TOGGLE_QUEUE:
            case KEYBINDINGS.TOGGLE_QUEUE.toUpperCase():
                if (togglePanelsFn?.toggleQueue) togglePanelsFn.toggleQueue();
                break;
            case KEYBINDINGS.TOGGLE_LOG:
            case KEYBINDINGS.TOGGLE_LOG.toUpperCase():
                if (togglePanelsFn?.toggleLog) togglePanelsFn.toggleLog();
                break;
            case KEYBINDINGS.TOGGLE_BDA:
            case KEYBINDINGS.TOGGLE_BDA.toUpperCase():
                if (togglePanelsFn?.toggleBDA) togglePanelsFn.toggleBDA();
                break;
            case KEYBINDINGS.TOGGLE_MUTE:
            case KEYBINDINGS.TOGGLE_MUTE.toUpperCase():
                toggleMute();
                break;
            case KEYBINDINGS.ZOOM_IN:
            case '=':
                const zoomInVal = Math.max(100, state.zoomLevel - 50);
                dispatch({ type: ACTIONS.SET_ZOOM, payload: zoomInVal });
                break;
            case KEYBINDINGS.ZOOM_OUT:
                const zoomOutVal = Math.min(250, state.zoomLevel + 50);
                dispatch({ type: ACTIONS.SET_ZOOM, payload: zoomOutVal });
                break;
            case KEYBINDINGS.TOGGLE_HUD:
            case KEYBINDINGS.TOGGLE_HUD.toUpperCase():
                if (togglePanelsFn?.toggleHUD) togglePanelsFn.toggleHUD();
                break;
            case '?':
            case '/':
                if (togglePanelsFn?.toggleHelp) togglePanelsFn.toggleHelp();
                break;
            case 'r':
            case 'R':
                cycleAutoLockTarget();
                break;
            default:
                break;
        }
    }, [state, dispatch, activateECM, toggleMute, togglePanelsFn]);

    const cycleThreat = (dir) => {
        if (state.threats.length === 0) return;

        // Sort threats by TTA
        const sorted = [...state.threats].sort((a, b) => {
            const da = Math.sqrt(a.x * a.x + a.y * a.y);
            const db = Math.sqrt(b.x * b.x + b.y * b.y);
            return (da / a.baseSpeed) - (db / b.baseSpeed);
        });

        let idx = sorted.findIndex(t => t.id === state.selectedThreatId);
        if (idx === -1) {
            dispatch({ type: ACTIONS.SELECT_THREAT, payload: sorted[0].id });
        } else {
            idx += dir;
            if (idx < 0) idx = sorted.length - 1;
            if (idx >= sorted.length) idx = 0;
            dispatch({ type: ACTIONS.SELECT_THREAT, payload: sorted[idx].id });
        }
    };

    const selectSystemByTier = (tier) => {
        // Find first ready system in tier
        const sys = state.systems.find(s => s.tier === tier && s.status === 'READY');
        if (sys) {
            dispatch({ type: ACTIONS.SELECT_SYSTEM, payload: sys.id });
        }
    };

    const cycleAutoLockTarget = () => {
        // Low level targets: CRUISE, DRONE, BOMB, LOITERING, FIGHTER. Exclude BALLISTIC, HYPERSONIC, ASBM
        const HIGH_LEVEL = ['BALLISTIC', 'HYPERSONIC', 'ASBM'];

        // Find targeted threats
        const targetedIds = new Set(state.interceptors.map(i => i.targetId));

        const validThreats = state.threats.filter(t =>
            !HIGH_LEVEL.includes(t.type) && !t.ignored && !targetedIds.has(t.id)
        );

        if (validThreats.length === 0) return; // No targets available to auto-lock

        // Sort by closest distance
        validThreats.sort((a, b) => {
            const da = Math.sqrt(a.x * a.x + a.y * a.y);
            const db = Math.sqrt(b.x * b.x + b.y * b.y);
            return da - db;
        });

        // Simply select the closest valid one
        dispatch({ type: ACTIONS.SELECT_THREAT, payload: validThreats[0].id });
    };

    const handleFire = () => {
        if (!state.selectedThreatId || !state.selectedSystemId) return;

        const sys = state.systems.find(s => s.id === state.selectedSystemId);
        const target = state.threats.find(t => t.id === state.selectedThreatId);

        if (sys && sys.status === 'READY' && sys.magazine > 0 && target) {
            // Audio is handled in Fire control component but can also be handled here via engine
            const interceptor = {
                id: `INT-${Date.now()}-${Math.floor(Math.random() * 100)}`,
                systemId: sys.id,
                systemName: sys.name,
                tier: sys.tier,
                targetId: target.id,
                startX: 0,
                startY: 0,
                endX: target.x,
                endY: target.y,
                progress: 0,
                duration: 500
            };
            dispatch({ type: ACTIONS.FIRE_INTERCEPTOR, payload: { systemId: sys.id, systemName: sys.name, threatId: target.id, interceptor } });
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}
