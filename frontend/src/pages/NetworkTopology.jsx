import { Globe } from 'lucide-react';
// Assuming EntityGraph/KnowledgeGraph component exists or we can mock it
// The user previously had EntityGraph.jsx open
import EntityGraph from '../components/EntityGraph';

const NetworkTopology = () => {
    return (
        <div className="h-full flex flex-col space-y-4">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Globe className="text-cyan-400" /> Network Topology
            </h1>
            <p className="text-slate-400 text-sm">Interactive visualization of threat actor relationships.</p>

            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden relative shadow-inner shadow-black/50">
                {/* 3D Graph Container */}
                <div className="absolute inset-0">
                    {/* 
                         We pass a default entity to search or load a general graph.
                         If EntityGraph needs props, we add them here.
                     */}
                    <EntityGraph initialEntity="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa" />
                </div>

                {/* Overlay Controls */}
                <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur border border-slate-700 p-2 rounded-lg text-xs space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span> Node (Entity)
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span> High Risk
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-8 h-[1px] bg-slate-400"></span> Edge (Relation)
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NetworkTopology;
