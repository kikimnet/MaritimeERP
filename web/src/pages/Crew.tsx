import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, PlusCircle, Users } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Crew: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [crew, setCrew] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCrew = async () => {
      try {
        const { data } = await api.get('/crew');
        setCrew(data);
      } catch (err) {
        console.error('Failed to fetch crew', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCrew();
  }, []);

  const filteredCrew = crew.filter(c => 
    c.first_name.toLowerCase().includes(search.toLowerCase()) || 
    c.last_name.toLowerCase().includes(search.toLowerCase()) ||
    c.rank.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Users size={24} color="#3b82f6" />
          </div>
          <h1 style={{ margin: 0 }}>Dossier Équipage</h1>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Rechercher (Nom, Grade)..." 
              style={{ paddingLeft: '40px', width: '250px' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {isAdmin && (
            <button className="btn-primary">
              <PlusCircle size={18} />
              Ajouter Membre
            </button>
          )}
          <button className="btn-primary" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            <Filter size={18} />
            Filtres
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '24px' }}>Chargement...</div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '16px', fontWeight: 500 }}>Nom Complet</th>
                <th style={{ padding: '16px', fontWeight: 500 }}>Grade (Rank)</th>
                <th style={{ padding: '16px', fontWeight: 500 }}>Nat.</th>
                <th style={{ padding: '16px', fontWeight: 500 }}>Statut Actuel</th>
                <th style={{ padding: '16px', fontWeight: 500 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCrew.map((member) => (
                <tr key={member.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {member.photo_url ? (
                        <img src={member.photo_url} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', background: 'rgba(255,255,255,0.1)' }} />
                      ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                           {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                        </div>
                      )}
                      <span>{member.first_name} {member.last_name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                     <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '12px' }}>
                        {member.rank}
                     </span>
                  </td>
                  <td style={{ padding: '16px' }}>{member.nationality}</td>
                  <td style={{ padding: '16px' }}>
                    {member.status === 'ON BOARD' ? (
                      <div>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', marginRight: '8px' }}></span>
                        {member.vessel_name}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-secondary)', marginRight: '8px' }}></span>
                        En congé
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <button 
                      onClick={() => navigate(`/crew/${member.id}`)}
                      style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                    >
                      Dossier Complet
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCrew.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Aucun membre trouvé
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Crew;
