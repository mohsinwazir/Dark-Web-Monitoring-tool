import { LayoutDashboard, Target, Network, Database, Activity, Globe, Microscope, Settings, FileText } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
    const menuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/live-ops', label: 'Live Operations', icon: Activity },
        { path: '/intelligence', label: 'Threat Intel', icon: Target },
        { path: '/forensics', label: 'Forensics Lab', icon: Microscope },
        { path: '/network', label: 'Network Map', icon: Globe },
        { path: '/admin', label: 'Admin Station', icon: Database },
        { path: '/reports', label: 'Reports', icon: FileText },
        { path: '/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <aside className="w-64 h-screen bg-black border-r border-zinc-800 flex flex-col shadow-2xl relative z-20">
            {/* Logo Area */}
            <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-green-400 tracking-wider">
                    CYBER<span className="text-white">INTEL</span>
                </h1>
                <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest pl-1">Enterprise Suite v3.0</p>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-3 py-6 space-y-2">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                            w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group
                            ${isActive
                                ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                            }
                        `}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon
                                    size={20}
                                    className={`transition-colors duration-300 ${isActive ? 'text-red-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}
                                />
                                <span className="font-medium tracking-wide text-sm">{item.label}</span>
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse" />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Operator Status */}
            <div className="p-4 mx-2 mb-4">
                <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 flex items-center gap-3">
                    <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-red-400 ring-2 ring-zinc-700">
                            OP
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-900"></span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-300">Logged In</span>
                        <span className="text-[10px] text-emerald-500 font-mono tracking-wide">SECURE_LINK_ACTIVE</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
