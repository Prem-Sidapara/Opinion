import React, { useState, useEffect } from 'react';
import api from '../api';
import CommentItem from './CommentItem';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const CommentSection = ({ opinionId, onUnmount }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const res = await api.get(`/opinions/${opinionId}/comments`);
                setComments(res.data);
            } catch (err) {
                console.error('Failed to load comments', err);
            } finally {
                setLoading(false);
            }
        };

        fetchComments();
    }, [opinionId]);

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        if (!user) return navigate('/login');

        try {
            const res = await api.post(`/opinions/${opinionId}/comments`, { content: newComment });
            setComments([...comments, res.data]);
            setNewComment('');
        } catch (err) {
            console.error(err);
            alert('Failed to post comment');
        }
    };

    const handleReplyPosted = (newReply) => {
        setComments(prev => [...prev, newReply]);
    };

    const handleDelete = (commentId) => {
        setComments(prev => prev.filter(c => c._id !== commentId));
    };

    // Filter only top-level comments (those without a parentId)
    const rootComments = comments.filter(c => !c.parentId);

    return (
        <div className="mt-6 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-bold uppercase text-slate-400 mb-4">
                {comments.length} Comments
            </h3>

            {user && (
                <form onSubmit={handlePostComment} className="flex gap-2 mb-6">
                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {user.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="bg-transparent border-b border-gray-300 p-2 text-sm focus:outline-none focus:border-black transition-colors w-full"
                        />
                        {newComment.trim() && (
                            <div className="flex justify-end">
                                <button type="submit" className="bg-black text-white px-4 py-1.5 text-xs font-bold uppercase rounded-full hover:bg-zinc-800">
                                    Comment
                                </button>
                            </div>
                        )}
                    </div>
                </form>
            )}

            {loading ? (
                <div className="text-center py-4">
                    <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full text-slate-400 mx-auto"></div>
                </div>
            ) : (
                <div className="space-y-4">
                    {rootComments.length === 0 && (
                        <p className="text-sm text-gray-400 italic text-center py-4">No comments yet. Be the first to share your thoughts!</p>
                    )}
                    {rootComments.map(comment => (
                        <CommentItem
                            key={comment._id}
                            comment={comment}
                            allComments={comments} // Pass all comments so children can find their replies
                            opinionId={opinionId}
                            onReplyPosted={handleReplyPosted}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CommentSection;
