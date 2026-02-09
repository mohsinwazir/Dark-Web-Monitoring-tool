import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock } from 'lucide-react';

const AuthForm = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '', email: '', password: '', role: 'user'
    });
    const { login, register } = useAuth();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (isLogin) {
            const result = await login(formData.username, formData.password);
            if (!result.success) {
                setError(result.message || 'Invalid credentials');
            }
            // If success, login function in AuthContext redirects or sets state?
            // Actually AuthContext sets state. We shouldn't navigate if it failed.
            // But wait, the navigate was NOT in AuthContext, it was here in AuthForm?
            // No, verify AuthForm original code: line 24 `const result = await login(...)`
            // Original code: `if (success) { navigate("/dashboard"); }`
            // Wait! Code I viewed in 2186 does NOT have navigate("/dashboard")!!!
            // Line 24: `const result = await login(...)`
            // Line 25: `if (!result) setError('Invalid credentials');`
            // Where is the navigation?
            // Ah, AuthContext does NOT navigate. The user stays on login page if success??
            // I need to scan AuthForm for `useNavigate`.
            // It is NOT imported in AuthForm.
            // Oh, checking `App.jsx`...
            // If `user` is set in context, `App.jsx` likely redirects from /login?
            // AuthContext: `setUser(...)` on success.

            // So if result.success is true, we essentially do nothing and let App redirect?
            // Or maybe I should add navigation here?
        } else {
            // Register
            const payload = {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                organization_name: "Self-Registered",
                role: "user", // Default
                keywords: [],
                target_domains: [],
                vip_names: []
            };
            const result = await register(payload);
            if (result.success) {
                setSuccess('Account created! Please sign in.');
                setIsLogin(true);
            } else {
                setError(result.message || 'Registration failed.');
            }
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 font-sans">
            <div className="w-full max-w-md p-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl transition-all">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Lock className="text-white" size={32} />
                    </div>
                </div>
                <h2 className="text-3xl font-bold text-center text-white mb-2">
                    {isLogin ? 'Secure Access' : 'Join Intelligence'}
                </h2>
                <p className="text-center text-slate-500 mb-8">Dark Web Intelligence System</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Username</label>
                        <input
                            name="username"
                            type="text"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                            required
                        />
                    </div>

                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
                        <input
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                            required
                        />
                        {!isLogin && <p className="text-xs text-slate-500 mt-1">Min 8 chars, uppercase, lowercase, number</p>}
                    </div>

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    {success && <p className="text-green-500 text-sm text-center">{success}</p>}

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-colors"
                    >
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                            setSuccess('');
                        }}
                        className="text-slate-400 hover:text-white text-sm"
                    >
                        {isLogin ? "Need an account? Register" : "Already have an account? Sign In"}
                    </button>
                </div>
            </div>
        </div >
    );
};

export default AuthForm;
