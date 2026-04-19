import { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';
import { api } from '../api/apiClient';

/**
 * EntityGraph Component - Deep Research
 * 
 * Goal: Visualize connections between .onion sites and entities.
 * Logic: Uses vis-network directly fetching from /entity-graph.
 */
const EntityGraph = () => {
    const containerRef = useRef(null);
    const networkRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchGraph = async () => {
            try {
                const res = await api.get('/entity-graph');
                const { nodes: rawNodes, edges: rawEdges } = res.data;

                // Map backend nodes to vis-network format
                const nodes = rawNodes.map(n => {
                    let groupStyle = {};
                    if (n.group === 'DOCUMENT') {
                        groupStyle = { color: '#10b981', shape: 'box', font: { color: '#000' } };
                    } else if (n.group === 'PERSON') {
                        groupStyle = { color: '#3b82f6', shape: 'dot', size: 25 };
                    } else if (n.group === 'ORG') {
                        groupStyle = { color: '#f59e0b', shape: 'triangle', size: 25 };
                    } else if (n.group === 'LOC') {
                        groupStyle = { color: '#8b5cf6', shape: 'diamond', size: 25 };
                    } else if (n.group === 'CRYPTO') {
                        groupStyle = { color: '#fcd34d', shape: 'hexagon', size: 30 };
                    }

                    return {
                        id: n.id,
                        label: n.name,
                        title: `Type: ${n.group}`,
                        ...groupStyle
                    };
                });

                // Map backend edges
                const edges = rawEdges.map(e => ({
                    from: e.source,
                    to: e.target,
                    label: e.label,
                    color: { color: '#475569' }
                }));

                const data = { nodes, edges };

                const options = {
                    nodes: {
                        font: { color: '#cbd5e1', size: 14, face: 'monospace' },
                        borderWidth: 2,
                    },
                    edges: {
                        width: 1,
                        font: { color: '#94a3b8', size: 10, align: 'middle' },
                        smooth: { type: 'continuous' },
                    },
                    physics: {
                        stabilization: false,
                        barnesHut: {
                            gravitationalConstant: -2000,
                            springConstant: 0.04,
                            springLength: 150,
                        },
                    },
                    interaction: { hover: true, tooltipDelay: 100 },
                    layout: { randomSeed: 2 },
                };

                if (containerRef.current) {
                    if (networkRef.current) {
                        networkRef.current.destroy();
                    }
                    networkRef.current = new Network(containerRef.current, data, options);
                }
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to load graph data.');
                setLoading(false);
            }
        };

        fetchGraph();

        return () => {
            if (networkRef.current) {
                networkRef.current.destroy();
            }
        };
    }, []);

    return (
        <div className="h-full flex flex-col animate-fadeIn">
            <div className="bg-zinc-800/50 p-6 rounded-t-2xl border border-zinc-700/50 border-b-0 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    🔗 Entity Link Analysis
                </h2>
                <p className="text-zinc-400 text-sm">Visualizing relationships between crawled hidden services and crypto identities.</p>
            </div>
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10 text-green-400 font-mono animate-pulse">
                    LOADING GRAPH LINKS...
                </div>
            )}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10 text-red-400 font-mono">
                    {error}
                </div>
            )}
            <div
                ref={containerRef}
                className="flex-1 min-h-[600px] bg-zinc-900 border border-zinc-700 rounded-b-2xl shadow-inner relative overflow-hidden"
                style={{ background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)' }}
            />
        </div>
    );
};

export default EntityGraph;
