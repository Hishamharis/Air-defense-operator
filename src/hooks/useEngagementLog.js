import { useGame } from '../context/GameContext';

export function useEngagementLog() {
    const { state } = useGame();

    // Simple accessor hook to adhere to strict architecture requested
    return {
        log: state.log
    };
}
