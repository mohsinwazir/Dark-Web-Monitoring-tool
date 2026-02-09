import { useState } from 'react';

// Simplified MITRE Matrix for Demo
const MATRIX = {
    "Initial Access": [
        { id: "T1190", name: "Exploit Public App" },
        { id: "T1566", name: "Phishing" },
        { id: "T1078", name: "Valid Accounts" }
    ],
    "Execution": [
        { id: "T1059", name: "Command Scripting" },
        { id: "T1204", name: "User Execution" }
    ],
    "Persistence": [
        { id: "T1098", name: "Account Manipulation" },
        { id: "T1547", name: "Boot/Logon Autostart" }
    ],
    "Credential Access": [
        { id: "T1110", name: "Brute Force" },
        { id: "T1003", name: "OS Credential Dumping" }
    ],
    "Impact": [
        { id: "T1486", name: "Data Encrypted" },
        { id: "T1490", name: "Inhibit System Recovery" }
    ]
};

const MitreHeatmap = ({ detectedTTPs = [] }) => {
    // detectedTTPs is list of IDs e.g. ["T1190", "T1486"]

    const isDetected = (id) => detectedTTPs.includes(id);

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-x-auto">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-red-600 rounded-full"></span>
                MITRE ATT&CK Heatmap
            </h3>

            <div className="flex gap-4 min-w-max">
                {Object.entries(MATRIX).map(([tactic, techniques]) => (
                    <div key={tactic} className="w-48">
                        <div className="bg-slate-800 text-slate-300 text-center py-2 text-sm font-bold border-b-2 border-slate-600 mb-2">
                            {tactic}
                        </div>
                        <div className="space-y-2">
                            {techniques.map(tech => (
                                <div
                                    key={tech.id}
                                    title={tech.id}
                                    className={`p-2 text-xs rounded border transition-all cursor-default ${isDetected(tech.id)
                                            ? 'bg-red-900/50 border-red-500 text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                                            : 'bg-slate-950/50 border-slate-800 text-slate-500'
                                        }`}
                                >
                                    <div className="font-mono text-[10px] opacity-70">{tech.id}</div>
                                    <div>{tech.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MitreHeatmap;
