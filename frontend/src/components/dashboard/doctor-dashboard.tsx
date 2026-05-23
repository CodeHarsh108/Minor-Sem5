import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Calendar, Clock, Video, Phone, Mail, Award, Stethoscope,
  Users, ChevronDown, ChevronUp, X, Plus, Leaf, User,
  Activity, CheckCircle2, AlarmClock, Handshake, Search,
  AlertTriangle, Pill, Heart, FileText, ShieldAlert, UserCheck
} from 'lucide-react';
import { useAuth } from '../../App';
import axios from 'axios';

const API = 'http://localhost:8002/api/v1';

/* ─── Types ─── */
interface PatientUser {
  _id: string; firstName: string; lastName: string;
  email: string; contactNumber?: string; gender?: string;
  accountType: string; image?: string; bloodGroup?: string; dateOfBirth?: string;
}
interface CollabDoctor {
  _id: string;
  user: { _id: string; firstName: string; lastName: string; email: string; image?: string };
  specialization?: string;
}
interface Appointment {
  _id: string;
  patient: PatientUser;
  doctor: string;
  date: string;
  timeSlot: { start: string; end: string };
  description?: string;
  paymentStatus: boolean;
  meetingLink?: string;
  collaboratingDoctors?: CollabDoctor[];
  createdAt: string;
}
interface PatientProfile {
  medicalHistory?: string;
  medications?: string;
  allergies?: string;
  emergencyContact?: string;
}
interface DoctorProfile {
  _id: string;
  user: { _id: string; firstName: string; lastName: string; email: string; contactNumber?: string; image?: string };
  specialization?: string; experience?: number; consultantFee?: number;
  degrees?: string; certification?: string;
  availableDays?: string[];
  availableTimeSlot?: { start: string; end: string };
  approvalStatus?: boolean;
}
interface AllDoctor {
  _id: string;
  user: { _id: string; firstName: string; lastName: string; email?: string; image?: string };
  specialization?: string;
}

/* ─── Helpers ─── */
const fmt12 = (t: string) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h); const ap = hr >= 12 ? 'PM' : 'AM';
  return `${hr % 12 || 12}:${m} ${ap}`;
};
const fmtDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString('en-US', { weekday:'short', year:'numeric', month:'short', day:'numeric' });
  } catch { return d; }
};
const isUpcoming = (d: string) => {
  const aptDate = new Date(d);
  aptDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return aptDate >= today;
};

/* ─── Sub-components ─── */
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number; color: string }> = ({ icon, label, value, color }) => (
  <div style={{
    background:'rgba(255,255,255,0.04)', border:`1px solid rgba(${color},0.2)`,
    borderRadius:20, padding:'20px 24px', backdropFilter:'blur(12px)',
    display:'flex', alignItems:'center', gap:16
  }}>
    <div style={{ width:48, height:48, borderRadius:14, background:`rgba(${color},0.12)`,
      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize:28, fontWeight:800, color:'#eff6ff', fontFamily:"'Syne',sans-serif", lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:13, color:'rgba(191,219,254,0.5)', marginTop:4 }}>{label}</div>
    </div>
  </div>
);

/* ─── Main Component ─── */
export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'appointments' | 'collaborating' | 'profile'>('appointments');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [collabAppointments, setCollabAppointments] = useState<Appointment[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [allDoctors, setAllDoctors] = useState<AllDoctor[]>([]);
  const [loading, setLoading] = useState(true);

  // Per-appointment expanded state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [patientDetails, setPatientDetails] = useState<Record<string, PatientProfile>>({});
  const [loadingPatient, setLoadingPatient] = useState<string | null>(null);

  // Collaboration modal
  const [collabModalId, setCollabModalId] = useState<string | null>(null);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [addingCollab, setAddingCollab] = useState(false);

  /* ─── Fetch ─── */
  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const profileRes = await axios.get<{ success: boolean; doctor: DoctorProfile }>(
        `${API}/user/doctor/${user.id || user._id}`, { withCredentials: true }
      );
      if (!profileRes.data.success) { setLoading(false); return; }
      const prof = profileRes.data.doctor;
      setDoctorProfile(prof);

      const [apptRes, collabRes, allDocRes] = await Promise.all([
        axios.get<{ success: boolean; data: Appointment[] }>(
          `${API}/user/doctors-bookings/${prof._id}`, { withCredentials: true }
        ),
        axios.get<{ success: boolean; data: Appointment[] }>(
          `${API}/user/collaborating-appointments/${prof._id}`, { withCredentials: true }
        ),
        axios.get<{ success: boolean; doctors: AllDoctor[] }>(
          `${API}/user/doctors`, { withCredentials: true }
        ),
      ]);

      if (apptRes.data.success) setAppointments(apptRes.data.data || []);
      if (collabRes.data.success) setCollabAppointments(collabRes.data.data || []);
      if (allDocRes.data.success) {
        setAllDoctors((allDocRes.data.doctors || []).filter(d => d._id !== prof._id && d.user != null));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ─── Expand patient details ─── */
  const handleExpand = async (apt: Appointment) => {
    const id = apt._id;
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    const patientId = typeof apt.patient === 'object' ? apt.patient._id : apt.patient;
    if (!patientDetails[patientId]) {
      setLoadingPatient(patientId);
      try {
        const res = await axios.get<{ success: boolean; user: PatientUser; patientProfile: PatientProfile }>(
          `${API}/user/patient-details/${patientId}`, { withCredentials: true }
        );
        if (res.data.success) {
          setPatientDetails(prev => ({ ...prev, [patientId]: res.data.patientProfile || {} }));
        }
      } catch { toast.error('Could not load patient details'); }
      finally { setLoadingPatient(null); }
    }
  };

  /* ─── Collaboration ─── */
  const handleAddCollab = async (appointmentId: string, doctorId: string) => {
    setAddingCollab(true);
    try {
      const res = await axios.post(`${API}/user/appointment/${appointmentId}/collaborate`,
        { doctorId }, { withCredentials: true });
      if (res.data.success) {
        toast.success('Doctor added as collaborator!');
        setCollabModalId(null);
        fetchAll();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add collaborator');
    } finally { setAddingCollab(false); }
  };

  const handleRemoveCollab = async (appointmentId: string, doctorId: string) => {
    try {
      await axios.delete(`${API}/user/appointment/${appointmentId}/collaborate/${doctorId}`,
        { withCredentials: true });
      toast.success('Collaborator removed');
      fetchAll();
    } catch { toast.error('Failed to remove collaborator'); }
  };

  /* ─── Filtered appointments ─── */
  const filteredApts = appointments.filter(a => {
    if (filter === 'upcoming') return isUpcoming(a.date);
    if (filter === 'past') return !isUpcoming(a.date);
    return true;
  });

  const stats = {
    total: appointments.length,
    upcoming: appointments.filter(a => isUpcoming(a.date)).length,
    past: appointments.filter(a => !isUpcoming(a.date)).length,
    collab: collabAppointments.length,
  };

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:'#0b1d3a', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:48, height:48, border:'3px solid rgba(96,165,250,0.2)',
            borderTopColor:'#60a5fa', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
          <p style={{ color:'rgba(191,219,254,0.5)', fontFamily:"'DM Sans',sans-serif" }}>Loading your dashboard…</p>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const dp = doctorProfile;
  const doctorName = dp ? `Dr. ${dp.user.firstName} ${dp.user.lastName}` : 'Doctor';

  return (
    <div style={{ minHeight:'100vh', background:'#0b1d3a', fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500&display=swap');
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideDown{from{opacity:0;max-height:0}to{opacity:1;max-height:600px}}
        .apt-card:hover{border-color:rgba(96,165,250,0.35)!important;transform:translateY(-1px)}
        .apt-card{transition:all 0.2s ease}
        .action-btn{transition:all 0.2s ease;cursor:pointer}
        .action-btn:hover{transform:translateY(-1px);filter:brightness(1.1)}
        .tab-btn{transition:all 0.2s ease;cursor:pointer;border:none;outline:none}
        .filter-btn{transition:all 0.2s ease;cursor:pointer;border:none;outline:none}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px}
        .doctor-item:hover{background:rgba(96,165,250,0.08)!important}
      `}</style>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 24px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom:32, animation:'fadeIn 0.5s ease' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div>
              <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(28px,3.5vw,42px)',
                color:'#eff6ff', lineHeight:1.15, margin:'0 0 8px' }}>
                Doctor <em style={{ color:'#60a5fa', fontStyle:'italic' }}>Dashboard</em>
              </h1>
              <p style={{ color:'rgba(191,219,254,0.55)', fontSize:15, margin:0 }}>
                Welcome back, <strong style={{ color:'#bfdbfe' }}>{doctorName}</strong>
                {dp?.specialization && <span> · {dp.specialization}</span>}
              </p>
            </div>
            {/* Quick Actions */}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <Link to="/herbs" style={{ textDecoration:'none' }}>
                <div className="action-btn" style={{
                  display:'flex', alignItems:'center', gap:8, padding:'10px 18px',
                  background:'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(52,211,153,0.08))',
                  border:'1px solid rgba(52,211,153,0.25)', borderRadius:50,
                  color:'#34d399', fontWeight:700, fontSize:13, fontFamily:"'Syne',sans-serif"
                }}>
                  <Leaf size={15}/> Browse Herbs
                </div>
              </Link>
              {dp?.approvalStatus === false && (
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px',
                  background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.25)',
                  borderRadius:50, color:'#fbbf24', fontSize:13, fontFamily:"'Syne',sans-serif" }}>
                  <AlertTriangle size={15}/> Pending Approval
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16, marginBottom:32 }}>
          <StatCard icon={<Calendar size={22} color="#60a5fa"/>} label="Total Appointments" value={stats.total} color="96,165,250" />
          <StatCard icon={<AlarmClock size={22} color="#34d399"/>} label="Upcoming" value={stats.upcoming} color="52,211,153" />
          <StatCard icon={<CheckCircle2 size={22} color="#a78bfa"/>} label="Completed" value={stats.past} color="167,139,250" />
          <StatCard icon={<Handshake size={22} color="#fb923c"/>} label="Collaborating" value={stats.collab} color="251,146,60" />
        </div>

        {/* ── Tabs ── */}
        <div style={{ display:'flex', gap:4, background:'rgba(0,0,0,0.25)', borderRadius:50,
          padding:4, marginBottom:28, width:'fit-content' }}>
          {([
            { id:'appointments', label:'My Appointments', icon:<Calendar size={14}/> },
            { id:'collaborating', label:'Collaborating Cases', icon:<Handshake size={14}/> },
            { id:'profile', label:'My Profile', icon:<UserCheck size={14}/> },
          ] as const).map(t => (
            <button key={t.id} className="tab-btn" onClick={() => setTab(t.id)}
              style={{
                display:'flex', alignItems:'center', gap:7, padding:'10px 20px',
                borderRadius:50, fontSize:13, fontWeight:700, fontFamily:"'Syne',sans-serif",
                background: tab === t.id ? 'linear-gradient(135deg,#2563eb,#3b82f6)' : 'transparent',
                color: tab === t.id ? '#fff' : 'rgba(191,219,254,0.55)',
                boxShadow: tab === t.id ? '0 4px 15px rgba(37,99,235,0.3)' : 'none',
              }}>
              {t.icon} {t.label}
              {t.id === 'collaborating' && stats.collab > 0 && (
                <span style={{ background:'rgba(251,146,60,0.3)', borderRadius:50, padding:'1px 7px',
                  fontSize:11, color:'#fb923c' }}>{stats.collab}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Appointments Tab ── */}
        {tab === 'appointments' && (
          <div style={{ animation:'fadeIn 0.4s ease' }}>
            {/* Filter */}
            <div style={{ display:'flex', gap:8, marginBottom:20 }}>
              {(['all','upcoming','past'] as const).map(f => (
                <button key={f} className="filter-btn" onClick={() => setFilter(f)}
                  style={{
                    padding:'7px 18px', borderRadius:50, fontSize:13, fontWeight:600,
                    fontFamily:"'Syne',sans-serif", textTransform:'capitalize',
                    background: filter === f ? 'rgba(96,165,250,0.15)' : 'transparent',
                    border: filter === f ? '1px solid rgba(96,165,250,0.4)' : '1px solid rgba(96,165,250,0.1)',
                    color: filter === f ? '#bfdbfe' : 'rgba(191,219,254,0.4)',
                  }}>
                  {f === 'all' ? `All (${stats.total})` : f === 'upcoming' ? `Upcoming (${stats.upcoming})` : `Past (${stats.past})`}
                </button>
              ))}
            </div>

            {filteredApts.length === 0 ? (
              <EmptyState icon={<Calendar size={48} color="rgba(96,165,250,0.3)"/>}
                title="No appointments found"
                desc="Patients will appear here when they book appointments with you." />
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {filteredApts.map(apt => (
                  <AppointmentCard
                    key={apt._id}
                    apt={apt}
                    isExpanded={expandedId === apt._id}
                    patientDetail={patientDetails[apt.patient?._id]}
                    loadingPatient={loadingPatient === apt.patient?._id}
                    allDoctors={allDoctors}
                    onExpand={() => handleExpand(apt)}
                    onOpenCollab={() => { setCollabModalId(apt._id); setDoctorSearch(''); }}
                    onRemoveCollab={(did) => handleRemoveCollab(apt._id, did)}
                    isCollab={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Collaborating Tab ── */}
        {tab === 'collaborating' && (
          <div style={{ animation:'fadeIn 0.4s ease' }}>
            {collabAppointments.length === 0 ? (
              <EmptyState icon={<Handshake size={48} color="rgba(251,146,60,0.3)"/>}
                title="No collaborative cases yet"
                desc="When a colleague adds you as a collaborator on a patient case, it will appear here." />
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {collabAppointments.map(apt => (
                  <AppointmentCard
                    key={apt._id}
                    apt={apt}
                    isExpanded={expandedId === apt._id}
                    patientDetail={patientDetails[apt.patient?._id]}
                    loadingPatient={loadingPatient === apt.patient?._id}
                    allDoctors={allDoctors}
                    onExpand={() => handleExpand(apt)}
                    onOpenCollab={() => {}}
                    onRemoveCollab={() => {}}
                    isCollab={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Profile Tab ── */}
        {tab === 'profile' && dp && (
          <div style={{ animation:'fadeIn 0.4s ease' }}>
            <ProfileCard dp={dp} />
          </div>
        )}
      </div>

      {/* ── Collaboration Modal ── */}
      {collabModalId && (
        <div className="modal-overlay" onClick={() => setCollabModalId(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background:'#0f2952', border:'1px solid rgba(96,165,250,0.2)', borderRadius:24,
            padding:28, width:'100%', maxWidth:520, maxHeight:'80vh', display:'flex', flexDirection:'column',
            animation:'fadeIn 0.3s ease'
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18, color:'#eff6ff', margin:0 }}>
                Invite a Collaborating Doctor
              </h3>
              <button onClick={() => setCollabModalId(null)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(191,219,254,0.5)', padding:4 }}>
                <X size={20}/>
              </button>
            </div>
            <div style={{ position:'relative', marginBottom:16 }}>
              <Search size={15} color="#60a5fa" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}/>
              <input value={doctorSearch} onChange={e => setDoctorSearch(e.target.value)}
                placeholder="Search doctors by name…"
                style={{ width:'100%', padding:'10px 12px 10px 36px', background:'rgba(255,255,255,0.05)',
                  border:'1px solid rgba(96,165,250,0.2)', borderRadius:12, color:'#eff6ff',
                  fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:'none', boxSizing:'border-box' }}/>
            </div>
            {/* Already collaborating */}
            {(() => {
              const curApt = appointments.find(a => a._id === collabModalId);
              return curApt?.collaboratingDoctors && curApt.collaboratingDoctors.length > 0 ? (
                <div style={{ marginBottom:12 }}>
                  <p style={{ fontSize:12, color:'rgba(191,219,254,0.45)', marginBottom:8, fontWeight:600 }}>CURRENTLY COLLABORATING</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {curApt.collaboratingDoctors.filter(cd => cd.user != null).map(cd => (
                      <div key={cd._id} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px 4px 8px',
                        background:'rgba(96,165,250,0.1)', border:'1px solid rgba(96,165,250,0.2)', borderRadius:50 }}>
                        <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(96,165,250,0.2)',
                          display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#60a5fa', fontWeight:700 }}>
                          {cd.user.firstName[0]}
                        </div>
                        <span style={{ color:'#bfdbfe', fontSize:12 }}>Dr. {cd.user.firstName} {cd.user.lastName}</span>
                        <button onClick={() => { handleRemoveCollab(collabModalId, cd._id); }}
                          style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(191,219,254,0.4)', padding:0, display:'flex' }}>
                          <X size={12}/>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
            <div style={{ overflowY:'auto', flex:1 }}>
              {allDoctors
                .filter(d => {
                  const q = doctorSearch.toLowerCase();
                  const n = `${d.user.firstName} ${d.user.lastName}`.toLowerCase();
                  return !q || n.includes(q) || (d.specialization||'').toLowerCase().includes(q);
                })
                .filter(d => {
                  const curApt = appointments.find(a => a._id === collabModalId);
                  const alreadyIds = (curApt?.collaboratingDoctors||[]).map(c=>c._id);
                  return !alreadyIds.includes(d._id);
                })
                .map(doc => (
                  <div key={doc._id} className="doctor-item"
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'12px 8px', borderRadius:12, transition:'background 0.2s', cursor:'default' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(96,165,250,0.15)',
                        display:'flex', alignItems:'center', justifyContent:'center', color:'#60a5fa',
                        fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, flexShrink:0 }}>
                        {doc.user.firstName[0]}{doc.user.lastName[0]}
                      </div>
                      <div>
                        <div style={{ color:'#eff6ff', fontWeight:600, fontSize:14 }}>
                          Dr. {doc.user.firstName} {doc.user.lastName}
                        </div>
                        {doc.specialization && (
                          <div style={{ color:'rgba(191,219,254,0.5)', fontSize:12 }}>{doc.specialization}</div>
                        )}
                      </div>
                    </div>
                    <button disabled={addingCollab}
                      onClick={() => collabModalId && handleAddCollab(collabModalId, doc._id)}
                      style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px',
                        background:'linear-gradient(135deg,#2563eb,#3b82f6)', border:'none', borderRadius:50,
                        color:'#fff', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:12,
                        cursor: addingCollab ? 'not-allowed' : 'pointer', opacity: addingCollab ? 0.7 : 1 }}>
                      <Plus size={12}/> Invite
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Appointment Card ─── */
const AppointmentCard: React.FC<{
  apt: Appointment;
  isExpanded: boolean;
  patientDetail?: PatientProfile;
  loadingPatient: boolean;
  allDoctors: AllDoctor[];
  onExpand: () => void;
  onOpenCollab: () => void;
  onRemoveCollab: (doctorId: string) => void;
  isCollab: boolean;
}> = ({ apt, isExpanded, patientDetail, loadingPatient, onExpand, onOpenCollab, onRemoveCollab, isCollab }) => {
  const p = apt.patient;
  const upcoming = isUpcoming(apt.date);

  return (
    <div className="apt-card" style={{
      background:'rgba(255,255,255,0.03)', border:'1px solid rgba(96,165,250,0.15)',
      borderRadius:20, overflow:'hidden',
    }}>
      {/* Card Header */}
      <div style={{ padding:'20px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          {/* Patient info */}
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:'50%', background:'rgba(96,165,250,0.15)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              color:'#60a5fa', fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15 }}>
              {p?.firstName?.[0]}{p?.lastName?.[0]}
            </div>
            <div>
              <div style={{ fontWeight:700, color:'#eff6ff', fontSize:15, fontFamily:"'Syne',sans-serif" }}>
                {p?.firstName} {p?.lastName}
              </div>
              <div style={{ display:'flex', gap:12, marginTop:4, flexWrap:'wrap' }}>
                {p?.gender && (
                  <span style={{ color:'rgba(191,219,254,0.5)', fontSize:12, display:'flex', alignItems:'center', gap:4 }}>
                    <User size={11}/>{p.gender}
                  </span>
                )}
                {p?.contactNumber && (
                  <span style={{ color:'rgba(191,219,254,0.5)', fontSize:12, display:'flex', alignItems:'center', gap:4 }}>
                    <Phone size={11}/>{p.contactNumber}
                  </span>
                )}
                {p?.email && (
                  <span style={{ color:'rgba(191,219,254,0.5)', fontSize:12, display:'flex', alignItems:'center', gap:4 }}>
                    <Mail size={11}/>{p.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right badges + actions */}
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            {isCollab && (
              <span style={{ padding:'4px 12px', borderRadius:50, fontSize:11, fontWeight:700,
                background:'rgba(251,146,60,0.12)', border:'1px solid rgba(251,146,60,0.25)',
                color:'#fb923c', fontFamily:"'Syne',sans-serif" }}>
                Collaborating
              </span>
            )}
            <span style={{ padding:'4px 12px', borderRadius:50, fontSize:11, fontWeight:700,
              background: upcoming ? 'rgba(52,211,153,0.12)' : 'rgba(167,139,250,0.12)',
              border: upcoming ? '1px solid rgba(52,211,153,0.25)' : '1px solid rgba(167,139,250,0.25)',
              color: upcoming ? '#34d399' : '#a78bfa', fontFamily:"'Syne',sans-serif" }}>
              {upcoming ? '● Upcoming' : '✓ Completed'}
            </span>
            {apt.paymentStatus && (
              <span style={{ padding:'4px 12px', borderRadius:50, fontSize:11, fontWeight:700,
                background:'rgba(96,165,250,0.1)', border:'1px solid rgba(96,165,250,0.2)',
                color:'#60a5fa', fontFamily:"'Syne',sans-serif" }}>Paid</span>
            )}
          </div>
        </div>

        {/* Date/time row */}
        <div style={{ display:'flex', gap:20, marginTop:14, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, color:'rgba(191,219,254,0.6)', fontSize:13 }}>
            <Calendar size={14} color="#60a5fa"/> {fmtDate(apt.date)}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, color:'rgba(191,219,254,0.6)', fontSize:13 }}>
            <Clock size={14} color="#60a5fa"/> {fmt12(apt.timeSlot.start)} – {fmt12(apt.timeSlot.end)}
          </div>
        </div>

        {apt.description && (
          <div style={{ marginTop:10, padding:'10px 14px', background:'rgba(96,165,250,0.06)',
            border:'1px solid rgba(96,165,250,0.1)', borderRadius:10 }}>
            <span style={{ color:'rgba(191,219,254,0.5)', fontSize:12, fontWeight:600 }}>REASON: </span>
            <span style={{ color:'rgba(191,219,254,0.75)', fontSize:13 }}>{apt.description}</span>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display:'flex', gap:8, marginTop:16, flexWrap:'wrap' }}>
          {apt.meetingLink && (
            <a href={apt.meetingLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>
              <div className="action-btn" style={{
                display:'flex', alignItems:'center', gap:7, padding:'9px 18px',
                background:'linear-gradient(135deg,#2563eb,#3b82f6)', borderRadius:50,
                color:'#fff', fontSize:13, fontWeight:700, fontFamily:"'Syne',sans-serif"
              }}>
                <Video size={14}/> Join Meeting
              </div>
            </a>
          )}
          {!isCollab && (
            <button className="action-btn" onClick={onOpenCollab}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px',
                background:'rgba(251,146,60,0.1)', border:'1px solid rgba(251,146,60,0.25)',
                borderRadius:50, color:'#fb923c', fontSize:13, fontWeight:700,
                fontFamily:"'Syne',sans-serif", cursor:'pointer' }}>
              <Handshake size={14}/> Collaborate
              {apt.collaboratingDoctors && apt.collaboratingDoctors.length > 0 && (
                <span style={{ background:'rgba(251,146,60,0.2)', borderRadius:50,
                  padding:'1px 6px', fontSize:11 }}>{apt.collaboratingDoctors.length}</span>
              )}
            </button>
          )}
          <button className="action-btn" onClick={onExpand}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px',
              background:'rgba(167,139,250,0.1)', border:'1px solid rgba(167,139,250,0.2)',
              borderRadius:50, color:'#a78bfa', fontSize:13, fontWeight:700,
              fontFamily:"'Syne',sans-serif", cursor:'pointer' }}>
            <Activity size={14}/> Patient Details
            {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
          </button>
        </div>

        {/* Collaborating doctors shown as avatars */}
        {apt.collaboratingDoctors && apt.collaboratingDoctors.filter(cd => cd.user != null).length > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:12, flexWrap:'wrap' }}>
            <span style={{ fontSize:12, color:'rgba(191,219,254,0.4)', fontWeight:600 }}>COLLABORATORS:</span>
            {apt.collaboratingDoctors.filter(cd => cd.user != null).map(cd => (
              <div key={cd._id} style={{ display:'flex', alignItems:'center', gap:5,
                background:'rgba(251,146,60,0.08)', border:'1px solid rgba(251,146,60,0.15)',
                borderRadius:50, padding:'3px 10px 3px 6px' }}>
                <div style={{ width:20, height:20, borderRadius:'50%', background:'rgba(251,146,60,0.2)',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:9,
                  color:'#fb923c', fontWeight:700 }}>
                  {cd.user.firstName[0]}
                </div>
                <span style={{ color:'rgba(251,190,120,0.8)', fontSize:12 }}>Dr. {cd.user.firstName} {cd.user.lastName}</span>
                {!isCollab && (
                  <button onClick={() => onRemoveCollab(cd._id)}
                    style={{ background:'none', border:'none', cursor:'pointer',
                      color:'rgba(191,219,254,0.3)', padding:0, display:'flex', marginLeft:2 }}>
                    <X size={11}/>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expanded patient medical details */}
      {isExpanded && (
        <div style={{ borderTop:'1px solid rgba(96,165,250,0.1)', padding:'20px 24px',
          background:'rgba(0,0,0,0.15)', animation:'fadeIn 0.3s ease' }}>
          {loadingPatient ? (
            <div style={{ display:'flex', alignItems:'center', gap:10, color:'rgba(191,219,254,0.5)' }}>
              <div style={{ width:16, height:16, border:'2px solid rgba(96,165,250,0.3)',
                borderTopColor:'#60a5fa', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
              Loading patient details…
            </div>
          ) : (
            <PatientDetails patient={p} profile={patientDetail}/>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Patient Details Section ─── */
const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value?: string; accent?: string }> = ({ icon, label, value, accent = '96,165,250' }) => (
  value ? (
    <div style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'10px 14px',
      background:`rgba(${accent},0.05)`, border:`1px solid rgba(${accent},0.1)`, borderRadius:12 }}>
      <div style={{ color:`rgb(${accent})`, marginTop:1, flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ fontSize:11, fontWeight:700, color:`rgba(${accent},0.7)`, marginBottom:3, letterSpacing:'0.05em' }}>{label.toUpperCase()}</div>
        <div style={{ fontSize:13, color:'rgba(191,219,254,0.8)', lineHeight:1.5 }}>{value}</div>
      </div>
    </div>
  ) : null
);

const PatientDetails: React.FC<{ patient: PatientUser; profile?: PatientProfile }> = ({ patient, profile }) => (
  <div>
    <h4 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, color:'#bfdbfe',
      margin:'0 0 14px', display:'flex', alignItems:'center', gap:8 }}>
      <FileText size={16} color="#60a5fa"/> Patient Medical Information
    </h4>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:10 }}>
      {patient?.bloodGroup && (
        <DetailItem icon={<Heart size={14}/>} label="Blood Group" value={patient.bloodGroup} accent="239,68,68"/>
      )}
      {patient?.gender && (
        <DetailItem icon={<User size={14}/>} label="Gender" value={patient.gender}/>
      )}
      {patient?.dateOfBirth && (
        <DetailItem icon={<Calendar size={14}/>} label="Date of Birth"
          value={new Date(patient.dateOfBirth).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}/>
      )}
      {patient?.contactNumber && (
        <DetailItem icon={<Phone size={14}/>} label="Contact" value={patient.contactNumber}/>
      )}
      {patient?.email && (
        <DetailItem icon={<Mail size={14}/>} label="Email" value={patient.email}/>
      )}
      {profile?.medicalHistory && (
        <DetailItem icon={<Activity size={14}/>} label="Medical History" value={profile.medicalHistory} accent="167,139,250"/>
      )}
      {profile?.medications && (
        <DetailItem icon={<Pill size={14}/>} label="Current Medications" value={profile.medications} accent="52,211,153"/>
      )}
      {profile?.allergies && (
        <DetailItem icon={<ShieldAlert size={14}/>} label="Allergies" value={profile.allergies} accent="251,191,36"/>
      )}
      {profile?.emergencyContact && (
        <DetailItem icon={<Phone size={14}/>} label="Emergency Contact" value={profile.emergencyContact} accent="239,68,68"/>
      )}
    </div>
    {!profile?.medicalHistory && !profile?.medications && !profile?.allergies && !profile?.emergencyContact && (
      <p style={{ color:'rgba(191,219,254,0.4)', fontSize:13, fontStyle:'italic', margin:0 }}>
        No detailed medical profile on file. Patient has not filled in additional health information.
      </p>
    )}
  </div>
);

/* ─── Profile Card ─── */
const ProfileCard: React.FC<{ dp: DoctorProfile }> = ({ dp }) => {
  const sections = [
    { icon:<Stethoscope size={16}/>, label:'Specialization', value:dp.specialization, accent:'96,165,250' },
    { icon:<Award size={16}/>, label:'Experience', value: dp.experience ? `${dp.experience} years` : undefined, accent:'167,139,250' },
    { icon:<Activity size={16}/>, label:'Consultation Fee', value: dp.consultantFee ? `₹${dp.consultantFee}` : undefined, accent:'52,211,153' },
    { icon:<FileText size={16}/>, label:'Degrees', value:dp.degrees, accent:'251,146,60' },
    { icon:<CheckCircle2 size={16}/>, label:'Certification', value:dp.certification, accent:'96,165,250' },
    { icon:<Calendar size={16}/>, label:'Available Days', value: dp.availableDays?.join(', '), accent:'52,211,153' },
    { icon:<Clock size={16}/>, label:'Working Hours',
      value: dp.availableTimeSlot ? `${fmt12(dp.availableTimeSlot.start)} – ${fmt12(dp.availableTimeSlot.end)}` : undefined,
      accent:'167,139,250' },
  ];
  return (
    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(96,165,250,0.15)', borderRadius:24, padding:28 }}>
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:28,
        paddingBottom:20, borderBottom:'1px solid rgba(96,165,250,0.1)' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(96,165,250,0.15)',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'#60a5fa', fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22 }}>
          {dp.user.firstName[0]}{dp.user.lastName[0]}
        </div>
        <div>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22, color:'#eff6ff', margin:'0 0 4px' }}>
            Dr. {dp.user.firstName} {dp.user.lastName}
          </h2>
          <p style={{ color:'rgba(191,219,254,0.5)', fontSize:13, margin:'0 0 8px' }}>{dp.user.email}</p>
          <span style={{ padding:'4px 12px', borderRadius:50, fontSize:11, fontWeight:700,
            background: dp.approvalStatus ? 'rgba(52,211,153,0.12)' : 'rgba(251,191,36,0.12)',
            border: dp.approvalStatus ? '1px solid rgba(52,211,153,0.25)' : '1px solid rgba(251,191,36,0.25)',
            color: dp.approvalStatus ? '#34d399' : '#fbbf24', fontFamily:"'Syne',sans-serif" }}>
            {dp.approvalStatus ? '● Active & Approved' : '⏳ Pending Approval'}
          </span>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:10 }}>
        {sections.map(s => s.value ? (
          <DetailItem key={s.label} icon={s.icon} label={s.label} value={s.value} accent={s.accent}/>
        ) : null)}
      </div>
    </div>
  );
};

/* ─── Empty State ─── */
const EmptyState: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div style={{ textAlign:'center', padding:'60px 24px',
    background:'rgba(255,255,255,0.02)', border:'1px solid rgba(96,165,250,0.08)', borderRadius:24 }}>
    <div style={{ marginBottom:16 }}>{icon}</div>
    <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:18, color:'#bfdbfe', margin:'0 0 8px' }}>{title}</h3>
    <p style={{ color:'rgba(191,219,254,0.4)', fontSize:14, margin:0, maxWidth:380, marginInline:'auto' }}>{desc}</p>
  </div>
);