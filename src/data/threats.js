import { TARGET_CLASSES } from '../constants/systemConstants';
import { SYSTEM_TIERS } from '../constants/gameConstants';
import { COLORS } from '../constants/colorConstants';

// Speed is base units (pixels/km per second simulated), multiplier applies in terminal
export const THREAT_TYPES = {
    [TARGET_CLASSES.BALLISTIC]: {
        id: TARGET_CLASSES.BALLISTIC, label: 'BALLISTIC MISSILE', abbreviation: 'BM',
        speed: 30, terminalSpeedMultiplier: 2.5,
        size: 6, blipColor: COLORS.threatRed, trailColor: 'rgba(255, 32, 32, 0.4)',
        minWaveIntroduced: 1, damage: 25, radarCrossSection: 1.0, detectRange: 1.0,
        canBeChaff: false, movementPattern: 'BALLISTIC',
        interceptableTiers: [SYSTEM_TIERS.LONG, SYSTEM_TIERS.MID]
    },
    [TARGET_CLASSES.CRUISE]: {
        id: TARGET_CLASSES.CRUISE, label: 'CRUISE MISSILE', abbreviation: 'CM',
        speed: 15, terminalSpeedMultiplier: 1.0,
        size: 4, blipColor: COLORS.threatRed, trailColor: 'rgba(255, 32, 32, 0.3)',
        minWaveIntroduced: 3, damage: 15, radarCrossSection: 0.6, detectRange: 0.9,
        canBeChaff: false, movementPattern: 'CRUISE',
        interceptableTiers: [SYSTEM_TIERS.LONG, SYSTEM_TIERS.MID, SYSTEM_TIERS.SHORT, SYSTEM_TIERS.POINT]
    },
    [TARGET_CLASSES.HYPERSONIC]: {
        id: TARGET_CLASSES.HYPERSONIC, label: 'HYPERSONIC GLIDE VEHICLE', abbreviation: 'HGV',
        speed: 55, terminalSpeedMultiplier: 1.2,
        size: 5, blipColor: COLORS.threatRed, trailColor: 'rgba(255, 0, 255, 0.5)',
        minWaveIntroduced: 5, damage: 30, radarCrossSection: 0.5, detectRange: 1.0,
        canBeChaff: false, movementPattern: 'ERRATIC_FAST',
        interceptableTiers: [SYSTEM_TIERS.LONG] // Only top tier long range can hit this (S-500, THAAD, etc defined in faction data)
    },
    [TARGET_CLASSES.FIGHTER]: {
        id: TARGET_CLASSES.FIGHTER, label: 'FIGHTER JET', abbreviation: 'FTR',
        speed: 20, terminalSpeedMultiplier: 1.0,
        size: 7, blipColor: COLORS.threatRed, trailColor: 'none',
        minWaveIntroduced: 6, damage: 10, radarCrossSection: 0.8, detectRange: 1.0,
        canBeChaff: true, movementPattern: 'JINKING',
        interceptableTiers: [SYSTEM_TIERS.LONG, SYSTEM_TIERS.MID, SYSTEM_TIERS.SHORT]
    },
    [TARGET_CLASSES.DRONE]: {
        id: TARGET_CLASSES.DRONE, label: 'DRONE SWARM', abbreviation: 'UAV',
        speed: 10, terminalSpeedMultiplier: 1.0,
        size: 2, blipColor: COLORS.threatRed, trailColor: 'none',
        minWaveIntroduced: 8, damage: 5, radarCrossSection: 0.2, detectRange: 0.7,
        canBeChaff: false, movementPattern: 'SWARM',
        interceptableTiers: [SYSTEM_TIERS.SHORT, SYSTEM_TIERS.POINT]
    },
    [TARGET_CLASSES.BOMB]: {
        id: TARGET_CLASSES.BOMB, label: 'GUIDED BOMB', abbreviation: 'GBU',
        speed: 18, terminalSpeedMultiplier: 1.5,
        size: 3, blipColor: COLORS.threatRed, trailColor: 'rgba(255, 128, 0, 0.3)',
        minWaveIntroduced: 2, damage: 20, radarCrossSection: 0.4, detectRange: 0.9,
        canBeChaff: false, movementPattern: 'FALLING',
        interceptableTiers: [SYSTEM_TIERS.MID, SYSTEM_TIERS.SHORT, SYSTEM_TIERS.POINT]
    },
    [TARGET_CLASSES.LASER]: {
        id: TARGET_CLASSES.LASER, label: 'LASER GUIDED MUNITION', abbreviation: 'LGM',
        speed: 35, terminalSpeedMultiplier: 1.0,
        size: 2, blipColor: COLORS.threatRed, trailColor: 'rgba(255, 255, 0, 0.8)',
        minWaveIntroduced: 10, damage: 15, radarCrossSection: 0.2, detectRange: 0.8,
        canBeChaff: false, movementPattern: 'STRAIGHT',
        interceptableTiers: [SYSTEM_TIERS.MID, SYSTEM_TIERS.SHORT, SYSTEM_TIERS.POINT]
    },
    [TARGET_CLASSES.DIRECTED_ENERGY]: {
        id: TARGET_CLASSES.DIRECTED_ENERGY, label: 'DIRECTED ENERGY', abbreviation: 'DEW',
        speed: 9999, terminalSpeedMultiplier: 1.0, // Instantaneous
        size: 0, blipColor: '#ffffff', trailColor: '#ffffff',
        minWaveIntroduced: 12, damage: 40, radarCrossSection: 0.1, detectRange: 1.0,
        canBeChaff: false, movementPattern: 'INSTANTANEOUS',
        interceptableTiers: [] // Cannot be intercepted
    },
    [TARGET_CLASSES.LOITERING]: {
        id: TARGET_CLASSES.LOITERING, label: 'LOITERING MUNITION', abbreviation: 'LTM',
        speed: 8, terminalSpeedMultiplier: 2.0,
        size: 3, blipColor: COLORS.threatRed, trailColor: 'none',
        minWaveIntroduced: 9, damage: 12, radarCrossSection: 0.3, detectRange: 0.6,
        canBeChaff: false, movementPattern: 'LOITER',
        interceptableTiers: [SYSTEM_TIERS.SHORT, SYSTEM_TIERS.POINT]
    },
    [TARGET_CLASSES.ASBM]: {
        id: TARGET_CLASSES.ASBM, label: 'ANTI-SHIP BALLISTIC MISSILE', abbreviation: 'ASBM',
        speed: 45, terminalSpeedMultiplier: 1.8,
        size: 8, blipColor: COLORS.threatRed, trailColor: 'rgba(255,0,0,0.8)',
        minWaveIntroduced: 7, damage: 35, radarCrossSection: 1.0, detectRange: 1.0,
        canBeChaff: false, movementPattern: 'REENTRY',
        interceptableTiers: [SYSTEM_TIERS.LONG]
    }
};
