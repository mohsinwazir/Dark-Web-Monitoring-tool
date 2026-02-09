
import { useState, useEffect } from 'react';
import { User, Lock, Mail, Bell, Moon, Sun, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/apiClient';

const ProfileTab = () => {
    const { user, token } = useAuth(); // Assuming useAuth provides current user details
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
        <div className="max-w-2xl bg-slate-900/50 p-8 rounded-2xl border border-slate-700 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <User className="text-indigo-400" /> Account Settings
            </h2>

            {msg.text && (
                <div className={`p-4 mb-6 rounded-lg ${msg.type === 'error' ? 'bg-red-900/50 text-red-200 border-red-500/30' : 'bg-green-900/50 text-green-200 border-green-500/30'} border`}>
                    {msg.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Info */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-slate-300 text-sm mb-2">Username</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-3 text-slate-500" />
                                <input
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                    placeholder="Username"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-slate-300 text-sm mb-2">Email Address</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-3 text-slate-500" />
                                <input
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                    placeholder="email@example.com"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="border-slate-800" />

                {/* Security */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Security</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-slate-300 text-sm mb-2">Current Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-3 text-slate-500" />
                                <input
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-slate-300 text-sm mb-2">New Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-3 text-slate-500" />
                                <input
                                    name="new_password"
                                    type="password"
                                    value={formData.new_password}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                    placeholder="Leave empty to keep current"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="border-slate-800" />

                {/* Preferences */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Preferences</h3>
                    <div className="flex flex-col gap-4">
                        <label className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                    <Bell size={18} />
                                </div>
                                <span className="text-slate-200">Email Alerts</span>
                            </div>
                            <input
                                type="checkbox"
                                name="pref_email_alerts"
                                checked={formData.preferences.email_alerts}
                                onChange={handleChange}
                                className="w-5 h-5 accent-indigo-500 rounded"
                            />
                        </label>

                        <label className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                    <Moon size={18} />
                                </div>
                                <span className="text-slate-200">Dark Mode</span>
                            </div>
                            <input
                                type="checkbox"
                                name="pref_dark_mode"
                                checked={formData.preferences.dark_mode}
                                onChange={handleChange}
                                className="w-5 h-5 accent-indigo-500 rounded"
                            />
                        </label>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Save Changes
                    </button>
                </div>

            </form>
        </div>
    );
};

export default ProfileTab;
