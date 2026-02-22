import { randomBetween, getDistance, getAngleDeg } from './mathUtils';

export const calculateIntercept = (system, threat, ecmActive, difficultyModifier) => {
    let finalPk = system.pk;

    // ECM reduces enemy guidance, which means our interceptors might have an easier time, 
    // or it just neutralizes directed energy. The prompt says:
    // "ECM active reduces enemy guidance accuracy (increases miss chance by 15%)"
    // Wait, ECM affects enemy hit chance on the base asset, or does it help interception?
    // "trigger calculate intercept result using system Pk modified by current ECM state and difficulty modifier"
    if (ecmActive) finalPk += 0.15; // easier to intercept

    // apply difficulty
    // PEACETIME (1.5 grace -> maybe higher Pk), WAR (0.5 grace) - we will keep pk independent of reloadGrace,
    // maybe difficulty modifier is from difficultySettings, let's keep it simple
    // let's assume difficultyModifier applies directly to Pk if provided
    if (difficultyModifier) finalPk *= difficultyModifier;

    // Max cap 99%
    finalPk = Math.min(finalPk, 0.99);

    return Math.random() <= finalPk; // true if success
};

export const applyIntercept = (threat, result) => {
    // Returns true if threat destroyed
    if (result) return true;
    return false;
};

export const createInterceptAnimation = (systemId, systemName, threatId, startX, startY, endX, endY) => {
    return {
        id: `INT-${Date.now()}-${Math.floor(randomBetween(10, 99))}`,
        systemId,
        systemName,
        targetId: threatId,
        startX,
        startY,
        endX,
        endY,
        progress: 0, // 0 to 1 over 500ms
        duration: 500 // ms
    };
};

export const createExplosion = (x, y, size) => {
    return {
        id: `EXP-${Date.now()}`,
        x,
        y,
        size,
        progress: 0,
        duration: 300 // 300ms
    };
};

export const createDebrisField = (x, y, threatType) => {
    // Generates particles for visual
    const particles = [];
    const num = randomBetween(5, 15);
    for (let i = 0; i < num; i++) {
        particles.push({
            x, y,
            vx: randomBetween(-20, 20),
            vy: randomBetween(-20, 20),
            life: 1.0 // 1 sec
        });
    }
    return particles;
};
