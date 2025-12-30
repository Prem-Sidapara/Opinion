import React, { useState, useEffect } from 'react';
import { Filter, TrendingUp, Clock, Plus, Zap } from 'lucide-react';
import api from '../api';
import OpinionCard from '../components/OpinionCard';
import CreateOpinionModal from '../components/CreateOpinionModal';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Feed = () => {
    const [opinions, setOpinions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTopic, setActiveTopic] = useState('all');
    const [topics, setTopics] = useState([]);
    const [sortBy, setSortBy] = useState('views');
    const [showModal, setShowModal] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    const fetchTopics = async () => {
        try {
            const res = await api.get('/topics');
            // Assuming res.data is array of objects { name: 'tech', ... }
            const fetchedTopics = res.data.map(t => t.name);
            const defaultTopics = ['lifestyle', 'tech', 'career', 'relationships', 'politics'];
            // Merge and Unique
            const uniqueTopics = [...new Set([...defaultTopics, ...fetchedTopics])];
            setTopics(['all', ...uniqueTopics]);
        } catch (err) {
            console.error('Failed to fetch topics', err);
            // Fallback
            setTopics(['all', 'lifestyle', 'tech', 'career', 'relationships', 'politics']);
        }
    };

    const fetchOpinions = async () => {
        setLoading(true);
        try {
            const params = { sort: sortBy };
            if (activeTopic !== 'all') params.topic = activeTopic;

            const res = await api.get('/opinions', { params });
            setOpinions(res.data);
        } catch (err) {
            console.error('Failed to fetch opinions', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTopics();
    }, []);

    useEffect(() => {
        fetchOpinions();
    }, [activeTopic, sortBy]);

    const handlePostClick = () => {
        if (!user) {
            if (confirm('You must be logged in to post an opinion. Go to Login?')) {
                navigate('/login');
            }
            return;
        }
        setShowModal(true);
    };

    const handleAddTopic = async () => {
        const newTopic = prompt('Enter new topic name:');
        if (!newTopic) return;
        try {
            await api.post('/topics', { name: newTopic });
            fetchTopics();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add topic');
        }
    };

    const handleDelete = (id) => {
        setOpinions(opinions.filter(o => o._id !== id));
    };

    const isAdmin = user && user.username === 'prem';

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="border-b border-white/20 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tighter mb-1">
                        Opinions.
                    </h1>
                    <p className="text-slate-400 font-medium">Unfiltered thoughts.</p>
                </div>
                <button
                    onClick={handlePostClick}
                    className="bg-white text-black px-6 py-3 font-bold hover:bg-slate-200 transition-colors shadow-lg"
                >
                    + Post Opinion
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-6 mb-8">
                {/* Topics */}
                <div className="flex flex-wrap gap-2 items-center">
                    {topics.map(topic => (
                        <button
                            key={topic}
                            onClick={() => setActiveTopic(topic)}
                            className={`px-4 py-2 text-xs font-bold uppercase transition-all ${activeTopic === topic
                                ? 'bg-red-600 text-white shadow-lg'
                                : 'bg-white text-black hover:bg-slate-200'
                                }`}
                        >
                            {topic}
                        </button>
                    ))}
                    {/* Add Topic Button */}
                    <button
                        onClick={handleAddTopic}
                        className="px-3 py-2 bg-zinc-800 text-white text-xs font-bold uppercase hover:bg-black"
                        title="Add Topic"
                    >
                        +
                    </button>
                </div>

                {/* Sort */}
                <div className="flex justify-between items-center border-t border-b border-white/10 py-3">
                    <span className="text-xs font-bold uppercase text-slate-400">
                        {opinions.length} ENTRIES
                    </span>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setSortBy('views')}
                            className={`uppercase text-xs font-bold flex items-center gap-1 ${sortBy === 'views' ? 'text-white underline decoration-red-600 decoration-2' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <TrendingUp size={14} />
                            Most Viewed
                        </button>
                        <button
                            onClick={() => setSortBy('latest')}
                            className={`uppercase text-xs font-bold flex items-center gap-1 ${sortBy === 'latest' ? 'text-white underline decoration-red-600 decoration-2' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Clock size={14} />
                            Latest
                        </button>
                    </div>
                </div>
            </div>
            {/* Feed */}
            <div className="space-y-6 min-h-[50vh]">
                {loading ? (
                    <div className="py-20 text-center font-bold animate-pulse text-white">
                        LOADING DATA...
                    </div>
                ) : opinions.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-gray-300 text-white/50">
                        <p className="text-xl font-bold mb-2">NO DATA</p>
                        <p className="text-sm">Be the first to post in {activeTopic.toUpperCase()}.</p>
                    </div>
                ) : (
                    opinions.map(op => (
                        <OpinionCard key={op._id} opinion={op} onDelete={handleDelete} />
                    ))
                )}
            </div>

            {showModal && (
                <CreateOpinionModal
                    onClose={() => setShowModal(false)}
                    onCreated={fetchOpinions}
                />
            )}
        </div>
    );
};

export default Feed;
