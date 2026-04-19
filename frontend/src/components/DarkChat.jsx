
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Terminal, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const DarkChat = () => {
    const { token } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'I am DarkChat. Ready to analyze.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || !token) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: userMsg })
            });

            if (!response.ok) throw new Error('Network response was not ok');

            // Initialize empty bot message
            setMessages(prev => [...prev, { role: 'assistant', text: '' }]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let botReply = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                botReply += chunk;

                // Update last message with new chunk
                setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastMsg = newMsgs[newMsgs.length - 1];
                    if (lastMsg.role === 'assistant') {
                        lastMsg.text = botReply;
                    }
                    return newMsgs;
                });
            }

        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', text: "Connection Error." }]);
        } finally {
            setLoading(false);
        }
    };

    if (!token) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="mb-4 w-96 bg-zinc-900/90 border border-red-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl ring-1 ring-red-500/20"
                    >
                        {/* Header */}
                        <div className="bg-red-600/20 p-4 border-b border-red-500/20 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-500/20 rounded-lg">
                                    <Bot size={20} className="text-red-400" />
                                </div>
                                <div>
                                    <span className="font-bold text-zinc-100 block text-sm">DarkChat AI</span>
                                    <span className="text-[10px] text-red-300 font-mono tracking-wider flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                        ONLINE
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-red-300 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-4 h-[400px] overflow-y-auto bg-black/40 space-y-4 custom-scrollbar">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={idx}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg ${msg.role === 'user'
                                        ? 'bg-red-600 text-white rounded-br-none shadow-red-900/20'
                                        : 'bg-zinc-800 text-zinc-200 border border-zinc-700/50 rounded-bl-none shadow-black/20 font-mono'
                                        }`}>
                                        {msg.text}
                                        {msg.role === 'assistant' && loading && idx === messages.length - 1 && (
                                            <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-red-400 animate-pulse"></span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSend} className="p-3 bg-zinc-900/80 border-t border-zinc-800/50 flex gap-2">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Execute command or query..."
                                className="flex-1 bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all font-mono placeholder:text-zinc-600"
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white p-3 rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-95 group"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="group-hover:tranzinc-x-0.5 transition-transform" />}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="bg-red-600 hover:bg-red-500 text-white p-4 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-colors relative group"
            >
                <AnimatePresence mode='wait'>
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                        >
                            <X size={24} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                        >
                            <MessageSquare size={24} className="fill-current" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Status Dot */}
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border border-zinc-900"></span>
                </span>
            </motion.button>
        </div>
    );
};

export default DarkChat;
