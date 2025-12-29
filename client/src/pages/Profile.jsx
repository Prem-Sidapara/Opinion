import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import OpinionCard from '../components/OpinionCard';
import { LogOut, User, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const { user, logout } = useAuth();
    const [opinions, setOpinions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMyOpinions = async () => {
            try {
                const res = await api.get('/opinions/mine');
                setOpinions(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMyOpinions();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            {/* Profile Header */}
            <div className="glass p-8 rounded-3xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-slate-800 to-black text-white flex items-center justify-center shadow-xl">
                        <span className="text-3xl font-black uppercase">{user?.username?.[0] || 'U'}</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 mb-1">{user?.username}</h1>
                        <p className="text-slate-500 font-medium">{user?.email}</p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="px-6 py-2.5 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-colors flex items-center gap-2"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>

            <div className="flex items-center gap-2 mb-6 px-2">
                <LayoutGrid size={20} className="text-slate-400" />
                <h2 className="text-lg font-bold text-slate-700 uppercase tracking-widest">My Opinions</h2>
            </div>

            <div className="space-y-4 min-h-[50vh]">
                {loading ? (
                    <div className="text-center py-12 text-slate-400 font-medium">Loading your thoughts...</div>
                ) : opinions.length === 0 ? (
                    <div className="text-center py-20 bg-white/50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-lg font-bold text-slate-600 mb-1">You haven't posted anything yet.</p>
                        <p className="text-slate-400">Your voice matters. Start sharing!</p>
                    </div>
                ) : (
                    opinions.map(op => (
                        <OpinionCard key={op._id} opinion={op} />
                    ))
                )}
            </div>
        </div>
    );
};

export default Profile;
