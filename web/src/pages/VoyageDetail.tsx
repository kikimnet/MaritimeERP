import React, { useEffect, useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { Map, ArrowLeft, Anchor, Navigation, Calendar, Clock, AlertTriangle } from 'lucide-react';
import api from '../api';

const VoyageDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [voyage, setVoyage] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await api.get(`/voyages/${id}`);
                setVoyage(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Chargement du voyage...</div>;
    if (!voyage) return <div style={{ padding: '24px', textAlign: 'center' }}>Voyage introuvable.</div>;

    return (
        <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <NavLink to="/voyages" style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '50%', display: 'flex' }}>
                    <ArrowLeft size={20} />
                </NavLink>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px', color: 'var(--text-primary)' }}>{voyage.voyage_number}</h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{voyage.vessel_name} • {voyage.voyage_type.toUpperCase()}</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
                {/* Left Panel: Tabs & Data */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', paddingRight: '12px' }}>
                    
                    {/* Basic info */}
                    <div className="glass-panel" style={{ padding: '20px' }}>
                        <h2 style={{ fontSize: '18px', margin: '0 0 16px 0', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <Anchor size={20} className="text-accent" /> Route Planifiée
                        </h2>
                        
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '16px' }}>
                            <div style={{ flex: 1 }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>DÉPART</span>
                                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{voyage.port_of_departure}</div>
                                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                    <Calendar size={14} /> {new Date(voyage.etd_planned).toLocaleDateString()}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', color: 'var(--accent)' }}>
                                <Navigation size={24} />
                            </div>
                            <div style={{ flex: 1, textAlign: 'right' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ARRIVÉE EST.</span>
                                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{voyage.port_of_arrival}</div>
                                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '4px' }}>
                                    <Clock size={14} /> {new Date(voyage.eta_planned).toLocaleDateString()}
                                </div>
                            </div>
                        </div>

                        {voyage.waypoints?.length > 0 && (
                            <div style={{ marginTop: '24px' }}>
                                <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>ESCALES ({voyage.waypoints.length})</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {voyage.waypoints.map((w: any) => (
                                        <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                                            <span style={{ fontWeight: 500 }}>{w.port_locode} / {w.terminal || 'Poste par défaut'}</span>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{new Date(w.eta_planned).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="glass-panel" style={{ padding: '20px', flex: 1 }}>
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', paddingTop: '40px' }}>
                            Sous-modules (Noon Reports, Documents, Escales M4) en construction.
                        </div>
                    </div>
                </div>

                {/* Right Panel: Mapbox placeholder */}
                <div style={{ flex: 1, borderRadius: '20px', overflow: 'hidden', position: 'relative', background: '#1e293b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                    <Map size={64} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '16px' }} />
                    <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>Carte Interactive en direct</h3>
                    <p style={{ color: 'var(--text-secondary)', opacity: 0.6, fontSize: '14px', maxWidth: '300px', textAlign: 'center' }}>L'intégration Mapbox GL JS affichera la route planifiée (bleu tireté) et la trace AIS temps réel (vert) ici.</p>
                    
                    {voyage.ai_scenario_id && (
                        <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', padding: '16px', borderRadius: '12px', border: '1px solid var(--accent)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 'bold', marginBottom: '8px' }}>
                                <AlertTriangle size={16} /> IA Optimiseur Actif
                            </div>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Ce voyage suit le scénario IA validé par l'opérateur. Les alertes de déviation sont activées sur les KPI de ce scénario.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VoyageDetail;
