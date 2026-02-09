
import { useState, useEffect, useRef } from 'react';
import { Terminal, Wifi, AlertOctagon } from 'lucide-react';
import LiveFeed from '../components/LiveFeed';

const LiveOperations = () => {
    const [logs, setLogs] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef(null);

    useEffect(() => {
        // Connect to WebSocket
        const connectWebSocket = () => {
            const wsUrl = '/ws/ws'; // In prod, use env vars
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('Connected to Threat Stream');
                setIsConnected(true);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    // Add new log to top
                    setLogs((prev) => [data, ...prev].slice(0, 50)); // Keep last 50
                } catch (e) {
                    console.error('WS Parse Error:', e);
                }
            };

            ws.onclose = () => {
                console.log('Disconnected from Threat Stream');
                setIsConnected(false);
                // Reconnect after 3s
                setTimeout(connectWebSocket, 3000);
            };

            ws.onerror = (err) => {
                console.error('WS Error:', err);
                ws.close();
            };
        };

        connectWebSocket();

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Live Operations</h1>
                    <p className="text-slate-400 text-sm">Real-time crawler telemetry and raw data stream.</p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs border ${isConnected
                    ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-400'
                    : 'bg-red-900/30 border-red-500/30 text-red-400'
                    }`}>
                    <Wifi size={14} className={isConnected ? "animate-pulse" : ""} />
                    <span>{isConnected ? "UPLINK ESTABLISHED" : "CONNECTION LOST"}</span>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Main Terminal Area */}
                <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col font-mono relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>
                    <div className="flex items-center gap-2 mb-4 text-emerald-500 border-b border-slate-900 pb-2">
                        <Terminal size={16} />
                        <span className="text-xs font-bold">/var/log/crawler/stream.log</span>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <LiveFeed logs={logs} />
                    </div>
                </div>

                {/* Side Panel status */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-slate-300 mb-3">Active Spiders</h3>
                        <div className="space-y-2">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center bg-slate-800 p-2 rounded text-xs">
                                    <span className="text-slate-400">Clearnet Spider</span>
                                    <span className="text-emerald-400">READY</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-800 p-2 rounded text-xs">
                                    <span className="text-slate-400">Onion Spider (Tor)</span>
                                    <span className="text-yellow-400">STANDBY</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-slate-300 mb-3">Tor Circuit Status</h3>
                        <div className="text-xs space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center">🌐</div>
                                <div className="h-[2px] flex-1 bg-emerald-500/50"></div>
                                <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center">🛡️</div>
                                <div className="h-[2px] flex-1 bg-emerald-500/50"></div>
                                <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center">🧅</div>
                            </div>
                            <p className="text-center text-emerald-500">Circuit #8942 Active (Latency: 142ms)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveOperations;
