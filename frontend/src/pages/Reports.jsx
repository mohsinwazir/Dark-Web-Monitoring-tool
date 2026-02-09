
import { FileText, Download } from 'lucide-react';

const Reports = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <FileText className="text-blue-400" /> Intelligence Reports
            </h1>

            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
                <table className="w-full text-left text-slate-300">
                    <thead className="border-b border-slate-700 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="py-3">Report Name</th>
                            <th className="py-3">Date</th>
                            <th className="py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-slate-800/50">
                            <td className="py-4">Daily_Threat_Summary.pdf</td>
                            <td className="py-4">2026-01-27</td>
                            <td className="py-4 text-right">
                                <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 ml-auto">
                                    <Download size={14} /> Download PDF
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Reports;
