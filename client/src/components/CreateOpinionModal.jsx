import React, { useState } from 'react';
import { X, Mic } from 'lucide-react';
import api from '../api';



const CreateOpinionModal = ({ onClose, onCreated }) => {
    const [content, setContent] = useState('');
    const [topic, setTopic] = useState('');
    const [availableTopics, setAvailableTopics] = useState([]);
    const [isCustomTopic, setIsCustomTopic] = useState(false);
    const [customTopic, setCustomTopic] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    React.useEffect(() => {
        const fetchTopics = async () => {
            try {
                const res = await api.get('/topics');
                const fetchedTopics = res.data; // Array of objects { _id, name, ... }

                const defaultTopics = ['lifestyle', 'tech', 'career', 'relationships', 'politics'];

                // We need to merge them. Users might have created duplicate names if DB was empty?
                // Let's rely on names.
                const fetchedNames = fetchedTopics.map(t => t.name);
                const allNames = [...new Set([...defaultTopics, ...fetchedNames])];

                // Convert back to objects for the UI (UI uses .name)
                // We map strings to objects. Since we only need name for now.
                const combinedTopics = allNames.map(name => {
                    const existing = fetchedTopics.find(t => t.name === name);
                    return existing || { _id: name, name: name }; // Use name as ID if virtual
                });

                setAvailableTopics(combinedTopics);
                if (combinedTopics.length > 0) setTopic(combinedTopics[0].name);
            } catch (err) {
                console.error('Failed to fetch topics', err);
                // Fallback if API fails completely
                const defaultTopics = ['lifestyle', 'tech', 'career', 'relationships', 'politics'];
                setAvailableTopics(defaultTopics.map(name => ({ _id: name, name })));
                setTopic('lifestyle');
            }
        };
        fetchTopics();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const finalTopic = isCustomTopic ? customTopic : topic;

        if (!finalTopic.trim()) {
            setError('Please select or enter a topic');
            setLoading(false);
            return;
        }

        try {
            await api.post('/opinions', { content, topic: finalTopic });
            onCreated();
            onClose();
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Failed to post. Is the server running?');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden scale-100 transform transition-all">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Speak Up</h2>
                        <p className="text-sm text-slate-500 font-medium">Anonymous & Unfiltered</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-black hover:bg-gray-100 transition-all shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl text-sm font-semibold flex items-center gap-2">
                            <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                            {error}
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                            {isCustomTopic ? 'Enter New Topic' : 'Select Topic'}
                        </label>

                        {!isCustomTopic ? (
                            <div className="flex flex-wrap gap-2">
                                {availableTopics.map(t => (
                                    <button
                                        type="button"
                                        key={t._id}
                                        onClick={() => setTopic(t.name)}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border ${topic === t.name
                                            ? 'bg-black text-white border-black shadow-lg scale-105'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        {t.name.charAt(0).toUpperCase() + t.name.slice(1)}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => { setIsCustomTopic(true); setCustomTopic(''); }}
                                    className="px-4 py-2 rounded-xl text-sm font-bold border border-dashed border-slate-300 text-slate-400 hover:border-black hover:text-black transition-all bg-slate-50 hover:bg-white"
                                >
                                    + Add New
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={customTopic}
                                    onChange={(e) => setCustomTopic(e.target.value)}
                                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none font-medium"
                                    placeholder="e.g., Gaming, Crypto, Food..."
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsCustomTopic(false)}
                                    className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                            Your Opinion <span className={content.length > 450 ? "text-rose-500" : "text-slate-300"}>{content.length}/500</span>
                        </label>
                        <div className="relative">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                maxLength={500}
                                rows={5}
                                className="w-full text-lg p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-black/10 focus:ring-0 outline-none resize-none transition-colors placeholder:text-slate-300 font-medium text-slate-800"
                                placeholder="What's heavily on your mind?"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !content.trim()}
                            className="px-8 py-3 bg-black text-white rounded-xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg shadow-black/20 hover:shadow-xl hover:-translate-y-0.5 transition-all w-full md:w-auto"
                        >
                            {loading ? 'Posting...' : 'Post it'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateOpinionModal;
