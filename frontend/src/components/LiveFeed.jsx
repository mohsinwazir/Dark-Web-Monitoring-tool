import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Clock, Terminal, Maximize2 } from 'lucide-react';
import ItemModal from './ItemModal';

/**
 * LiveFeed Component - Real-Time Intelligence
 * 
 * Goal: A rolling log of scraper activity.
 * Logic: Connects to WebSocket on mount.
 * Alert Styling: Red border/badge for risk_score > 0.8.
 */
const LiveFeed = ({ logs }) => {
    const scrollRef = useRef(null);
    const [selectedItemId, setSelectedItemId] = useState(null);

    // Note: logs are passed from parent (App.jsx) which manages the WebSocket
    // This helps prevent multiple socket connections if the component re-renders

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col bg-black rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
            {/* Terminal Header */}
            <div className="bg-zinc-900 px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Terminal size={20} className="text-green-500" />
                    <h2 className="text-lg font-mono font-bold text-zinc-200 tracking-wide">
                        LIVE_THREAT_FEED <span className="animate-pulse">_</span>
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-mono text-green-500 uppercase">System Online</span>
                </div>
            </div>

            {/* Feed Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-zinc-900/50 backdrop-blur-sm" ref={scrollRef}>
                {logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-600 font-mono">
                        <Clock size={48} className="mb-4 opacity-50" />
                        <p>Awaiting incoming intelligence...</p>
                    </div>
                ) : (
                    logs.map((log, index) => {
                        const isCritical = log.risk_score > 0.8 || log.csam_flag;
                        const timestamp = new Date(log.timestamp).toLocaleTimeString();

                        return (
                            <div
                                key={index}
                                onClick={() => log.id && setSelectedItemId(log.id)}
                                className={`flex gap-4 p-4 rounded-lg font-mono text-sm transition-all animate-fadeIn ${log.id ? 'cursor-pointer' : ''} ${isCritical
                                    ? 'bg-red-950/20 border-l-4 border-red-600 shadow-[0_0_20px_-5px_rgba(220,38,38,0.2)] hover:bg-red-900/30'
                                    : 'bg-zinc-800/40 border-l-4 border-zinc-600 hover:bg-zinc-800/60'
                                    }`}
                            >
                                {/* Time & Icon */}
                                <div className="flex flex-col items-center gap-2 min-w-[80px]">
                                    <span className="text-zinc-500 text-xs">{timestamp}</span>
                                    {isCritical && <AlertTriangle size={16} className="text-red-500" />}
                                </div>

                                {/* Content */}
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-start">
                                        <span className={`font-bold uppercase tracking-wider text-xs px-2 py-0.5 rounded ${isCritical ? 'bg-red-500/20 text-red-500' : 'bg-zinc-700 text-zinc-400'
                                            }`}>
                                            {log.label || 'UNKNOWN'}
                                        </span>
                                        {isCritical && (
                                            <span className="animate-pulse text-red-500 font-bold text-xs tracking-widest border border-red-500/50 px-2 py-0.5 rounded">
                                                CRITICAL THREAT
                                            </span>
                                        )}
                                    </div>

                                    <h4 className="text-zinc-200 font-semibold">{log.title || 'Untitled Document'}</h4>

                                    {/* Clean URL display */}
                                    <p className="text-zinc-500 text-xs truncate max-w-xl">{log.url}</p>

                                    {/* Entity Tags */}
                                    {log.entities && Object.values(log.entities).flat().length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-zinc-800/50">
                                            {Object.entries(log.entities).map(([type, values]) => (
                                                values.slice(0, 3).map((val, idx) => (
                                                    <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                                                        {val}
                                                    </span>
                                                ))
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {selectedItemId && (
                <ItemModal itemId={selectedItemId} onClose={() => setSelectedItemId(null)} />
            )}
        </div>
    );
};

export default LiveFeed;
