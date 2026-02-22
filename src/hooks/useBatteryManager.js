import { useGame } from '../context/GameContext';
import { ACTIONS } from '../constants/gameConstants';

export function useBatteryManager() {
    const { state, dispatch } = useGame();

    const getEligibleSystems = (threat) => {
        if (!threat) return [];
        const dist = Math.sqrt(threat.x * threat.x + threat.y * threat.y); // simplified
        return state.systems.filter(sys =>
            sys.status === 'READY' &&
            sys.magazine > 0 &&
            dist <= sys.range &&
            threat.z >= sys.minAltitude &&
            threat.z <= sys.maxAltitude &&
            (threat.type === 'HYPERSONIC' ? sys.canEngageHypersonic : true) &&
            (threat.type === 'ASBM' ? sys.canEngageASBM : true) &&
            (threat.type === 'DIRECTED_ENERGY' ? false : true) // DEW cannot be engaged by missiles
        );
    };

    const fireSystem = (systemId, threatId, interceptorDuration = 500) => {
        const sys = state.systems.find(s => s.id === systemId);
        const target = state.threats.find(t => t.id === threatId);
        if (!sys || !target) return;

        const interceptor = {
            id: `INT-${Date.now()}-${Math.floor(Math.random() * 100)}`,
            systemId: sys.id,
            systemName: sys.name,
            targetId: threatId,
            startX: 0,
            startY: 0,
            endX: target.x,
            endY: target.y,
            progress: 0,
            duration: interceptorDuration
        };

        dispatch({ type: ACTIONS.FIRE_INTERCEPTOR, payload: { systemId, systemName: sys.name, threatId, interceptor } });
    };

    return {
        systems: state.systems,
        getEligibleSystems,
        fireSystem
    };
}
