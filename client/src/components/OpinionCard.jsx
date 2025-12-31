import React, { useState, useEffect, useRef } from 'react';
import { Eye, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const OpinionCard = ({ opinion, onDelete }) => {
    const [votes, setVotes] = useState({ helpful: opinion.helpful, notHelpful: opinion.notHelpful });
    const [userVote, setUserVote] = useState(opinion.userVote || null);
    const [commentCount, setCommentCount] = useState(opinion.commentsCount || 0);
    const [loading, setLoading] = useState(false);
    const [viewed, setViewed] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);

    const cardRef = useRef(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        setVotes({ helpful: opinion.helpful, notHelpful: opinion.notHelpful });
        setUserVote(opinion.userVote || null);
    }, [opinion]);

    useEffect(() => {
        const viewKey = `viewed_${opinion._id}`;
        const hasViewed = sessionStorage.getItem(viewKey);

        if (!viewed && !hasViewed) {
            const timer = setTimeout(() => {
                api.patch(`/opinions/${opinion._id}/view`).catch(err => console.error(err));
                setViewed(true);
                sessionStorage.setItem(viewKey, 'true');
            }, 4000);
            return () => clearTimeout(timer);
        } else if (hasViewed) {
            setViewed(true);
        }
    }, [opinion._id, viewed]);

    const handleVote = async (type) => {
        if (!user) {
            if (confirm('LOGIN REQUIRED TO VOTE. PROCEED?')) {
                navigate('/login');
            }
            return;
        }

        if (loading) return;
        const previousVotes = { ...votes };
        const previousUserVote = userVote;
        let newVotes = { ...votes };
        let newUserVote = null;

        if (type === 'helpful') {
            if (userVote === 'helpful') {
                newVotes.helpful--;
                newUserVote = null;
            } else if (userVote === 'notHelpful') {
                newVotes.notHelpful--;
                newVotes.helpful++;
                newUserVote = 'helpful';
            } else {
                newVotes.helpful++;
                newUserVote = 'helpful';
            }
        } else {
            if (userVote === 'notHelpful') {
                newVotes.notHelpful--;
                newUserVote = null;
            } else if (userVote === 'helpful') {
                newVotes.helpful--;
                newVotes.notHelpful++;
                newUserVote = 'notHelpful';
            } else {
                newVotes.notHelpful++;
                newUserVote = 'notHelpful';
            }
        }

        setVotes(newVotes);
        setUserVote(newUserVote);
        setLoading(true);

        try {
            const res = await api.patch(`/opinions/${opinion._id}/vote`, { type });
            setVotes({ helpful: res.data.helpful, notHelpful: res.data.notHelpful });
            setUserVote(res.data.userVote);
        } catch (err) {
            setVotes(previousVotes);
            setUserVote(previousUserVote);
        } finally {
            setLoading(false);
        }
    };

    const toggleComments = async () => {
        if (!showComments) {
            setLoadingComments(true);
            try {
                const res = await api.get(`/opinions/${opinion._id}/comments`);
                setComments(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingComments(false);
            }
        }
        setShowComments(!showComments);
    };

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        if (!user) return navigate('/login');

        try {
            const res = await api.post(`/opinions/${opinion._id}/comments`, { content: newComment });
            setComments([...comments, res.data]);
            setCommentCount(prev => prev + 1);
            setNewComment('');
        } catch (err) {
            console.error(err);
            alert('Failed to post comment');
        }
    };

    const handleDeleteOpinion = async () => {
        if (!confirm('Are you sure you want to delete this opinion?')) return;
        try {
            await api.delete(`/opinions/${opinion._id}`);
            if (onDelete) onDelete(opinion._id);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete');
        }
    };

    // Calculate permissions
    const isOwner = user && opinion.userId && (user._id === opinion.userId._id || user.userId === opinion.userId._id); // handle possible populate variations
    const isAdmin = user && user.username === 'prem';
    const canDelete = isOwner || isAdmin;

    return (
        <div ref={cardRef} className="glass-card p-4 md:p-6 mb-6 relative">
            <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-3">
                <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-widest ${opinion.topic === 'lifestyle' ? 'bg-emerald-100 text-emerald-800' :
                    opinion.topic === 'tech' ? 'bg-indigo-100 text-indigo-800' :
                        opinion.topic === 'career' ? 'bg-amber-100 text-amber-800' :
                            opinion.topic === 'relationships' ? 'bg-rose-100 text-rose-800' :
                                'bg-slate-100 text-slate-800'
                    }`}>
                    {opinion.topic}
                </span>

                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                    <Eye size={14} />
                    <span>{opinion.views + (viewed && !sessionStorage.getItem(`viewed_${opinion._id}_server_sync`) ? 1 : 0)}</span>
                    {canDelete && (
                        <button onClick={handleDeleteOpinion} className="ml-2 text-red-500 hover:text-red-700 uppercase">
                            [Delete]
                        </button>
                    )}
                </div>
            </div>

            <p className="text-slate-800 text-base md:text-lg leading-7 font-medium mb-6">
                {opinion.content}
            </p>

            <div className="flex items-center gap-3 pt-2">
                <button
                    onClick={() => handleVote('helpful')}
                    disabled={loading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase transition-all rounded-md shadow-sm border ${userVote === 'helpful'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                >
                    <ThumbsUp size={12} />
                    <span>Helpful {votes.helpful > 0 && `(${votes.helpful})`}</span>
                </button>

                <button
                    onClick={() => handleVote('notHelpful')}
                    disabled={loading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase transition-all rounded-md shadow-sm border ${userVote === 'notHelpful'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                >
                    <ThumbsDown size={12} />
                    <span>No {votes.notHelpful > 0 && `(${votes.notHelpful})`}</span>
                </button>

                <button
                    onClick={toggleComments}
                    className="px-3 py-1.5 text-xs font-bold uppercase bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 text-slate-500 flex items-center gap-1.5 transition-all"
                    title="Comments"
                >
                    <MessageSquare size={12} />
                    {showComments ? 'Hide' : (commentCount > 0 ? commentCount : '')}
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                    {loadingComments ? (
                        <p className="text-xs text-gray-400">Loading...</p>
                    ) : (
                        <div className="space-y-3 mb-4">
                            {comments.length === 0 && <p className="text-xs text-gray-400 italic">No comments yet.</p>}
                            {comments.map(c => (
                                <div key={c._id} className="bg-slate-50 p-3 text-sm">
                                    <span className="font-bold text-black mr-2">@{c.userId?.username || 'user'}:</span>
                                    <span className="text-slate-700">{c.content}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {user && (
                        <form onSubmit={handlePostComment} className="flex gap-2">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                className="flex-1 bg-white border border-gray-300 p-2 text-sm focus:outline-none focus:border-black transition-colors"
                            />
                            <button type="submit" className="bg-black text-white px-4 py-2 text-xs font-bold uppercase hover:bg-zinc-800">
                                Post
                            </button>
                        </form>
                    )}
                </div>
            )}

            <div className="mt-4 text-right md:absolute md:bottom-6 md:right-6 md:mt-0 text-xs font-mono text-slate-400 italic">
                posted by @{opinion.userId?.username || 'user'}
            </div>
        </div>
    );
};

export default OpinionCard;
