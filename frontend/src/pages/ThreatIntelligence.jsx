
import { useState, useEffect } from 'react';
import MitreHeatmap from '../components/MitreHeatmap';
import { Database, FileJson, AlertTriangle, Search, Filter, Cpu, Globe, AlertCircle } from 'lucide-react';
import { api } from '../api/apiClient';

const ThreatIntelligence = () => {
    const [activeTab, setActiveTab] = useState('explorer'); // 'dashboard' or 'explorer'
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // Search Filters
    const [query, setQuery] = useState('');
    const [minRisk, setMinRisk] = useState(0.0);
    const [category, setCategory] = useState("All");

    // Mock Data for Dashboard (TTPs)
    const demoTTPs = ["T1190", "T1003", "T1566", "T1486"];
    const cves = [
        { id: "CVE-2023-1289", score: 9.8, sev: "CRITICAL", desc: "Remote Code Execution in..." },
        { id: "CVE-2023-4451", score: 7.5, sev: "HIGH", desc: "Privilege Escalation via..." },
    ];

    useEffect(() => {
        if (activeTab === 'explorer') {
            handleSearch();
        }
    }, [activeTab]);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            // Build params
            const params = { q: query, limit: 50 };
            if (minRisk > 0) params.risk_score = minRisk;
            if (category !== "All") params.category = category;

            const res = await api.get('/items', { params });
            setSearchResults(res.data);
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Database className="text-purple-400" /> Threat Intelligence
                </h1>

                {/* Tabs */}
                <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('explorer')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'explorer' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        AI Data Explorer
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
                {activeTab === 'dashboard' ? (
                    <div className="space-y-8 overflow-y-auto h-full pr-2">
                        {/* MITRE MATRIX */}
                        <div className="bg-slate-900/50 p-6 rounded-2xl border border-indigo-500/20">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-400">
                                <Database size={18} /> MITRE ATT&CK Matrix
                            </h2>
                            <MitreHeatmap detectedTTPs={demoTTPs} />
                        </div>

                        {/* CVE LIST */}
                        <div className="bg-slate-900/50 p-6 rounded-2xl border border-rose-500/20">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-rose-400">
                                <AlertTriangle size={18} /> Critical Vulnerabilities (CVE)
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-slate-400 text-xs uppercase border-b border-slate-800">
                                            <th className="p-3">ID</th>
                                            <th className="p-3">Severity</th>
                                            <th className="p-3">Description</th>
                                            <th className="p-3 text-right">CVSS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {cves.map((cve) => (
                                            <tr key={cve.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                                <td className="p-3 font-mono text-slate-300">{cve.id}</td>
                                                <td className="p-3">
                                                    <span className="bg-red-900/50 text-red-500 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                                                        {cve.sev}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-slate-400 truncate max-w-md">{cve.desc}</td>
                                                <td className="p-3 text-right font-mono font-bold">{cve.score}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    // DATA EXPLORER TAB
                    <div className="h-full flex flex-col space-y-4">
                        {/* Search Bar & Filters */}
                        <form onSubmit={handleSearch} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 flex flex-wrap gap-4 items-center">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search extracted content (AI)..."
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none"
                            >
                                <option value="All">All Categories</option>
                                <option value="Drugs">Drugs</option>
                                <option value="Weapons">Weapons</option>
                                <option value="Financial">Financial Fraud</option>
                                <option value="Human Trafficking">Human Trafficking</option>
                            </select>

                            <select
                                value={minRisk}
                                onChange={(e) => setMinRisk(Number(e.target.value))}
                                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none"
                            >
                                <option value={0}>Risk: Any</option>
                                <option value={0.5}>Risk: Medium (50%+)</option>
                                <option value={0.8}>Risk: Critical (80%+)</option>
                            </select>

                            <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-bold transition-colors">
                                Filter
                            </button>
                        </form>

                        {/* Results Grid */}
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                            {loading ? (
                                <div className="text-center p-8 text-slate-500">Scanning Intelligence Database...</div>
                            ) : searchResults.length === 0 ? (
                                <div className="text-center p-8 text-slate-500">No intelligence found matching criteria.</div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {searchResults.map((item) => (
                                        <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-purple-500/30 transition-colors group">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${item.risk_score > 0.8 ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                                                        <AlertCircle size={20} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-white text-lg leading-tight">{item.title || "Unknown Title"}</h3>
                                                        <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-purple-400 hover:underline flex items-center gap-1 mt-1">
                                                            <Globe size={10} /> {item.url}
                                                        </a>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold font-mono text-slate-200">{(item.risk_score * 100).toFixed(0)}%</div>
                                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Risk Score</div>
                                                </div>
                                            </div>

                                            <p className="text-slate-400 text-sm mb-4 line-clamp-3 font-mono bg-slate-950/50 p-3 rounded border border-slate-800/50">
                                                {item.text || "No text content extracted."}
                                            </p>

                                            <div className="flex flex-wrap gap-2">
                                                {item.category && (
                                                    <span className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 border border-slate-700">
                                                        📂 {item.category}
                                                    </span>
                                                )}
                                                {item.csam_flag && (
                                                    <span className="px-2 py-1 rounded bg-red-900/20 text-red-400 text-xs border border-red-900/30 font-bold">
                                                        🚫 ILLEGAL CONTENT
                                                    </span>
                                                )}
                                                {item.conn_type && (
                                                    <span className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-500 border border-slate-700">
                                                        🔌 {item.conn_type}
                                                    </span>
                                                )}
                                                <span className="ml-auto text-xs text-slate-600 self-center">
                                                    {new Date(item.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ThreatIntelligence;
