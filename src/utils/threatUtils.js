import { THREAT_TYPES } from '../data/threats';
import { TARGET_CLASSES, THREAT_CONFIDENCE } from '../constants/systemConstants';
import { randomBetween, getDistance, randomSign } from './mathUtils';

export const createThreat = (type, spawnEdge, radarRange, waveNumber, difficulty) => {
    const baseDef = THREAT_TYPES[type];

    // Decide spawn position
    // spawnEdge: 0=top, 1=right, 2=bottom, 3=left
    // radarRange is the max spawn distance
    // detectRange modifier applies to when it shows up, but it physically spawns at radar boundary usually
    let x, y;

    if (type === TARGET_CLASSES.BALLISTIC || type === TARGET_CLASSES.HYPERSONIC || type === TARGET_CLASSES.ASBM || type === TARGET_CLASSES.LASER) {
        // Spawns near top edge (y is negative if center is 0,0 and top is -)
        // Assume world y < 0 is "top" in traditional Cartesian or + is top. 
        // Let's assume standard math where 0,0 center. -y is north/top
        x = randomBetween(-radarRange * 0.5, radarRange * 0.5);
        y = -radarRange - randomBetween(10, 50);
    } else if (spawnEdge === 1) { // right
        x = radarRange + randomBetween(10, 50);
        y = randomBetween(-radarRange * 0.8, radarRange * 0.8);
    } else if (spawnEdge === 3) { // left
        x = -radarRange - randomBetween(10, 50);
        y = randomBetween(-radarRange * 0.8, radarRange * 0.8);
    } else {
        // default top/bottom spread
        x = randomBetween(-radarRange, radarRange);
        y = spawnEdge === 2 ? radarRange + 20 : -radarRange - 20;
    }

    return {
        id: `TGT-${String(Date.now()).slice(-5)}-${Math.floor(Math.random() * 90 + 10)}`,
        type: type,
        x: x,
        y: y,
        z: randomBetween(10, 50), // altitude
        baseSpeed: baseDef.speed * difficulty.speedMultiplier,
        headingOffsetX: 0,
        headingOffsetY: 0,
        jinkTimer: 0,
        health: 100,
        timeAlive: 0,
        confidence: THREAT_CONFIDENCE.UNKNOWN,
        ignored: false,
        ...baseDef
    };
};

export const applyMovementPattern = (threat, deltaTime, radarCenter) => {
    const dt = deltaTime / 1000;
    const distToCenter = getDistance(threat.x, threat.y, radarCenter.x, radarCenter.y);

    // Terminal phase check (e.g., last 20% of range)
    // Assume radarRange is roughly 150 defaults
    const isTerminal = distToCenter < 30;
    const currentSpeed = isTerminal ? threat.baseSpeed * threat.terminalSpeedMultiplier : threat.baseSpeed;

    const dx = radarCenter.x - threat.x;
    const dy = radarCenter.y - threat.y;
    const angleToCenter = Math.atan2(dy, dx);

    let moveX = Math.cos(angleToCenter) * currentSpeed * dt;
    let moveY = Math.sin(angleToCenter) * currentSpeed * dt;

    // Pattern overrides
    threat.timeAlive += dt;

    if (threat.movementPattern === 'JINKING' || threat.movementPattern === 'ERRATIC_FAST' || threat.movementPattern === 'LOITER') {
        threat.jinkTimer -= dt;
        if (threat.jinkTimer <= 0) {
            if (threat.movementPattern === 'JINKING') {
                const jinkAngle = randomBetween(-0.5, 0.5); // rad
                threat.headingOffsetX = Math.cos(angleToCenter + jinkAngle) * currentSpeed - moveX;
                threat.headingOffsetY = Math.sin(angleToCenter + jinkAngle) * currentSpeed - moveY;
                threat.jinkTimer = 2;
            } else if (threat.movementPattern === 'ERRATIC_FAST') {
                const jinkAngle = randomBetween(-0.25, 0.25);
                threat.headingOffsetX = Math.cos(angleToCenter + jinkAngle) * currentSpeed - moveX;
                threat.headingOffsetY = Math.sin(angleToCenter + jinkAngle) * currentSpeed - moveY;
                threat.jinkTimer = 1;
            } else if (threat.movementPattern === 'LOITER') {
                const jinkAngle = randomBetween(-1.5, 1.5);
                threat.headingOffsetX = Math.cos(angleToCenter + jinkAngle) * currentSpeed * 0.5 - moveX;
                threat.headingOffsetY = Math.sin(angleToCenter + jinkAngle) * currentSpeed * 0.5 - moveY;
                threat.jinkTimer = randomBetween(2, 4);
            }
        }

        // Smooth return to center vector
        threat.headingOffsetX *= 0.95;
        threat.headingOffsetY *= 0.95;

        moveX += threat.headingOffsetX * dt;
        moveY += threat.headingOffsetY * dt;
    }

    if (threat.movementPattern === 'CRUISE') {
        // slight sinusoidal weaving
        const wave = Math.sin(threat.timeAlive * 2) * 5;
        // Perpendicular vector
        const perpX = -Math.sin(angleToCenter);
        const perpY = Math.cos(angleToCenter);
        moveX += perpX * wave * dt;
        moveY += perpY * wave * dt;
    }

    return { x: threat.x + moveX, y: threat.y + moveY, timeAlive: threat.timeAlive, jinkTimer: threat.jinkTimer, headingOffsetX: threat.headingOffsetX, headingOffsetY: threat.headingOffsetY };
};

export const getTimeToImpact = (threat, radarCenter) => {
    const dist = getDistance(threat.x, threat.y, radarCenter.x, radarCenter.y);
    // Using base speed for estimation
    const speed = threat.baseSpeed;
    return speed > 0 ? dist / speed : 999;
};

export const getThreatConfidence = (threat) => {
    // Simulates that confidence increases over time
    if (threat.timeAlive > 10) return THREAT_CONFIDENCE.SURE;
    if (threat.timeAlive > 3) return THREAT_CONFIDENCE.PROBABLE;
    return THREAT_CONFIDENCE.UNKNOWN;
};

export const classifyThreatAuto = (threat) => {
    // Based on altitude, speed behavior it attempts to guess type
    if (threat.type === TARGET_CLASSES.BALLISTIC || threat.type === TARGET_CLASSES.ASBM) return TARGET_CLASSES.BALLISTIC;
    return threat.type;
};

export const isThreatInRange = (threat, system, radarCenter) => {
    const dist = getDistance(threat.x, threat.y, radarCenter.x, radarCenter.y);
    // System range is in km, distance in same km scale
    return dist <= system.range && threat.z >= system.minAltitude && threat.z <= system.maxAltitude;
};

export const getEligibleSystems = (threat, batteries, radarCenter) => {
    return batteries.filter(b => isThreatInRange(threat, b, radarCenter) && b.status === 'READY');
};
