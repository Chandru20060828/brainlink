import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

/* Animated particle canvas background */
const ParticleCanvas = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.3,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35,
      o: Math.random() * 0.5 + 0.1,
      hue: Math.random() > 0.5 ? 240 : 190
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width)  p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},80%,70%,${p.o})`;
        ctx.fill();
      });
      // Draw connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${0.12 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none'
    }} />
  );
};

const StatCard = ({ value, label, onClick, delay = 0 }) => (
  <div
    className="card"
    style={{
      textAlign: 'center', cursor: onClick ? 'pointer' : 'default',
      animation: `fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}s both`,
      background: 'var(--surface)',
    }}
    onClick={onClick}
  >
    <div style={{
      fontSize: '2.2rem', fontWeight: 800,
      fontFamily: "'Syne', sans-serif",
      background: 'linear-gradient(135deg, #818cf8, #22d3ee)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      backgroundClip: 'text', letterSpacing: '-0.04em'
    }}>{value}</div>
    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{label}</div>
  </div>
);

const FeatureCard = ({ icon, title, desc, link, badge, delay = 0 }) => {
  const navigate = useNavigate();
  return (
    <div
      className="card"
      onClick={() => navigate(link)}
      style={{
        cursor: 'pointer',
        animation: `fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}s both`,
        position: 'relative', overflow: 'hidden'
      }}
    >
      {/* Hover glow orb */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80,
        background: 'radial-gradient(circle, rgba(99,102,241,0.2), transparent)',
        borderRadius: '50%', transition: 'transform 0.4s',
        pointerEvents: 'none'
      }} />
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: 'linear-gradient(135deg, var(--primary-light), rgba(34,211,238,0.1))',
        border: '1px solid var(--border-bright)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4rem', marginBottom: 14,
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)'
      }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15) rotate(-5deg)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >{icon}</div>
      <div style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1rem',
        marginBottom: 6, color: 'var(--text)', letterSpacing: '-0.01em'
      }}>{title}</div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.845rem', lineHeight: 1.6 }}>{desc}</p>
      {badge && (
        <span style={{
          position: 'absolute', top: 16, right: 16,
          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
          color: '#fff', fontSize: '0.65rem', fontWeight: 700,
          padding: '2px 8px', borderRadius: 999, letterSpacing: '0.06em',
          textTransform: 'uppercase'
        }}>{badge}</span>
      )}
      <div style={{ marginTop: 14, fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 4 }}>
        {link.includes('?tab=') ? '→ Profile' : '→ Explore'}
      </div>
    </div>
  );
};

const Home = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features = [
    { icon: '📝', titleKey: 'featureQATitle',      descKey: 'featureQADesc',      link: '/questions',         badge: 'Q&A',     delay: 0.05 },
    { icon: '🌐', titleKey: 'featureSocialTitle',   descKey: 'featureSocialDesc',  link: '/social',            badge: null,      delay: 0.10 },
    { icon: '💎', titleKey: 'featureSubTitle',      descKey: 'featureSubDesc',     link: '/subscription',      badge: 'Plans',   delay: 0.15 },
    { icon: '⭐', titleKey: 'featurePointsTitle',   descKey: 'featurePointsDesc',  link: '/profile?tab=points',badge: null,      delay: 0.20 },
    { icon: '🔐', titleKey: 'featureSecureTitle',   descKey: 'featureSecureDesc',  link: '/profile?tab=security', badge: null,  delay: 0.25 },
    { icon: '🌍', titleKey: 'featureLangTitle',     descKey: 'featureLangDesc',    link: '/profile?tab=language', badge: '6 lang', delay: 0.30 },
  ];

  return (
    <div>
      {/* ── HERO ─────────────────────────────────────── */}
      <div style={{
        position: 'relative', overflow: 'hidden', minHeight: 520,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(160deg, #06070f 0%, #0d0f1e 40%, #13152a 100%)',
        padding: '80px 24px'
      }}>
        <ParticleCanvas />
        {/* Decorative orbs */}
        <div style={{
          position: 'absolute', top: -80, left: -80,
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none', animation: 'orbFloat 6s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute', bottom: -60, right: -60,
          width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none', animation: 'orbFloat 8s ease-in-out infinite reverse'
        }} />
        <style>{`
          @keyframes orbFloat {
            0%,100% { transform: translate(0,0) scale(1); }
            50%      { transform: translate(20px,20px) scale(1.05); }
          }
          @keyframes heroTextIn {
            from { opacity:0; transform:translateY(30px); }
            to   { opacity:1; transform:translateY(0); }
          }
          @keyframes heroSubIn {
            from { opacity:0; transform:translateY(20px); }
            to   { opacity:1; transform:translateY(0); }
          }
        `}</style>

        <div style={{ textAlign: 'center', maxWidth: 720, position: 'relative', zIndex: 1 }}>
          {/* Pill label */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 999, padding: '5px 16px', marginBottom: 24,
            animation: 'heroTextIn 0.5s 0.1s both'
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22d3ee',
              boxShadow: '0 0 8px #22d3ee', display: 'inline-block', animation: 'pointsGlow 2s infinite' }} />
            <span style={{ fontSize: '0.78rem', color: '#a5b4fc', fontWeight: 600, letterSpacing: '0.06em',
              textTransform: 'uppercase' }}>Live Community Platform</span>
          </div>

          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(2.2rem, 6vw, 4rem)',
            fontWeight: 800, lineHeight: 1.1,
            letterSpacing: '-0.04em',
            marginBottom: 20,
            animation: 'heroTextIn 0.6s 0.2s both'
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #f1f5f9, #cbd5e1)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>Connect. Learn.</span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #22d3ee 50%, #f472b6 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>Grow Together.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: 'var(--text-muted)',
            marginBottom: 36, lineHeight: 1.7, maxWidth: 540, margin: '0 auto 36px',
            animation: 'heroSubIn 0.6s 0.35s both'
          }}>
            {t('heroSubtitle')}
          </p>

          {user ? (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap',
              animation: 'heroSubIn 0.6s 0.45s both' }}>
              {[
                { label: `👋 ${user.name}`, bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.35)' },
                { label: `💎 ${user.subscription?.plan || 'free'} ${t('plan')}`, bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)', cap: true },
                { label: `⭐ ${user.points || 0} ${t('points')}`, bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' }
              ].map((chip, i) => (
                <span key={i} style={{
                  background: chip.bg, border: `1px solid ${chip.border}`,
                  padding: '9px 20px', borderRadius: 999, fontWeight: 600,
                  fontSize: '0.875rem', color: 'var(--text)',
                  textTransform: chip.cap ? 'capitalize' : 'none',
                  backdropFilter: 'blur(8px)'
                }}>{chip.label}</span>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap',
              animation: 'heroSubIn 0.6s 0.45s both' }}>
              <Link to="/register" className="btn btn-primary btn-lg"
                style={{ fontSize: '1rem', padding: '13px 36px' }}>
                {t('getStartedFree')} →
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg"
                style={{ fontSize: '1rem', padding: '13px 36px' }}>
                {t('signIn')}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────── */}
      <div className="container">
        {/* Stats */}
        {user && (
          <div className="grid-3" style={{ marginBottom: 40 }}>
            <StatCard value={user.points || 0} label={t('totalPoints')}
              onClick={() => navigate('/profile?tab=points')} delay={0} />
            <StatCard value={(user.subscription?.plan || 'free').toUpperCase()} label={t('currentPlan')}
              onClick={() => navigate('/subscription')} delay={0.06} />
            <StatCard value={user.friends?.length || 0} label={t('friends')}
              onClick={() => navigate('/profile?tab=friends')} delay={0.12} />
          </div>
        )}

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontSize: '1.6rem', fontWeight: 800,
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, var(--text), var(--text-muted))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
          }}>{t('platformFeatures')}</h2>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--border-bright), transparent)' }} />
        </div>

        <div className="grid-3 stagger">
          {features.map((f, i) => (
            <FeatureCard
              key={i}
              icon={f.icon}
              title={t(f.titleKey)}
              desc={t(f.descKey)}
              link={f.link}
              badge={f.badge}
              delay={f.delay}
            />
          ))}
        </div>

        {/* Bottom CTA for non-logged users */}
        {!user && (
          <div style={{
            marginTop: 60, padding: '48px 40px', textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(34,211,238,0.05))',
            border: '1px solid var(--border-bright)', borderRadius: 'var(--radius-xl)',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
              width: 300, height: 150,
              background: 'radial-gradient(ellipse, rgba(99,102,241,0.2), transparent)',
              pointerEvents: 'none'
            }} />
            <h3 style={{
              fontFamily: "'Syne', sans-serif", fontSize: '1.8rem', fontWeight: 800,
              marginBottom: 12, letterSpacing: '-0.03em'
            }}>
              <span className="gradient-text">Ready to join BrainLink?</span>
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: '1rem' }}>
              Free forever. Upgrade when you need more.
            </p>
            <Link to="/register" className="btn btn-primary btn-lg">
              Create Free Account →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
