import React from 'react';
import { useTranslation } from 'react-i18next';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: '24px' }}>{t('dashboard.title')}</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>{t('dashboard.activeContracts')}</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold', marginTop: '12px', color: 'var(--accent)' }}>124</p>
        </div>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>{t('dashboard.vesselsAtSea')}</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold', marginTop: '12px', color: 'var(--success)' }}>18</p>
        </div>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>{t('dashboard.leaveAlerts')}</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold', marginTop: '12px', color: 'var(--danger)' }}>3</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
