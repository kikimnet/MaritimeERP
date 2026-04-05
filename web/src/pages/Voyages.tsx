import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Map, Plus, Ship, Navigation } from 'lucide-react';
import api from '../api';

const Voyages: React.FC = () => {
    const [voyages, setVoyages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVoyages = async () => {
            try {
                const res = await api.get('/voyages');
                setVoyages(res.data);
            } catch (err) {
                console.error("Failed to load voyages", err);
            } finally {
                setLoading(false);
            }
        };
        fetchVoyages();
    }, []);

    const getStatusBadge = (status: string) => {
        const statusMap: any = {
            'planned': { label: 'Planifié', col: '#cbd5e1' },
            'confirmed': { label: 'Confirmé', col: '#fbbf24' },
            'in_progress': { label: 'En cours', col: '#60a5fa' },
            'in_port': { label: 'En escale', col: '#a78bfa' },
            'arrived': { label: 'Arrivé', col: '#34d399' },
            'closed': { label: 'Clôturé', col: '#94a3b8' }
        };
        const st = statusMap[status] || { label: status, col: '#fff' };
        return <span style={{ padding: '4px 8px', borderRadius: '12px', background: `${st.col}20`, color: st.col, fontSize: '12px', fontWeight: 600 }}>{st.label}</span>;
    };

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'var(--accent)', padding: '12px', borderRadius: '12px', display: 'flex' }}>
                        <Map size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '24px', color: 'var(--text-primary)' }}>Voyages Actifs</h1>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Centre de contrôle des expéditions</p>
                    </div>
                </div>
                <NavLink to="/voyages/new" style={{ textDecoration: 'none' }}>
                    <button className="primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} />
                        Nouveau Voyage
                    </button>
                </NavLink>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Chargement des voyages...</div>
            ) : voyages.length === 0 ? (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderRadius: '20px' }}>
                    <Map size={48} style={{ color: 'var(--text-secondary)', marginBottom: '16px', opacity: 0.5 }} />
                    <h3 style={{ color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Aucun voyage actif</h3>
                    <p style={{ color: 'var(--text-secondary)', margin: '0 0 24px 0' }}>Commencez par planifier une nouvelle expédition.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {voyages.map((v) => (
                        <div key={v.id} className="voyage-card glass-panel" style={{ padding: '0', overflow: 'hidden', borderRadius: '20px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{v.voyage_number}</h3>
                                        {true && <span style={{ fontSize: '10px', background: 'var(--accent)', color: 'white', padding: '2px 6px', borderRadius: '6px' }}>IA {v.ai_scenario_id ? 'Approuvé' : 'Assisté'}</span>}
                                    </div>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Ship size={14} /> {v.vessel_name} ({v.voyage_type})
                                    </p>
                                </div>
                                {getStatusBadge(v.status)}
                            </div>
                            
                            <div style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{v.port_of_departure}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Départ</div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                        <Navigation size={20} style={{ color: 'var(--accent)', marginBottom: '8px' }} />
                                        <div style={{ height: '2px', background: 'var(--border-color)', width: '100%' }}></div>
                                    </div>
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{v.port_of_arrival}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Arrivée</div>
                                    </div>
                                </div>

                                <NavLink to={`/voyages/${v.id}`} style={{ textDecoration: 'none' }}>
                                    <button style={{ 
                                        width: '100%', marginTop: '24px', background: 'rgba(255,255,255,0.05)', 
                                        border: '1px solid var(--border-color)', color: 'var(--text-primary)',
                                        padding: '12px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => Object.assign(e.currentTarget.style, { background: 'rgba(255,255,255,0.1)' })}
                                    onMouseOut={(e) => Object.assign(e.currentTarget.style, { background: 'rgba(255,255,255,0.05)' })}>
                                        Tableau de Bord Voyage
                                    </button>
                                </NavLink>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Voyages;
