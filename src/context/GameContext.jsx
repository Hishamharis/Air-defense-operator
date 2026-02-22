import React, { createContext, useReducer, useContext } from 'react';
import { ACTIONS, GAME_STATES } from '../constants/gameConstants';

const initialState = {
    gameState: GAME_STATES.BOOT, // BOOT, FACTION_SELECT, DIFFICULTY_SELECT, MAIN_GAME, DEBRIEF
    faction: null,
    difficulty: null,
    systems: [],      // array of configured systems with magazines and status
    threats: [],      // array of active threat objects
    interceptors: [], // array of in-flight interceptor objects
    explosions: [],   // visual explosion events
    log: [],          // array of log strings/objects
    bda: null,        // last battle damage assessment object
    wave: 1,
    waveTimer: null,  // countdown between waves
    isWaveActive: false,
    ecmActive: false,
    ecmActiveTimer: 0,
    ecmCooldownTimer: 0,
    assetHp: 100,
    sessionId: null,
    score: 0,
    kills: 0,
    breaches: 0,
    watchcon: 4,
    zoomLevel: 100, // max km visible (100, 150, 200, 250)
    autoEngage: false,
    isPaused: false,
    supportCooldown: 0,

    // Selections
    selectedThreatId: null,
    selectedSystemId: null,
};

function gameReducer(state, action) {
    switch (action.type) {
        case 'FINISH_BOOT':
            return { ...state, gameState: GAME_STATES.FACTION_SELECT };
        case ACTIONS.SELECT_FACTION:
            return { ...state, faction: action.payload, gameState: GAME_STATES.DIFFICULTY_SELECT };
        case ACTIONS.SELECT_DIFFICULTY:
            return { ...state, difficulty: action.payload, gameState: GAME_STATES.MAIN_GAME };
        case ACTIONS.START_GAME:
            // Initialization is handled when transitioning to MAIN_GAME, payload contains initialized systems
            return { ...state, systems: action.payload.systems, assetHp: action.payload.startHP };
        case ACTIONS.PAUSE_GAME:
            return { ...state, isPaused: true };
        case ACTIONS.RESUME_GAME:
            return { ...state, isPaused: false };
        case ACTIONS.SPAWN_THREAT:
            return { ...state, threats: [...state.threats, action.payload] };
        case ACTIONS.REMOVE_THREAT:
            return { ...state, threats: state.threats.filter(t => t.id !== action.payload) };
        case ACTIONS.SELECT_THREAT:
            return { ...state, selectedThreatId: action.payload };
        case ACTIONS.DESELECT_THREAT:
            return { ...state, selectedThreatId: null };
        case ACTIONS.SELECT_SYSTEM:
            return { ...state, selectedSystemId: action.payload };
        case ACTIONS.FIRE_INTERCEPTOR:
            // Deduct magazine, set system status to RELOADING, add to interceptors
            const updatedSystemsFire = state.systems.map(sys => {
                if (sys.id === action.payload.systemId) {
                    const newMag = sys.magazine - 1;
                    return {
                        ...sys,
                        magazine: newMag,
                        status: newMag > 0 ? 'RELOADING' : 'WINCHESTER',
                        reloadTimer: newMag > 0 ? sys.reloadTime : 0
                    };
                }
                return sys;
            });
            return {
                ...state,
                systems: updatedSystemsFire,
                interceptors: [...state.interceptors, action.payload.interceptor],
                log: [{ time: new Date().toISOString(), message: `FIRED ${action.payload.systemName} AT TGT-${action.payload.threatId}`, type: 'INFO' }, ...state.log].slice(0, 20)
            };
        case ACTIONS.INTERCEPT_SUCCESS:
            return {
                ...state,
                kills: state.kills + 1,
                score: state.score + action.payload.scoreValue,
                threats: state.threats.filter(t => t.id !== action.payload.threatId),
                interceptors: state.interceptors.filter(i => i.id !== action.payload.interceptorId),
                explosions: [...state.explosions, { x: action.payload.x, y: action.payload.y, size: 20, id: Date.now() }],
                log: [{ time: new Date().toISOString(), message: `INTERCEPT SUCCESS TGT-${action.payload.threatId}`, type: 'SUCCESS' }, ...state.log].slice(0, 20),
                bda: action.payload.bda
            };
        case ACTIONS.INTERCEPT_FAILURE:
            return {
                ...state,
                interceptors: state.interceptors.filter(i => i.id !== action.payload.interceptorId),
                log: [{ time: new Date().toISOString(), message: `INTERCEPT FAILED TGT-${action.payload.threatId}`, type: 'WARNING' }, ...state.log].slice(0, 20),
                bda: action.payload.bda
            };
        case ACTIONS.THREAT_BREACH:
            return {
                ...state,
                breaches: state.breaches + 1,
                assetHp: Math.max(0, state.assetHp - action.payload.damage),
                threats: state.threats.filter(t => t.id !== action.payload.threatId),
                log: [{ time: new Date().toISOString(), message: `BREACH TGT-${action.payload.threatId} DMG: ${action.payload.damage}`, type: 'ERROR' }, ...state.log].slice(0, 20),
                gameState: state.assetHp - action.payload.damage <= 0 ? GAME_STATES.DEBRIEF : state.gameState
            };
        case ACTIONS.UPDATE_BATTERY_STATUS:
            // handled via tick, but explicit updates here if needed
            return { ...state, systems: action.payload };
        case ACTIONS.TOGGLE_ECM:
            if (state.ecmActive || state.ecmCooldownTimer > 0) return state;
            return { ...state, ecmActive: true, ecmActiveTimer: 10 };
        case ACTIONS.ECM_TICK:
            if (!state.ecmActive) return state;
            if (state.ecmActiveTimer <= 1) {
                return { ...state, ecmActive: false, ecmActiveTimer: 0, ecmCooldownTimer: 20 };
            }
            return { ...state, ecmActiveTimer: state.ecmActiveTimer - 1 };
        case ACTIONS.ECM_COOLDOWN_TICK:
            if (state.ecmCooldownTimer <= 0) return state;
            return { ...state, ecmCooldownTimer: state.ecmCooldownTimer - 1 };
        case ACTIONS.TICK_TIMERS:
            // Decrement reload timers
            const tickedSystems = state.systems.map(sys => {
                if (sys.status === 'RELOADING' && sys.reloadTimer > 0) {
                    const newTimer = sys.reloadTimer - action.payload.deltaTime;
                    if (newTimer <= 0) {
                        return { ...sys, status: 'READY', reloadTimer: 0 };
                    }
                    return { ...sys, reloadTimer: newTimer };
                }
                return sys;
            });
            return {
                ...state,
                systems: tickedSystems,
                supportCooldown: Math.max(0, state.supportCooldown - action.payload.deltaTime)
            };
        case ACTIONS.UPDATE_ASSET_HP:
            return { ...state, assetHp: action.payload };
        case ACTIONS.NEXT_WAVE:
            let newWatchcon = 4;
            if (action.payload >= 3 && action.payload < 5) newWatchcon = 3;
            if (action.payload >= 5 && action.payload < 8) newWatchcon = 2;
            if (action.payload >= 8) newWatchcon = 1;

            return { ...state, wave: action.payload, isWaveActive: true, watchcon: newWatchcon };
        case ACTIONS.WAVE_PAUSE_TICK:
            return { ...state, waveTimer: action.payload, isWaveActive: false };
        case ACTIONS.ADD_LOG_ENTRY:
            return { ...state, log: [action.payload, ...state.log].slice(0, 20) };
        case ACTIONS.UPDATE_BDA:
            return { ...state, bda: action.payload };
        case ACTIONS.SET_ZOOM:
            return { ...state, zoomLevel: action.payload };
        case ACTIONS.TOGGLE_AUTO_ENGAGE:
            return { ...state, autoEngage: !state.autoEngage };
        case ACTIONS.REQUEST_SUPPORT:
            if (state.supportCooldown > 0) return state;
            return { ...state, supportCooldown: 30 };
        case ACTIONS.SUPPORT_FIRE:
            // Handled similar to fire interceptor but distinct logic
            return {
                ...state,
                interceptors: [...state.interceptors, action.payload.interceptor],
                log: [{ time: new Date().toISOString(), message: `ALLIED SUPPORT FIRED AT TGT-${action.payload.threatId}`, type: 'INFO' }, ...state.log].slice(0, 20)
            };
        case ACTIONS.ABORT_INTERCEPT:
            const interceptorToAbort = state.interceptors.find(i => i.id === action.payload);
            if (!interceptorToAbort) return state;

            // Refund ammo
            const systemsAfterAbort = state.systems.map(sys => {
                if (sys.id === interceptorToAbort.systemId) {
                    return { ...sys, magazine: sys.magazine + 1, status: 'RELOADING', reloadTimer: sys.reloadTime }; // Immediate reload begin
                }
                return sys;
            });

            return {
                ...state,
                interceptors: state.interceptors.filter(i => i.id !== action.payload),
                systems: systemsAfterAbort,
                log: [{ time: new Date().toISOString(), message: `INTERCEPT ABORTED TGT-${interceptorToAbort.targetId}`, type: 'WARNING' }, ...state.log].slice(0, 20)
            };
        case ACTIONS.PRIORITIZE_THREAT:
            const threatToMove = state.threats.find(t => t.id === action.payload);
            if (!threatToMove) return state;
            return {
                ...state,
                threats: [threatToMove, ...state.threats.filter(t => t.id !== action.payload)]
            };
        case ACTIONS.IGNORE_THREAT:
            return {
                ...state,
                threats: state.threats.map(t => t.id === action.payload ? { ...t, ignored: true } : t)
            };
        case ACTIONS.REORDER_QUEUE:
            return { ...state, threats: action.payload };
        case ACTIONS.UPDATE_THREAT_POSITIONS:
            return { ...state, threats: action.payload };
        case ACTIONS.UPDATE_INTERCEPTIONS: // To update flight paths
            return { ...state, interceptors: action.payload };
        case 'SET_SESSION_ID':
            return { ...state, sessionId: action.payload };

        case ACTIONS.END_GAME:
            return { ...state, gameState: GAME_STATES.DEBRIEF };
        case 'VIEW_LEADERBOARD':
            return { ...state, gameState: GAME_STATES.LEADERBOARD };
        case 'REMOVE_EXPLOSION':
            return { ...state, explosions: state.explosions.filter(e => e.id !== action.payload) };
        default:
            return state;
    }
}

export const GameContext = createContext();

export function GameProvider({ children }) {
    const [state, dispatch] = useReducer(gameReducer, initialState);

    return (
        <GameContext.Provider value={{ state, dispatch }}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    return useContext(GameContext);
}
