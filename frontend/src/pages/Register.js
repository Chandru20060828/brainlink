import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError(t('passwordMismatch'));
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/register', {
        name: form.name, email: form.email, phone: form.phone, password: form.password
      });
      login(res.data.token, res.data.user); navigate('/');
    } catch (err) { setError(err.response?.data?.message || t('registrationFailed')); }
    finally { setLoading(false); }
  };

  // autocomplete values mapped per field
  const fields = [
    { key: 'name',     label: t('fullName'),       type: 'text',     ph: t('fullNamePlaceholder'), autoComplete: 'name' },
    { key: 'email',    label: t('email'),           type: 'email',    ph: t('emailPlaceholder'),    autoComplete: 'username' },
    { key: 'phone',    label: t('phone'),           type: 'tel',      ph: t('phonePlaceholder'),    autoComplete: 'tel' },
    { key: 'password', label: t('password'),        type: 'password', ph: t('passwordMin'), min: 6, autoComplete: 'new-password' },
    { key: 'confirm',  label: t('confirmPassword'), type: 'password', ph: t('repeatPassword'),      autoComplete: 'new-password' },
  ];

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      background: 'radial-gradient(ellipse 80% 60% at 70% 70%, rgba(167,139,250,0.07) 0%, transparent 60%)'
    }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 32, animation: 'fadeUp 0.5s both' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--secondary), var(--pink))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', boxShadow: '0 0 24px rgba(167,139,250,0.4)'
          }}>🚀</div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontSize: '1.8rem', fontWeight: 800,
            letterSpacing: '-0.04em', marginBottom: 6
          }} className="gradient-text">{t('createAccount')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('joinCommunity')}</p>
        </div>

        <div className="card" style={{ animation: 'fadeUp 0.5s 0.1s both', padding: '32px 28px' }}>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit} autoComplete="on">
            {fields.map(f => (
              <div className="form-group" key={f.key}>
                <label className="form-label">{f.label}</label>
                <input
                  className="form-control"
                  type={f.type}
                  name={f.key}
                  value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.ph}
                  required={f.key !== 'phone'}
                  minLength={f.min}
                  autoComplete={f.autoComplete}
                />
              </div>
            ))}
            <button className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: 4 }} disabled={loading}>
              {loading ? <><span className="spinner"></span> {t('creatingAccount')}</> : t('createAccount')}
            </button>
          </form>
          <div className="divider" style={{ margin: '24px 0 18px' }} />
          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {t('alreadyAccount')} <Link to="/login" style={{ color: 'var(--secondary)', fontWeight: 600 }}>{t('signIn')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
