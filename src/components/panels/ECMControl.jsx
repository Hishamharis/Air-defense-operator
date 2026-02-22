import React from 'react';
import { useECM } from '../../hooks/useECM';

export default function ECMControl() {
    const { isActive, activeTimer, cooldownTimer, activateECM } = useECM();

    return (
        <div className="border border-phosphor p-4 bg-black">
            <h3 className="text-lg font-bold mb-2 border-b border-phosphor/50 pb-1">ELECTRONIC WARFARE</h3>

            <div className="flex justify-between items-center mb-4">
                <span className="opacity-70">ECM STATUS:</span>
                <span className={`font-bold ${isActive ? 'text-amberWarning animate-pulse text-shadow-amber-glow' : 'text-phosphor'}`}>
                    {isActive ? 'ACTIVE' : (cooldownTimer > 0 ? 'COOLDOWN' : 'STANDBY')}
                </span>
            </div>

            <button
                onClick={activateECM}
                disabled={isActive || cooldownTimer > 0}
                className={`w-full py-2 font-bold tracking-widest border transition-all ${!isActive && cooldownTimer === 0 ? 'border-amberWarning text-amberWarning hover:bg-amberWarning hover:text-black cursor-pointer shadow-amber-glow' : 'border-phosphor/30 text-phosphor/30 cursor-not-allowed bg-black'}`}
            >
                ACTIVATE ECM
            </button>

            <div className="flex justify-between mt-2 text-xs font-mono">
                <span className={`${isActive ? 'text-amberWarning' : 'text-phosphor/50'}`}>
                    ACTIVE: {isActive ? activeTimer : '0'}s
                </span>
                <span className={`${cooldownTimer > 0 ? 'text-threatRed' : 'text-phosphor/50'}`}>
                    CD: {cooldownTimer}s
                </span>
            </div>
        </div>
    );
}
