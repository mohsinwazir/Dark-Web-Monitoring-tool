import { useState } from 'react';
import { Scan, Eye, Lock, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StegoLab = () => {
    const { token } = useAuth();
    const [url, setUrl] = useState('');
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState(null);

    const handleScan = async () => {
        if (!url) return;
        setScanning(true);
        setResult(null);

        try {
            const res = await fetch('/api/forensics/stego', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ image_url: url })
            });
            const data = await res.json();

            // Simulate scanning time for effect
            setTimeout(() => {
                setResult(data);
                setScanning(false);
            }, 2000);

        } catch (e) {
            setScanning(false);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Eye className="text-emerald-400" /> Steganography Decoder
            </h2>

            <div className="flex gap-4 mb-6">
                <input
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="Enter Image URL to Analyze..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
                />
                <button
                    onClick={handleScan}
                    disabled={scanning}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold transition-all disabled:opacity-50"
                >
                    {scanning ? 'SCANNING...' : 'DECODE'}
                </button>
            </div>

            {/* Preview Area */}
            {url && (
                <div className="relative w-full h-64 bg-black/50 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
                    <img src={url} alt="Target" className="h-full object-contain opacity-80" />

                    {/* Scanning Animation */}
                    {scanning && (
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent w-full h-full animate-[scan_2s_ease-in-out_infinite] border-b-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]"></div>
                    )}
                </div>
            )}

            {/* Result Box */}
            {result && (
                <div className={`mt-6 p-4 rounded-xl border ${result.has_hidden_text ? 'bg-red-900/20 border-red-500/50' : 'bg-slate-800 border-slate-700'}`}>
                    {result.has_hidden_text ? (
                        <div>
                            <div className="flex items-center gap-2 text-red-500 font-bold mb-2">
                                <Lock size={18} /> HIDDEN PAYLOAD EXTRACTED
                            </div>
                            <div className="font-mono text-sm text-red-100 bg-black/40 p-3 rounded">
                                {result.text}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-slate-400">
                            <CheckCircle size={18} /> No hidden artifacts detected.
                        </div>
                    )}
                </div>
            )}

            <style>{`
                @keyframes scan {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }
            `}</style>
        </div>
    );
};

export default StegoLab;
