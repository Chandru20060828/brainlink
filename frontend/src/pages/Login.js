import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [step, setStep]       = useState('login');
  const [otp, setOtp]         = useState('');
  const [userId, setUserId]   = useState('');
  const [msg, setMsg]         = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [noAccount, setNoAccount] = useState(false);
  const { login } = useAuth();
  const navigate   = useNavigate();
  const { t }      = useTranslation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setMsg(''); setNoAccount(false);
    try {
      const res = await api.post('/auth/login', form);
      if (res.data.requireOTP) {
        setUserId(res.data.userId);
        setStep('otp');
        setMsg(res.data.message);
      } else {
        login(res.data.token, res.data.user);
        navigate('/');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
      // If account not found, show register link
      if (msg.toLowerCase().includes('no account') || msg.toLowerCase().includes('not found')) {
        setNoAccount(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOTP = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/verify-login-otp', { userId, otp });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      background: 'radial-gradient(ellipse 80% 60% at 30% 30%, rgba(99,102,241,0.09) 0%, transparent 60%)'
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32, animation: 'fadeUp 0.5s both' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', boxShadow: 'var(--glow-primary)'
          }}>⚡</div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontSize: '1.8rem', fontWeight: 800,
            letterSpacing: '-0.04em', marginBottom: 6
          }} className="gradient-text">BrainLink</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('signInAccount')}</p>
        </div>

        <div className="card" style={{ animation: 'fadeUp 0.5s 0.1s both', padding: '32px 28px' }}>
          {msg && <div className="alert alert-info">{msg}</div>}

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 16 }}>
              ⚠️ {error}
              {noAccount && (
                <div style={{ marginTop: 8, fontSize: '0.85rem' }}>
                  Don't have an account?{' '}
                  <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                    Register here →
                  </Link>
                </div>
              )}
            </div>
          )}

          {step === 'login' ? (
            <form onSubmit={handleLogin} autoComplete="on">
              <div className="form-group">
                <label className="form-label">{t('email')}</label>
                <input
                  className="form-control"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder={t('emailPlaceholder')}
                  autoComplete="username"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('password')}</label>
                <input
                  className="form-control"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  placeholder={t('passwordPlaceholder')}
                  autoComplete="current-password"
                />
              </div>
              <div style={{ textAlign: 'right', marginBottom: 20 }}>
                <Link to="/forgot-password" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {t('forgotPassword')}
                </Link>
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
                disabled={loading}
              >
                {loading ? <><span className="spinner"></span> {t('signingIn')}</> : t('signIn')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOTP} autoComplete="off">
              <div className="alert alert-info" style={{ textAlign: 'center', marginBottom: 20 }}>
                🔒 Chrome security: An OTP was sent to <strong>{form.email}</strong>
              </div>
              <div className="form-group" style={{ textAlign: 'center' }}>
                <label className="form-label">{t('enterOtp')}</label>
                <input
                  className="form-control"
                  type="text"
                  name="otp"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  placeholder="• • • • • •"
                  maxLength={6}
                  autoComplete="one-time-code"
                  style={{
                    letterSpacing: '10px', fontSize: '1.5rem', textAlign: 'center',
                    fontFamily: 'monospace', padding: '14px'
                  }}
                  autoFocus
                />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
                  Check your inbox at <strong>{form.email}</strong>. OTP valid for 10 minutes.
                </p>
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
                disabled={loading || otp.length !== 6}
              >
                {loading ? <><span className="spinner"></span> Verifying…</> : 'Verify OTP & Login'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ width: '100%', marginTop: 10 }}
                onClick={() => { setStep('login'); setOtp(''); setError(''); }}
              >
                ← Back to Login
              </button>
            </form>
          )}

          <div className="divider" style={{ margin: '24px 0 18px' }} />
          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {t('noAccount')}{' '}
            <Link to="/register" style={{ color: 'var(--secondary)', fontWeight: 600 }}>
              {t('register')}
            </Link>
          </p>
        </div>

        {/* Dev helper — remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            marginTop: 16, padding: '10px 14px', borderRadius: 8,
            background: 'rgba(255,200,0,0.08)', border: '1px solid rgba(255,200,0,0.2)',
            fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center'
          }}>
            💡 Dev tip: Visit{' '}
            <a
              href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/debug`}
              target="_blank" rel="noreferrer"
              style={{ color: 'var(--primary)' }}
            >
              /api/debug
            </a>{' '}
            to check DB connection &amp; user count.
            If 0 users →{' '}
            <Link to="/register" style={{ color: 'var(--primary)' }}>register first</Link>.
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
