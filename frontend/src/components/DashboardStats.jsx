import { Bar } from 'react-chartjs-2';
import { Play, ShieldAlert, Globe, Activity } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

/**
 * DashboardStats Component - Analytics
 * 
 * Goal: The main view.
 * Visuals: Top Cards, Main Bar Chart, Start Crawl Action.
 */
const DashboardStats = ({ stats, startCrawl, crawlerStatus, logs }) => {

    // Chart Configuration
    const chartData = {
        labels: stats.categories || [],
        datasets: [
            {
                label: 'Threat Count',
                data: stats.counts || [],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.6)',   // Red for severe
                    'rgba(249, 115, 22, 0.6)',  // Orange
                    'rgba(234, 179, 8, 0.6)',   // Yellow
                    'rgba(59, 130, 246, 0.6)',   // Blue
                    'rgba(168, 85, 247, 0.6)',  // Purple
                    'rgba(236, 72, 153, 0.6)',  // Pink
                ],
                borderColor: [
                    'rgba(239, 68, 68, 1)',
                    'rgba(249, 115, 22, 1)',
                    'rgba(234, 179, 8, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(168, 85, 247, 1)',
                    'rgba(236, 72, 153, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#f8fafc',
                bodyColor: '#cbd5e1',
                borderColor: 'rgba(51, 65, 85, 0.5)',
                borderWidth: 1,
                padding: 10,
                displayColors: false,
            }
        },
        scales: {
            y: {
                grid: { color: 'rgba(51, 65, 85, 0.3)' },
                ticks: { color: '#94a3b8' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8' }
            }
        }
    };

    // Calculate high risk count from logs (mock calculation if stats doesn't have it)
    const highRiskCount = logs.filter(l => l.risk_score > 0.8).length;

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header Area with Action Button */}
            <div className="flex justify-between items-center bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
                <div>
                    <h2 className="text-3xl font-bold text-white">Threat Analytics</h2>
                    <p className="text-slate-400">Real-time overview of crawler operations</p>
                </div>
                <button
                    onClick={startCrawl}
                    disabled={crawlerStatus === 'running'}
                    className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-xl ${crawlerStatus === 'running'
                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600'
                            : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-green-900/40 hover:scale-105 active:scale-95'
                        }`}
                >
                    {crawlerStatus === 'running' ? (
                        <Activity className="animate-spin" />
                    ) : (
                        <Play className="fill-current" />
                    )}
                    {crawlerStatus === 'running' ? 'CRAWLING...' : 'START CRAWL'}
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm flex items-center justify-between group hover:border-blue-500/30 transition-all">
                    <div>
                        <p className="text-slate-400 font-medium mb-1">Total URLs Scanned</p>
                        <h3 className="text-4xl font-bold text-white tracking-tight">{stats.total || 0}</h3>
                    </div>
                    <div className="p-4 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                        <Globe className="text-blue-500" size={32} />
                    </div>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm flex items-center justify-between group hover:border-red-500/30 transition-all">
                    <div>
                        <p className="text-slate-400 font-medium mb-1">High Risk Sites</p>
                        <h3 className="text-4xl font-bold text-red-500 tracking-tight">{highRiskCount}</h3>
                    </div>
                    <div className="p-4 bg-red-500/10 rounded-xl group-hover:bg-red-500/20 transition-colors">
                        <ShieldAlert className="text-red-500" size={32} />
                    </div>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm flex items-center justify-between group hover:border-amber-500/30 transition-all">
                    <div>
                        <p className="text-slate-400 font-medium mb-1">Active Categories</p>
                        <h3 className="text-4xl font-bold text-amber-500 tracking-tight">{stats.categories ? stats.categories.length : 0}</h3>
                    </div>
                    <div className="p-4 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-colors">
                        <Activity className="text-amber-500" size={32} />
                    </div>
                </div>
            </div>

            {/* Main Bar Chart */}
            <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700/50 backdrop-blur-sm shadow-xl">
                <h3 className="text-xl font-semibold text-slate-200 mb-6 flex items-center gap-2">
                    <Activity size={20} className="text-green-500" />
                    Threat Landscape (By Category)
                </h3>
                <div className="h-[400px] w-full">
                    {stats.categories && stats.categories.length > 0 ? (
                        <Bar data={chartData} options={chartOptions} />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-700 rounded-xl bg-slate-800/30">
                            <Activity size={48} className="mb-4 opacity-50" />
                            <p className="text-lg">No threat data available.</p>
                            <p className="text-sm mt-2">Start a crawl to generate analytics.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardStats;
