import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Anchor, LayoutDashboard, FileText, Anchor as ShipIcon, Users, Globe, Map } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="app-container">
      <aside className="sidebar glass-panel" style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: 'none' }}>
        <div className="brand" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.png" alt="MareLinx 1.0" style={{ height: '40px', objectFit: 'contain' }} />
          </div>
          <button onClick={toggleLanguage} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Globe size={18} />
            <span style={{ fontSize: '12px', fontWeight: 600 }}>{t('nav.switchLanguage')}</span>
          </button>
        </div>
        
        <nav>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            {t('nav.dashboard')}
          </NavLink>
          <NavLink to="/voyages" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Map size={20} />
            Voyages
          </NavLink>
          <NavLink to="/contracts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <FileText size={20} />
            {t('nav.contracts')}
          </NavLink>
          <NavLink to="/fleet" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <ShipIcon size={20} />
            {t('nav.fleet')}
          </NavLink>
          <NavLink to="/crew" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Users size={20} />
            {t('nav.crew')}
          </NavLink>
        </nav>
        
        <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px dashed var(--border-color)' }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
                <div>
                  <p style={{ fontSize: '14px', margin: 0, fontWeight: 500, color: 'var(--text-primary)' }}>{user?.firstName}</p>
                  <p style={{ fontSize: '12px', margin: 0, color: 'var(--accent)' }}>{user?.role}</p>
                </div>
              </div>
              <button 
                onClick={logout} 
                className="nav-link" 
                style={{ background: 'transparent', border: 'none', color: '#ef4444', width: '100%', justifyContent: 'flex-start', cursor: 'pointer' }}
              >
                Déconnexion
              </button>
            </div>
          ) : (
             <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ color: 'var(--accent)' }}>
              Connexion Admin
            </NavLink>
          )}
        </div>
      </aside>
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
