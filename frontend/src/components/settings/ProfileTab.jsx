
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Bell, Moon, Sun, Save, Loader2, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/apiClient';

const ProfileTab = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        new_password: '',
        preferences: {
            email_alerts: true,
            dark_mode: true
        }
    });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    // Ideally fetch fresh data on mount, but simplifying by using context or props
    // Let's assume we can fetch 'me'
    useEffect(() => {
        // Mock fetch or simple sync
        if (user) {
            setFormData(prev => ({
                ...prev,
                username: user.username || '',
                // email: user.email || '' // If context doesn't have it, we might need a distinct fetch
            }));
        }
        // Ideally we'd GET /users/me here to fill email and prefs
    }, [user]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.startsWith("pref_")) {
            const prefKey = name.replace("pref_", "");
            setFormData(prev => ({
                ...prev,
                preferences: { ...prev.preferences, [prefKey]: checked }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg({ type: '', text: '' });

        try {
            // Build payload
            const payload = {
                username: formData.username,
                email: formData.email, // Only send if changed/populated
                preferences: formData.preferences
            };
            if (formData.new_password) {
                payload.password = formData.password;
                payload.new_password = formData.new_password;
            }

            const res = await api.put('/users/me', payload);
            setMsg({ type: 'success', text: 'Profile updated successfully' });
            // Optionally refresh auth context
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.detail || 'Update failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl bg-zinc-900/50 p-8 rounded-2xl border border-zinc-700 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <User className="text-red-400" /> Account Settings
            </h2>

            {msg.text && (
                <div className={`p-4 mb-6 rounded-lg ${msg.type === 'error' ? 'bg-red-900/50 text-red-200 border-red-500/30' : 'bg-green-900/50 text-green-200 border-green-500/30'} border`}>
                    {msg.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Info */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-zinc-300 text-sm mb-2">Username</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-3 text-zinc-500" />
                                <input
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full bg-black border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-red-500 focus:outline-none"
                                    placeholder="Username"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-zinc-300 text-sm mb-2">Email Address</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-3 text-zinc-500" />
                                <input
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-black border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-red-500 focus:outline-none"
                                    placeholder="email@example.com"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="border-zinc-800" />

                {/* Security */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Security</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-zinc-300 text-sm mb-2">Current Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-3 text-zinc-500" />
                                <input
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full bg-black border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-red-500 focus:outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-zinc-300 text-sm mb-2">New Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-3 text-zinc-500" />
                                <input
                                    name="new_password"
                                    type="password"
                                    value={formData.new_password}
                                    onChange={handleChange}
                                    className="w-full bg-black border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-red-500 focus:outline-none"
                                    placeholder="Leave empty to keep current"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="border-zinc-800" />

                {/* Preferences */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Preferences</h3>
                    <div className="flex flex-col gap-4">
                        <label className="flex items-center justify-between p-3 bg-black rounded-lg border border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
                                    <Bell size={18} />
                                </div>
                                <span className="text-zinc-200">Email Alerts</span>
                            </div>
                            <input
                                type="checkbox"
                                name="pref_email_alerts"
                                checked={formData.preferences.email_alerts}
                                onChange={handleChange}
                                className="w-5 h-5 accent-red-500 rounded"
                            />
                        </label>

                        <label className="flex items-center justify-between p-3 bg-black rounded-lg border border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
                                    <Moon size={18} />
                                </div>
                                <span className="text-zinc-200">Dark Mode</span>
                            </div>
                            <input
                                type="checkbox"
                                name="pref_dark_mode"
                                checked={formData.preferences.dark_mode}
                                onChange={handleChange}
                                className="w-5 h-5 accent-red-500 rounded"
                            />
                        </label>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-red-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Save Changes
                    </button>
                </div>

            </form>

            <div className="mt-12 pt-6 border-t border-zinc-800">
                <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-4">Danger Zone</h3>
                <button
                    onClick={() => {
                        logout();
                        navigate('/login');
                    }}
                    className="flex items-center gap-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 px-6 py-3 rounded-xl font-semibold transition-all"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default ProfileTab;
