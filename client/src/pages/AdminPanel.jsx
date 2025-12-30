import React, { useState, useEffect } from 'react';
import api from '../api';
import { Trash2, User, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    // Redirect if not admin (client-side backup)
    useEffect(() => {
        if (user && user.username !== 'prem') {
            navigate('/');
        }
    }, [user, navigate]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/auth/users');
            setUsers(res.data);
        } catch (err) {
            alert('Failed to fetch users: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (userId, username) => {
        if (!confirm(`Are you sure you want to PERMANENTLY delete user "@${username}"? This cannot be undone.`)) {
            return;
        }

        try {
            await api.delete(`/auth/users/${userId}`);
            setUsers(users.filter(u => u._id !== userId));
        } catch (err) {
            alert('Failed to delete user: ' + (err.response?.data?.message || err.message));
        }
    };

    if (loading) return <div className="p-8 text-center text-white font-bold">LOADING ADMIN PANEL...</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/20">
                <ShieldAlert className="text-red-500" size={32} />
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
                    Admin Control
                </h1>
            </div>

            <div className="glass rounded-xl overflow-hidden p-6">
                <h2 className="text-lg font-bold text-white mb-4 uppercase tracking-wider opacity-70">
                    Registered Users ({users.length})
                </h2>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-xs font-bold uppercase text-slate-400 tracking-wider">
                                <th className="p-3">Username</th>
                                <th className="p-3">Email</th>
                                <th className="p-3">Joined</th>
                                <th className="p-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-medium text-slate-200">
                            {users.map((u) => (
                                <tr key={u._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                                                {u.username[0].toUpperCase()}
                                            </div>
                                            <span className={u.username === 'prem' ? 'text-red-400 font-bold' : ''}>
                                                @{u.username}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3 font-mono text-slate-400 text-xs">{u.email}</td>
                                    <td className="p-3 text-slate-500 text-xs">
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-3 text-right">
                                        {u.username !== 'prem' && (
                                            <button
                                                onClick={() => handleDelete(u._id, u.username)}
                                                className="text-slate-500 hover:text-red-500 transition-colors p-2"
                                                title="Delete User"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
