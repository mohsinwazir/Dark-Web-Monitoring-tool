
import { useState } from 'react';
import { Cog, User, Shield } from 'lucide-react';
import ProfileTab from '../components/settings/ProfileTab';
import UserTable from '../components/settings/UserTable';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
    const { isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

            {/* Tabs Navigation */}
            <div className="flex gap-4 border-b border-slate-800 pb-1">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'profile'
                            ? 'border-indigo-500 text-indigo-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <User size={16} />
                    My Profile
                </button>

                {isAdmin() && (
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'users'
                                ? 'border-indigo-500 text-indigo-400'
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        <Shield size={16} />
                        User Management
                    </button>
                )}
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                {activeTab === 'profile' && <ProfileTab />}
                {activeTab === 'users' && isAdmin() && <UserTable />}
            </div>
        </div>
    );
};

export default Settings;
