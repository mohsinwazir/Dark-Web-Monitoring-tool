import { useState, useEffect } from 'react';
import { Plus, Trash2, Globe, ShieldAlert } from 'lucide-react';
import { api } from '../../api/apiClient';

const TargetManagement = () => {
    const [targets, setTargets] = useState([]);
    const [newTarget, setNewTarget] = useState('');
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchTargets();
    }, []);

    const fetchTargets = async () => {
        try {
            const res = await api.get('/users/me');
            if (res.data.assets && res.data.assets.monitored_domains) {
                setTargets(res.data.assets.monitored_domains);
            }
        } catch (err) {
            console.error("Failed to fetch targets:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTarget = async (e) => {
        e.preventDefault();
        if (!newTarget.trim()) return;

        try {
            const res = await api.post('/users/me/targets', { target: newTarget });
            setTargets(res.data.targets);
            setNewTarget('');
            setMsg({ type: 'success', text: 'Target acquired successfully' });
            setTimeout(() => setMsg({ type: '', text: '' }), 3000);
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to add target' });
        }
    };

    const handleRemoveTarget = async (target) => {
        try {
            const res = await api.delete('/users/me/targets', { data: { target } });
            setTargets(res.data.targets);
        } catch (err) {
            console.error("Failed to remove target:", err);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">

            {/* Header Section */}
            <div className="relative p-6 rounded-2xl bg-slate-900/40 border border-cyan-500/20 backdrop-blur-sm overflow-hidden group">
                <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <ShieldAlert className="text-cyan-400 animate-pulse" />
                    <span className="tracking-wider">TARGET MANAGEMENT</span>
                </h2>
                <p className="text-cyan-200/60 mt-2 font-mono text-sm">
                    // Configure surveillance parameters for dark web assets
                </p>
            </div>

            {/* Input Section */}
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_40px_-10px_rgba(6,182,212,0.1)]">
                <form onSubmit={handleAddTarget} className="flex flex-col md:flex-row gap-4 items-center justify-center">
                    <div className="relative w-full md:w-2/3 group">
                        <div className="absolute inset-0 bg-cyan-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
                        <input
                            type="text"
                            value={newTarget}
                            onChange={(e) => setNewTarget(e.target.value)}
                            placeholder="Enter .onion URL or Domain..."
                            className="relative w-full bg-slate-950/80 border border-cyan-500/30 text-cyan-50 placeholder-cyan-800/50 px-6 py-4 rounded-xl focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all font-mono text-lg"
                        />
                        <Globe className="absolute right-4 top-4 text-cyan-500/40" size={20} />
                    </div>

                    <button
                        type="submit"
                        className="w-full md:w-auto px-8 py-4 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 rounded-xl font-bold tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group"
                    >
                        <Plus className="group-hover:rotate-90 transition-transform" />
                        <span>Add Target</span>
                    </button>
                </form>

                {msg.text && (
                    <div className={`mt-4 text-center font-mono text-sm ${msg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {msg.text}
                    </div>
                )}
            </div>

            {/* Active Targets List */}
            <div className="space-y-4">
                <h3 className="text-cyan-400 font-mono text-sm uppercase tracking-widest px-2">Active Surveillance Targets ({targets.length})</h3>

                {loading ? (
                    <div className="text-center py-12 text-cyan-500/30 animate-pulse font-mono">
                        SCANNING DATABASE...
                    </div>
                ) : targets.length === 0 ? (
                    <div className="p-8 rounded-xl border border-dashed border-slate-700 text-center text-slate-500 font-mono">
                        NO TARGETS CONFIGURED. SYSTEM IDLE.
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {targets.map((target, idx) => (
                            <div
                                key={idx}
                                className="group flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900/60 rounded-xl backdrop-blur-sm transition-all duration-300"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
                                    <span className="text-slate-300 font-mono group-hover:text-cyan-300 transition-colors">
                                        {target}
                                    </span>
                                </div>

                                <button
                                    onClick={() => handleRemoveTarget(target)}
                                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-60 group-hover:opacity-100"
                                    title="Terminate Surveillance"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TargetManagement;
