import { useState } from 'react';
import { Shield, Code, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DefenseConsole = () => {
    const { token } = useAuth();
    const [threat, setThreat] = useState('');
    const [iocs, setIocs] = useState('');
    const [rule, setRule] = useState('');
    const [typing, setTyping] = useState(false);

    const generateRule = async () => {
        if (!threat || !iocs) return;
        setRule('');

        const indicators = iocs.split(',').map(s => s.trim());

        try {
            const res = await fetch('/api/intel/yara', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ threat_name: threat, indicators })
            });
            const data = await res.json();

            // Typewriter Effect
            setTyping(true);
            const fullText = data.rule;
            let i = 0;
            const timer = setInterval(() => {
                setRule(fullText.substring(0, i));
                i++;
                if (i > fullText.length) {
                    clearInterval(timer);
                    setTyping(false);
                }
            }, 20); // Speed of typing

        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="text-blue-400" /> Auto-Defense Generator
            </h2>
            <p className="text-slate-400 text-sm mb-6">Create YARA rules from Indicators of Compromise (IOCs).</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold">Threat Name</label>
                        <input
                            value={threat}
                            onChange={e => setThreat(e.target.value)}
                            placeholder="e.g. Ransomware_BlackCat"
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white mt-1"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold">IOCs (comma separated)</label>
                        <textarea
                            value={iocs}
                            onChange={e => setIocs(e.target.value)}
                            placeholder='e.g. "bitcoin_address", "malicious_url.com"'
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white mt-1 h-32 font-mono text-sm"
                        />
                    </div>
                    <button
                        onClick={generateRule}
                        disabled={typing}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                    >
                        <Play size={16} /> GENERATE VACCINE
                    </button>
                </div>

                {/* Code Editor Preview */}
                <div className="bg-[#1e1e1e] rounded-xl border border-slate-700 p-4 font-mono text-sm overflow-auto text-blue-100 shadow-inner relative">
                    <div className="absolute top-2 right-2 text-xs text-slate-500 flex items-center gap-1">
                        <Code size={12} /> YARA
                    </div>
                    <pre className="whitespace-pre-wrap">
                        {rule}
                        {typing && <span className="animate-pulse">|</span>}
                    </pre>
                    {!rule && !typing && <div className="text-slate-600 italic mt-10 text-center">Waiting for input...</div>}
                </div>
            </div>
        </div>
    );
};

export default DefenseConsole;
