import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Ship, Users, FileCheck, Anchor, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const VesselDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  
  const [vessel, setVessel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [showEditForm, setShowEditForm] = useState(false);
  const [editVessel, setEditVessel] = useState({ name: '', imo: '', type: '', flag: '', dwt: '', yearBuilt: '', imageUrl: '', technicalSheetUrl: '', status: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchVessel = async () => {
      try {
        const { data } = await api.get(`/fleet/${id}`);
        setVessel({
          id: data.id,
          name: data.name,
          imo: data.imo_number,
          type: data.vessel_type,
          flag: data.flag,
          dwt: data.dwt,
          yearBuilt: data.year_built,
          status: data.status,
          image_url: data.image_url,
          technical_sheet_url: data.technical_sheet_url,
          currentCrew: data.currentCrew || 0
        });
      } catch (err) {
        console.error('Failed to fetch vessel', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchVessel();
  }, [id]);

  const handleEditClick = () => {
    setEditVessel({
      name: vessel.name || '',
      imo: vessel.imo || '',
      type: vessel.type || '',
      flag: vessel.flag || '',
      dwt: vessel.dwt || '',
      yearBuilt: vessel.yearBuilt || '',
      imageUrl: vessel.image_url || '',
      technicalSheetUrl: vessel.technical_sheet_url || '',
      status: vessel.status || 'IN TRANSIT'
    });
    setShowEditForm(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.put(`/fleet/${id}`, editVessel);
      const updatedData = res.data;
      setVessel({
        ...vessel,
        name: updatedData.name,
        imo: updatedData.imo_number,
        type: updatedData.vessel_type,
        flag: updatedData.flag,
        dwt: updatedData.dwt,
        yearBuilt: updatedData.year_built,
        status: updatedData.status,
        image_url: updatedData.image_url,
        technical_sheet_url: updatedData.technical_sheet_url
      });
      setShowEditForm(false);
    } catch (err) {
      console.error('Failed to update vessel', err);
      alert('Error updating vessel');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;
  if (!vessel) return <div style={{ padding: '24px' }}>Vessel not found</div>;

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate('/fleet')} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={18} />
            {t('fleet.vesselDetail.back')}
          </button>
          <h1 style={{ margin: 0 }}>{t('fleet.vesselDetail.title')} : {vessel.name}</h1>
        </div>
        
        {isAdmin && (
          <button className="btn-primary" onClick={handleEditClick} style={{ background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent)', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
            <Edit2 size={18} />
            Modifier le navire
          </button>
        )}
      </div>

      {vessel.image_url ? (
        <div className="glass-panel" style={{ width: '100%', maxHeight: '450px', marginBottom: '24px', borderRadius: '16px', overflow: 'hidden', display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
          <img src={vessel.image_url} alt={vessel.name} style={{ maxWidth: '100%', maxHeight: '450px', objectFit: 'contain' }} />
        </div>
      ) : (
        <div className="glass-panel" style={{ width: '100%', height: '350px', marginBottom: '24px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          <Ship size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <span style={{ fontSize: '18px' }}>Photo non disponible</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent)' }}>
              <Ship size={24} />
              <h2 style={{ fontSize: '20px' }}>{t('fleet.vesselDetail.specifications')}</h2>
            </div>
            {vessel.technical_sheet_url && (
              <a 
                href={vessel.technical_sheet_url.startsWith('http') ? vessel.technical_sheet_url : (vessel.technical_sheet_url.startsWith('/') ? `https://desgagnes.com${vessel.technical_sheet_url}` : `https://desgagnes.com/${vessel.technical_sheet_url}`)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-primary" 
                style={{ background: '#e11d48', color: 'white', textDecoration: 'none', padding: '8px 16px', fontSize: '14px', border: 'none' }}
              >
                Fiche Technique (PDF)
              </a>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', color: 'var(--text-secondary)' }}>
            <div>
              <p style={{ fontSize: '12px', textTransform: 'uppercase' }}>{t('fleet.form.imo')}</p>
              <p style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '16px' }}>{vessel.imo}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', textTransform: 'uppercase' }}>{t('fleet.form.type')}</p>
              <p style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '16px' }}>{vessel.type}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', textTransform: 'uppercase' }}>{t('fleet.form.dwt')}</p>
              <p style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '16px' }}>{vessel.dwt} MT</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', textTransform: 'uppercase' }}>{t('fleet.form.yearBuilt')}</p>
              <p style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '16px' }}>{vessel.yearBuilt}</p>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: 'var(--success)' }}>
            <Anchor size={24} />
            <h2 style={{ fontSize: '20px' }}>{t('fleet.vesselDetail.currentStatus')}</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
             <div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</p>
                <span style={{ display: 'inline-block', marginTop: '4px', padding: '6px 12px', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent)', borderRadius: '20px', fontSize: '14px', fontWeight: 600 }}>
                  {vessel.status}
                </span>
             </div>
             <div style={{ display: 'flex', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}><Users size={20} color="var(--text-primary)" /></div>
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('fleet.vesselDetail.crewOnboard')}</p>
                    <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{vessel.currentCrew}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}><FileCheck size={20} color="var(--success)" /></div>
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('fleet.vesselDetail.certificates')}</p>
                    <p style={{ fontSize: '18px', fontWeight: 'bold' }}>Valid</p>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {showEditForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '700px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '24px', color: 'var(--accent)' }}>Modifier le Navire</h2>
            <form onSubmit={handleEditSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('fleet.form.name')}</label>
                <input type="text" required className="input-field" value={editVessel.name} onChange={e => setEditVessel({...editVessel, name: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('fleet.form.imo')}</label>
                <input type="text" required className="input-field" value={editVessel.imo} onChange={e => setEditVessel({...editVessel, imo: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('fleet.form.type')}</label>
                <select required className="input-field" value={editVessel.type} onChange={e => setEditVessel({...editVessel, type: e.target.value})}>
                  <option value="Cargo">Cargo</option>
                  <option value="Tanker">Tanker</option>
                  <option value="Passenger">Passenger</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('fleet.form.flag')}</label>
                <input type="text" required className="input-field" value={editVessel.flag} onChange={e => setEditVessel({...editVessel, flag: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('fleet.form.dwt')}</label>
                <input type="number" min="0" required className="input-field" value={editVessel.dwt} onChange={e => setEditVessel({...editVessel, dwt: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('fleet.form.yearBuilt')}</label>
                <input type="number" min="1900" max="2100" required className="input-field" value={editVessel.yearBuilt} onChange={e => setEditVessel({...editVessel, yearBuilt: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Statut Actuel</label>
                <select required className="input-field" value={editVessel.status} onChange={e => setEditVessel({...editVessel, status: e.target.value})}>
                  <option value="IN TRANSIT">IN TRANSIT</option>
                  <option value="MOORED">MOORED</option>
                  <option value="AT ANCHOR">AT ANCHOR</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Image URL (Optionnel)</label>
                <input type="url" className="input-field" value={editVessel.imageUrl} onChange={e => setEditVessel({...editVessel, imageUrl: e.target.value})} placeholder="https://..." />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Lien Fiche Technique PDF (Optionnel)</label>
                <input type="url" className="input-field" value={editVessel.technicalSheetUrl} onChange={e => setEditVessel({...editVessel, technicalSheetUrl: e.target.value})} placeholder="https://..." />
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} onClick={() => setShowEditForm(false)}>
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ width: 'auto', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default VesselDetail;
