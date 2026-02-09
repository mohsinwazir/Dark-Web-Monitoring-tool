import { useEffect, useRef } from 'react';
import { Network } from 'vis-network';

/**
 * EntityGraph Component - Deep Research
 * 
 * Goal: Visualize connections between .onion sites and entities.
 * Logic: Uses vis-network directly.
 */
const EntityGraph = () => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (containerRef.current) {
            // Logic: Hardcode sample data, but structure for API
            const nodes = [
                { id: 1, label: 'DarkMarket_01', color: '#ef4444', shape: 'dot', size: 30 }, // Red for Market
                { id: 2, label: 'Wallet_1A8z...', color: '#f59e0b', shape: 'diamond' }, // Orange for Bitcoin
                { id: 3, label: 'Vendor_Alice', color: '#3b82f6', shape: 'triangle' }, // Blue for Person
                { id: 4, label: 'Buyer_Bob', color: '#10b981' },
                { id: 5, label: 'Forum_Thread_X', color: '#6366f1' },
            ];

            const edges = [
                { from: 1, to: 2, label: 'payment_method', color: { color: '#64748b' } },
                { from: 1, to: 3, label: 'admin', color: { color: '#64748b' } },
                { from: 3, to: 2, label: 'owns', color: { dashed: true } },
                { from: 4, to: 1, label: 'posted_review' },
                { from: 5, to: 1, label: 'mentions' },
            ];

            const data = { nodes, edges };

            const options = {
                nodes: {
                    font: { color: '#cbd5e1', size: 14, face: 'monospace' },
                    borderWidth: 2,
                },
                edges: {
                    width: 2,
                    color: { color: '#475569' },
                    font: { color: '#94a3b8', size: 10, align: 'middle' },
                    smooth: { type: 'continuous' },
                },
                physics: {
                    stabilization: false,
                    barnesHut: {
                        gravitationalConstant: -3000,
                        springConstant: 0.04,
                        springLength: 95,
                    },
                },
                interaction: { hover: true },
                layout: { randomSeed: 2 },
            };

            // Initialize Network
            const network = new Network(containerRef.current, data, options);

            // Cleanup
            return () => {
                network.destroy();
            };
        }
    }, []);

    return (
        <div className="h-full flex flex-col animate-fadeIn">
            <div className="bg-slate-800/50 p-6 rounded-t-2xl border border-slate-700/50 border-b-0 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    🔗 Entity Link Analysis
                </h2>
                <p className="text-slate-400 text-sm">Visualizing relationships between crawled hidden services and crypto identities.</p>
            </div>
            <div
                ref={containerRef}
                className="flex-1 min-h-[600px] bg-slate-900 border border-slate-700 rounded-b-2xl shadow-inner relative overflow-hidden"
                style={{ background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)' }}
            />
        </div>
    );
};

export default EntityGraph;
