
import { useState, useEffect } from 'react';
import DashboardStats from '../components/DashboardStats';
import { ShieldCheck, Activity, Globe } from 'lucide-react';
import { api } from '../api/apiClient';

const DashboardOverview = () => {
    const [stats, setStats] = useState({ categories: [], counts: [], total: 0 });
    const [logs, setLogs] = useState([]); // Placeholder for now
    const [crawlerStatus, setCrawlerStatus] = useState('idle');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const statsRes = await api.get('/stats');
            setStats(statsRes.data);

            // Fetch logs/report? For now, we simulate logs or fetch if endpoint exists
            // const logsRes = await api.get('/logs'); 
            // setLogs(logsRes.data);

        } catch (error) {
            console.error("Dashboard data fetch failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartCrawl = async () => {
        try {
            setCrawlerStatus('running');
            await api.post('/admin/crawl');
            // Poll for status or just wait
            setTimeout(() => setCrawlerStatus('idle'), 5000); // Mock feedback
        } catch (error) {
            console.error("Crawl failed:", error);
            setCrawlerStatus('idle');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white mb-6">Mission Overview</h1>

            {/* KPI Cards */}
            <DashboardStats
                stats={stats}
                startCrawl={handleStartCrawl}
                crawlerStatus={crawlerStatus}
                logs={logs}
            />

            {/* Quick Actions / Recent Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-indigo-400 mb-4 flex items-center gap-2">
                        <ShieldCheck size={18} /> Recent Alerts
                    </h2>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                <div className="w-2 h-2 mt-2 rounded-full bg-red-500 animate-pulse"></div>
                                <div>
                                    <p className="text-sm font-medium text-slate-200">New Ransomware Signature Detected</p>
                                    <p className="text-xs text-slate-500">2 minutes ago • Source: Crawler_Node_X</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                        <Activity size={18} /> System Status
                    </h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Database Cluster</span>
                            <span className="text-emerald-400 font-mono">HEALTHY (SQL)</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Crawler Nodes</span>
                            <span className="text-emerald-400 font-mono">4/4 ACTIVE</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">VPN Tunnel</span>
                            <span className="text-yellow-400 font-mono">RE-KEYING</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                            <div className="bg-emerald-500 h-full w-[85%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        </div>
                        <p className="text-xs text-right text-slate-500 mt-1">CPU Load: 85%</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
