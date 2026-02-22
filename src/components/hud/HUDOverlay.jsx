import React from 'react';
import AssetIntegrityBar from './AssetIntegrityBar';
import ScoreDisplay from './ScoreDisplay';
import KillRatioDisplay from './KillRatioDisplay';
import ZuluClock from './ZuluClock';
import WaveIndicator from './WaveIndicator';

export default function HUDOverlay() {

    return (
        <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4">

            {/* Top Bar */}
            <div className="flex justify-between items-start pointer-events-auto">
                <div className="flex gap-6 bg-black/60 p-2 border border-phosphor shadow-phosphor">
                    <ScoreDisplay />
                    <div className="w-[1px] bg-phosphor/50"></div>
                    <KillRatioDisplay />
                </div>

                {/* Center Top */}
                <WaveIndicator />

                {/* Top Right */}
                <ZuluClock />
            </div>

            {/* Bottom Bar */}
            <div className="flex justify-between items-end pointer-events-auto">
                <div className="bg-black/80 p-3 border border-phosphor shadow-phosphor">
                    <AssetIntegrityBar />
                </div>
            </div>

        </div>
    );
}
