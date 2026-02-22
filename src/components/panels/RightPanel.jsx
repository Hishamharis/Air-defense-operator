import React from 'react';
import FireControlPanel from './FireControlPanel';
import BatteryStatusPanel from './BatteryStatusPanel';
import ECMControl from './ECMControl';
import BDAPanel from './BDAPanel';

export default function RightPanel() {
    return (
        <div className="w-[350px] h-full bg-crtBlack border-l border-phosphor flex flex-col uppercase font-sharetech text-phosphor shrink-0 relative z-20 shadow-phosphor overflow-y-auto custom-scrollbar">

            <div className="p-4 border-b border-phosphor bg-phosphor/10">
                <h2 className="text-xl font-bold tracking-widest text-center">TACTICAL CONTROL</h2>
            </div>

            <div className="flex-1 flex flex-col p-4 gap-6">
                <FireControlPanel />
                <ECMControl />
                <BatteryStatusPanel />
                <BDAPanel />
            </div>
        </div>
    );
}
