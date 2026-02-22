import { SYSTEM_TIERS } from '../constants/gameConstants';

export const FACTIONS = [
    {
        id: 'usa',
        name: 'United States',
        lore: 'Advanced multi-layered integrated air and missile defense emphasizing network-centric warfare.',
        flag: '🇺🇸',
        systems: [
            {
                tier: SYSTEM_TIERS.LONG,
                systems: [
                    { id: 'us-thaad', name: 'THAAD', range: 200, minAltitude: 40, maxAltitude: 150, pk: 0.97, reloadTime: 12, magazine: 8, tier: SYSTEM_TIERS.LONG, canEngageHypersonic: true, canEngageASBM: true, canEngageDirectedEnergy: false, description: 'Terminal High Altitude Area Defense. Exceptional against ballistic threats.' },
                    { id: 'us-patriot-pac3', name: 'Patriot PAC-3', range: 100, minAltitude: 15, maxAltitude: 100, pk: 0.92, reloadTime: 8, magazine: 12, tier: SYSTEM_TIERS.LONG, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Phased Array Tracking Radar to Intercept on Target.' }
                ]
            },
            {
                tier: SYSTEM_TIERS.MID,
                systems: [
                    { id: 'us-patriot-pac2', name: 'Patriot PAC-2', range: 70, minAltitude: 5, maxAltitude: 50, pk: 0.82, reloadTime: 6, magazine: 16, tier: SYSTEM_TIERS.MID, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Older generation Patriot, effective against aircraft and cruise missiles.' },
                    { id: 'us-nasams', name: 'NASAMS', range: 30, minAltitude: 0.03, maxAltitude: 15, pk: 0.88, reloadTime: 5, magazine: 18, tier: SYSTEM_TIERS.MID, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'National Advanced Surface-to-Air Missile System.' }
                ]
            },
            {
                tier: SYSTEM_TIERS.SHORT,
                systems: [
                    { id: 'us-phalanx', name: 'Phalanx CIWS', range: 5, minAltitude: 0, maxAltitude: 5, pk: 0.75, reloadTime: 2, magazine: 50, tier: SYSTEM_TIERS.SHORT, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Close-in weapon system. Very fast firing rate.' },
                    { id: 'us-mshorad', name: 'M-SHORAD', range: 10, minAltitude: 0, maxAltitude: 8, pk: 0.80, reloadTime: 4, magazine: 24, tier: SYSTEM_TIERS.SHORT, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Mobile Short-Range Air Defense.' }
                ]
            },
            {
                tier: SYSTEM_TIERS.POINT,
                systems: [
                    { id: 'us-ironfist', name: 'Iron Fist APS', range: 1, minAltitude: 0, maxAltitude: 2, pk: 0.70, reloadTime: 1, magazine: 30, tier: SYSTEM_TIERS.POINT, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Active Protection System for point blank defense.' }
                ]
            }
        ]
    },
    {
        id: 'russia',
        name: 'Russia',
        lore: 'Robust area-denial capabilities with heavy emphasis on overlapping SAM coverage and massive magazine depth.',
        flag: '🇷🇺',
        systems: [
            {
                tier: SYSTEM_TIERS.LONG,
                systems: [
                    { id: 'ru-s500', name: 'S-500 Prometheus', range: 600, minAltitude: 10, maxAltitude: 200, pk: 0.98, reloadTime: 15, magazine: 6, tier: SYSTEM_TIERS.LONG, canEngageHypersonic: true, canEngageASBM: true, canEngageDirectedEnergy: false, description: 'Next-generation air and space defense.' },
                    { id: 'ru-s400', name: 'S-400 Triumf', range: 400, minAltitude: 5, maxAltitude: 185, pk: 0.95, reloadTime: 12, magazine: 8, tier: SYSTEM_TIERS.LONG, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Long range anti-aircraft and anti-missile system.' }
                ]
            },
            {
                tier: SYSTEM_TIERS.MID,
                systems: [
                    { id: 'ru-s350', name: 'S-350 Vityaz', range: 120, minAltitude: 0.01, maxAltitude: 30, pk: 0.88, reloadTime: 8, magazine: 12, tier: SYSTEM_TIERS.MID, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Highly mobile mid-range system.' },
                    { id: 'ru-bukm3', name: 'Buk-M3', range: 70, minAltitude: 0.015, maxAltitude: 35, pk: 0.85, reloadTime: 6, magazine: 18, tier: SYSTEM_TIERS.MID, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Tracked medium-range surface-to-air missile system.' }
                ]
            },
            {
                tier: SYSTEM_TIERS.SHORT,
                systems: [
                    { id: 'ru-torm2', name: 'Tor-M2', range: 16, minAltitude: 0.01, maxAltitude: 12, pk: 0.82, reloadTime: 4, magazine: 16, tier: SYSTEM_TIERS.SHORT, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'All-weather low to medium altitude SAM.' },
                    { id: 'ru-pantsirs1', name: 'Pantsir-S1', range: 20, minAltitude: 0.005, maxAltitude: 15, pk: 0.80, reloadTime: 3, magazine: 24, tier: SYSTEM_TIERS.SHORT, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Combined short to medium range SAM and anti-aircraft artillery.' }
                ]
            },
            {
                tier: SYSTEM_TIERS.POINT,
                systems: [
                    { id: 'ru-tunguska', name: 'Tunguska-M1', range: 4, minAltitude: 0, maxAltitude: 3.5, pk: 0.72, reloadTime: 2, magazine: 40, tier: SYSTEM_TIERS.POINT, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Tracked self-propelled anti-aircraft weapon.' }
                ]
            }
        ]
    },
    {
        id: 'china',
        name: 'China',
        lore: 'Rapidly modernizing air defense network utilizing advanced indigenous phased-array tracking.',
        flag: '🇨🇳',
        systems: [
            {
                tier: SYSTEM_TIERS.LONG,
                systems: [
                    { id: 'cn-hq19', name: 'HQ-19', range: 500, minAltitude: 10, maxAltitude: 200, pk: 0.96, reloadTime: 14, magazine: 6, tier: SYSTEM_TIERS.LONG, canEngageHypersonic: true, canEngageASBM: true, canEngageDirectedEnergy: false, description: 'Advanced exoatmospheric ABM system.' },
                    { id: 'cn-hq9b', name: 'HQ-9B', range: 250, minAltitude: 0.025, maxAltitude: 185, pk: 0.93, reloadTime: 11, magazine: 10, tier: SYSTEM_TIERS.LONG, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Long-range semi-active radar homing SAM.' }
                ]
            },
            {
                tier: SYSTEM_TIERS.MID,
                systems: [
                    { id: 'cn-hq22', name: 'HQ-22', range: 170, minAltitude: 0.05, maxAltitude: 27, pk: 0.87, reloadTime: 7, magazine: 14, tier: SYSTEM_TIERS.MID, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Medium to long range semi-active radar homing.' },
                    { id: 'cn-hq16', name: 'HQ-16', range: 70, minAltitude: 0.01, maxAltitude: 25, pk: 0.84, reloadTime: 6, magazine: 16, tier: SYSTEM_TIERS.MID, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Medium range air defense.' }
                ]
            },
            {
                tier: SYSTEM_TIERS.SHORT,
                systems: [
                    { id: 'cn-fk3000', name: 'FK-3000', range: 9, minAltitude: 0.01, maxAltitude: 6, pk: 0.78, reloadTime: 3, magazine: 20, tier: SYSTEM_TIERS.SHORT, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Mobile SHORAD platform protecting high value targets.' },
                    { id: 'cn-hq7b', name: 'HQ-7B', range: 15, minAltitude: 0.03, maxAltitude: 8, pk: 0.76, reloadTime: 4, magazine: 18, tier: SYSTEM_TIERS.SHORT, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Short range low altitude point defense.' }
                ]
            },
            {
                tier: SYSTEM_TIERS.POINT,
                systems: [
                    { id: 'cn-pgz09', name: 'PGZ-09', range: 3, minAltitude: 0, maxAltitude: 4, pk: 0.70, reloadTime: 1.5, magazine: 35, tier: SYSTEM_TIERS.POINT, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Self-propelled anti-aircraft artillery.' }
                ]
            }
        ]
    },
    {
        id: 'india',
        name: 'India',
        lore: 'Integrated multi-tier ballistic missile and air defense combining domestic and imported systems.',
        flag: '🇮🇳',
        systems: [
            {
                tier: SYSTEM_TIERS.LONG,
                systems: [
                    { id: 'in-s400', name: 'S-400 (acquired)', range: 400, minAltitude: 5, maxAltitude: 185, pk: 0.95, reloadTime: 12, magazine: 8, tier: SYSTEM_TIERS.LONG, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Imported long-range air defense.' },
                    { id: 'in-akashng', name: 'Akash-NG', range: 70, minAltitude: 0.03, maxAltitude: 20, pk: 0.88, reloadTime: 7, magazine: 12, tier: SYSTEM_TIERS.LONG, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Next-generation medium-range mobile capability.' } // Treated as long tier relatively for this faction setup
                ]
            },
            {
                tier: SYSTEM_TIERS.MID,
                systems: [
                    { id: 'in-akashmk1', name: 'Akash MK-1S', range: 40, minAltitude: 0.02, maxAltitude: 18, pk: 0.84, reloadTime: 6, magazine: 14, tier: SYSTEM_TIERS.MID, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Domestic medium range SAM.' },
                    { id: 'in-barak8', name: 'Barak-8', range: 100, minAltitude: 0.02, maxAltitude: 16, pk: 0.86, reloadTime: 6, magazine: 16, tier: SYSTEM_TIERS.MID, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Indo-Israeli surface-to-air missile.' }
                ]
            },
            {
                tier: SYSTEM_TIERS.SHORT,
                systems: [
                    { id: 'in-spyder', name: 'Spyder SR', range: 15, minAltitude: 0.02, maxAltitude: 9, pk: 0.80, reloadTime: 4, magazine: 16, tier: SYSTEM_TIERS.SHORT, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Low-level quick reaction missile.' },
                    { id: 'in-igla', name: 'Igla-S MANPADS', range: 6, minAltitude: 0.01, maxAltitude: 5, pk: 0.72, reloadTime: 3, magazine: 12, tier: SYSTEM_TIERS.SHORT, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Man-portable infrared homing system.' }
                ]
            },
            {
                tier: SYSTEM_TIERS.POINT,
                systems: [
                    { id: 'in-zu232', name: 'ZU-23-2', range: 2.5, minAltitude: 0, maxAltitude: 2, pk: 0.68, reloadTime: 1, magazine: 45, tier: SYSTEM_TIERS.POINT, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Upgraded twin-barreled autocannon.' }
                ]
            }
        ]
    },
    {
        id: 'other',
        name: 'Other Nations',
        lore: 'A coalition of allied defenses relying on highly accurate ' + "hit-to-kill" + ' interceptor technologies.',
        flag: '🇺🇳',
        systems: [
            {
                tier: SYSTEM_TIERS.LONG,
                systems: [
                    { id: 'ot-arrow3', name: 'Arrow-3', range: 2400, minAltitude: 100, maxAltitude: 500, pk: 0.99, reloadTime: 18, magazine: 4, tier: SYSTEM_TIERS.LONG, canEngageHypersonic: true, canEngageASBM: true, canEngageDirectedEnergy: false, description: 'Exoatmospheric hypersonic anti-ballistic missile.' },
                    { id: 'ot-aster30', name: 'Aster-30 SAMP/T', range: 120, minAltitude: 0.05, maxAltitude: 20, pk: 0.91, reloadTime: 10, magazine: 8, tier: SYSTEM_TIERS.LONG, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Surface-to-Air Missile Platform/Terrain.' }
                ]
            },
            {
                tier: SYSTEM_TIERS.MID,
                systems: [
                    { id: 'ot-iris', name: 'IRIS-T SLM', range: 40, minAltitude: 0.03, maxAltitude: 20, pk: 0.87, reloadTime: 6, magazine: 16, tier: SYSTEM_TIERS.MID, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Surface Launched Medium Range.' },
                    { id: 'ot-barak8er', name: 'Barak-8 ER', range: 150, minAltitude: 0.02, maxAltitude: 16, pk: 0.88, reloadTime: 7, magazine: 14, tier: SYSTEM_TIERS.MID, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Extended range surface-to-air missile.' }
                ]
            },
            {
                tier: SYSTEM_TIERS.SHORT,
                systems: [
                    { id: 'ot-crotaleng', name: 'Crotale NG', range: 11, minAltitude: 0.015, maxAltitude: 6, pk: 0.79, reloadTime: 4, magazine: 15, tier: SYSTEM_TIERS.SHORT, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Next generation short-range SAM.' },
                    { id: 'ot-ram', name: 'RIM-116 RAM', range: 9, minAltitude: 0.005, maxAltitude: 4, pk: 0.82, reloadTime: 3, magazine: 21, tier: SYSTEM_TIERS.SHORT, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Rolling Airframe Missile point defense.' }
                ]
            },
            {
                tier: SYSTEM_TIERS.POINT,
                systems: [
                    { id: 'ot-skyshield', name: 'Oerlikon Skyshield', range: 3, minAltitude: 0, maxAltitude: 3, pk: 0.73, reloadTime: 1.5, magazine: 36, tier: SYSTEM_TIERS.POINT, canEngageHypersonic: false, canEngageASBM: false, canEngageDirectedEnergy: false, description: 'Modular short range air defense system.' }
                ]
            }
        ]
    }
];
