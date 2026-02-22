import { SYSTEM_TIERS } from '../constants/gameConstants';
import { COLORS } from '../constants/colorConstants';

export const worldToCanvas = (worldX, worldY, canvasWidth, canvasHeight, radarRange) => {
    const scaledX = (worldX / radarRange) * (canvasWidth / 2);
    const scaledY = (worldY / radarRange) * (canvasHeight / 2);

    // Assuming radar center is center of canvas, world 0,0 is center
    return {
        x: (canvasWidth / 2) + scaledX,
        y: (canvasHeight / 2) + scaledY // Not flipping Y yet, if top is -Y then we'd subtract
    };
};

export const canvasToWorld = (canvasX, canvasY, canvasWidth, canvasHeight, radarRange) => {
    const dx = canvasX - (canvasWidth / 2);
    const dy = canvasY - (canvasHeight / 2);

    return {
        x: (dx / (canvasWidth / 2)) * radarRange,
        y: (dy / (canvasHeight / 2)) * radarRange
    };
};

export const isInsideRadar = (canvasX, canvasY, centerX, centerY, radius) => {
    const dx = canvasX - centerX;
    const dy = canvasY - centerY;
    return Math.sqrt(dx * dx + dy * dy) <= radius;
};

export const getZoneColor = (tier) => {
    switch (tier) {
        case SYSTEM_TIERS.LONG: return COLORS.zones.LONG;
        case SYSTEM_TIERS.MID: return COLORS.zones.MID;
        case SYSTEM_TIERS.SHORT: return COLORS.zones.SHORT;
        case SYSTEM_TIERS.POINT: return COLORS.zones.POINT;
        default: return 'rgba(255, 255, 255, 0.1)';
    }
};

export const getRangeLabelForZoom = (zoom) => {
    // zoom is the max range in km. e.g 100
    // we return labels for 25%, 50%, 75%, 100%
    const steps = [0.25, 0.5, 0.75, 1.0];
    return steps.map(s => `${(zoom * s).toFixed(0)}km`);
};
