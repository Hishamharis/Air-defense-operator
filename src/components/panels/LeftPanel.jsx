import React from 'react';
import ThreatQueue from './ThreatQueue';
import EngagementLog from './EngagementLog';
import WatchconDisplay from './WatchconDisplay';

export default function LeftPanel({ showQueue, showLog }) {
    return (
        <div className="w-[300px] h-full bg-crtBlack border-r border-phosphor flex flex-col uppercase font-sharetech text-phosphor selection:bg-phosphor selection:text-black shrink-0 relative z-20 shadow-phosphor">
            <WatchconDisplay />

            {showQueue && (
                <div className="flex-1 overflow-auto border-b border-phosphor/50 custom-scrollbar flex flex-col">
                    <h2 className="text-xl px-4 py-2 border-b border-phosphor bg-phosphor/10 sticky top-0 shadow-sm z-10">PRIORITY QUEUE</h2>
                    <ThreatQueue />
                </div>
            )}

            {showLog && (
                <div className="flex-1 overflow-auto custom-scrollbar flex flex-col">
                    <h2 className="text-xl px-4 py-2 border-b border-phosphor bg-phosphor/10 sticky top-0 shadow-sm z-10 flex justify-between">
                        <span>ENG_LOG</span>
                        <span className="text-[10px] opacity-70 mt-1">ZULU REFS</span>
                    </h2>
                    <EngagementLog />
                </div>
            )}
        </div>
    );
}
