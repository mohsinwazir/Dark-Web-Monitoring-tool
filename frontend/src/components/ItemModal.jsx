import { useState, useEffect } from 'react';
import { X, Globe, AlertCircle, Database, FileJson, Clock } from 'lucide-react';
import { api } from '../api/apiClient';
import SafeHTML from './SafeHTML';

const ItemModal = ({ itemId, onClose }) => {
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState('raw'); // 'raw' or 'extracted'

    useEffect(() => {
        const fetchItem = async () => {
            try {
                const res = await api.get(`/items/${itemId}`);
                setItem(res.data);
            } catch (err) {
                console.error(err);
                setError("Failed to load item details.");
            } finally {
                setLoading(false);
            }
        };
        fetchItem();
    }, [itemId]);

    if (!itemId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-zinc-900 border border-zinc-700 w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-black">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Database className="text-red-500" size={20} /> Dark Web Intel Viewer
                    </h2>
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex justify-center items-center text-zinc-500 animate-pulse">
                        <Database size={48} className="mr-4 opacity-50" /> Fetching Deep Scan Data...
                    </div>
                ) : error ? (
                    <div className="flex-1 flex justify-center items-center text-red-500 font-mono">
                        {error}
                    </div>
                ) : item ? (
                    <div className="flex flex-1 overflow-hidden">

                        {/* Sidebar details */}
                        <div className="w-1/3 bg-black border-r border-zinc-800 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">

                            <div>
                                <h3 className="font-bold text-lg text-white mb-2 leading-tight">{item.title || "Unknown Title"}</h3>
                                <a href={item.url} target="_blank" rel="noreferrer" className="text-sm text-red-400 hover:underline flex items-center gap-1 break-all">
                                    <Globe size={14} className="shrink-0" /> {item.url}
                                </a>
                            </div>

                            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                                <span className="text-zinc-400 text-sm flex items-center gap-2"><AlertCircle size={16} /> AI Risk Score:</span>
                                <span className={`text-2xl font-bold font-mono ${item.risk_score > 0.8 ? 'text-red-500' : 'text-zinc-200'}`}>
                                    {(item.risk_score * 100).toFixed(0)}%
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Metadata</h4>
                                    <div className="space-y-2 text-sm text-zinc-300">
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">Category:</span>
                                            <span className="font-mono">{item.category || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">Crawled On:</span>
                                            <span className="font-mono text-xs">{new Date(item.timestamp).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">Connection:</span>
                                            <span className="font-mono">{item.conn_type || "N/A"}</span>
                                        </div>
                                        {item.csam_flag && (
                                            <div className="mt-2 p-2 bg-red-900/30 text-red-500 font-bold border border-red-500/50 rounded flex justify-center uppercase text-xs tracking-widest">
                                                🚨 Illegal Material Detected
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">AI Extracted Entities</h4>
                                    {item.entities && Object.values(item.entities).flat().length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(item.entities).map(([type, values]) => (
                                                values.map((val, idx) => (
                                                    <span key={`${type}-${idx}`} className="px-2 py-1 bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 rounded font-mono">
                                                        <span className="text-red-400">{type}:</span> {val}
                                                    </span>
                                                ))
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-zinc-500 text-sm italic">No entities extracted.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Main viewer */}
                        <div className="flex flex-col flex-1 bg-[#0f111a]">
                            <div className="flex border-b border-zinc-800 bg-zinc-900">
                                <button
                                    onClick={() => setActiveTab('raw')}
                                    className={`px-6 py-3 text-sm font-bold transition-all ${activeTab === 'raw' ? 'bg-[#0f111a] text-red-400 border-t-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    Raw Web Page Render
                                </button>
                                <button
                                    onClick={() => setActiveTab('extracted')}
                                    className={`px-6 py-3 text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'extracted' ? 'bg-[#0f111a] text-red-400 border-t-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    <FileJson size={16} /> Extracted Plaintext
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                {activeTab === 'raw' ? (
                                    item.raw_html ? (
                                        <div className="bg-white text-black p-4 rounded-xl min-h-full">
                                            <SafeHTML html={item.raw_html} />
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col justify-center items-center text-zinc-600 font-mono space-y-4">
                                            <AlertCircle size={48} className="opacity-50 text-amber-500" />
                                            <p>Raw HTML data is missing or was not saved during the crawl.</p>
                                        </div>
                                    )
                                ) : (
                                    <div className="font-mono text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
                                        {item.text || "No text available."}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default ItemModal;
