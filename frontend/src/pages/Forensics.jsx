import StegoLab from '../components/StegoLab';
import DefenseConsole from '../components/DefenseConsole';
import { Microscope } from 'lucide-react';

const Forensics = () => {
    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Microscope className="text-purple-400" /> Digital Forensics Lab
            </h1>

            <div className="grid grid-cols-1 gap-8">
                {/* Module 1: Steganography */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-xs font-bold border border-emerald-500/20">MODULE 01</span>
                        <h3 className="text-slate-300 font-semibold">Hidden Layer Detection</h3>
                    </div>
                    <StegoLab />
                </section>

                {/* Module 2: YARA */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-xs font-bold border border-blue-500/20">MODULE 02</span>
                        <h3 className="text-slate-300 font-semibold">Active Defense Generation</h3>
                    </div>
                    <DefenseConsole />
                </section>
            </div>
        </div>
    );
};

export default Forensics;
