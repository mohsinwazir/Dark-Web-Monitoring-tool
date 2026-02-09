
import { useState, useEffect } from 'react';
import { Trash2, Shield, Search, User as UserIcon, MoreHorizontal, UserCheck, Ban } from 'lucide-react';
import { api } from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';

const UserTable = () => {
    const { isAdmin } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users/');
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;

        try {
            await api.delete(`/admin/users/${userId}`);
            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (err) {
            alert(err.response?.data?.detail || "Delete failed");
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await api.patch(`/admin/users/${userId}/role`, { role: newRole });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (err) {
            console.error("Role update failed", err);
        }
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (!isAdmin()) {
        return <div className="text-rose-500 p-4 border border-rose-900 bg-rose-950/20 rounded">Access Denied: Admin Privileges Required</div>;
    }

    return (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-700 backdrop-blur-sm overflow-hidden">
            {/* Header / Actions */}
            <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Shield className="text-blue-500" /> User Directory
                </h2>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search users..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase font-semibold">
                        <tr>
                            <th className="p-4">User</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Role</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-800">
                        {loading ? (
                            <tr><td colSpan="4" className="p-8 text-center text-slate-500">Loading users...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan="4" className="p-8 text-center text-slate-500">No users found.</td></tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30">
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-200">{user.username}</p>
                                                <p className="text-xs text-slate-500">{user.email || 'No Email'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded textxs font-medium ${user.is_active
                                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                            }`}>
                                            {user.is_active ? 'Active' : 'Banned'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:border-blue-500 outline-none cursor-pointer"
                                        >
                                            <option value="user">User</option>
                                            <option value="analyst">Analyst</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            title="Delete User"
                                            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserTable;
