import { useEffect, useRef } from 'react';
import { drawRadarBackground, drawRangeRings, drawSweepLine, drawEngagementZones, drawSectorLabels, drawCenterAsset, drawThreat, drawInterceptor, drawExplosion } from '../utils/renderUtils';

export function useRadarCanvas(canvasRef, stateRef) {
    const animationRef = useRef();
    const lastTimeRef = useRef(0);
    const sweepAngleRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Scale for high dpi
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const render = (time) => {
            if (!lastTimeRef.current) lastTimeRef.current = time;
            const deltaTime = time - lastTimeRef.current;
            lastTimeRef.current = time;

            // Update sweep angle (1 rev every 4 seconds)
            if (!stateRef.current.isPaused) {
                sweepAngleRef.current = (sweepAngleRef.current + (Math.PI * 2 / 4) * (deltaTime / 1000)) % (Math.PI * 2);
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const radius = Math.min(cx, cy) - 20;

            const state = stateRef.current;

            drawRadarBackground(ctx, canvas.width, canvas.height);
            drawRangeRings(ctx, cx, cy, radius, state.zoomLevel);
            drawSectorLabels(ctx, cx, cy, radius);
            drawEngagementZones(ctx, cx, cy, state.systems, radius, state.zoomLevel);

            // Draw grid, sweet line
            drawSweepLine(ctx, cx, cy, radius, sweepAngleRef.current, true);

            // Draw threats
            state.threats.forEach(t => {
                const isSelected = t.id === state.selectedThreatId;
                drawThreat(ctx, t, isSelected, sweepAngleRef.current, cx, cy, radius, state.zoomLevel);
            });

            // Draw interceptors
            state.interceptors.forEach(i => {
                drawInterceptor(ctx, i, cx, cy, radius, state.zoomLevel);
            });

            // Draw explosions
            state.explosions.forEach(e => {
                drawExplosion(ctx, e, cx, cy, radius, state.zoomLevel);
            });

            drawCenterAsset(ctx, cx, cy, state.assetHp);

            animationRef.current = requestAnimationFrame(render);
        };

        animationRef.current = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationRef.current);
    }, [canvasRef]); // Intentionally omitting stateRef to prevent teardowns

    return {};
}
