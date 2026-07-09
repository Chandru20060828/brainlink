import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import i18n from '../utils/i18n';

const LANGUAGES = [
  { code: 'en', name: 'English 🇬🇧' },
  { code: 'es', name: 'Español 🇪🇸' },
  { code: 'hi', name: 'हिंदी 🇮🇳' },
  { code: 'pt', name: 'Português 🇧🇷' },
  { code: 'zh', name: '中文 🇨🇳' },
  { code: 'fr', name: 'Français 🇫🇷' }
];

const VALID_TABS = ['overview', 'points', 'friends', 'language', 'security', 'payments'];

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  // Read ?tab= from URL and default to 'overview'
  const getTabFromUrl = () => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    return VALID_TABS.includes(tabParam) ? tabParam : 'overview';
  };

  const [tab, setTab] = useState(getTabFromUrl);

  // Update tab whenever URL changes (e.g. navigating from Home cards)
  useEffect(() => {
    setTab(getTabFromUrl());
  }, [location.search]);

  const [loginHistory, setLoginHistory] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [transferTo, setTransferTo] = useState('');
  const [transferToName, setTransferToName] = useState('');
  const [transferPoints, setTransferPoints] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);

  useEffect(() => {
    if (tab === 'security') fetchLoginHistory();
    if (tab === 'friends') fetchFriendRequests();
    if (tab === 'payments') fetchPayments();
  }, [tab]);

  const fetchLoginHistory = async () => {
    try { const res = await api.get('/auth/login-history'); setLoginHistory(res.data); } catch {}
  };
  const fetchFriendRequests = async () => {
    try { const res = await api.get('/users/me/friend-requests'); setFriendRequests(res.data); } catch {}
  };
  const fetchPayments = async () => {
    try { const res = await api.get('/payment/history'); setPaymentHistory(res.data); } catch {}
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    try { const res = await api.get(`/users/search?q=${searchQuery}`); setSearchResults(res.data); } catch {}
  };

  const sendFriendRequest = async (userId) => {
    try {
      await api.post(`/users/${userId}/friend-request`);
      setMsg(t('friendRequestSent'));
      setSearchResults([]);
    } catch (err) { setError(err.response?.data?.message || t('transferFailed')); }
  };

  const acceptFriend = async (userId) => {
    try {
      await api.post(`/users/${userId}/accept-friend`);
      setFriendRequests(friendRequests.filter(r => r._id !== userId));
      setMsg(t('friendAdded'));
      const res = await api.get('/auth/profile');
      updateUser(res.data);
    } catch (err) { setError(err.response?.data?.message || t('transferFailed')); }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg(''); setError('');
    try {
      const res = await api.post('/users/transfer-points', { toUserId: transferTo, points: parseInt(transferPoints) });
      setMsg(res.data.message);
      updateUser({ points: res.data.newBalance });
      setTransferTo(''); setTransferToName(''); setTransferPoints('');
    } catch (err) { setError(err.response?.data?.message || t('transferFailed')); }
    finally { setLoading(false); }
  };

  const changeLanguage = async (lang) => {
    if (lang === user?.language) return;
    setMsg(''); setError('');
    try {
      await api.post('/auth/update-language', { language: lang });
      i18n.changeLanguage(lang);
      localStorage.setItem('appLanguage', lang);
      updateUser({ language: lang });
      const langName = LANGUAGES.find(l => l.code === lang)?.name;
      setMsg(`${t('languageChanged')} ${langName}`);
    } catch (err) { setError(err.response?.data?.message || t('transferFailed')); }
  };

  const deviceIcon = (d) => d === 'mobile' ? '📱' : d === 'tablet' ? '📟' : '💻';
  const browserIcon = (b) => b === 'Chrome' ? '🌐' : b === 'Microsoft' ? '🪟' : '🌍';

  const switchTab = (newTab) => {
    setTab(newTab);
    setMsg('');
    setError('');
    // Update URL without reload
    const url = new URL(window.location);
    url.searchParams.set('tab', newTab);
    window.history.pushState({}, '', url);
  };

  if (!user) return <div className="container"><div className="alert alert-warning">{t('pleaseLogin')}</div></div>;

  const tabs = [
    { key: 'overview',  label: t('tabOverview') },
    { key: 'points',    label: t('tabPoints') },
    { key: 'friends',   label: t('tabFriends') },
    { key: 'language',  label: t('tabLanguage') },
    { key: 'security',  label: t('tabSecurity') },
    { key: 'payments',  label: t('tabPayments') },
  ];

  return (
    <div className="container" style={{ maxWidth: 900 }}>
      {/* Profile Header */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="avatar avatar-lg" style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            fontSize: '2rem'
          }}>
            {user.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{user.name}</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 8 }}>{user.email}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className={`badge badge-${user.subscription?.plan || 'free'}`} style={{ textTransform: 'capitalize' }}>
                💎 {user.subscription?.plan || 'free'} {t('plan')}
              </span>
              <span className="points-badge">⭐ {user.points || 0} {t('points')}</span>
              <span className="badge badge-primary">👥 {user.friends?.length || 0} {t('friends')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map(tb => (
          <button
            key={tb.key}
            className={`tab${tab === tb.key ? ' active' : ''}`}
            onClick={() => switchTab(tb.key)}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {msg && <div className="alert alert-success">✅ {msg}</div>}
      {error && <div className="alert alert-danger">⚠️ {error}</div>}

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title">{t('accountStats')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              {[
                [t('points'),        user.points || 0,                           '⭐'],
                [t('friends'),       user.friends?.length || 0,                  '👥'],
                [t('questionsToday2'), user.subscription?.questionsPostedToday || 0, '📝'],
                [t('plan'),          user.subscription?.plan || 'free',          '💎'],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{label}</span>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-title">{t('accountInfo')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              {[
                [t('email'),       user.email,                                                          '📧'],
                [t('phone'),       user.phone || t('notSet'),                                          '📱'],
                [t('language'),    LANGUAGES.find(l => l.code === user.language)?.name || 'English 🇬🇧', '🌍'],
                [t('memberSince'), new Date(user.createdAt || Date.now()).toLocaleDateString(),          '📅'],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', gap: 8 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', textAlign: 'right', wordBreak: 'break-all' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── POINTS ── */}
      {tab === 'points' && (
        <div>
          <div className="card" style={{ marginBottom: 16, textAlign: 'center', background: 'linear-gradient(135deg, #fef9c3, #fde68a)' }}>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: '#b45309' }}>{user.points || 0}</div>
            <div style={{ color: '#92400e', fontWeight: 600 }}>{t('totalPointsLabel')}</div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">{t('howToEarnPoints')}</div>
            <ul style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 2.2, paddingLeft: 20, marginTop: 8 }}>
              <li>✅ {t('earn1')}</li>
              <li>🏆 {t('earn2')}</li>
              <li>👎 {t('earn3')}</li>
              <li>🗑 {t('earn4')}</li>
            </ul>
          </div>

          <div className="card">
            <div className="card-title">🔄 {t('transferPoints')}</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '8px 0 16px' }}>
              {t('transferDesc')}: <strong>{user.points || 0} {t('pts')}</strong>
            </p>
            {(user.points || 0) <= 10 && (
              <div className="alert alert-warning">⚠️ {t('transferWarning')}</div>
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input className="form-control" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('searchUserPlaceholder')}
                onKeyDown={e => e.key === 'Enter' && searchUsers()} />
              <button className="btn btn-primary btn-sm" onClick={searchUsers}>{t('search')}</button>
            </div>

            {searchResults.length > 0 && (
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, marginBottom: 16 }}>
                {searchResults.map(u => (
                  <div key={u._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div className="avatar avatar-sm">{u.name?.[0]?.toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => {
                      setTransferTo(u._id);
                      setTransferToName(u.name);
                      setSearchResults([]);
                      setSearchQuery('');
                    }}>{t('select')}</button>
                  </div>
                ))}
              </div>
            )}

            {transferToName && (
              <div className="alert alert-info" style={{ marginBottom: 12 }}>
                ✅ {t('select')}: <strong>{transferToName}</strong>
              </div>
            )}

            <form onSubmit={handleTransfer}>
              <div className="form-group">
                <label className="form-label">{t('recipientUserId')}</label>
                <input className="form-control" value={transferTo}
                  onChange={e => setTransferTo(e.target.value)}
                  placeholder={t('recipientPlaceholder')} required />
              </div>
              <div className="form-group">
                <label className="form-label">{t('pointsToTransfer')}</label>
                <input className="form-control" type="number" min={1} max={user.points || 0}
                  value={transferPoints}
                  onChange={e => setTransferPoints(e.target.value)}
                  placeholder={t('pointsAmountPlaceholder')} required />
              </div>
              <button className="btn btn-primary" disabled={loading || (user.points || 0) <= 10}>
                {loading ? <><span className="spinner"></span> {t('transferring')}</> : t('transferBtn')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── FRIENDS ── */}
      {tab === 'friends' && (
        <div>
          {friendRequests.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">🔔 {t('friendRequests')} ({friendRequests.length})</div>
              {friendRequests.map(req => (
                <div key={req._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div className="avatar avatar-sm">{req.name?.[0]?.toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{req.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.email}</div>
                    </div>
                  </div>
                  <button className="btn btn-success btn-sm" onClick={() => acceptFriend(req._id)}>{t('accept')}</button>
                </div>
              ))}
            </div>
          )}

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">{t('findFriends')}</div>
            <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
              <input className="form-control" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('searchFriendPlaceholder')}
                onKeyDown={e => e.key === 'Enter' && searchUsers()} />
              <button className="btn btn-primary btn-sm" onClick={searchUsers}>{t('search')}</button>
            </div>
            {searchResults.map(u => (
              <div key={u._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div className="avatar avatar-sm">{u.name?.[0]?.toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email} • {u.points} {t('pts')}</div>
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => sendFriendRequest(u._id)}>{t('addFriend')}</button>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-title">👥 {t('yourFriends')} ({user.friends?.length || 0})</div>
            {!user.friends?.length ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 8 }}>{t('noFriendsYet')}</p>
            ) : user.friends.map(f => (
              <div key={f._id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="avatar avatar-sm">{f.name?.[0]?.toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{f.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.email}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LANGUAGE ── */}
      {tab === 'language' && (
        <div className="card">
          <div className="card-title">🌍 {t('languageSettings')}</div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            {t('currentLanguage')}: <strong>{LANGUAGES.find(l => l.code === user.language)?.name || 'English 🇬🇧'}</strong>
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {LANGUAGES.map(lang => (
              <button key={lang.code}
                className={`btn${user.language === lang.code ? ' btn-primary' : ' btn-outline'}`}
                onClick={() => changeLanguage(lang.code)}
                style={{ justifyContent: 'flex-start' }}>
                {lang.name} {user.language === lang.code && '✓'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── SECURITY / LOGIN HISTORY ── */}
      {tab === 'security' && (
        <div>
          <div className="card">
            <div className="card-title">🔐 {t('loginHistory')}</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '8px 0 16px' }}>
              {t('last20Sessions')}
            </p>
            {loginHistory.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>{t('noLoginHistory')}</p>
            ) : loginHistory.map((h, i) => (
              <div key={i} className="history-item">
                <div className="history-icon" style={{ fontSize: '1.2rem' }}>{deviceIcon(h.device)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    {browserIcon(h.browser)} {h.browser} · {h.os} · {h.device}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    IP: {h.ip} · {new Date(h.timestamp).toLocaleString()}
                  </div>
                </div>
                {i === 0 && <span className="badge badge-success">{t('currentSession')}</span>}
              </div>
            ))}
          </div>
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-title">{t('securityRules')}</div>
            <ul style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 2.2, paddingLeft: 20, marginTop: 8 }}>
              <li>🌐 {t('secRule1')}</li>
              <li>🪟 {t('secRule2')}</li>
              <li>📱 {t('secRule3')}</li>
              <li>🔑 {t('secRule4')}</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── PAYMENTS ── */}
      {tab === 'payments' && (
        <div className="card">
          <div className="card-title">💳 {t('paymentHistory')}</div>
          {paymentHistory.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>{t('noPaymentsYet')}</p>
          ) : paymentHistory.map(p => (
            <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{p.plan} {t('plan')}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  #{p.invoiceNumber} · {new Date(p.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700 }}>₹{(p.amount / 100).toFixed(0)}</div>
                <span className={`badge ${p.status === 'paid' ? 'badge-success' : 'badge-danger'}`}>{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Profile;
