import { useGame } from '../context/GameContext';

export function useAssetIntegrity() {
    const { state } = useGame();

    // Simple accessor hook
    return {
        hp: state.assetHp,
        maxHp: state.difficulty ? state.difficulty.startHP : 100
    };
}
