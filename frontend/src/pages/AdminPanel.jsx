
import { ShieldAlert, Activity, Database, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import MitreHeatmap from '../components/MitreHeatmap';
import { api } from '../api/apiClient';

const AdminPanel = () => {
    const { token, logout } = useAuth(); // Added logout
    const [crawling, setCrawling] = useState(false); // Renamed from loading
    const [statusMsg, setStatusMsg] = useState(''); // Renamed from msg
    const [scope, setScope] = useState('hybrid'); // Default scope

    // Mock TTPs for visual demo if no real data
    // In real app, fetch from stats API
    const demoTTPs = ["T1190", "T1003", "T1566", "T1486"];

    const triggerCrawl = async () => {
        setCrawling(true);
        setStatusMsg('Initiating Global Crawl...');

        try {
            const response = await api.post(`/admin/crawl?scope=${scope}`);
            const data = response.data;
            setStatusMsg('✅ ' + data.message);
        } catch (err) {
            const detail = err.response?.data?.detail || err.message;
            setStatusMsg('❌ Error: ' + detail);
            if (detail.includes("Connection")) setStatusMsg('❌ Connection Failed');
            setCrawling(false);
        }
    };

    // Check status on mount
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const response = await api.get('/admin/crawl/status');
                const data = response.data;

                if (data.running) {
                    setCrawling(true);
                    setScope(data.scope); // Sync scope from backend
                    setStatusMsg(`🔄 Crawling active (${data.scope.toUpperCase()})...`);
                } else {
                    setCrawling(false);
                }
            } catch (e) {
                console.error("Status check failed", e);
            }
        };
        checkStatus();

        // Optional: Poll status every 5s while looking at this page
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, [token]);

    return (
        <div className="p-8 space-y-8 text-zinc-100">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-600">
                        System Administration
                    </h1>
                    <p className="text-zinc-400">Restricted Access Level 5</p>
                </div>
                <button
                    onClick={logout}
                    className="px-4 py-2 border border-zinc-700 rounded-lg hover:bg-zinc-800"
                >
                    Logout
                </button>
            </div>

            {/* Control Center */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-red-500/20 backdrop-blur">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Activity className="text-red-500" /> Crawler Control
                    </h2>
                    <p className="text-sm text-zinc-400 mb-6">
                        Manually force a system-wide deep web crawl. This action is logged.
                    </p>

                    {/* Scope Selector */}
                    <div className="mb-4">
                        <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2 block">
                            Target Scope
                        </label>
                        <div className="flex bg-black p-1 rounded-lg border border-zinc-700">
                            {['clearnet', 'hybrid', 'darkweb'].map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setScope(mode)}
                                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all uppercase ${scope === mode
                                        ? 'bg-red-600 text-white shadow-lg'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={triggerCrawl}
                            disabled={crawling}
                            className={`flex-1 py-4 rounded-xl font-bold tracking-widest transition-all ${crawling
                                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-500 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] text-white'
                                }`}
                        >
                            {crawling ? 'EXECUTING...' : 'INITIALIZE'}
                        </button>

                        {crawling && (
                            <button
                                onClick={async () => {
                                    try {
                                        // Mock stop - in real app would hit API
                                        // For now just reset state or hit a stop endpoint if we had one
                                        setCrawling(false);
                                        setStatusMsg("🛑 CRAWL ABORTED");
                                    } catch (e) { console.error(e); }
                                }}
                                className="w-24 bg-zinc-800 hover:bg-red-900 border border-zinc-700 text-white rounded-xl font-bold transition-all"
                            >
                                STOP
                            </button>
                        )}
                    </div>
                    {statusMsg && <p className="mt-4 text-center font-mono text-sm">{statusMsg}</p>}
                </div>

                {/* Infrastructure Control */}
                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-red-500/20 backdrop-blur">
                    <h2 className="text-xl font-semibold mb-4 text-red-400">Infrastructure</h2>
                    <p className="text-zinc-400 mb-4">Manage Backend Workers (Redis + Celery).</p>

                    <div className="flex items-center gap-4 mb-4">
                        <label htmlFor="workerCount" className="text-sm text-zinc-300">Workers:</label>
                        <input
                            type="number"
                            min="1"
                            max="8"
                            defaultValue="2"
                            id="workerCount"
                            className="bg-black border border-zinc-700 rounded px-3 py-1 text-white w-20"
                        />
                    </div>

                    <button
                        onClick={async () => {
                            const count = document.getElementById('workerCount').value;
                            try {
                                const res = await fetch('/api/admin/system/start-workers?concurrency=' + count, {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                const d = await res.json();
                                alert(JSON.stringify(d.report, null, 2));
                            } catch (e) {
                                alert("Failed: " + e.message);
                            }
                        }}
                        className="w-full py-3 rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white transition-all shadow-lg shadow-red-900/20"
                    >
                        Launch System
                    </button>
                </div>

                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-700 backdrop-blur">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <ShieldAlert className="text-red-500" /> System Health
                    </h2>
                    <div className="space-y-4">
                        <div className="flex justify-between p-3 bg-zinc-800 rounded-lg">
                            <span>API Status</span>
                            <span className="text-green-400">ONLINE</span>
                        </div>
                        <div className="flex justify-between p-3 bg-zinc-800 rounded-lg">
                            <span>Database</span>
                            <span className="text-green-400">CONNECTED</span>
                        </div>
                        <div className="flex justify-between p-3 bg-zinc-800 rounded-lg">
                            <span>Tor Circuit</span>
                            <span className="text-yellow-400">ESTABLISHING</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTI Section - Full Width */}
            <div className="mt-8 bg-zinc-900/30 p-6 rounded-2xl border border-zinc-700">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
                    <Database className="text-red-500" /> Threat Intelligence Dashboard
                </h2>
                <MitreHeatmap detectedTTPs={demoTTPs} />
                <p className="text-xs text-zinc-500 mt-2 text-center">
                    * Highlights tactics detected in recent dark web crawls (MITRE ATT&CK Matrix)
                </p>
            </div>

        </div>
    );
};

export default AdminPanel;
