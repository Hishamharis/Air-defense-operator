import { TARGET_CLASSES } from '../constants/systemConstants';

// Wave 1: 3 ballistic missiles only, slow, introMessage INCOMING BALLISTIC THREAT DETECTED
// Wave 2: 4 ballistic + 2 guided bombs
// Wave 3: introduces cruise missiles, 6 total threats
// Wave 4: 8 threats, mix of ballistic cruise guided bomb
// Wave 5: introduces hypersonic glide vehicles, 8 threats, speedMultiplier 1.25
// Wave 6: introduces fighter jets, 10 threats
// Wave 7: introduces ASBMs, 10 threats, speedMultiplier 1.35
// Wave 8: introduces drone swarms, 12 threats
// Wave 9: introduces loitering munitions, 12 threats
// Wave 10: introduces laser guided munitions, 14 threats, speedMultiplier 1.5
// Wave 11: 14 threats, all types active except directed energy
// Wave 12: introduces directed energy weapons, 16 threats
// Wave 13: 18 threats all types, speedMultiplier 1.65
// Wave 14: 20 threats all types, speedMultiplier 1.8
// Wave 15: 25 threats all types, maximum density, introMessage CRITICAL — ALL SYSTEMS ENGAGE

export const WAVE_CONFIGS = [
    {
        waveNumber: 1,
        spawnList: [
            { id: TARGET_CLASSES.BALLISTIC, count: 3 }
        ],
        spawnInterval: 5000,
        speedMultiplier: 0.8,
        threatCountBonus: 0,
        introMessage: "INCOMING BALLISTIC THREAT DETECTED",
        allowedThreatTypes: [TARGET_CLASSES.BALLISTIC]
    },
    {
        waveNumber: 2,
        spawnList: [
            { id: TARGET_CLASSES.BALLISTIC, count: 4 },
            { id: TARGET_CLASSES.BOMB, count: 2 }
        ],
        spawnInterval: 4000,
        speedMultiplier: 0.9,
        threatCountBonus: 0,
        introMessage: "WAVE 2 INCOMING",
        allowedThreatTypes: [TARGET_CLASSES.BALLISTIC, TARGET_CLASSES.BOMB]
    },
    {
        waveNumber: 3,
        spawnList: [
            { id: TARGET_CLASSES.BALLISTIC, count: 2 },
            { id: TARGET_CLASSES.BOMB, count: 2 },
            { id: TARGET_CLASSES.CRUISE, count: 2 }
        ],
        spawnInterval: 4500,
        speedMultiplier: 1.0,
        threatCountBonus: 0,
        introMessage: "CRUISE MISSILES DETECTED - CHECK LOW ALTITUDE",
        allowedThreatTypes: [TARGET_CLASSES.BALLISTIC, TARGET_CLASSES.BOMB, TARGET_CLASSES.CRUISE]
    },
    {
        waveNumber: 4,
        spawnList: [
            { id: TARGET_CLASSES.BALLISTIC, count: 3 },
            { id: TARGET_CLASSES.BOMB, count: 2 },
            { id: TARGET_CLASSES.CRUISE, count: 3 }
        ],
        spawnInterval: 4000,
        speedMultiplier: 1.05,
        threatCountBonus: 0,
        introMessage: "WAVE 4 INCOMING",
        allowedThreatTypes: [TARGET_CLASSES.BALLISTIC, TARGET_CLASSES.BOMB, TARGET_CLASSES.CRUISE]
    },
    {
        waveNumber: 5,
        spawnList: [
            { id: TARGET_CLASSES.HYPERSONIC, count: 2 },
            { id: TARGET_CLASSES.BALLISTIC, count: 3 },
            { id: TARGET_CLASSES.CRUISE, count: 3 }
        ],
        spawnInterval: 3500,
        speedMultiplier: 1.25,
        threatCountBonus: 0,
        introMessage: "WARNING: HYPERSONIC GLIDE VEHICLES DETECTED",
        allowedThreatTypes: [TARGET_CLASSES.BALLISTIC, TARGET_CLASSES.BOMB, TARGET_CLASSES.CRUISE, TARGET_CLASSES.HYPERSONIC]
    },
    {
        waveNumber: 6,
        spawnList: [
            { id: TARGET_CLASSES.FIGHTER, count: 4 },
            { id: TARGET_CLASSES.CRUISE, count: 3 },
            { id: TARGET_CLASSES.BOMB, count: 3 }
        ],
        spawnInterval: 3000,
        speedMultiplier: 1.25,
        threatCountBonus: 0,
        introMessage: "HOSTILE AIRCRAFT INBOUND",
        allowedThreatTypes: [TARGET_CLASSES.BALLISTIC, TARGET_CLASSES.BOMB, TARGET_CLASSES.CRUISE, TARGET_CLASSES.HYPERSONIC, TARGET_CLASSES.FIGHTER]
    },
    {
        waveNumber: 7,
        spawnList: [
            { id: TARGET_CLASSES.ASBM, count: 2 },
            { id: TARGET_CLASSES.HYPERSONIC, count: 2 },
            { id: TARGET_CLASSES.BALLISTIC, count: 6 }
        ],
        spawnInterval: 2500,
        speedMultiplier: 1.35,
        threatCountBonus: 0,
        introMessage: "ANTI-SHIP BALLISTIC MISSILES INBOUND",
        allowedThreatTypes: [TARGET_CLASSES.BALLISTIC, TARGET_CLASSES.BOMB, TARGET_CLASSES.CRUISE, TARGET_CLASSES.HYPERSONIC, TARGET_CLASSES.FIGHTER, TARGET_CLASSES.ASBM]
    },
    {
        waveNumber: 8,
        spawnList: [
            { id: TARGET_CLASSES.DRONE, count: 6 },
            { id: TARGET_CLASSES.FIGHTER, count: 3 },
            { id: TARGET_CLASSES.CRUISE, count: 3 }
        ],
        spawnInterval: 2000,
        speedMultiplier: 1.35,
        threatCountBonus: 0,
        introMessage: "UAV SWARMS DETECTED",
        allowedThreatTypes: [TARGET_CLASSES.BALLISTIC, TARGET_CLASSES.BOMB, TARGET_CLASSES.CRUISE, TARGET_CLASSES.HYPERSONIC, TARGET_CLASSES.FIGHTER, TARGET_CLASSES.ASBM, TARGET_CLASSES.DRONE]
    },
    {
        waveNumber: 9,
        spawnList: [
            { id: TARGET_CLASSES.LOITERING, count: 4 },
            { id: TARGET_CLASSES.DRONE, count: 4 },
            { id: TARGET_CLASSES.FIGHTER, count: 4 }
        ],
        spawnInterval: 2500,
        speedMultiplier: 1.4,
        threatCountBonus: 0,
        introMessage: "LOITERING MUNITIONS IN AREA",
        allowedThreatTypes: [TARGET_CLASSES.BALLISTIC, TARGET_CLASSES.BOMB, TARGET_CLASSES.CRUISE, TARGET_CLASSES.HYPERSONIC, TARGET_CLASSES.FIGHTER, TARGET_CLASSES.ASBM, TARGET_CLASSES.DRONE, TARGET_CLASSES.LOITERING]
    },
    {
        waveNumber: 10,
        spawnList: [
            { id: TARGET_CLASSES.LASER, count: 4 },
            { id: TARGET_CLASSES.HYPERSONIC, count: 2 },
            { id: TARGET_CLASSES.ASBM, count: 3 },
            { id: TARGET_CLASSES.CRUISE, count: 5 }
        ],
        spawnInterval: 2000,
        speedMultiplier: 1.5,
        threatCountBonus: 0,
        introMessage: "LASER GUIDED MUNITIONS DETECTED",
        allowedThreatTypes: [TARGET_CLASSES.BALLISTIC, TARGET_CLASSES.BOMB, TARGET_CLASSES.CRUISE, TARGET_CLASSES.HYPERSONIC, TARGET_CLASSES.FIGHTER, TARGET_CLASSES.ASBM, TARGET_CLASSES.DRONE, TARGET_CLASSES.LOITERING, TARGET_CLASSES.LASER]
    },
    {
        waveNumber: 11,
        spawnList: [
            { id: TARGET_CLASSES.LASER, count: 2 },
            { id: TARGET_CLASSES.HYPERSONIC, count: 2 },
            { id: TARGET_CLASSES.ASBM, count: 2 },
            { id: TARGET_CLASSES.DRONE, count: 3 },
            { id: TARGET_CLASSES.FIGHTER, count: 2 },
            { id: TARGET_CLASSES.BALLISTIC, count: 3 }
        ],
        spawnInterval: 1800,
        speedMultiplier: 1.5,
        threatCountBonus: 0,
        introMessage: "WAVE 11 INCOMING",
        allowedThreatTypes: [TARGET_CLASSES.BALLISTIC, TARGET_CLASSES.BOMB, TARGET_CLASSES.CRUISE, TARGET_CLASSES.HYPERSONIC, TARGET_CLASSES.FIGHTER, TARGET_CLASSES.ASBM, TARGET_CLASSES.DRONE, TARGET_CLASSES.LOITERING, TARGET_CLASSES.LASER]
    },
    {
        waveNumber: 12,
        spawnList: [
            { id: TARGET_CLASSES.DIRECTED_ENERGY, count: 2 },
            { id: TARGET_CLASSES.LASER, count: 3 },
            { id: TARGET_CLASSES.HYPERSONIC, count: 3 },
            { id: TARGET_CLASSES.CRUISE, count: 8 }
        ],
        spawnInterval: 2000,
        speedMultiplier: 1.5,
        threatCountBonus: 0,
        introMessage: "WARNING: DIRECTED ENERGY WEAPONS DETECTED. PREPARE ECM.",
        allowedThreatTypes: [TARGET_CLASSES.BALLISTIC, TARGET_CLASSES.BOMB, TARGET_CLASSES.CRUISE, TARGET_CLASSES.HYPERSONIC, TARGET_CLASSES.FIGHTER, TARGET_CLASSES.ASBM, TARGET_CLASSES.DRONE, TARGET_CLASSES.LOITERING, TARGET_CLASSES.LASER, TARGET_CLASSES.DIRECTED_ENERGY]
    },
    {
        waveNumber: 13,
        spawnList: [
            { id: TARGET_CLASSES.DIRECTED_ENERGY, count: 2 },
            { id: TARGET_CLASSES.ASBM, count: 4 },
            { id: TARGET_CLASSES.HYPERSONIC, count: 4 },
            { id: TARGET_CLASSES.DRONE, count: 8 }
        ],
        spawnInterval: 1500,
        speedMultiplier: 1.65,
        threatCountBonus: 2,
        introMessage: "WAVE 13 INCOMING",
        allowedThreatTypes: [TARGET_CLASSES.BALLISTIC, TARGET_CLASSES.BOMB, TARGET_CLASSES.CRUISE, TARGET_CLASSES.HYPERSONIC, TARGET_CLASSES.FIGHTER, TARGET_CLASSES.ASBM, TARGET_CLASSES.DRONE, TARGET_CLASSES.LOITERING, TARGET_CLASSES.LASER, TARGET_CLASSES.DIRECTED_ENERGY]
    },
    {
        waveNumber: 14,
        spawnList: [
            { id: TARGET_CLASSES.DIRECTED_ENERGY, count: 3 },
            { id: TARGET_CLASSES.LASER, count: 5 },
            { id: TARGET_CLASSES.CRUISE, count: 6 },
            { id: TARGET_CLASSES.LOITERING, count: 6 }
        ],
        spawnInterval: 1200,
        speedMultiplier: 1.8,
        threatCountBonus: 2,
        introMessage: "MULTIPLE TARGETS INBOUND - HOSTILE INTENT CONFIRMED",
        allowedThreatTypes: [TARGET_CLASSES.BALLISTIC, TARGET_CLASSES.BOMB, TARGET_CLASSES.CRUISE, TARGET_CLASSES.HYPERSONIC, TARGET_CLASSES.FIGHTER, TARGET_CLASSES.ASBM, TARGET_CLASSES.DRONE, TARGET_CLASSES.LOITERING, TARGET_CLASSES.LASER, TARGET_CLASSES.DIRECTED_ENERGY]
    },
    {
        waveNumber: 15,
        spawnList: [
            { id: TARGET_CLASSES.DIRECTED_ENERGY, count: 4 },
            { id: TARGET_CLASSES.HYPERSONIC, count: 5 },
            { id: TARGET_CLASSES.ASBM, count: 4 },
            { id: TARGET_CLASSES.LASER, count: 4 },
            { id: TARGET_CLASSES.DRONE, count: 4 },
            { id: TARGET_CLASSES.BALLISTIC, count: 4 }
        ],
        spawnInterval: 1000,
        speedMultiplier: 2.0,
        threatCountBonus: 4,
        introMessage: "CRITICAL — ALL SYSTEMS ENGAGE",
        allowedThreatTypes: [TARGET_CLASSES.BALLISTIC, TARGET_CLASSES.BOMB, TARGET_CLASSES.CRUISE, TARGET_CLASSES.HYPERSONIC, TARGET_CLASSES.FIGHTER, TARGET_CLASSES.ASBM, TARGET_CLASSES.DRONE, TARGET_CLASSES.LOITERING, TARGET_CLASSES.LASER, TARGET_CLASSES.DIRECTED_ENERGY]
    }
];
