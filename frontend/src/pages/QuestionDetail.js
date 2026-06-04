import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const QuestionDetail = () => {
  const { id } = useParams();
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchQuestion(); }, [id]);

  const fetchQuestion = async () => {
    try {
      const res = await api.get(`/questions/${id}`);
      setQuestion(res.data);
    } catch (err) { setError('Question not found'); }
    finally { setLoading(false); }
  };

  const handleAnswer = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      const res = await api.post(`/questions/${id}/answers`, { content: answer });
      setQuestion(res.data);
      setAnswer('');
      if (user) updateUser({ points: (user.points || 0) + 5 });
    } catch (err) {
      setError(err.response?.data?.message || t('failedToPostQuestion'));
    } finally { setSubmitting(false); }
  };

  const handleVote = async (answerId, type) => {
    try {
      await api.post(`/questions/${id}/answers/${answerId}/${type}`);
      fetchQuestion();
    } catch (err) { setError(err.response?.data?.message || t('voteFailed')); }
  };

  const handleDeleteAnswer = async (answerId) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    try {
      await api.delete(`/questions/${id}/answers/${answerId}`);
      fetchQuestion();
      if (user) updateUser({ points: Math.max(0, (user.points || 0) - 5) });
    } catch (err) { setError(err.response?.data?.message || t('deleteFailed')); }
  };

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;
  if (!question) return <div className="container"><div className="alert alert-danger">{error || 'Not found'}</div></div>;

  const answerCount = question.answers?.length || 0;

  return (
    <div className="container" style={{ maxWidth: 800 }}>
      <Link to="/questions" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        {t('backToQuestions')}
      </Link>

      <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 12 }}>{question.title}</h1>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 16 }}>{question.content}</p>
        <div className="card-meta">
          <span>👤 {question.user?.name}</span>
          <span>🕐 {new Date(question.createdAt).toLocaleString()}</span>
          <span>👁 {question.views} {t('views')}</span>
          {question.tags?.map(tag => <span key={tag} className="badge badge-silver">{tag}</span>)}
        </div>
      </div>

      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '24px 0 16px' }}>
        {answerCount} {answerCount === 1 ? t('answerCount_one', { count: answerCount }).replace('{{count}} ', '') : t('answers')}
      </h2>

      {error && <div className="alert alert-danger">{error}</div>}

      {question.answers?.map(ans => (
        <div key={ans._id} className="card" style={{ borderLeft: '4px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 48 }}>
              <button className="btn btn-sm" style={{
                background: ans.upvotes?.includes(user?._id) ? 'var(--primary)' : 'var(--bg)',
                color: ans.upvotes?.includes(user?._id) ? '#fff' : 'var(--text-muted)',
                border: '1px solid var(--border)', padding: '4px 10px'
              }} onClick={() => user && handleVote(ans._id, 'upvote')} title={t('upvote')}>▲</button>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: (ans.upvotes?.length || 0) > (ans.downvotes?.length || 0) ? 'var(--success)' : 'var(--text)' }}>
                {(ans.upvotes?.length || 0) - (ans.downvotes?.length || 0)}
              </span>
              <button className="btn btn-sm" style={{
                background: ans.downvotes?.includes(user?._id) ? 'var(--danger)' : 'var(--bg)',
                color: ans.downvotes?.includes(user?._id) ? '#fff' : 'var(--text-muted)',
                border: '1px solid var(--border)', padding: '4px 10px'
              }} onClick={() => user && handleVote(ans._id, 'downvote')} title={t('downvote')}>▼</button>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ lineHeight: 1.7, color: 'var(--text)' }}>{ans.content}</p>
              <div className="card-meta" style={{ marginTop: 12 }}>
                <span>👤 {ans.user?.name}</span>
                <span>🕐 {new Date(ans.createdAt).toLocaleString()}</span>
                <span style={{ color: '#f59e0b' }}>⭐ {t('ptsEarned')}</span>
                {(ans.upvotes?.length || 0) >= 5 && <span className="badge badge-success">{t('bonusPts')}</span>}
                {user && ans.user?._id === user._id && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteAnswer(ans._id)}>{t('deleteAnswer')}</button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {user ? (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 16 }}>{t('yourAnswer')}</h3>
          <form onSubmit={handleAnswer}>
            <div className="form-group">
              <textarea className="form-control" value={answer} onChange={e => setAnswer(e.target.value)}
                required placeholder={t('writeAnswerPlaceholder')} rows={5} />
            </div>
            <button className="btn btn-primary" disabled={submitting}>
              {submitting ? <><span className="spinner"></span> {t('posting')}</> : t('postAnswer')}
            </button>
          </form>
        </div>
      ) : (
        <div className="alert alert-info" style={{ marginTop: 16 }}>
          <Link to="/login">{t('login')}</Link> {t('loginToAnswer')}
        </div>
      )}
    </div>
  );
};

export default QuestionDetail;
