import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Trash2 } from 'lucide-react';
import DashboardStats from '../components/DashboardStats';
import TwoFactorSetup from '../components/TwoFactorSetup';

const UserDashboard = () => {
    const { user, token, logout } = useAuth();
    const [newKeyword, setNewKeyword] = useState('');
    const [msg, setMsg] = useState('');

    const addWatchlist = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/user/watchlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify([newKeyword])
            });
            if (response.ok) {
                setMsg(`✅ Monitoring "${newKeyword}"`);
                setNewKeyword('');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="p-8 space-y-8 text-slate-100">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">
                        Threat Intelligence Dashboard
                    </h1>
                    <p className="text-slate-400">Welcome back, {user?.username}</p>
                </div>
                <button
                    onClick={logout}
                    className="px-4 py-2 border border-slate-700 rounded-lg hover:bg-slate-800"
                >
                    Logout
                </button>
            </div>

            {/* Watchlist Manager */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-emerald-500/20 backdrop-blur">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Search className="text-emerald-500" /> My Watchlist
                    </h2>
                    <form onSubmit={addWatchlist} className="flex gap-4">
                        <input
                            type="text"
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            placeholder="Enter keyword (e.g., 'Project X', 'secret_key')"
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                            type="submit"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 rounded-xl font-bold flex items-center gap-2"
                        >
                            <Plus size={18} /> Add
                        </button>
                    </form>
                    {msg && <p className="mt-2 text-emerald-400 text-sm">{msg}</p>}
                </div>

                <TwoFactorSetup />
            </div>

            {/* Personalized Stats Placeholder */}
            {/* Note: We would pass specific props here based on the fetch results */}
            <div className="bg-slate-900/30 p-8 rounded-2xl border border-dashed border-slate-700 text-center text-slate-500">
                <p>Personalized Alert Feed Loading...</p>
                {/* <DashboardStats ... /> could go here reusing the component */}
            </div>
        </div>
    );
};

export default UserDashboard;
