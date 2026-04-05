import React, { useState, useEffect } from 'react';
import { Ship, Filter, Search, MapPin, PlusCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Fleet: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVessel, setNewVessel] = useState({ name: '', imo: '', type: 'Cargo', flag: 'CA', dwt: '', yearBuilt: '', imageUrl: '', technicalSheetUrl: '' });
  const [vessels, setVessels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVessels = async () => {
      try {
        const res = await api.get('/fleet');
        const formatted = res.data.map((v: any) => ({
          id: v.id,
          name: v.name,
          imo: v.imo_number,
          type: v.vessel_type,
          flag: v.flag,
          status: v.status || 'IN TRANSIT',
          image_url: v.image_url,
          technical_sheet_url: v.technical_sheet_url,
          nextPort: 'TBD', // In a full app, this comes from voyages query
          eta: '-'
        }));
        console.log("Vessels fetched:", formatted);
        setVessels(formatted);
      } catch (err) {
        console.error('Failed to fetch vessels', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVessels();
  }, []);

  const filteredVessels = vessels.filter(v => v.name.toLowerCase().includes(search.toLowerCase()));

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'IN TRANSIT': return 'var(--accent)';
      case 'MOORED': return 'var(--success)';
      case 'AT ANCHOR': return '#f59e0b';
      default: return 'var(--text-secondary)';
    }
  };

  const translateStatus = (status: string) => {
    switch(status) {
      case 'IN TRANSIT': return t('fleet.status.transit');
      case 'MOORED': return t('fleet.status.moored');
      case 'AT ANCHOR': return t('fleet.status.anchor');
      default: return status;
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/fleet', newVessel);
      const added = {
        id: res.data.id,
        name: res.data.name,
        imo: res.data.imo_number,
        type: res.data.vessel_type,
        flag: res.data.flag,
        status: res.data.status,
        image_url: res.data.image_url,
        technical_sheet_url: res.data.technical_sheet_url,
        nextPort: 'TBD',
        eta: '-'
      };
      setVessels([...vessels, added]);
      setShowAddForm(false);
      setNewVessel({ name: '', imo: '', type: 'Cargo', flag: 'CA', dwt: '', yearBuilt: '', imageUrl: '', technicalSheetUrl: '' });
    } catch (err) {
      console.error('Failed to add vessel', err);
      alert('Error creating vessel via API');
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1>{t('fleet.title')}</h1>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder={t('fleet.search')} 
              style={{ paddingLeft: '40px', width: '250px' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {isAdmin && (
            <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
              <PlusCircle size={18} />
              {t('fleet.addVessel')}
            </button>
          )}
          <button className="btn-primary" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            <Filter size={18} />
            {t('fleet.filters')}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px' }}>
          <h2 style={{ marginBottom: '24px', color: 'var(--accent)' }}>{t('fleet.form.title')}</h2>
          <form onSubmit={handleAddSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('fleet.form.name')}</label>
              <input type="text" required className="input-field" value={newVessel.name} onChange={e => setNewVessel({...newVessel, name: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('fleet.form.imo')}</label>
              <input type="text" required className="input-field" value={newVessel.imo} onChange={e => setNewVessel({...newVessel, imo: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('fleet.form.type')}</label>
              <select required className="input-field" value={newVessel.type} onChange={e => setNewVessel({...newVessel, type: e.target.value})}>
                <option value="Cargo">Cargo</option>
                <option value="Tanker">Tanker</option>
                <option value="Passenger">Passenger</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('fleet.form.flag')}</label>
              <input type="text" required className="input-field" value={newVessel.flag} onChange={e => setNewVessel({...newVessel, flag: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('fleet.form.dwt')}</label>
              <input type="number" min="0" placeholder="Ex: 15000" required className="input-field" value={newVessel.dwt} onChange={e => setNewVessel({...newVessel, dwt: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('fleet.form.yearBuilt')}</label>
              <input type="number" min="1900" max="2100" placeholder="Ex: 2015" required className="input-field" value={newVessel.yearBuilt} onChange={e => setNewVessel({...newVessel, yearBuilt: e.target.value})} />
            </div>
            <div style={{ gridColumn: 'span 1' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Image URL (Optionnel)</label>
              <input type="url" className="input-field" value={newVessel.imageUrl} onChange={e => setNewVessel({...newVessel, imageUrl: e.target.value})} placeholder="https://..." />
            </div>
            <div style={{ gridColumn: 'span 1' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Lien Fiche Technique PDF (Optionnel)</label>
              <input type="url" className="input-field" value={newVessel.technicalSheetUrl} onChange={e => setNewVessel({...newVessel, technicalSheetUrl: e.target.value})} placeholder="https://..." />
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button type="button" className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} onClick={() => setShowAddForm(false)}>
                {t('fleet.form.cancel')}
              </button>
              <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                {t('fleet.form.submit')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
        {filteredVessels.map(vessel => (
          <div key={vessel.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {vessel.image_url ? (
              <div style={{ width: '100%', height: '180px', borderRadius: '12px', overflow: 'hidden', marginBottom: '8px' }}>
                <img src={vessel.image_url} alt={vessel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div style={{ width: '100%', height: '180px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                <Ship size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <span style={{ fontSize: '13px' }}>Photo non disponible</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', margin: '0 0 4px 0' }}>{vessel.name}</h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span>IMO: {vessel.imo}</span>
                    <span>•</span>
                    <span>{vessel.type}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(vessel.status) }}></div>
                <span style={{ color: getStatusColor(vessel.status), fontWeight: 500 }}>{translateStatus(vessel.status)}</span>
                <span style={{ color: 'var(--text-secondary)' }}>({t('fleet.flag')}: {vessel.flag})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <MapPin size={16} />
                {t('fleet.dest')} <strong style={{ color: 'var(--text-primary)' }}>{vessel.nextPort}</strong> ({t('fleet.eta')} {vessel.eta})
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-primary" style={{ flex: 1, padding: '8px', fontSize: '13px' }} onClick={() => navigate(`/fleet/${vessel.id}`)}>
                {t('fleet.details')}
              </button>
              <button className="btn-primary" style={{ flex: 1, padding: '8px', fontSize: '13px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                {t('fleet.positioning')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Fleet;
