import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Questions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ title: '', content: '', tags: '' });
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate  = useNavigate();
  const { t }     = useTranslation();

  useEffect(() => { fetchQuestions(); }, []);

  const fetchQuestions = async () => {
    try { const res = await api.get('/questions'); setQuestions(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    setSubmitting(true); setError(''); setSuccess('');
    try {
      const tags = form.tags.split(',').map(tg => tg.trim()).filter(Boolean);
      const res  = await api.post('/questions', { ...form, tags });
      setQuestions([res.data, ...questions]);
      setForm({ title: '', content: '', tags: '' });
      setShowForm(false);
      setSuccess(t('questionPostedSuccess'));
    } catch (err) { setError(err.response?.data?.message || t('failedToPostQuestion')); }
    finally { setSubmitting(false); }
  };

  const planLimits  = { free: 1, bronze: 5, silver: 10, gold: '∞' };
  const currentPlan = user?.subscription?.plan || 'free';
  const questionsLeft = planLimits[currentPlan] === '∞' ? '∞'
    : Math.max(0, (planLimits[currentPlan] || 1) - (user?.subscription?.questionsPostedToday || 0));

  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>{t('questions')}</h1>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="badge badge-primary">{questionsLeft} {t('questionsLeftToday')}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                · {currentPlan} plan
              </span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {user ? (
            <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
              {showForm ? `✕ ${t('cancel')}` : `+ ${t('askQuestion')}`}
            </button>
          ) : (
            <Link to="/login" className="btn btn-primary">{t('loginToAsk')}</Link>
          )}
        </div>
      </div>

      {success && <div className="alert alert-success">✅ {success}</div>}
      {error   && <div className="alert alert-danger">⚠️ {error}</div>}

      {/* Ask form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 28, border: '1px solid var(--border-bright)',
          animation: 'fadeUp 0.3s both' }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 18,
            fontSize: '1rem' }}>{t('askAQuestion')}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t('titleLabel')}</label>
              <input className="form-control" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required placeholder={t('titlePlaceholder')} autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">{t('detailsLabel')}</label>
              <textarea className="form-control" value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                required placeholder={t('detailsPlaceholder')} rows={4} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('tagsLabel')}</label>
              <input className="form-control" value={form.tags}
                onChange={e => setForm({ ...form, tags: e.target.value })}
                placeholder={t('tagsPlaceholder')} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" disabled={submitting}>
                {submitting ? <><span className="spinner"></span> {t('posting')}</> : t('postQuestion')}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>{t('cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {/* Upgrade banner */}
      {user && currentPlan === 'free' && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 10, padding: '14px 18px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(34,211,238,0.05))',
          border: '1px solid var(--border-bright)', borderRadius: 'var(--radius)',
          marginBottom: 20, fontSize: '0.875rem', color: 'var(--text-2)'
        }}>
          <span>📊 {t('freePlanBanner')}</span>
          <Link to="/subscription" className="btn btn-primary btn-sm">{t('upgradeNow')} ✨</Link>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="loading-center">
          <div className="loading-dots"><span/><span/><span/></div>
          <span>{t('questions')}…</span>
        </div>
      ) : questions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>❓</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>{t('noQuestionsYet')}</p>
        </div>
      ) : (
        <div className="stagger">
          {questions.map((q, idx) => (
            <Link to={`/questions/${q._id}`} key={q._id} style={{ textDecoration: 'none', display: 'block' }}>
              <div className="card" style={{ animation: `fadeUp 0.4s ${idx * 0.04}s both` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.975rem',
                    color: 'var(--secondary)', flex: 1, lineHeight: 1.4 }}>{q.title}</h3>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'flex-start' }}>
                    <span className="badge badge-primary">{q.answers?.length || 0} {t('answers')}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', paddingTop: 3 }}>
                      {q.views} {t('views')}
                    </span>
                  </div>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.845rem', margin: '8px 0', lineHeight: 1.55 }}>
                  {q.content?.substring(0, 160)}{q.content?.length > 160 ? '…' : ''}
                </p>
                <div className="card-meta">
                  <span>👤 {q.user?.name}</span>
                  <span>🕐 {new Date(q.createdAt).toLocaleDateString()}</span>
                  {q.tags?.map(tag => (
                    <span key={tag} style={{
                      background: 'var(--surface-2)', color: 'var(--accent)',
                      padding: '2px 9px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600,
                      border: '1px solid rgba(34,211,238,0.2)'
                    }}>{tag}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Questions;
