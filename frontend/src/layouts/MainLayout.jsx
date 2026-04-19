import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Bot, Shield, Bell, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DarkChat from '../components/DarkChat';

const MainLayout = () => {
    const location = useLocation();
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, type: 'alert', text: 'New high-risk market detected: "SilkRoad 4.0"', time: '2m ago' },
        { id: 2, type: 'info', text: 'System backup completed successfully.', time: '1h ago' },
        { id: 3, type: 'alert', text: 'Unusual traffic spike from Node 12.', time: '3h ago' }
    ]);

    return (
        <div className="flex h-screen bg-black text-zinc-100 font-sans selection:bg-red-500/30 overflow-hidden">
            {/* Persistent Sidebar */}
            <Sidebar />

            <div className="flex-1 flex flex-col relative">
                {/* HUD / Top Bar */}
                <header className="h-16 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md flex justify-between items-center px-6 z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-red-400 bg-red-950/30 px-3 py-1 rounded-full border border-red-500/20">
                            <Shield size={16} />
                            <span className="text-xs font-bold tracking-wider">SYSTEM SECURE</span>
                        </div>
                        <div className="h-4 w-[1px] bg-zinc-700"></div>
                        <span className="text-zinc-400 text-sm">Op: DarkWatch-Alpha</span>
                    </div>

                    <div className="flex items-center gap-4 relative">
                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors relative"
                            >
                                <Bell size={20} />
                                {notifications.length > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                )}
                            </button>

                            {/* Dropdown */}
                            <AnimatePresence>
                                {showNotifications && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-12 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                                    >
                                        <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-black/50">
                                            <span className="font-bold text-sm text-white">Notifications</span>
                                            <button
                                                onClick={() => setNotifications([])}
                                                className="text-xs text-red-400 hover:text-red-300"
                                            >
                                                Clear All
                                            </button>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-8 text-center text-zinc-500 text-sm">
                                                    No new alerts.
                                                </div>
                                            ) : (
                                                notifications.map((note) => (
                                                    <div key={note.id} className="p-3 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${note.type === 'alert' ? 'bg-red-500/20 text-red-400' : 'bg-red-500/20 text-red-400'
                                                                }`}>
                                                                {note.type.toUpperCase()}
                                                            </span>
                                                            <span className="text-[10px] text-zinc-500">{note.time}</span>
                                                        </div>
                                                        <p className="text-sm text-zinc-300 line-clamp-2">{note.text}</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex items-center gap-3 pl-4 border-l border-zinc-700">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-white">Analyst_01</p>
                                <p className="text-xs text-zinc-500">Cyber Intelligence</p>
                            </div>
                            <div className="w-9 h-9 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                                <User size={18} />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area with Transitions */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 relative scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>

                {/* Global Chat Widget */}
                <DarkChat />
            </div>
        </div>
    );
};

export default MainLayout;
