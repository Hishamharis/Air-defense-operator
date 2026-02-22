import React from 'react';
import { useEngagementLog } from '../../hooks/useEngagementLog';
import { formatZulu } from '../../utils/timeUtils';

export default function EngagementLog() {
    const { log } = useEngagementLog();

    return (
        <div className="p-3 font-mono text-[11px] leading-tight space-y-2">
            {log.length === 0 && <span className="opacity-50">NO REPORTABLE EVENTS</span>}
            {log.map((entry, idx) => {
                let color = "text-phosphor";
                if (entry.type === 'SUCCESS') color = "text-phosphor";
                if (entry.type === 'INFO') color = "text-neutralYellow";
                if (entry.type === 'WARNING') color = "text-amberWarning";
                if (entry.type === 'ERROR') color = "text-threatRed";

                return (
                    <div key={idx} className="flex flex-col border-b border-phosphor/20 pb-1 w-full gap-0.5 animate-[fadeIn_0.5s_ease-out]">
                        <span className="text-[9px] opacity-60">[{formatZulu(entry.time)}]</span>
                        <span className={`${color}`}>{entry.message}</span>
                    </div>
                );
            })}
        </div>
    );
}
