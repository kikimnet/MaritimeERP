import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Bot, CheckCircle, Ship, MapPin, Zap, BrainCircuit, Activity } from 'lucide-react';
import api from '../api';

const cssLoader = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

const VoyageBuilder: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    
    // Core states
    const [fleet, setFleet] = useState<any[]>([]);
    const [form, setForm] = useState({
        voyage_number: `VY-${new Date().getFullYear()}-${Math.floor(Math.random()*10000).toString().padStart(4, '0')}`,
        vessel_id: '',
        voyage_type: 'cargo',
        port_of_departure: '',
        port_of_arrival: '',
        etd_planned: '',
        eta_planned: ''
    });

    // AI States
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [scenarios, setScenarios] = useState<any>(null);
    const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
    const [aiSessionId, setAiSessionId] = useState<string | null>(null);

    useEffect(() => {
        const loadFleet = async () => {
            try {
                const res = await api.get('/fleet');
                setFleet(res.data);
                if (res.data.length > 0) setForm(f => ({...f, vessel_id: res.data[0].id}));
            } catch (err) {}
        };
        loadFleet();
    }, []);

    const handleOptimize = async () => {
        setIsOptimizing(true);
        try {
            const res = await api.post('/voyages/optimize', {
                vessel_id: form.vessel_id,
                port_of_departure: form.port_of_departure,
                port_of_arrival: form.port_of_arrival,
                waypoints: [], // Empty for simplistic manual MVP
                operator_constraints: {}
            });
            setScenarios(res.data.scenarios);
            setAiSessionId(res.data.session_id);
            setStep(3);
        } catch (err) {
            console.error("AI Optimization failed", err);
            alert("L'optimisation IA est temporairement indisponible.");
            setStep(3); // Proceed to manual anyway
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleCreateVoyage = async () => {
        try {
            let finalScenarioId = null;
            let speed = 12.0;

            if (selectedScenario && scenarios) {
                // Submit AI selection
                await api.post(`/voyages/optimize/${aiSessionId}/select`, {
                    selected_scenario: selectedScenario,
                    overrides: {}
                });
                finalScenarioId = aiSessionId;
                speed = scenarios[selectedScenario].kpis.cruising_speed_knots;
            }

            const res = await api.post('/voyages', {
                ...form,
                speed_planned: speed,
                ai_scenario_id: finalScenarioId,
                operator_id: null // Ideally from auth context
            });

            navigate(`/voyages/${res.data.id}`);
        } catch (err) {
            console.error("Creation failed", err);
            alert("Erreur lors de la création du voyage");
        }
    };

    const renderAICard = (key: string, s: any) => {
        const isSelected = selectedScenario === key;
        
        return (
            <div 
                key={key} 
                className={`glass-panel ${isSelected ? 'selected' : ''}`}
                style={{ 
                    flex: 1, 
                    cursor: 'pointer', 
                    border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                    opacity: selectedScenario && !isSelected ? 0.5 : 1,
                    transition: 'all 0.3s',
                    position: 'relative',
                    padding: '24px',
                    borderRadius: '20px'
                }}
                onClick={() => setSelectedScenario(key)}
            >
                {s.recommended && (
                    <div style={{ position: 'absolute', top: '-12px', right: '20px', background: 'var(--accent)', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                        Recommandé
                    </div>
                )}
                
                <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {key === 'scenario_a' && <Activity size={20} className="text-secondary" />}
                    {key === 'scenario_b' && <Zap size={20} className="text-accent" />}
                    {key === 'scenario_c' && <BrainCircuit size={20} style={{ color: '#10b981' }} />}
                    {s.name}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Coût estimé</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>${s.kpis.estimated_cost_cad.toLocaleString()} CAD</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Durée</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{s.kpis.estimated_duration_days} jours</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Vitesse</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{s.kpis.cruising_speed_knots} nds</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Consommation</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{s.kpis.total_fuel_consumption_mt} tm</div>
                    </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', minHeight: '60px' }}>
                    <strong>Raisonnement :</strong> {s.ai_reasoning}
                </div>

                {s.risks && s.risks.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 'bold' }}>⚠️ Facteurs (Météo/Glace) pour la période</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {s.risks.map((r: any, idx: number) => (
                                <div key={idx} style={{ 
                                    padding: '6px 12px', 
                                    borderRadius: '6px', 
                                    background: r.severity === 'high' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                                    color: r.severity === 'high' ? '#ef4444' : '#f59e0b',
                                    fontSize: '12px'
                                }}>
                                    {r.description}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ textAlign: 'center' }}>
                    {isSelected ? (
                        <div style={{ color: 'var(--accent)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <CheckCircle size={18} /> Scénario sélectionné
                        </div>
                    ) : (
                        <div style={{ color: 'var(--text-secondary)' }}>Cliquez pour sélectionner</div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: '24px', maxWidth: step === 3 ? '1200px' : '800px', margin: '0 auto', transition: 'max-width 0.3s' }}>
            <style>{cssLoader}</style>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <h1 style={{ margin: 0, fontSize: '28px' }}>Planification de Voyage</h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ width: '30px', height: '4px', borderRadius: '2px', background: step >= 1 ? 'var(--accent)' : 'var(--border-color)' }}></div>
                    <div style={{ width: '30px', height: '4px', borderRadius: '2px', background: step >= 2 ? 'var(--accent)' : 'var(--border-color)' }}></div>
                    <div style={{ width: '30px', height: '4px', borderRadius: '2px', background: step >= 3 ? 'var(--accent)' : 'var(--border-color)' }}></div>
                </div>
            </div>

            {step === 1 && (
                <div className="glass-panel" style={{ padding: '32px', borderRadius: '20px' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}><Ship /> 1. Identité du voyage</h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label>Navire assigné</label>
                            <select value={form.vessel_id} onChange={e => setForm({...form, vessel_id: e.target.value})}>
                                {fleet.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <label>Port de départ (LOCODE)</label>
                                <input type="text" placeholder="ex: CATRQ" value={form.port_of_departure} onChange={e => setForm({...form, port_of_departure: e.target.value.toUpperCase()})} maxLength={5} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label>Port d'arrivée (LOCODE)</label>
                                <input type="text" placeholder="ex: CASEP" value={form.port_of_arrival} onChange={e => setForm({...form, port_of_arrival: e.target.value.toUpperCase()})} maxLength={5} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label>Date Départ Prévu (ETD)</label>
                                <input type="date" value={form.etd_planned} onChange={e => setForm({...form, etd_planned: e.target.value})} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label>Date Arrivée Prévue (ETA)</label>
                                <input type="date" value={form.eta_planned} onChange={e => setForm({...form, eta_planned: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
                        <button className="primary" onClick={() => setStep(2)} disabled={!form.port_of_departure || !form.port_of_arrival || !form.etd_planned || !form.eta_planned}>
                            Suivant <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="glass-panel" style={{ padding: '32px', borderRadius: '20px', textAlign: 'center' }}>
                    <Bot size={64} style={{ color: 'var(--accent)', marginBottom: '16px' }} />
                    <h2 style={{ margin: '0 0 16px 0' }}>Génération de Scénarios IA</h2>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 32px auto', lineHeight: '1.6' }}>
                        L'Optimiseur IA de MareLinx peut analyser l'historique de votre flotte, les prix réels du carburant par port, et la météo sur votre route pour vous proposer 3 scénarios de gestion.
                    </p>

                    {isOptimizing ? (
                        <div style={{ padding: '40px' }}>
                            <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}></div>
                            <div style={{ color: 'var(--accent)', marginBottom: '8px' }}>Analyse algorithmique en cours... (Claude Sonnet 4.6)</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Récupération des données météo ECMWF pour le {form.etd_planned}...</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                            <button onClick={() => setStep(3)} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer' }}>
                                Créer manuellement
                            </button>
                            <button className="primary" onClick={handleOptimize} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Zap size={18} /> Générer 3 scénarios IA
                            </button>
                        </div>
                    )}
                </div>
            )}

            {step === 3 && (
                <div>
                    {!scenarios ? (
                        <div className="glass-panel" style={{ padding: '32px', borderRadius: '20px' }}>
                            <h2>Mode Manuel (IA Ignorée)</h2>
                            <p>Vous avez choisi de définir vos paramètres sans l'IA. Cette vue sera remplacée par le formulaire avancé.</p>
                            
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
                                <button className="primary" onClick={handleCreateVoyage}>
                                    Confirmer et créer le voyage
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <Bot className="text-accent" /> Sélectionnez un scénario recommandé
                            </h2>
                            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                {renderAICard('scenario_a', scenarios.scenario_a)}
                                {renderAICard('scenario_c', scenarios.scenario_c)}
                                {renderAICard('scenario_b', scenarios.scenario_b)}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', padding: '24px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px' }}>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                                    {selectedScenario ? 'Scénario validé. L\'IA appliquera les KPIs choisis au registre du voyage.' : 'Aucun scénario choisi. Le voyage ne peut pas être validé.'}
                                </div>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <button onClick={() => setStep(2)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                        Retour
                                    </button>
                                    <button className="primary" disabled={!selectedScenario} onClick={handleCreateVoyage}>
                                        Confirmer le voyage
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VoyageBuilder;
