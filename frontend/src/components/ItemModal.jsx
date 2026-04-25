import { useState, useEffect } from 'react';
import { X, Globe, AlertCircle, Database, FileJson, Clock, ShieldAlert, Terminal, Bug, Network, Mail, Phone, Cpu, Lock } from 'lucide-react';
import { api } from '../api/apiClient';
import SafeHTML from './SafeHTML';

// --- AI Brief Generator (client-side synthesis) ---
const generateThreatBrief = (item) => {
    if (!item) return null;

    const cat = item.category || 'Unknown';
    const risk = (item.risk_score * 100).toFixed(0);
    const title = item.title || 'Unknown Threat';
    const text = item.text || '';
    const entities = item.entities || {};

    const tactics = {
        'Hacking': { tactic: 'TA0001 - Initial Access', technique: 'T1190 - Exploit Public-Facing Application', actor: 'Threat Actor (Initial Broker)', color: 'red' },
        'Drugs': { tactic: 'TA0040 - Impact', technique: 'T1565 - Data Manipulation', actor: 'Dark Web Vendor', color: 'orange' },
        'Financial Fraud': { tactic: 'TA0009 - Collection', technique: 'T1056 - Input Capture / Skimming', actor: 'Financial Threat Actor', color: 'yellow' },
        'Stolen Credit Card Fraud': { tactic: 'TA0009 - Collection', technique: 'T1056 - Input Capture / Card Skimming', actor: 'Carding Syndicate', color: 'yellow' },
        'Weapons': { tactic: 'TA0042 - Resource Development', technique: 'T1588 - Obtain Capabilities', actor: 'Arms Trafficker', color: 'red' },
        'Counterfeit': { tactic: 'TA0040 - Impact', technique: 'T1496 - Resource Hijacking', actor: 'Counterfeit Supplier', color: 'orange' },
        'Human Trafficking': { tactic: 'TA0040 - Impact', technique: 'T1657 - Financial Theft', actor: 'Criminal Network', color: 'red' },
    };

    const mitigations = {
        'Hacking': [
            'Immediately rotate all exposed credentials and API keys',
            'Enable MFA on all VPN and admin endpoints',
            'Audit firewall rules and disable unnecessary external ports',
            'Deploy an EDR solution on all endpoints for lateral movement detection',
        ],
        'Drugs': [
            'No direct IT mitigation required. Report to law enforcement.',
            'Monitor for package interception attempts at corporate facilities',
        ],
        'Financial Fraud': [
            'Issue new cards to all affected accounts immediately',
            'Enable real-time transaction fraud alerts',
            'Notify PCI-DSS compliance team and initiate breach assessment',
            'Deploy velocity checking on payment endpoints',
        ],
        'Stolen Credit Card Fraud': [
            'Alert issuing bank to block and reissue affected cards',
            'Scan e-commerce infrastructure for skimming malware (Magecart)',
            'Review recent chargebacks for confirmed fraud patterns',
        ],
        'Hacking Tools': [
            'Check network traffic for C2 beacon signatures',
            'Deploy YARA rules to endpoint AV for malware family detection',
            'Isolate any systems flagged in threat intelligence',
        ],
        'Weapons': ['Report intelligence to relevant law enforcement agencies immediately.'],
        'Counterfeit': ['Alert brand protection team. Submit DMCA/takedown notices.'],
    };

    const yaraTemplates = {
        'Hacking': `rule ${title.replace(/[^a-zA-Z0-9]/g, '_')} {
    meta:
        description = "Detects indicators from: ${title}"
        category    = "${cat}"
        risk_score  = "${risk}%"
        source      = "DWITMS Dark Web Intelligence"
        date        = "${new Date().toISOString().split('T')[0]}"
    strings:
        $s1 = "vpn" ascii nocase
        $s2 = "rdp" ascii nocase
        $s3 = "citrix" ascii nocase
        $s4 = "admin privileges" ascii nocase
        $s5 = "auction" ascii nocase
    condition:
        3 of them
}`,
        'Financial Fraud': `rule ${title.replace(/[^a-zA-Z0-9]/g, '_')} {
    meta:
        description = "Financial fraud indicators: ${title}"
        category    = "${cat}"
        risk_score  = "${risk}%"
    strings:
        $cc1 = /[0-9]{16}/ 
        $cc2 = "cvv" ascii nocase
        $cc3 = "fullz" ascii nocase
        $cc4 = "dumps" ascii nocase
    condition:
        2 of them
}`,
        'default': `rule ${title.replace(/[^a-zA-Z0-9]/g, '_')} {
    meta:
        description = "Dark web IOC: ${title}"
        category    = "${cat}"
        risk_score  = "${risk}%"
        source      = "DWITMS"
    strings:
        $ioc1 = "${(text.split(' ').slice(0, 4).join(' '))}" ascii nocase
    condition:
        $ioc1
}`,
    };

    const mitigationList = mitigations[cat] || [
        'Monitor intelligence feeds for related indicators.',
        'Ingest identified .onion domains into threat intel platform.',
        'Brief security operations team on discovered threat vector.',
    ];

    const tacticsInfo = tactics[cat] || { tactic: 'TA0043 - Reconnaissance', technique: 'T1596 - Search Open Sources', actor: 'Unknown Threat Actor', color: 'zinc' };
    const yaraRule = yaraTemplates[cat] || yaraTemplates['default'];

    // Build IoC list from entities
    const iocs = [];
    if (entities.EMAIL) entities.EMAIL.forEach(e => iocs.push({ type: 'Email', value: e }));
    if (entities.IP_ADDRESS) entities.IP_ADDRESS.forEach(e => iocs.push({ type: 'IP Address', value: e }));
    if (entities.CRYPTO) entities.CRYPTO.forEach(e => iocs.push({ type: 'Crypto Wallet', value: e }));
    if (entities.PHONE) entities.PHONE.forEach(e => iocs.push({ type: 'Phone', value: e }));
    if (entities.PGP_KEY) entities.PGP_KEY.forEach(e => iocs.push({ type: 'PGP Key', value: e }));
    if (entities.PERSON) entities.PERSON.forEach(e => iocs.push({ type: 'Person', value: e }));
    if (entities.ORG) entities.ORG.forEach(e => iocs.push({ type: 'Organization', value: e }));

    return { tacticsInfo, mitigationList, yaraRule, iocs };
};

const ENTITY_ICONS = {
    EMAIL: <Mail size={12} />, IP_ADDRESS: <Network size={12} />, CRYPTO: <Lock size={12} />,
    PHONE: <Phone size={12} />, PGP_KEY: <Lock size={12} />, DARKWEB_TERMS: <Bug size={12} />,
    PERSON: <AlertCircle size={12} />, ORG: <Database size={12} />,
};

const ENTITY_COLORS = {
    EMAIL: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
    IP_ADDRESS: 'bg-orange-900/40 text-orange-300 border-orange-700/50',
    CRYPTO: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50',
    PHONE: 'bg-green-900/40 text-green-300 border-green-700/50',
    PGP_KEY: 'bg-purple-900/40 text-purple-300 border-purple-700/50',
    DARKWEB_TERMS: 'bg-red-900/40 text-red-300 border-red-700/50',
    PERSON: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    ORG: 'bg-zinc-800 text-zinc-300 border-zinc-700',
};

const ItemModal = ({ itemId, onClose }) => {
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('brief'); // 'brief', 'raw', 'extracted', 'yara'

    useEffect(() => {
        const fetchItem = async () => {
            try {
                const res = await api.get(`/items/${itemId}`);
                setItem(res.data);
            } catch (err) {
                console.error(err);
                setError('Failed to load item details.');
            } finally {
                setLoading(false);
            }
        };
        fetchItem();
    }, [itemId]);

    if (!itemId) return null;

    const brief = item ? generateThreatBrief(item) : null;
    const riskColor = item?.risk_score > 0.8 ? 'text-red-500' : item?.risk_score > 0.5 ? 'text-orange-400' : 'text-yellow-400';

    const tabs = [
        { id: 'brief', label: '🧠 AI Threat Brief', icon: <ShieldAlert size={14}/> },
        { id: 'yara', label: '⚙️ YARA Rule', icon: <Terminal size={14}/> },
        { id: 'extracted', label: '📄 Raw Text', icon: <FileJson size={14}/> },
        { id: 'raw', label: '🌐 Web Render', icon: <Globe size={14}/> },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-[#0d0d0f] border border-zinc-800 w-full max-w-6xl h-[92vh] rounded-2xl shadow-2xl shadow-red-950/20 flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800 bg-black/50 shrink-0">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Database className="text-red-500" size={18} />
                        <span className="text-zinc-400">DWITMS</span>
                        <span className="text-zinc-600 mx-1">/</span>
                        Dark Web Intel Viewer
                    </h2>
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex justify-center items-center text-zinc-500 animate-pulse">
                        <Cpu size={40} className="mr-3 opacity-40 animate-spin" /> Fetching Deep Scan Data...
                    </div>
                ) : error ? (
                    <div className="flex-1 flex justify-center items-center text-red-500 font-mono">{error}</div>
                ) : item ? (
                    <div className="flex flex-1 overflow-hidden">

                        {/* LEFT SIDEBAR */}
                        <div className="w-72 shrink-0 bg-black/40 border-r border-zinc-800 p-5 flex flex-col gap-5 overflow-y-auto">
                            {/* Title + URL */}
                            <div>
                                <h3 className="font-bold text-white text-base leading-snug mb-2">{item.title || 'Unknown Title'}</h3>
                                <a href={item.url} target="_blank" rel="noreferrer"
                                    className="text-xs text-red-400 hover:underline flex items-start gap-1 break-all">
                                    <Globe size={12} className="shrink-0 mt-0.5" /> {item.url}
                                </a>
                            </div>

                            {/* Risk Score */}
                            <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-zinc-400 text-xs flex items-center gap-1"><AlertCircle size={12}/> Risk Score</span>
                                    <span className={`text-2xl font-black font-mono ${riskColor}`}>{(item.risk_score * 100).toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-zinc-800 rounded-full h-1.5">
                                    <div className="h-1.5 rounded-full bg-gradient-to-r from-red-700 to-red-500 transition-all"
                                        style={{ width: `${item.risk_score * 100}%` }} />
                                </div>
                            </div>

                            {/* Metadata */}
                            <div>
                                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Metadata</h4>
                                <div className="space-y-2 text-xs">
                                    {[
                                        { label: 'Category', value: item.category },
                                        { label: 'Connection', value: item.conn_type || 'Tor' },
                                        { label: 'Crawl Depth', value: item.depth ?? 'N/A' },
                                        { label: 'Detected On', value: new Date(item.timestamp).toLocaleString() },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="flex justify-between gap-2">
                                            <span className="text-zinc-500">{label}</span>
                                            <span className="text-zinc-300 font-mono text-right">{value}</span>
                                        </div>
                                    ))}
                                    {item.csam_flag && (
                                        <div className="mt-2 p-2 bg-red-900/30 text-red-500 font-bold border border-red-500/40 rounded text-center text-[10px] uppercase tracking-widest">
                                            🚨 Illegal Material Detected
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* MITRE */}
                            {brief && (
                                <div>
                                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">MITRE ATT&CK</h4>
                                    <div className="space-y-1 text-xs">
                                        <div className="px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-300 font-mono">{brief.tacticsInfo.tactic}</div>
                                        <div className="px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-300 font-mono">{brief.tacticsInfo.technique}</div>
                                        <div className="px-2 py-1.5 bg-red-900/20 border border-red-900/40 rounded text-red-400 font-mono">{brief.tacticsInfo.actor}</div>
                                    </div>
                                </div>
                            )}

                            {/* Entities */}
                            <div>
                                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Extracted Indicators</h4>
                                {item.entities && Object.keys(item.entities).length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {Object.entries(item.entities).map(([type, values]) =>
                                            values.map((val, idx) => (
                                                <span key={`${type}-${idx}`}
                                                    className={`px-2 py-1 border rounded text-[10px] font-mono flex items-center gap-1 ${ENTITY_COLORS[type] || 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}>
                                                    {ENTITY_ICONS[type]}
                                                    <span className="font-bold opacity-70">{type}:</span> {val}
                                                </span>
                                            ))
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-zinc-600 text-xs italic">No structured entities extracted. See raw text.</div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT MAIN PANEL */}
                        <div className="flex flex-col flex-1 overflow-hidden">
                            {/* Tab Bar */}
                            <div className="flex border-b border-zinc-800 bg-black/30 shrink-0">
                                {tabs.map(tab => (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                        className={`px-5 py-3 text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 ${activeTab === tab.id
                                            ? 'text-red-400 border-red-500 bg-[#0d0d0f]'
                                            : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}>
                                        {tab.icon} {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">

                                {/* ---- AI BRIEF TAB ---- */}
                                {activeTab === 'brief' && brief && (
                                    <div className="space-y-6">
                                        {/* Threat Summary */}
                                        <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-5">
                                            <h3 className="text-red-400 font-bold text-sm mb-3 flex items-center gap-2"><ShieldAlert size={16}/> Threat Summary</h3>
                                            <p className="text-zinc-300 text-sm leading-relaxed">
                                                This intelligence record documents a <strong className="text-white">{item.category}</strong> threat originating from a Tor hidden service.
                                                The AI risk engine assigned a confidence score of <strong className={riskColor}>{(item.risk_score * 100).toFixed(0)}%</strong>, classifying this as a
                                                {item.risk_score > 0.8 ? <strong className="text-red-400"> CRITICAL</strong> : item.risk_score > 0.5 ? <strong className="text-orange-400"> HIGH</strong> : <strong className="text-yellow-400"> MEDIUM</strong>} priority threat.
                                            </p>
                                            {item.text && (
                                                <div className="mt-4 bg-black/50 border border-zinc-800 rounded-lg p-4 font-mono text-xs text-zinc-400 leading-relaxed">
                                                    <span className="text-zinc-600 text-[10px] uppercase tracking-widest block mb-1">Raw Intelligence Snippet</span>
                                                    {item.text.slice(0, 600)}{item.text.length > 600 ? '...' : ''}
                                                </div>
                                            )}
                                        </div>

                                        {/* IoCs Table */}
                                        {brief.iocs.length > 0 && (
                                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                                                <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2"><Network size={16} className="text-orange-400"/> Indicators of Compromise (IoC)</h3>
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="text-zinc-500 border-b border-zinc-800">
                                                            <th className="text-left py-2 pr-4 font-semibold uppercase tracking-wider">Type</th>
                                                            <th className="text-left py-2 font-semibold uppercase tracking-wider">Value</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {brief.iocs.map((ioc, i) => (
                                                            <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                                                                <td className="py-2 pr-4 text-orange-400 font-bold">{ioc.type}</td>
                                                                <td className="py-2 font-mono text-zinc-300 break-all">{ioc.value}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {/* Recommended Actions */}
                                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                                            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2"><Lock size={16} className="text-green-400"/> Recommended Mitigation Actions</h3>
                                            <ol className="space-y-2">
                                                {brief.mitigationList.map((action, i) => (
                                                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                                                        <span className="shrink-0 w-6 h-6 rounded-full bg-red-900/40 text-red-400 border border-red-900/50 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                                                        {action}
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>
                                    </div>
                                )}

                                {/* ---- YARA TAB ---- */}
                                {activeTab === 'yara' && brief && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-white font-bold flex items-center gap-2"><Terminal size={16} className="text-green-400"/> AI-Generated YARA Detection Rule</h3>
                                            <button onClick={() => navigator.clipboard.writeText(brief.yaraRule)}
                                                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-700 transition-colors">
                                                Copy Rule
                                            </button>
                                        </div>
                                        <pre className="bg-black border border-zinc-800 rounded-xl p-5 text-xs text-green-400 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">
                                            {brief.yaraRule}
                                        </pre>
                                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-400">
                                            💡 Deploy this rule to your EDR / SIEM platform to detect related malicious activity on your network endpoints.
                                        </div>
                                    </div>
                                )}

                                {/* ---- RAW TEXT TAB ---- */}
                                {activeTab === 'extracted' && (
                                    <div className="font-mono text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap bg-black/30 p-4 rounded-xl border border-zinc-800 min-h-full">
                                        {item.text || 'No extracted text available.'}
                                    </div>
                                )}

                                {/* ---- WEB RENDER TAB ---- */}
                                {activeTab === 'raw' && (
                                    item.raw_html ? (
                                        <div className="bg-white text-black p-4 rounded-xl min-h-full">
                                            <SafeHTML html={item.raw_html} />
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col justify-center items-center text-zinc-600 font-mono space-y-4">
                                            <AlertCircle size={48} className="opacity-30 text-amber-500" />
                                            <p className="text-sm">Raw HTML was not saved during crawl for this record.</p>
                                            <p className="text-xs text-zinc-700">Switch to the <strong>Raw Text</strong> tab to view extracted plaintext.</p>
                                        </div>
                                    )
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
