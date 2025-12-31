import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, CornerDownRight, Trash2 } from 'lucide-react';
import api from '../api';

const CommentItem = ({ comment, replies, allComments, opinionId, onReplyPosted, onDelete }) => {
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [showReplies, setShowReplies] = useState(true);
    const { user } = useAuth();

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;

        try {
            const res = await api.post(`/opinions/${opinionId}/comments`, {
                content: replyContent,
                parentId: comment._id
            });
            onReplyPosted(res.data);
            setReplyContent('');
            setIsReplying(false);
            setShowReplies(true); // Auto-expand when replying
        } catch (err) {
            console.error(err);
            alert('Failed to post reply');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this comment?')) return;
        try {
            await api.delete(`/opinions/${opinionId}/comments/${comment._id}`);
            onDelete(comment._id);
        } catch (err) {
            alert('Failed to delete comment');
        }
    };

    // Calculate permissions
    const isOwner = user && comment.userId && user.userId === comment.userId._id;
    const isAdmin = user && (user.username === 'prem' || user.email === 'pprem1644@gmail.com');
    const canDelete = isOwner || isAdmin;

    // Find children for this comment from the global list to pass down recursively
    const getRepliesFor = (parentId) => {
        return allComments.filter(c => c.parentId === parentId);
    };

    const childReplies = replies || getRepliesFor(comment._id);

    return (
        <div className="flex gap-3 mb-4">
            <div className="flex-shrink-0 mt-1">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                    {comment.userId?.username?.[0]?.toUpperCase() || '?'}
                </div>
            </div>

            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900">@{comment.userId?.username || 'user'}</span>
                    <span className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed mb-2">{comment.content}</p>

                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mb-2">
                    {user && (
                        <button
                            onClick={() => setIsReplying(!isReplying)}
                            className="hover:text-slate-900 uppercase tracking-wide flex items-center gap-1"
                        >
                            Reply
                        </button>
                    )}
                    {canDelete && (
                        <button
                            onClick={handleDelete}
                            className="hover:text-red-600 flex items-center gap-1"
                        >
                            <Trash2 size={12} />
                        </button>
                    )}
                </div>

                {isReplying && (
                    <form onSubmit={handleReply} className="mb-4 flex gap-2">
                        <input
                            type="text"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder={`Reply to @${comment.userId?.username || 'user'}...`}
                            autoFocus
                            className="flex-1 bg-white border border-gray-300 p-2 text-sm focus:outline-none focus:border-black transition-colors rounded-sm"
                        />
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={() => setIsReplying(false)}
                                className="px-3 py-1.5 text-xs font-bold uppercase border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-3 py-1.5 text-xs font-bold uppercase bg-black text-white hover:bg-zinc-800 rounded-sm"
                            >
                                Reply
                            </button>
                        </div>
                    </form>
                )}

                {/* Recursive Replies */}
                {childReplies.length > 0 && (
                    <div className="mt-2">
                        {/* Optional: Add a toggle to hide/show replies if needed, similar to YouTube's "View X replies" */}
                        {/* For now, we list them all, or could add state to toggle visibility */}

                        <div className="flex flex-col gap-2">
                            {childReplies.map(reply => (
                                <CommentItem
                                    key={reply._id}
                                    comment={reply}
                                    allComments={allComments}
                                    opinionId={opinionId}
                                    onReplyPosted={onReplyPosted}
                                    onDelete={onDelete}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentItem;
