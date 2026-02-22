export const calculateKillRatio = (intercepted, total) => {
    if (!total || total === 0) return 0;
    return parseFloat((intercepted / total).toFixed(4));
};

export const getDifficultyModifier = (difficulty) => {
    const lookup = {
        'RECON': 0.8,
        'FRONT LINE': 1.0,
        'TOTAL WAR': 1.5,
        'NIGHTMARE': 2.5
    };
    return lookup[difficulty] || 1.0;
};

export const getWatchconForWave = (waveNumber) => {
    if (waveNumber >= 15) return 1;
    if (waveNumber >= 10) return 2;
    if (waveNumber >= 5) return 3;
    return 4;
};

export const calculateScore = (stats, difficultyModifier) => {
    const { totalIntercepted = 0, finalHp = 0, waveReached = 1, systemsExpendedCount = 0 } = stats;
    let baseScore = (totalIntercepted * 10) + (waveReached * 100);
    if (finalHp > 0) baseScore += (finalHp * 5); // Survival Bonus

    // Penalize inefficient system usage slightly
    baseScore -= (systemsExpendedCount * 2);

    const finalScore = Math.floor(Math.max(0, baseScore) * difficultyModifier);
    return finalScore;
};

export const isHighScore = (score, userId, period, sortedSetRankFuncResult) => {
    // Basic logic to determine if current score breaks their old record
    // This is handled normally by Redis sorted sets updating via ZADD CH, 
    // but useful if checking pre-db commit.
    return true;
};

export const assessSessionValidity = (session) => {
    // Basic anti-cheat heuristicts
    if (session.killRatio > 1.0) return false;
    if (session.sessionDurationMs < 30000 && session.waveReached > 5) return false; // Impossible speed
    if (session.score > 200000) return false; // Hardcoded max theoretical (needs tuning)
    if (session.totalIntercepted > session.totalThreatsSpawned) return false;
    return true;
};
