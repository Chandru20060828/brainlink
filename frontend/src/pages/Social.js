import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Social = () => {
  const [posts, setPosts]                   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [content, setContent]               = useState('');
  const [file, setFile]                     = useState(null);
  const [filePreview, setFilePreview]       = useState(null);
  const [fileType, setFileType]             = useState('');
  const [error, setError]                   = useState('');
  const [success, setSuccess]               = useState('');
  const [submitting, setSubmitting]         = useState(false);
  const [commentInputs, setCommentInputs]   = useState({});
  const [openComments, setOpenComments]     = useState({});
  const [shareMsg, setShareMsg]             = useState({});
  const [deletingPost, setDeletingPost]     = useState('');
  const [deletingComment, setDeletingComment] = useState('');
  const fileRef = useRef();
  const { user } = useAuth();
  const { t }    = useTranslation();

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    try { const res = await api.get('/posts'); setPosts(res.data); }
    catch {}
    finally { setLoading(false); }
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    setFile(f); setFileType(f.type.startsWith('video') ? 'video' : 'image');
    const reader = new FileReader();
    reader.onloadend = () => setFilePreview(reader.result);
    reader.readAsDataURL(f);
  };
  const removeFile = () => {
    setFile(null); setFilePreview(null); setFileType('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim() && !file) return setError('Add text or media.');
    setSubmitting(true); setError(''); setSuccess('');
    try {
      const data = new FormData();
      data.append('content', content);
      if (file) data.append('media', file);
      const res = await api.post('/posts', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPosts([res.data, ...posts]);
      setContent(''); removeFile();
      setSuccess(t('postSharedSuccess'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.message || t('failedToPost')); }
    finally { setSubmitting(false); }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm(t('deletePostConfirm') || 'Delete this post?')) return;
    setDeletingPost(postId);
    try { await api.delete(`/posts/${postId}`); setPosts(posts.filter(p => p._id !== postId)); }
    catch (err) { setError(err.response?.data?.message || 'Delete failed'); }
    finally { setDeletingPost(''); }
  };

  const handleLike = async (postId) => {
    try {
      const res = await api.post(`/posts/${postId}/like`);
      setPosts(posts.map(p => p._id === postId ? {
        ...p, likes: res.data.liked
          ? [...(p.likes||[]), user._id]
          : (p.likes||[]).filter(id => (id?._id||id)?.toString() !== user._id?.toString())
      } : p));
    } catch {}
  };

  const handleComment = async (postId) => {
    const text = commentInputs[postId]; if (!text?.trim()) return;
    try {
      const res = await api.post(`/posts/${postId}/comment`, { text });
      setPosts(posts.map(p => p._id === postId ? { ...p, comments: res.data } : p));
      setCommentInputs({ ...commentInputs, [postId]: '' });
    } catch {}
  };

  const handleDeleteComment = async (postId, commentId) => {
    setDeletingComment(commentId);
    try {
      const res = await api.delete(`/posts/${postId}/comments/${commentId}`);
      setPosts(posts.map(p => p._id === postId ? { ...p, comments: res.data } : p));
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
    finally { setDeletingComment(''); }
  };

  const handleShare = async (postId) => {
    const postUrl  = `${window.location.origin}/posts/${postId}`;
    const shareData = { title:'Check out this post on BrainLink', text:'Found something interesting!', url: postUrl };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        await api.post(`/posts/${postId}/share`);
        setPosts(posts.map(p => p._id === postId ? { ...p, shares:(p.shares||0)+1 } : p));
        setShareMsg({ [postId]: { text: t('shareNativeSuccess'), type:'success' } });
      } else {
        await navigator.clipboard.writeText(postUrl);
        await api.post(`/posts/${postId}/share`);
        setPosts(posts.map(p => p._id === postId ? { ...p, shares:(p.shares||0)+1 } : p));
        setShareMsg({ [postId]: { text: t('shareSuccess'), type:'success' } });
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setShareMsg({ [postId]: { text: t('shareError'), type:'error' } });
    }
    setTimeout(() => setShareMsg(prev => ({ ...prev, [postId]: null })), 3000);
  };

  const friendCount = user?.friends?.length || 0;
  const getPostLimitMsg = () => {
    if (friendCount === 0) return t('noFriendsPostLimit');
    if (friendCount === 1) return t('oneFriendLimit');
    if (friendCount === 2) return t('twoFriendsLimit');
    if (friendCount > 10)  return t('manyFriendsLimit');
    return t('nFriendsLimit', { count: friendCount });
  };

  const isPostOwner    = (post) => (post.user?._id||post.user)?.toString() === user?._id?.toString();
  const canDelComment  = (c, post) =>
    (c.user?._id||c.user)?.toString() === user?._id?.toString() || isPostOwner(post);

  return (
    <div className="container" style={{ maxWidth:700 }}>
      <h1 className="page-title">{t('socialSpace')}</h1>

      {/* Limit banner */}
      <div className="alert alert-info" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8, marginBottom:20 }}>
        <span>👥 {t('postingLimit')}: <strong>{getPostLimitMsg()}</strong></span>
        {friendCount === 0 && <a href="/profile?tab=friends" className="btn btn-primary btn-sm">{t('findFriendsLink')}</a>}
      </div>

      {/* Create post */}
      {user && friendCount > 0 && (
        <div className="card" style={{ marginBottom:24, border:'1px solid var(--border-bright)' }}>
          {success && <div className="alert alert-success">✅ {success}</div>}
          {error   && <div className="alert alert-danger">⚠️ {error}</div>}
          <form onSubmit={handlePost}>
            <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:12 }}>
              <div className="avatar" style={{ marginTop:2 }}>{user.name?.[0]?.toUpperCase()}</div>
              <textarea className="form-control" style={{ flex:1, minHeight:72, resize:'none' }}
                value={content} onChange={e => setContent(e.target.value)}
                placeholder={t('whatsOnMind')} />
            </div>

            {filePreview && (
              <div style={{ position:'relative', marginBottom:12, borderRadius:'var(--radius)', overflow:'hidden' }}>
                {fileType === 'video'
                  ? <video src={filePreview} controls style={{ width:'100%', maxHeight:240, borderRadius:'var(--radius)' }} />
                  : <img src={filePreview} alt="preview" style={{ width:'100%', maxHeight:240, objectFit:'cover', borderRadius:'var(--radius)' }} />}
                <button type="button" onClick={removeFile} style={{
                  position:'absolute', top:8, right:8,
                  background:'rgba(0,0,0,0.7)', color:'#fff', border:'none',
                  borderRadius:'50%', width:28, height:28, cursor:'pointer', fontSize:'0.85rem',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  backdropFilter:'blur(4px)'
                }}>✕</button>
              </div>
            )}

            <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
              <label style={{ display:'inline-flex', alignItems:'center', gap:6,
                padding:'7px 14px', borderRadius:'var(--radius-sm)',
                border:'1.5px solid var(--border)', cursor:'pointer', fontSize:'0.82rem',
                color:'var(--text-muted)', background:'var(--surface-2)', transition:'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--primary)'; e.currentTarget.style.color='var(--primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)';  e.currentTarget.style.color='var(--text-muted)'; }}>
                📎 {t('attachMedia')}
                <input type="file" ref={fileRef} accept="image/*,video/*" style={{ display:'none' }} onChange={handleFileChange} />
              </label>
              <button className="btn btn-primary" style={{ flex:1, minWidth:120 }} disabled={submitting}>
                {submitting ? <><span className="spinner"></span> {t('sharingPost')}</> : t('sharePostBtn')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feed */}
      {loading ? (
        <div className="loading-center">
          <div className="loading-dots"><span/><span/><span/></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'60px 40px' }}>
          <div style={{ fontSize:'3.5rem', marginBottom:16 }}>📭</div>
          <p style={{ color:'var(--text-muted)' }}>{t('noPostsYet')}</p>
        </div>
      ) : posts.map((post, idx) => {
        const liked = post.likes?.some(id => (id?._id||id)?.toString() === user?._id?.toString());
        const isMine = isPostOwner(post);

        return (
          <div key={post._id} className="post-card" style={{ animationDelay:`${idx*0.04}s` }}>
            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <div className="avatar">{post.user?.name?.[0]?.toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight:600, fontSize:'0.925rem', color:'var(--text)' }}>{post.user?.name}</div>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>
                    {new Date(post.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              {isMine && (
                <button className="btn btn-danger btn-sm" onClick={() => handleDeletePost(post._id)}
                  disabled={deletingPost===post._id}
                  style={{ padding:'5px 10px', fontSize:'0.8rem' }}>
                  {deletingPost===post._id ? <span className="spinner" style={{ width:13,height:13 }}></span> : '🗑'}
                </button>
              )}
            </div>

            {post.content && <p style={{ lineHeight:1.65, marginBottom:10, color:'var(--text-2)' }}>{post.content}</p>}

            {post.mediaUrl && (
              post.mediaType==='video'
                ? <video className="post-media" controls src={post.mediaUrl} style={{ marginBottom:10 }} />
                : <img className="post-media" src={post.mediaUrl} alt="Post media" style={{ marginBottom:10 }}
                    onError={e => { e.target.style.display='none'; }} />
            )}

            {shareMsg[post._id] && (
              <div className={`alert ${shareMsg[post._id].type==='success'?'alert-success':'alert-danger'}`}
                style={{ padding:'7px 12px', fontSize:'0.8rem', marginBottom:10 }}>
                {shareMsg[post._id].type==='success'?'✅':'⚠️'} {shareMsg[post._id].text}
              </div>
            )}

            {/* Action buttons */}
            <div className="post-actions">
              <button className={`post-action-btn${liked?' liked':''}`}
                onClick={() => user && handleLike(post._id)}>
                {liked ? '❤️' : '🤍'} {t('like')}
                {post.likes?.length > 0 && <span style={{ background:'var(--surface-2)',
                  padding:'1px 7px', borderRadius:999, fontSize:'0.72rem' }}>{post.likes.length}</span>}
              </button>
              <button className="post-action-btn"
                onClick={() => setOpenComments(prev => ({ ...prev, [post._id]: !prev[post._id] }))}>
                💬 {t('comment')}
                {post.comments?.length > 0 && <span style={{ background:'var(--surface-2)',
                  padding:'1px 7px', borderRadius:999, fontSize:'0.72rem' }}>{post.comments.length}</span>}
              </button>
              <button className="post-action-btn" onClick={() => handleShare(post._id)}>
                🔗 {t('share')}
                {post.shares > 0 && <span style={{ background:'var(--surface-2)',
                  padding:'1px 7px', borderRadius:999, fontSize:'0.72rem' }}>{post.shares}</span>}
              </button>
            </div>

            {/* Comments */}
            {(openComments[post._id] || post.comments?.length > 0) && (
              <div style={{ marginTop:14, borderTop:'1px solid var(--border)', paddingTop:14 }}>
                {post.comments?.map(c => (
                  <div key={c._id} style={{ display:'flex', gap:8, marginBottom:10, alignItems:'flex-start' }}>
                    <div className="avatar avatar-sm" style={{ flexShrink:0 }}>
                      {(c.user?.name||'?')[0].toUpperCase()}
                    </div>
                    <div style={{ flex:1, background:'var(--surface-2)', padding:'8px 12px',
                      borderRadius:'var(--radius-sm)', fontSize:'0.845rem', wordBreak:'break-word',
                      border:'1px solid var(--border)' }}>
                      <span style={{ fontWeight:600, color:'var(--secondary)' }}>{c.user?.name}</span>
                      <span style={{ color:'var(--text-dim)', fontSize:'0.7rem', marginLeft:8 }}>
                        {new Date(c.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                      </span>
                      <br />
                      <span style={{ color:'var(--text-2)' }}>{c.text}</span>
                    </div>
                    {user && canDelComment(c, post) && (
                      <button onClick={() => handleDeleteComment(post._id, c._id)}
                        disabled={deletingComment===c._id}
                        style={{ background:'transparent', border:'none', color:'var(--danger)',
                          cursor:'pointer', padding:'6px', flexShrink:0, opacity:0.7,
                          transition:'opacity 0.2s', fontSize:'0.9rem' }}
                        onMouseEnter={e=>e.currentTarget.style.opacity='1'}
                        onMouseLeave={e=>e.currentTarget.style.opacity='0.7'}>
                        {deletingComment===c._id ? <span className="spinner spinner-primary" style={{width:12,height:12}}></span> : '🗑'}
                      </button>
                    )}
                  </div>
                ))}

                {user && (
                  <div style={{ display:'flex', gap:8, marginTop:6 }}>
                    <div className="avatar avatar-sm" style={{ flexShrink:0 }}>
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    <input className="form-control"
                      style={{ flex:1, fontSize:'0.845rem', padding:'8px 12px' }}
                      value={commentInputs[post._id]||''}
                      onChange={e => setCommentInputs({...commentInputs,[post._id]:e.target.value})}
                      placeholder={t('writeComment')}
                      onKeyDown={e => e.key==='Enter' && handleComment(post._id)} />
                    <button className="btn btn-primary btn-sm" onClick={() => handleComment(post._id)}
                      style={{ flexShrink:0 }}>{t('send')}</button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Social;
