
import { useState, useEffect } from 'react';
import { FileText, Download, PlusCircle, Trash2 } from 'lucide-react';
import { api } from '../api/apiClient';

const Reports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await api.get('/reports');
            setReports(res.data.reports || []);
        } catch (err) {
            console.error("Failed to fetch reports:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (reportId) => {
        try {
            // Streaming download
            const response = await api.get(`/reports/${reportId}/pdf`, {
                responseType: 'blob'
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `threat_report_${reportId.substring(0, 8)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Download failed:", err);
            alert("Failed to download PDF");
        }
    };

    const handleCreateDummy = async () => {
        try {
            await api.post('/generate-report');
            fetchReports(); // Refresh list
        } catch (err) {
            console.error("Report generation failed:", err);
            alert("Failed to create report");
        }
    };

    const handleDelete = async (reportId) => {
        if (!window.confirm("Are you sure you want to delete this report?")) return;

        try {
            await api.delete(`/reports/${reportId}`);
            fetchReports(); // Refresh list
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Failed to delete report");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                    <FileText className="text-red-400" /> Intelligence Reports
                </h1>
                <button
                    onClick={handleCreateDummy}
                    className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-lg shadow-red-900/20 transition-all"
                >
                    <PlusCircle size={16} /> Generate Demo Report
                </button>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-700 rounded-xl p-6">
                {loading ? (
                    <div className="text-zinc-400 text-center py-8">Loading reports...</div>
                ) : reports.length === 0 ? (
                    <div className="text-zinc-400 text-center py-8">No reports generated yet.</div>
                ) : (
                    <table className="w-full text-left text-zinc-300">
                        <thead className="border-b border-zinc-700 text-zinc-500 uppercase text-xs">
                            <tr>
                                <th className="py-3">Report Date</th>
                                <th className="py-3">Findings</th>
                                <th className="py-3">Summary Preview</th>
                                <th className="py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((report) => (
                                <tr key={report.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                    <td className="py-4 font-medium text-zinc-200">
                                        {new Date(report.timestamp).toLocaleDateString()} <span className="text-zinc-500 text-xs ml-1">{new Date(report.timestamp).toLocaleTimeString()}</span>
                                    </td>
                                    <td className="py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-900/50">
                                            {report.findings_count} Risks
                                        </span>
                                    </td>
                                    <td className="py-4 text-sm text-zinc-400 max-w-xs truncate">
                                        {report.summary}
                                    </td>
                                    <td className="py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleDownload(report.id)}
                                                className="bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-2 transition-all"
                                                title="Download PDF"
                                            >
                                                <Download size={14} /> PDF
                                            </button>
                                            <button
                                                onClick={() => handleDelete(report.id)}
                                                className="bg-zinc-800 hover:bg-red-900/30 text-zinc-400 hover:text-red-400 border border-zinc-700 hover:border-red-900/50 p-1.5 rounded-lg transition-all"
                                                title="Delete Report"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
export default Reports;
