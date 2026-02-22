import React, { useRef, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useRadarCanvas } from '../../hooks/useRadarCanvas';
import { ACTIONS } from '../../constants/gameConstants';

export default function RadarCanvas() {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const { state, dispatch } = useGame();

    // Keep a fresh reference to state for the canvas loop to read without causing teardowns
    const stateRef = useRef(state);
    stateRef.current = state;

    useRadarCanvas(canvasRef, stateRef);

    const [hoverThreat, setHoverThreat] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setMousePos({ x, y });

        const cx = canvasRef.current.width / 2;
        const cy = canvasRef.current.height / 2;
        const radius = Math.min(cx, cy) - 20;

        let found = null;
        for (const t of state.threats) {
            const cX = cx + (t.x / state.zoomLevel) * radius;
            const cY = cy + (t.y / state.zoomLevel) * radius;

            const dist = Math.sqrt(Math.pow(cX - x, 2) + Math.pow(cY - y, 2));
            if (dist <= Math.max(t.size, 10)) {
                found = t;
                break;
            }
        }
        setHoverThreat(found);
    };

    const handleClick = (e) => {
        if (hoverThreat) dispatch({ type: ACTIONS.SELECT_THREAT, payload: hoverThreat.id });
        else dispatch({ type: ACTIONS.DESELECT_THREAT });
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        if (hoverThreat) dispatch({ type: ACTIONS.IGNORE_THREAT, payload: hoverThreat.id });
    };

    const handleWheel = (e) => {
        let newZoom = state.zoomLevel;
        if (e.deltaY < 0) newZoom = Math.max(100, state.zoomLevel - 50);
        else newZoom = Math.min(250, state.zoomLevel + 50);
        if (newZoom !== state.zoomLevel) dispatch({ type: ACTIONS.SET_ZOOM, payload: newZoom });
    };

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 flex items-center justify-center font-display"
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            onWheel={handleWheel}
        >
            {/* HUD Top Overlay */}
            <div className="absolute top-4 left-4 z-20 flex gap-4 pointer-events-none">
                <div className="bg-black/40 backdrop-blur px-3 py-1 border border-primary/30 rounded text-xs font-mono text-primary shadow-sm">
                    <span className="text-primary/60">GRID:</span> ACTIVE
                </div>
                <div className="bg-black/40 backdrop-blur px-3 py-1 border border-primary/30 rounded text-xs font-mono text-primary shadow-sm">
                    <span className="text-primary/60">RANGE:</span> {state.zoomLevel}KM
                </div>
            </div>

            {/* Static Rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                <div className="w-[80%] aspect-square max-w-[800px] rounded-full border border-primary/50 flex items-center justify-center">
                    <div className="absolute top-2 text-[10px] text-primary/70 font-mono">{state.zoomLevel}KM</div>
                    <div className="w-[75%] aspect-square rounded-full border border-primary/30 flex items-center justify-center relative">
                        <div className="absolute top-2 text-[10px] text-primary/70 font-mono">{state.zoomLevel * 0.75}KM</div>
                        <div className="w-[66%] aspect-square rounded-full border border-primary/20 flex items-center justify-center relative">
                            <div className="absolute top-2 text-[10px] text-primary/70 font-mono">{state.zoomLevel * 0.5}KM</div>
                            <div className="w-[50%] aspect-square rounded-full border border-primary/10 bg-primary/5 flex items-center justify-center relative">
                                <div className="absolute top-2 text-[10px] text-primary/70 font-mono">{state.zoomLevel * 0.25}KM</div>
                                <div className="w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_#54cf17]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sector Lines */}
            <div className="absolute inset-0 pointer-events-none opacity-20 flex justify-center items-center">
                <div className="absolute h-full w-px bg-primary"></div>
                <div className="absolute w-full h-px bg-primary"></div>
                <div className="absolute h-[150%] w-px bg-primary rotate-45"></div>
                <div className="absolute h-[150%] w-px bg-primary -rotate-45"></div>
            </div>

            {/* Sector Labels */}
            <div className="absolute inset-4 pointer-events-none text-primary/40 font-bold text-xs tracking-widest">
                <span className="absolute top-4 left-1/2 -translate-x-1/2">NORTH // ALPHA</span>
                <span class="absolute bottom-4 left-1/2 -translate-x-1/2">SOUTH // CHARLIE</span>
                <span class="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90">WEST // DELTA</span>
                <span class="absolute right-4 top-1/2 -translate-y-1/2 rotate-90">EAST // BRAVO</span>
            </div>

            {/* Dynamic Radar Sweep */}
            {!state.isPaused && (
                <div className="absolute w-[120%] h-[120%] bg-radar-sweep rounded-full animate-radar-spin pointer-events-none opacity-60 mix-blend-screen origin-center"></div>
            )}

            {/* The DOM Canvas for exact entities */}
            <canvas
                ref={canvasRef}
                className="w-full h-full cursor-crosshair z-10"
            />

            {/* Tooltip HTML Overlay */}
            {hoverThreat && (
                <div
                    className="absolute pointer-events-none bg-black/80 backdrop-blur-sm border border-primary/40 p-1.5 rounded min-w-[100px] z-50 text-display shadow-[0_0_15px_rgba(0,0,0,0.8)]"
                    style={{ left: mousePos.x + 15, top: mousePos.y + 15 }}
                >
                    <div className={`text-[10px] font-bold leading-none ${hoverThreat.baseSpeed > 3 ? 'text-danger' : hoverThreat.baseSpeed > 1 ? 'text-warning' : 'text-primary'}`}>
                        {hoverThreat.id} [H]
                    </div>
                    <div className={`text-[9px] font-mono leading-none mt-1 opacity-80 ${hoverThreat.baseSpeed > 3 ? 'text-danger' : hoverThreat.baseSpeed > 1 ? 'text-warning' : 'text-primary'}`}>
                        M {(hoverThreat.baseSpeed / 1.5).toFixed(1)} | FL{Math.floor(hoverThreat.z * 10)}
                    </div>
                    <div className={`mt-1 text-[8px] uppercase font-bold tracking-widest ${hoverThreat.confidence === 'SURE' ? 'text-primary' : hoverThreat.confidence === 'PROBABLE' ? 'text-warning' : 'text-danger'}`}>
                        CONF: {hoverThreat.confidence}
                    </div>
                </div>
            )}

            {state.isPaused && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40 pointer-events-none backdrop-blur-sm">
                    <div className="text-4xl text-warning font-bold tracking-[0.3em] drop-shadow-[0_0_10px_rgba(234,179,8,0.8)] border-y border-warning py-4 w-full text-center bg-black/80">
                        SYSTEM PAUSED
                    </div>
                </div>
            )}
        </div>
    );
}
