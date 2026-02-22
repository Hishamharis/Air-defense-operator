import { COLORS } from '../constants/colorConstants';
import { getZoneColor } from './radarUtils';

// New Theme Colors
const PRIMARY = '#54cf17';
const DANGER = '#ef4444';
const WARNING = '#eab308';
const BACKGROUND = 'transparent'; // Let CSS grid show through
const GRID_STRONG = 'rgba(84, 207, 23, 0.5)';
const GRID_FAINT = 'rgba(84, 207, 23, 0.2)';

export const drawRadarBackground = (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
};

export const drawRangeRings = (ctx, cx, cy, radius, zoom) => {
    // Now handled mostly by CSS/HTML overlays, but if we need dynamic rings...
    // Let's only draw dynamic rings if zoom changes drastically, or skip if we rely on CSS
    // For now, we will let CSS handle the static rings for the perfect look.
};

export const drawSweepLine = (ctx, cx, cy, radius, sweepAngle, trail) => {
    // CSS handles the main sweep animation perfectly
};

export const drawEngagementZones = (ctx, cx, cy, systems, canvasRadius, maxRangeKm) => {
    if (!systems) return;

    const getCanvasRadius = (range) => (range / maxRangeKm) * canvasRadius;
    const sorted = [...systems].sort((a, b) => b.range - a.range);

    sorted.forEach(sys => {
        if (sys.status !== 'READY') return;
        const r = getCanvasRadius(sys.range);
        if (r <= 0) return;

        let color = PRIMARY;
        if (sys.tier === 'LONG') color = 'rgba(84, 207, 23, 0.4)';
        if (sys.tier === 'MID') color = 'rgba(234, 179, 8, 0.4)';
        if (sys.tier === 'SHORT') color = 'rgba(239, 68, 68, 0.4)';

        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 10]);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    });
};

export const drawSectorLabels = (ctx, cx, cy, radius) => {
    // CSS handles this
};

export const drawCenterAsset = (ctx, cx, cy, hp) => {
    // CSS handles this with the tiny dot in the center of the rings
};

export const drawThreat = (ctx, threat, isSelected, sweepAngle, cx, cy, canvasRadius, maxRange) => {
    if (threat.ignored) {
        ctx.globalAlpha = 0.3;
    }

    const cX = cx + (threat.x / maxRange) * canvasRadius;
    const cY = cy + (threat.y / maxRange) * canvasRadius;

    let color = PRIMARY;
    if (threat.baseSpeed > 3) color = DANGER;
    else if (threat.baseSpeed > 1) color = WARNING;

    // Blip dot
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = isSelected ? 15 : 5;

    ctx.beginPath();
    ctx.arc(cX, cY, isSelected ? 4 : 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0; // reset

    // Ring for selected
    if (isSelected) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cX, cY, 10, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Draw vector line (heading) instead of long trail
    // The line points exactly inverse of dx, dy if going towards center, or we can use heading offsets
    // For simplicity, threat heading is towards center right now roughly
    const dx = cx - cX;
    const dy = cy - cY;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
        ctx.strokeStyle = `rgba(${color === DANGER ? '239,68,68' : color === WARNING ? '234,179,8' : '84,207,23'}, 0.5)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cX, cY);
        // Line points TOWARDS center
        ctx.lineTo(cX + (dx / len) * 20, cY + (dy / len) * 20);
        ctx.stroke();
    }

    ctx.globalAlpha = 1.0;
};

export const drawInterceptor = (ctx, anim, cx, cy, canvasRadius, maxRange) => {
    const sx = cx;
    const sy = cy;

    const targetCX = cx + (anim.endX / maxRange) * canvasRadius;
    const targetCY = cy + (anim.endY / maxRange) * canvasRadius;

    const currentX = sx + (targetCX - sx) * anim.progress;
    const currentY = sy + (targetCY - sy) * anim.progress;

    if (anim.tier === 'POINT') {
        // C-RAM style bullet stream
        ctx.strokeStyle = '#eab308'; // warning yellow bullets
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 10]);
        // Stream goes from start towards current, length depends on progress
        const streamLength = Math.min(anim.progress * 100, 50); // limit trail length visually

        ctx.beginPath();
        const backwardX = currentX - (targetCX - sx) * (streamLength / 100) * 0.1;
        const backwardY = currentY - (targetCY - sy) * (streamLength / 100) * 0.1;
        ctx.moveTo(backwardX, backwardY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
        ctx.setLineDash([]);
    } else {
        // Missile style
        const trailLength = 15;
        const vecX = targetCX - sx;
        const vecY = targetCY - sy;
        const magnitude = Math.sqrt(vecX * vecX + vecY * vecY);
        const normX = vecX / magnitude;
        const normY = vecY / magnitude;

        // Faint smoke trail
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();

        // Engine flare
        ctx.strokeStyle = '#f97316'; // bright orange
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(currentX - normX * trailLength, currentY - normY * trailLength);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();

        // Missile body (dot)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(currentX, currentY, 2, 0, Math.PI * 2);
        ctx.fill();
    }
};

export const drawExplosion = (ctx, exp, cx, cy, canvasRadius, maxRange) => {
    const ex = cx + (exp.x / maxRange) * canvasRadius;
    const ey = cy + (exp.y / maxRange) * canvasRadius;
    const maxRadius = exp.size * 2; // enhance size
    const currentRadius = maxRadius * exp.progress;

    ctx.strokeStyle = DANGER;
    ctx.fillStyle = 'rgba(239,68,68,0.3)';
    ctx.shadowColor = DANGER;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.arc(ex, ey, currentRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
};

export const drawHoverTooltip = (ctx, threat, mouseX, mouseY) => {
    // Handled by React state now for better styling
};
