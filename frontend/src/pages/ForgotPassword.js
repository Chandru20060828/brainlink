import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useTranslation } from 'react-i18next';

const ForgotPassword = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [msg, setMsg]       = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg(''); setError('');
    try {
      const res = await api.post('/auth/forgot-password', { emailOrPhone });
      setMsg(res.data.message); setDone(true);
    } catch (err) { setError(err.response?.data?.message || 'Something went wrong'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px' }}>
      <div style={{ width:'100%', maxWidth:440 }}>
        <div style={{ textAlign:'center', marginBottom:32, animation:'fadeUp 0.5s both' }}>
          <div style={{ width:56, height:56, borderRadius:16, margin:'0 auto 16px',
            background:'linear-gradient(135deg,var(--warning),#f59e0b)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'1.6rem', boxShadow:'0 0 24px rgba(245,158,11,0.35)' }}>🔑</div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:'1.8rem', fontWeight:800,
            letterSpacing:'-0.04em', marginBottom:6, color:'var(--text)' }}>
            {t('forgotPasswordTitle')}
          </h1>
          <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', maxWidth:340, margin:'0 auto' }}>
            {t('forgotPasswordDesc')}
          </p>
        </div>

        <div className="card" style={{ animation:'fadeUp 0.5s 0.1s both', padding:'32px 28px' }}>
          {msg && (
            <div className="alert alert-success">
              ✅ {msg}<br/>
              <small style={{ opacity:0.8 }}>{t('checkEmailLogin')}</small>
            </div>
          )}
          {error && <div className="alert alert-danger">⚠️ {error}</div>}

          {!done ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">{t('emailOrPhone')}</label>
                <input className="form-control" value={emailOrPhone}
                  onChange={e => setEmailOrPhone(e.target.value)}
                  required placeholder={t('emailOrPhonePlaceholder')} autoFocus />
              </div>
              <div className="alert alert-warning" style={{ marginBottom:18 }}>
                ⚠️ {t('oncePerDayWarning')}
              </div>
              <button className="btn btn-primary" style={{ width:'100%', padding:'12px' }} disabled={loading}>
                {loading ? <><span className="spinner"></span> {t('sending')}</> : t('sendNewPassword')}
              </button>
            </form>
          ) : (
            <div style={{ textAlign:'center', padding:'16px 0' }}>
              <div style={{ fontSize:'3.5rem', marginBottom:16, animation:'fadeUp 0.4s both' }}>📧</div>
              <p style={{ fontWeight:600, marginBottom:8 }}>{t('checkEmailTitle')}</p>
              <p style={{ color:'var(--text-muted)', fontSize:'0.845rem' }}>{t('lettersOnlyNote')}</p>
            </div>
          )}

          <div className="divider" style={{ margin:'24px 0 16px' }} />
          <p style={{ textAlign:'center', fontSize:'0.875rem', color:'var(--text-muted)' }}>
            {t('rememberPassword')} <Link to="/login" style={{ color:'var(--secondary)', fontWeight:600 }}>{t('signIn')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
