import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const PostDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [post, setPost]                   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [commentText, setCommentText]     = useState('');
  const [deletingComment, setDeletingComment] = useState('');
  const [deleting, setDeleting]           = useState(false);

  useEffect(() => {
    api.get(`/posts/${id}`)
      .then(res => setPost(res.data))
      .catch(() => setError('Post not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDeletePost = async () => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.delete(`/posts/${id}`);
      navigate('/social');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
      setDeleting(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await api.post(`/posts/${id}/comment`, { text: commentText });
      setPost(p => ({ ...p, comments: res.data }));
      setCommentText('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    setDeletingComment(commentId);
    try {
      const res = await api.delete(`/posts/${id}/comments/${commentId}`);
      setPost(p => ({ ...p, comments: res.data }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete comment');
    } finally {
      setDeletingComment('');
    }
  };

  const isCommentOwner = (c) => {
    const myId = user?._id?.toString();
    const commentOwner = (c.user?._id || c.user)?.toString();
    const postOwner    = (post?.user?._id || post?.user)?.toString();
    return myId === commentOwner || myId === postOwner;
  };

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;
  if (error || !post) return (
    <div className="container" style={{ maxWidth: 680, paddingTop: 40 }}>
      <div className="alert alert-danger">⚠️ {error || 'Post not found'}</div>
      <Link to="/social" className="btn btn-primary">← {t('social')}</Link>
    </div>
  );

  const isMine = (post.user?._id || post.user)?.toString() === user?._id?.toString();

  return (
    <div className="container" style={{ maxWidth: 680, paddingTop: 24 }}>
      <Link to="/social" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        ← {t('social')}
      </Link>

      <div className="post-card">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="avatar">{post.user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <div style={{ fontWeight: 600 }}>{post.user?.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(post.createdAt).toLocaleString()}</div>
            </div>
          </div>
          {isMine && (
            <button className="btn btn-danger btn-sm" onClick={handleDeletePost} disabled={deleting}>
              {deleting ? <span className="spinner" style={{ width: 14, height: 14 }}></span> : '🗑 Delete Post'}
            </button>
          )}
        </div>

        {/* Content */}
        {post.content && <p style={{ marginBottom: 12, lineHeight: 1.7 }}>{post.content}</p>}

        {/* Media — Cloudinary URL */}
        {post.mediaUrl && (
          post.mediaType === 'video'
            ? <video src={post.mediaUrl} controls style={{ width: '100%', borderRadius: 8, marginBottom: 12, maxHeight: 420 }} />
            : <img src={post.mediaUrl} alt="Post media" style={{ width: '100%', borderRadius: 8, marginBottom: 12, maxHeight: 420, objectFit: 'cover' }} />
        )}

        {/* Stats */}
        <div className="card-meta" style={{ marginBottom: 16 }}>
          <span>❤️ {post.likes?.length || 0} {t('like')}</span>
          <span>💬 {post.comments?.length || 0} {t('comment')}</span>
          <span>🔗 {post.shares || 0} {t('share')}</span>
        </div>

        {/* Comments */}
        {post.comments?.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginBottom: 12 }}>
            {post.comments.map(c => (
              <div key={c._id} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-start' }}>
                <div className="avatar avatar-sm" style={{ flexShrink: 0 }}>
                  {(c.user?.name || '?')[0].toUpperCase()}
                </div>
                <div style={{ background: 'var(--bg)', padding: '7px 12px', borderRadius: 8, flex: 1, fontSize: '0.875rem', wordBreak: 'break-word' }}>
                  <span style={{ fontWeight: 600 }}>{c.user?.name}</span>: {c.text}
                </div>
                {user && isCommentOwner(c) && (
                  <button
                    className="btn btn-sm"
                    style={{ background: 'transparent', border: 'none', color: 'var(--danger)', padding: '4px 6px', flexShrink: 0 }}
                    onClick={() => handleDeleteComment(c._id)}
                    disabled={deletingComment === c._id}
                    title="Delete comment"
                  >
                    {deletingComment === c._id ? <span className="spinner" style={{ width: 12, height: 12 }}></span> : '🗑'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add comment */}
        {user && (
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: 8 }}>
            <input
              className="form-control"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder={t('writeComment')}
              style={{ flex: 1, fontSize: '0.875rem' }}
            />
            <button className="btn btn-primary btn-sm" type="submit">{t('send')}</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PostDetail;
