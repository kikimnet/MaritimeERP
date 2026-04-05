import React, { useState, useEffect } from 'react';
import { PlusCircle, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Interfaces based on the MLC 2006 compliance
interface ContractForm {
  sailor_id: string;
  vessel_id: string;
  contract_type: string;
  start_date: string;
  end_date: string;
  port_sign_on: string;
  port_sign_off: string;
}

const DESGAGNES_FLEET = [
  { id: '1', name: 'Acadia Desgagnés', type: 'Cargo' },
  { id: '2', name: 'Annette A. Desgagnés', type: 'Cargo' },
  { id: '3', name: 'Argentia Desgagnés', type: 'Cargo' },
  { id: '4', name: 'Bella Desgagnés', type: 'Cargo/Passenger' },
  { id: '5', name: 'Berthe A. Desgagnés', type: 'Cargo' },
  { id: '6', name: 'Claude A. Desgagnés', type: 'Cargo' },
  { id: '7', name: 'Marcellin A. Desgagnés', type: 'Cargo' },
  { id: '8', name: 'Miena Desgagnés', type: 'Tanker' },
  { id: '9', name: 'Nordika Desgagnés', type: 'Cargo' },
  { id: '10', name: 'Rosaire A. Desgagnés', type: 'Cargo' },
  { id: '11', name: 'Sedna Desgagnés', type: 'Cargo' },
  { id: '12', name: 'Taïga Desgagnés', type: 'Cargo' },
  { id: '13', name: 'Zelada Desgagnés', type: 'Cargo' }
];

const Contracts: React.FC = () => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [portQuery, setPortQuery] = useState('');
  const [portSuggestions, setPortSuggestions] = useState<string[]>([]);
  const [formData, setFormData] = useState<ContractForm>({
    sailor_id: '',
    vessel_id: '',
    contract_type: 'CDD',
    start_date: '',
    end_date: '',
    port_sign_on: '',
    port_sign_off: ''
  });

  // Simulation of port API autocomplete triggering after 4 characters
  useEffect(() => {
    if (portQuery.length >= 4) {
      // Simulate API call to fetch ports
      const fakePorts = ['Port de Montréal', 'Port de Québec', 'Port of Houston', 'Port of Antwerp', 'Port of Singapore'];
      const filtered = fakePorts.filter(p => p.toLowerCase().includes(portQuery.toLowerCase()));
      setPortSuggestions(filtered);
    } else {
      setPortSuggestions([]);
    }
  }, [portQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      alert("Erreur: La date de fin doit être strictement supérieure à la date de début (Conformité MLC 2006).");
      return;
    }
    
    // Simuler un appel API POST backend
    try {
      console.log('Deploying to API...', formData);
      alert('Contrat enregistré avec succès ! (Simulation)');
      setShowForm(false);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la création du contrat.');
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1>{t('contracts.title')}</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <PlusCircle size={18} />
          {t('contracts.newContract')}
        </button>
      </div>

      {showForm && (
        <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px' }}>
          <h2 style={{ marginBottom: '24px', color: 'var(--accent)' }}>{t('contracts.formTitle')}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('contracts.crewMember')}</label>
              <input 
                type="text" 
                required
                className="input-field" 
                placeholder={t('contracts.crewMemberPlaceholder')}
                value={formData.sailor_id}
                onChange={e => setFormData({...formData, sailor_id: e.target.value})}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('contracts.vessel')}</label>
              <select 
                required
                className="input-field"
                value={formData.vessel_id}
                onChange={e => setFormData({...formData, vessel_id: e.target.value})}
              >
                <option value="" disabled>{t('contracts.selectVessel')}</option>
                {DESGAGNES_FLEET.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.type})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('contracts.startDate')}</label>
              <input 
                type="date" 
                required
                className="input-field" 
                value={formData.start_date}
                onChange={e => setFormData({...formData, start_date: e.target.value})}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('contracts.endDate')}</label>
              <input 
                type="date" 
                required
                className="input-field" 
                value={formData.end_date}
                onChange={e => setFormData({...formData, end_date: e.target.value})}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('contracts.portSignOn')}</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  required
                  className="input-field" 
                  style={{ paddingLeft: '36px' }}
                  placeholder={t('contracts.portSignOnPlaceholder')}
                  value={portQuery}
                  onChange={e => {
                    setPortQuery(e.target.value);
                    setFormData({...formData, port_sign_on: e.target.value});
                  }}
                />
              </div>
              {portSuggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '8px', zIndex: 10, marginTop: '4px' }}>
                  {portSuggestions.map(p => (
                    <div 
                      key={p} 
                      style={{ padding: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
                      onClick={() => {
                        setFormData({...formData, port_sign_on: p});
                        setPortQuery(p);
                        setPortSuggestions([]);
                      }}
                    >
                      {p}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('contracts.portSignOff')}</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder={t('contracts.portSignOffPlaceholder')}
                value={formData.port_sign_off}
                onChange={e => setFormData({...formData, port_sign_off: e.target.value})}
              />
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                {t('contracts.submit')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mock Table */}
      <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('contracts.table.sailor')}</th>
              <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('contracts.table.vessel')}</th>
              <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('contracts.table.dates')}</th>
              <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('contracts.table.portOn')}</th>
              <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('contracts.table.status')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '16px' }}>Marc Tremblay</td>
              <td style={{ padding: '16px' }}>M/T Damia Desgagnés</td>
              <td style={{ padding: '16px' }}>01/04/2026 - 30/06/2026</td>
              <td style={{ padding: '16px' }}>Port de Montréal</td>
              <td style={{ padding: '16px' }}><span style={{ padding: '4px 8px', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)', borderRadius: '12px', fontSize: '12px' }}>{t('contracts.table.active')}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Contracts;
