import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Eye, ThumbsUp, ThumbsDown, MessageSquare, EyeOff } from 'lucide-react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import CommentSection from './CommentSection';

const OpinionCard = ({ opinion, onDelete }) => {
    const [votes, setVotes] = useState({ helpful: opinion.helpful, notHelpful: opinion.notHelpful });
    const [userVote, setUserVote] = useState(opinion.userVote || null);
    const [commentCount, setCommentCount] = useState(opinion.commentsCount || 0);
    const [loading, setLoading] = useState(false);
    const [viewed, setViewed] = useState(false);
    const [showComments, setShowComments] = useState(false);

    const cardRef = useRef(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    // Generate stable random traits for this card based on its ID
    const randomTraits = useMemo(() => {
        // Simple hash function to get a seed from the ID
        const seed = opinion._id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        // Pseudo-random generator based on seed
        const random = (max) => Math.floor((Math.sin(seed + 1) * 10000 % 1 + 1) * max) % max; // Ensure positive

        const heights = ['min-h-[120px]', 'min-h-[140px]', 'min-h-[160px]', 'min-h-[180px]'];
        const fonts = ['text-base md:text-lg', 'text-lg md:text-xl', 'text-sm md:text-base'];
        const fontWeights = ['font-medium', 'font-normal', 'font-semibold'];

        // Random pastel colors (Tailwind classes)
        const colors = [
            'bg-red-50 border-red-100', 'bg-orange-50 border-orange-100', 'bg-amber-50 border-amber-100',
            'bg-yellow-50 border-yellow-100', 'bg-lime-50 border-lime-100', 'bg-green-50 border-green-100',
            'bg-emerald-50 border-emerald-100', 'bg-teal-50 border-teal-100', 'bg-cyan-50 border-cyan-100',
            'bg-sky-50 border-sky-100', 'bg-blue-50 border-blue-100', 'bg-indigo-50 border-indigo-100',
            'bg-violet-50 border-violet-100', 'bg-purple-50 border-purple-100', 'bg-fuchsia-50 border-fuchsia-100',
            'bg-pink-50 border-pink-100', 'bg-rose-50 border-rose-100', 'bg-slate-50 border-slate-100'
        ];

        // Determine layout based on content length + randomness
        const isLongText = opinion.content.length > 200;

        return {
            minHeight: isLongText ? 'min-h-[200px]' : heights[random(heights.length)],
            fontSize: fonts[random(fonts.length)],
            fontWeight: fontWeights[random(fontWeights.length)],
            color: colors[random(colors.length)],
            // Randomly justify content to add more variance (start, or sometimes center for short bold texts)
            justify: !isLongText && random(10) > 7 ? 'justify-center text-center' : 'justify-between text-left'
        };
    }, [opinion._id, opinion.content.length]);

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
        setShowComments(!showComments);
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
    const isAdmin = user && (user.username === 'prem' || user.email === 'pprem1644@gmail.com');
    const canDelete = isOwner || isAdmin;



    return (
        <div
            ref={cardRef}
            className={`p-6 mb-6 relative break-inside-avoid hover:scale-[1.01] hover:shadow-2xl transition-all duration-300 ease-out border shadow-lg rounded-2xl flex flex-col ${randomTraits.justify} ${randomTraits.minHeight} ${randomTraits.color}`}
        >
            <div className={`flex justify-between items-start mb-4 border-b border-black/5 pb-3 ${randomTraits.justify.includes('center') ? 'w-full' : ''}`}>
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

            <p className={`text-slate-800 leading-relaxed mb-6 ${randomTraits.fontSize} ${randomTraits.fontWeight} ${randomTraits.justify.includes('center') ? 'italic' : ''}`}>
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
                <CommentSection opinionId={opinion._id} />
            )}

            <div className="mt-4 text-right md:absolute md:bottom-6 md:right-6 md:mt-0 text-xs font-mono text-slate-400 italic">
                {opinion.isAnonymous
                    ? 'posted by @anonymous'
                    : `posted by @${opinion.userId?.username || 'user'}`}
            </div>
        </div>
    );
};

export default OpinionCard;
