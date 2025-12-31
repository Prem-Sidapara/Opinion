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

    // Pagination state
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const { user } = useAuth();
    const navigate = useNavigate();

    // Reset pagination when filter/sort changes
    useEffect(() => {
        setOpinions([]);
        setPage(1);
        setHasMore(true);
    }, [activeTopic, sortBy]);

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

    const fetchOpinions = async (pageNum = 1) => {
        if (pageNum === 1) setLoading(true);
        else setIsFetchingMore(true);

        try {
            const params = { sort: sortBy, page: pageNum, limit: 12 }; // Fetch 12 at a time
            if (activeTopic !== 'all') params.topic = activeTopic;

            const res = await api.get('/opinions', { params });

            if (res.data.length === 0) {
                setHasMore(false);
            } else {
                setOpinions(prev => pageNum === 1 ? res.data : [...prev, ...res.data]);
                // If we got fewer items than limit, no more pages
                if (res.data.length < 12) setHasMore(false);
            }
        } catch (err) {
            console.error('Failed to fetch opinions', err);
        } finally {
            setLoading(false);
            setIsFetchingMore(false);
        }
    };

    useEffect(() => {
        fetchTopics();
    }, []);

    useEffect(() => {
        fetchOpinions(page);
    }, [page, activeTopic, sortBy]);

    // Scroll listener for infinite scroll
    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + document.documentElement.scrollTop + 100 >= document.documentElement.offsetHeight &&
                hasMore &&
                !loading &&
                !isFetchingMore
            ) {
                setPage(prev => prev + 1);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [hasMore, loading, isFetchingMore]);

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
        <div className="max-w-[1600px] mx-auto px-4 py-6 md:py-10">
            {/* Header */}
            <div className="border-b border-white/20 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tighter mb-2">
                        Opinions.
                    </h1>
                    <p className="text-slate-300 font-medium text-lg">Unfiltered thoughts, curated for you.</p>
                </div>
                <button
                    onClick={handlePostClick}
                    className="bg-white text-black px-6 py-3 font-bold hover:bg-slate-200 transition-colors shadow-lg rounded-full"
                >
                    + Ask/Post Opinion
                </button>
            </div>


            {/* Controls */}
            <div className="flex flex-col gap-6 mb-10 sticky top-4 z-10 transition-all duration-300">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    {/* Topics */}
                    <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start">
                        {topics.map(topic => (
                            <button
                                key={topic}
                                onClick={() => setActiveTopic(topic)}
                                className={`px-4 py-2 text-xs font-bold uppercase transition-all rounded-full ${activeTopic === topic
                                    ? 'bg-red-600 text-white shadow-md transform scale-105'
                                    : 'bg-black/20 text-white hover:bg-white/20 backdrop-blur-sm'
                                    }`}
                            >
                                {topic}
                            </button>
                        ))}
                        {/* Add Topic Button */}
                        <button
                            onClick={handleAddTopic}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white text-xs font-bold uppercase hover:bg-white/20"
                            title="Add Topic"
                        >
                            +
                        </button>
                    </div>

                    {/* Sort */}
                    <div className="flex gap-6 items-center">
                        <button
                            onClick={() => setSortBy('views')}
                            className={`uppercase text-xs font-bold flex items-center gap-1.5 transition-colors ${sortBy === 'views' ? 'text-white' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <TrendingUp size={16} className={sortBy === 'views' ? 'text-red-500' : ''} />
                            Most Viewed
                        </button>
                        <button
                            onClick={() => setSortBy('latest')}
                            className={`uppercase text-xs font-bold flex items-center gap-1.5 transition-colors ${sortBy === 'latest' ? 'text-white' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Clock size={16} className={sortBy === 'latest' ? 'text-red-500' : ''} />
                            Latest
                        </button>
                    </div>
                </div>
            </div>

            {/* Feed */}
            <div className="min-h-[50vh]">
                {loading ? (
                    <div className="py-20 text-center font-bold animate-pulse text-white text-xl tracking-widest">
                        LOADING FEED...
                    </div>
                ) : opinions.length === 0 ? (
                    <div className="py-32 text-center border-2 border-dashed border-white/20 rounded-3xl text-white/50">
                        <p className="text-2xl font-bold mb-2">NO DATA</p>
                        <p className="text-base">Be the first to post in {activeTopic.toUpperCase()}.</p>
                    </div>
                ) : (
                    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                        {opinions.map(op => (
                            <OpinionCard key={op._id} opinion={op} onDelete={handleDelete} />
                        ))}
                    </div>
                )}

                {isFetchingMore && (
                    <div className="text-center py-8">
                        <div className="inline-block w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {showModal && (
                <CreateOpinionModal
                    onClose={() => setShowModal(false)}
                    onCreated={() => {
                        setPage(1);
                        fetchOpinions(1);
                    }}
                />
            )}
        </div>
    );
};

export default Feed;
