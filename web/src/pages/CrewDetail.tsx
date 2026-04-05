import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, User, ShieldCheck, Clock, MapPin, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const CrewDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  
  const [crew, setCrew] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [showEditForm, setShowEditForm] = useState(false);
  const [editCrew, setEditCrew] = useState({ firstName: '', lastName: '', email: '', seamanBookNumber: '', rank: '', nationality: '', dateOfBirth: '' });
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  
  // Add Cert Modal State
  const [showCertForm, setShowCertForm] = useState(false);
  const [newCert, setNewCert] = useState({ name: '', number: '', issueDate: '', expiryDate: '' });

  // Add Assign Modal State
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [newAssign, setNewAssign] = useState({ vesselId: '', signOnDate: '', role: '' });
  const [vessels, setVessels] = useState<any[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCrew = async () => {
      try {
        const { data } = await api.get(`/crew/${id}`);
        setCrew(data);
      } catch (err) {
        console.error('Failed to fetch crew member', err);
      } finally {
        setLoading(false);
      }
    };
    const fetchVessels = async () => {
      try {
        const { data } = await api.get('/fleet');
        setVessels(data);
      } catch (err) {
        console.error('Failed to fetch vessels', err);
      }
    };
    
    if (id) {
      fetchCrew();
      if (isAdmin) fetchVessels();
    }
  }, [id, isAdmin]);

  const handleEditClick = () => {
    setEditCrew({
      firstName: crew.first_name || '',
      lastName: crew.last_name || '',
      email: crew.email || '',
      seamanBookNumber: crew.seaman_book_number || '',
      rank: crew.rank || '',
      nationality: crew.nationality || '',
      dateOfBirth: crew.date_of_birth ? crew.date_of_birth.split('T')[0] : ''
    });
    setSelectedPhoto(null);
    setShowEditForm(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Update basic crew details
      const res = await api.put(`/crew/${id}`, {
        first_name: editCrew.firstName,
        last_name: editCrew.lastName,
        email: editCrew.email,
        seaman_book_number: editCrew.seamanBookNumber,
        rank: editCrew.rank,
        nationality: editCrew.nationality,
        date_of_birth: editCrew.dateOfBirth
      });
      
      let finalPhotoUrl = res.data.photo_url || crew.photo_url;
      
      // 2. If a file was selected, upload it
      if (selectedPhoto) {
        const formData = new FormData();
        formData.append('photo', selectedPhoto);
        const photoRes = await api.post(`/crew/${id}/photo`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalPhotoUrl = photoRes.data.photo_url;
      }

      setCrew({
        ...crew,
        first_name: res.data.first_name,
        last_name: res.data.last_name,
        email: res.data.email,
        seaman_book_number: res.data.seaman_book_number,
        rank: res.data.rank,
        nationality: res.data.nationality,
        date_of_birth: res.data.date_of_birth,
        photo_url: finalPhotoUrl
      });
      setShowEditForm(false);
    } catch (err) {
      console.error('Failed to update crew', err);
      alert('Error updating crew profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post(`/crew/${id}/certifications`, {
        certificate_name: newCert.name,
        certificate_number: newCert.number,
        issue_date: newCert.issueDate,
        expiry_date: newCert.expiryDate
      });
      
      const updatedCerts = [...crew.certifications, res.data].sort(
        (a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
      );

      setCrew({ ...crew, certifications: updatedCerts });
      
      setShowCertForm(false);
      setNewCert({ name: '', number: '', issueDate: '', expiryDate: '' });
    } catch (err) {
      console.error('Failed to add certificate', err);
      alert('Error adding certificate');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post(`/crew/${id}/assignments`, {
        vessel_id: newAssign.vesselId,
        sign_on_date: newAssign.signOnDate,
        role_onboard: newAssign.role
      });
      
      // Update local state: end existing active assignments for this UI
      const updatedAssignments = (crew.assignments || []).map((a: any) => 
        !a.sign_off_date ? { ...a, sign_off_date: newAssign.signOnDate } : a
      );

      // Add the new assignment at the beginning
      setCrew({ ...crew, assignments: [res.data, ...updatedAssignments] });
      
      setShowAssignForm(false);
      setNewAssign({ vesselId: '', signOnDate: '', role: '' });
    } catch (err) {
      console.error('Failed to add assignment', err);
      alert('Error adding assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOff = async (assignmentId: string, currentSignOn: string) => {
    const signOffDate = window.prompt("Entrez la date de débarquement (YYYY-MM-DD) :", new Date().toISOString().split('T')[0]);
    if (!signOffDate) return;

    if (new Date(signOffDate) < new Date(currentSignOn)) {
      alert('La date de débarquement ne peut pas être avant la date d\'embarquement.');
      return;
    }

    try {
      const res = await api.put(`/crew/${id}/assignments/${assignmentId}`, {
        sign_off_date: signOffDate
      });
      
      const updatedAssignments = crew.assignments.map((a: any) => 
        a.id === assignmentId ? { ...a, sign_off_date: res.data.sign_off_date } : a
      );
      setCrew({ ...crew, assignments: updatedAssignments });
    } catch (err) {
      console.error('Failed to end assignment', err);
      alert('Error updating assignment');
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;
  if (!crew) return <div style={{ padding: '24px' }}>Dossier introuvable</div>;

  // Render a certification row with visual expiry warning
  const renderCert = (cert: any) => {
    const expiryDate = new Date(cert.expiry_date);
    const now = new Date();
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    let statusColor = 'var(--success)';
    let statusText = 'Valide';
    
    if (daysLeft < 0) {
      statusColor = '#ef4444'; // Red
      statusText = 'Expiré';
    } else if (daysLeft < 90) {
      statusColor = '#f59e0b'; // Orange
      statusText = `Expire bientôt (${daysLeft}j)`;
    }

    return (
      <div key={cert.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', borderLeft: `4px solid ${statusColor}` }}>
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{cert.certificate_name}</h4>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>N°: {cert.certificate_number} • Expire le : {expiryDate.toLocaleDateString()}</p>
        </div>
        <div style={{ color: statusColor, fontSize: '13px', fontWeight: 600, padding: '4px 10px', background: `${statusColor}20`, borderRadius: '20px' }}>
          {statusText}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate('/crew')} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={18} />
            Retour à l'équipage
          </button>
          <h1 style={{ margin: 0 }}>Dossier Personnel</h1>
        </div>
        
        {isAdmin && (
          <button className="btn-primary" onClick={handleEditClick} style={{ background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent)', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
            <Edit2 size={18} />
            Modifier
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px' }}>
        {/* Colonne de gauche : Profil */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {crew.photo_url ? (
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', marginBottom: '16px', overflow: 'hidden', border: '3px solid var(--accent)', background: 'var(--bg-main)' }}>
              <img src={crew.photo_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px', border: '3px solid var(--border-color)' }}>
              <User size={56} color="var(--accent)" />
            </div>
          )}

          <h2 style={{ margin: '0 0 4px 0', fontSize: '24px' }}>{crew.first_name} {crew.last_name}</h2>
          <p style={{ margin: '0 0 24px 0', color: 'var(--accent)', fontWeight: 500, fontSize: '14px' }}>{crew.rank}</p>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left', marginTop: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Email</p>
              <p style={{ fontSize: '14px', margin: 0 }}>{crew.email}</p>
            </div>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Livret Maritime</p>
              <p style={{ fontSize: '14px', margin: 0, fontFamily: 'monospace' }}>{crew.seaman_book_number}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                 <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Nat.</p>
                 <p style={{ fontSize: '14px', margin: 0 }}>{crew.nationality}</p>
              </div>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                 <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Date Naissance</p>
                 <p style={{ fontSize: '14px', margin: 0 }}>{crew.date_of_birth ? new Date(crew.date_of_birth).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne de droite : Certificats & Affectations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent)' }}>
                <ShieldCheck size={24} />
                <h2 style={{ fontSize: '20px', margin: 0 }}>Certifications</h2>
              </div>
              {isAdmin && (
                <button className="btn-primary" onClick={() => setShowCertForm(true)} style={{ padding: '6px 12px', fontSize: '13px' }}>{t('crew.newCertification', 'Nouvelle certification')}</button>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {crew.certifications && crew.certifications.length > 0 ? (
                crew.certifications.map(renderCert)
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>Aucune certification enregistrée.</p>
              )}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--success)' }}>
                <Clock size={24} />
                <h2 style={{ fontSize: '20px', margin: 0 }}>Historique d'Affectation</h2>
              </div>
              {isAdmin && (
                <button className="btn-primary" onClick={() => setShowAssignForm(true)} style={{ padding: '6px 12px', fontSize: '13px' }}>Nouvelle Affectation</button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {crew.assignments && crew.assignments.length > 0 ? (
                crew.assignments.map((assignment: any) => (
                  <div key={assignment.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-main)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <MapPin size={20} color="var(--text-secondary)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{assignment.vessel_name}</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Du {new Date(assignment.sign_on_date).toLocaleDateString()} 
                        {assignment.sign_off_date ? ` au ${new Date(assignment.sign_off_date).toLocaleDateString()}` : ' - Présent'}
                      </p>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--accent)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <span>En tant que : {assignment.role_onboard}</span>
                      {!assignment.sign_off_date && isAdmin && (
                        <button 
                          className="btn-primary" 
                          onClick={() => handleSignOff(assignment.id, assignment.sign_on_date)} 
                          style={{ padding: '4px 10px', fontSize: '11px', background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)' }}
                        >
                          Débarquer
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>Aucune affectation passée ou en cours.</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {showEditForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '700px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '24px', color: 'var(--accent)' }}>Modifier Profil : {crew.first_name} {crew.last_name}</h2>
            <form onSubmit={handleEditSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Prénom</label>
                <input type="text" className="input-field" value={editCrew.firstName} onChange={e => setEditCrew({...editCrew, firstName: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Nom</label>
                <input type="text" className="input-field" value={editCrew.lastName} onChange={e => setEditCrew({...editCrew, lastName: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Adresse Email</label>
                <input type="email" className="input-field" value={editCrew.email} onChange={e => setEditCrew({...editCrew, email: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Livret Maritime</label>
                <input type="text" className="input-field" value={editCrew.seamanBookNumber} onChange={e => setEditCrew({...editCrew, seamanBookNumber: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Grade (Rank)</label>
                <input type="text" className="input-field" value={editCrew.rank} onChange={e => setEditCrew({...editCrew, rank: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Nationalité</label>
                <input type="text" className="input-field" value={editCrew.nationality} onChange={e => setEditCrew({...editCrew, nationality: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Date de Naissance</label>
                <input type="date" className="input-field" value={editCrew.dateOfBirth} onChange={e => setEditCrew({...editCrew, dateOfBirth: e.target.value})} required />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Nouvelle Photo (Optionnel)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="input-field" 
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedPhoto(e.target.files[0]);
                    }
                  }} 
                  style={{ padding: '8px' }}
                />
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Sélectionnez une image de votre PC pour modifier l'avatar actuel.</p>
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

      {showCertForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
            <h2 style={{ marginBottom: '24px', color: 'var(--accent)' }}>Ajouter un Certificat</h2>
            <form onSubmit={handleCertSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Nom du certificat</label>
                <input type="text" className="input-field" value={newCert.name} onChange={e => setNewCert({...newCert, name: e.target.value})} placeholder="ex: Basic Safety Training" required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Numéro de certificat</label>
                <input type="text" className="input-field" value={newCert.number} onChange={e => setNewCert({...newCert, number: e.target.value})} placeholder="ex: BST-12345" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Date de Délivrance</label>
                  <input type="date" className="input-field" value={newCert.issueDate} onChange={e => setNewCert({...newCert, issueDate: e.target.value})} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Date d'Expiration</label>
                  <input type="date" className="input-field" value={newCert.expiryDate} onChange={e => setNewCert({...newCert, expiryDate: e.target.value})} required />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} onClick={() => setShowCertForm(false)}>
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ width: 'auto', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
            <h2 style={{ marginBottom: '24px', color: 'var(--accent)' }}>Nouvelle Affectation</h2>
            <form onSubmit={handleAssignSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Navire</label>
                <select className="input-field" value={newAssign.vesselId} onChange={e => setNewAssign({...newAssign, vesselId: e.target.value})} required>
                  <option value="">Sélectionner un navire</option>
                  {vessels.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Date d'Embarquement</label>
                  <input type="date" className="input-field" value={newAssign.signOnDate} onChange={e => setNewAssign({...newAssign, signOnDate: e.target.value})} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Fonction à bord</label>
                  <input type="text" className="input-field" value={newAssign.role} onChange={e => setNewAssign({...newAssign, role: e.target.value})} placeholder="ex: Capitaine" required />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} onClick={() => setShowAssignForm(false)}>
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ width: 'auto', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'Validation...' : 'Embarquer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CrewDetail;
