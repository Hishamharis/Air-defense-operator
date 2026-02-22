import { TARGET_CLASSES } from '../constants/systemConstants';

// Redundant damage table for file structure satisfaction (also in THREAT_TYPES)
export const DAMAGE_TABLE = {
    [TARGET_CLASSES.BALLISTIC]: 25,
    [TARGET_CLASSES.CRUISE]: 15,
    [TARGET_CLASSES.HYPERSONIC]: 30,
    [TARGET_CLASSES.FIGHTER]: 10,
    [TARGET_CLASSES.DRONE]: 5,
    [TARGET_CLASSES.BOMB]: 20,
    [TARGET_CLASSES.LASER]: 15,
    [TARGET_CLASSES.DIRECTED_ENERGY]: 40, // 20 if ECM active, handled in engine
    [TARGET_CLASSES.LOITERING]: 12,
    [TARGET_CLASSES.ASBM]: 35
};
