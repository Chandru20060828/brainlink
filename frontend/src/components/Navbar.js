import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => setMenuOpen(false), [location]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (path) =>
    location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar" style={{
      boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.5)' : 'none',
      transition: 'box-shadow 0.3s'
    }}>
      <Link to="/" className="navbar-brand">
        <span className="logo-icon">⚡</span>
        BrainLink
      </Link>

      <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
        <span style={{ display: 'block', transition: 'transform 0.2s', transform: menuOpen ? 'rotate(90deg)' : 'none' }}>
          {menuOpen ? '✕' : '☰'}
        </span>
      </button>

      <div className={`navbar-nav${menuOpen ? ' open' : ''}`}>
        <Link to="/" className={isActive('/')}>{t('home')}</Link>
        <Link to="/questions" className={isActive('/questions')}>{t('questions')}</Link>
        {user && <Link to="/social" className={isActive('/social')}>{t('social')}</Link>}

        {user ? (
          <>
            <Link to="/profile" className={isActive('/profile')}>{t('profile')}</Link>
            <Link to="/subscription" className={isActive('/subscription')}>{t('subscription')}</Link>
            <span className="points-badge">⭐ {user.points || 0}</span>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}
              style={{ borderColor: 'rgba(244,63,94,0.4)', color: '#fb7185' }}>
              {t('logout')}
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline btn-sm">{t('login')}</Link>
            <Link to="/register" className="btn btn-primary btn-sm">{t('register')}</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
