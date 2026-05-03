
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Users, Calendar, Shield, ArrowRight,
  Stethoscope, Video, Star, ChevronDown,
  Heart, User, LogOut, LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../App';

/*
  BLUE PALETTE REFERENCE
  ──────────────────────
  Deep navy   : #05102b   (darkest bg)
  Navy        : #0b1d3a   (dark section bg)
  Midnight    : #0f2952   (hero bg)
  Cobalt      : #1a4fbf   (strong accent)
  Royal       : #2563eb   (primary action)
  Cerulean    : #3b82f6   (hover / link)
  Sky         : #60a5fa   (icon / highlight)
  Cornflower  : #93c5fd   (mid pastel)
  Powder      : #bfdbfe   (light pastel text)
  Ice         : #dbeafe   (lightest pastel)
  Alice       : #eff6ff   (light sect
  ion bg)
  Periwinkle  : #c7d2fe   (indigo-tinted pastel)
  Lavender    : #e0e7ff   (indigo-tinted light bg)
*/

/* ─── Marquee ─── */
const TICKER_ITEMS = [
  "Ayurvedic Remedies","Allopathic Treatments","500+ Doctors","Teleconsultation",
  "150+ Remedies","Holistic Healing","Book Appointments","Ancient Wisdom"
];

const Marquee: React.FC = () => (
  <div style={{ overflow:'hidden', background:'#0b1d3a', padding:'14px 0',
    borderTop:'2px solid #1a4fbf', borderBottom:'2px solid #1a4fbf' }}>
    <div style={{ display:'flex', gap:'3rem', animation:'marquee 28s linear infinite', width:'max-content' }}>
      {[...TICKER_ITEMS,...TICKER_ITEMS,...TICKER_ITEMS].map((item,i) => (
        <span key={i} style={{ color:'#93c5fd', fontFamily:"'Syne',sans-serif", fontWeight:700,
          fontSize:'13px', letterSpacing:'0.12em', textTransform:'uppercase',
          display:'flex', alignItems:'center', gap:'10px', whiteSpace:'nowrap' }}>
          <span style={{ color:'#60a5fa', fontSize:'18px' }}>✦</span>
          {item}
        </span>
      ))}
    </div>
  </div>
);

/* ─── Blob ─── */
const Blob: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div style={{ position:'absolute', borderRadius:'60% 40% 70% 30% / 40% 60% 30% 70%',
    opacity:0.15, pointerEvents:'none', ...style }} />
);

/* ─── Global styles injected once ─── */
const GlobalStyles: React.FC = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500&display=swap');
    @keyframes marquee  { from{transform:translateX(0)} to{transform:translateX(-33.333%)} }
    @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
    @keyframes fadeUp   { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
    @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes shimmer  { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }

    /* ── Nav ── */
    .nav-link { font-family:'DM Sans',sans-serif; font-size:14px; color:#93c5fd;
      text-decoration:none; transition:color 0.2s; }
    .nav-link:hover { color:#bfdbfe; }

    /* ── Chips ── */
    .stat-chip { background:rgba(96,165,250,0.12); border:1px solid rgba(96,165,250,0.25);
      border-radius:50px; padding:8px 18px; display:inline-flex; align-items:center; gap:8px;
      color:#bfdbfe; font-family:'DM Sans',sans-serif; font-size:13px; }

    /* ── Floating hero cards ── */
    .floating-card { background:rgba(255,255,255,0.05); backdrop-filter:blur(20px);
      border:1px solid rgba(96,165,250,0.22); border-radius:20px; padding:20px;
      animation:float 4s ease-in-out infinite; }

    /* ── Feature cards (dark bg) ── */
    .feature-card { border-radius:24px; padding:32px; transition:all 0.4s; cursor:pointer;
      background:rgba(255,255,255,0.03); border:1px solid rgba(96,165,250,0.13); }
    .feature-card:hover { background:rgba(96,165,250,0.08); border-color:rgba(96,165,250,0.38);
      transform:translateY(-6px); box-shadow:0 24px 48px rgba(0,0,0,0.4); }

    /* ── Story cards ── */
    .story-card { border-radius:24px; padding:32px; transition:all 0.3s;
      background:rgba(255,255,255,0.03); border:1px solid rgba(96,165,250,0.13); }
    .story-card:hover { border-color:rgba(96,165,250,0.35); background:rgba(96,165,250,0.06); }

    /* ── Audience cards (light section) ── */
    .audience-card { background:#fff; border-radius:20px; padding:24px;
      border:1px solid #bfdbfe; transition:all 0.3s;
      box-shadow:0 4px 20px rgba(37,99,235,0.07); }
    .audience-card:hover { border-color:#93c5fd; box-shadow:0 8px 32px rgba(37,99,235,0.14);
      transform:translateY(-4px); }

    /* ── Pills on dark bg ── */
    .pill-dark { background:rgba(96,165,250,0.13); border:1px solid rgba(96,165,250,0.28);
      border-radius:50px; padding:6px 18px; display:inline-block; color:#93c5fd;
      font-family:'Syne',sans-serif; font-size:12px; font-weight:700;
      letter-spacing:0.1em; text-transform:uppercase; margin-bottom:16px; }

    /* ── Pills on light bg ── */
    .pill-light { background:#dbeafe; border:1px solid #93c5fd;
      border-radius:50px; padding:6px 18px; display:inline-block; color:#1a4fbf;
      font-family:'Syne',sans-serif; font-size:12px; font-weight:700;
      letter-spacing:0.1em; text-transform:uppercase; margin-bottom:16px; }

    /* ── Buttons ── */
    .btn-primary { background:linear-gradient(135deg,#2563eb,#3b82f6); color:#fff;
      padding:15px 36px; border-radius:50px; text-decoration:none;
      font-family:'Syne',sans-serif; font-weight:700; font-size:15px;
      display:inline-block; transition:all 0.3s; border:none; cursor:pointer; }
    .btn-primary:hover { background:linear-gradient(135deg,#1a4fbf,#2563eb);
      transform:translateY(-2px); box-shadow:0 12px 32px rgba(37,99,235,0.45); }

    .btn-outline-dark { background:transparent; color:#bfdbfe; padding:15px 36px;
      border-radius:50px; text-decoration:none; font-family:'Syne',sans-serif;
      font-weight:700; font-size:15px; display:inline-block; transition:all 0.3s;
      border:1.5px solid rgba(191,219,254,0.3); }
    .btn-outline-dark:hover { border-color:#93c5fd; color:#dbeafe; transform:translateY(-2px); }

    .btn-outline-light { background:transparent; color:#1a4fbf; padding:14px 32px;
      border-radius:50px; text-decoration:none; font-family:'Syne',sans-serif;
      font-weight:700; font-size:14px; display:inline-block; transition:all 0.3s;
      border:1.5px solid #93c5fd; }
    .btn-outline-light:hover { background:#dbeafe; border-color:#60a5fa; }

    /* ── User profile btn ── */
    .user-profile-btn { display:flex; align-items:center; gap:8px;
      background:rgba(147,197,253,0.1); border:1.5px solid rgba(147,197,253,0.28);
      border-radius:50px; padding:7px 18px 7px 8px; color:#bfdbfe;
      font-family:'Syne',sans-serif; font-weight:700; font-size:13px;
      text-decoration:none; transition:all 0.3s; cursor:pointer; }
    .user-profile-btn:hover { background:rgba(147,197,253,0.2); border-color:#93c5fd; color:#dbeafe; }

    /* ── FAQ ── */
    .faq-item { border-bottom:1px solid #bfdbfe; padding:20px 0; cursor:pointer; }
    .faq-item:hover .faq-q { color:#2563eb; }

    /* ── How-it-works step card ── */
    .step-card { background:#fff; border-radius:24px; padding:36px 28px; text-align:center;
      border:1px solid #bfdbfe; transition:all 0.3s;
      box-shadow:0 4px 24px rgba(37,99,235,0.07); }
    .step-card:hover { border-color:#93c5fd; box-shadow:0 12px 36px rgba(37,99,235,0.13);
      transform:translateY(-4px); }
  `}</style>
);

/* ─── Navbar ─── */
const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    try { await logout(); navigate('/'); } catch (e) { console.error(e); }
  };

  const getInitials = () => {
    if (!user) return 'U';
    return `${(user.firstName || 'U').charAt(0)}${(user.lastName || '').charAt(0)}`.toUpperCase();
  };

  return (
    <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100,
      background:'rgba(5,16,43,0.9)', backdropFilter:'blur(20px)',
      borderBottom:'1px solid rgba(96,165,250,0.15)', padding:'0 24px' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', height:64,
        display:'flex', alignItems:'center', justifyContent:'space-between' }}>

        {/* Logo with round image */}
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
          <img src="/logo.jpg" alt="ॐ" style={{ height:38, width:38, borderRadius:'50%',
            objectFit:'cover', border:'2px solid rgba(96,165,250,0.3)' }} />
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:17, color:'#eff6ff' }}>AyurSamhita</span>
        </Link>

        {/* Links */}
        <div style={{ display:'flex', gap:32, alignItems:'center' }}>
          <Link to="/"          className="nav-link">Home</Link>
          <Link to="/herbs"     className="nav-link">Herbs</Link>
          <Link to="/doctors"   className="nav-link">Doctors</Link>
          {user && <Link to="/dashboard" className="nav-link">Dashboard</Link>}
        </div>

        {/* Auth section */}
        {user ? (
          <div ref={dropdownRef} style={{ position:'relative' }}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{ width:36, height:36, borderRadius:'50%', border:'1px solid rgba(96,165,250,0.3)',
                background:'rgba(96,165,250,0.15)', color:'#93c5fd', cursor:'pointer',
                fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13,
                display:'flex', alignItems:'center', justifyContent:'center' }}>
              {getInitials()}
            </button>
            {dropdownOpen && (
              <div style={{ position:'absolute', right:0, top:44, minWidth:200,
                background:'rgba(11,29,58,0.97)', backdropFilter:'blur(20px)',
                border:'1px solid rgba(96,165,250,0.2)', borderRadius:16,
                padding:'8px 0', boxShadow:'0 16px 48px rgba(0,0,0,0.5)' }}>
                <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(96,165,250,0.12)' }}>
                  <p style={{ color:'#eff6ff', fontSize:14, fontWeight:600, margin:0,
                    fontFamily:"'Syne',sans-serif" }}>{user.firstName} {user.lastName}</p>
                  <p style={{ color:'rgba(191,219,254,0.5)', fontSize:12, margin:'4px 0 0',
                    textTransform:'capitalize', fontFamily:"'DM Sans',sans-serif" }}>{user.accountType?.toLowerCase()}</p>
                </div>
                <Link to="/dashboard" onClick={() => setDropdownOpen(false)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px',
                    color:'#93c5fd', textDecoration:'none', fontSize:14,
                    fontFamily:"'DM Sans',sans-serif", transition:'background 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.background='rgba(96,165,250,0.1)'}
                  onMouseOut={e => e.currentTarget.style.background='transparent'}
                ><LayoutDashboard size={15} /> Dashboard</Link>
                <button onClick={handleLogout}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px',
                    color:'#93c5fd', fontSize:14, fontFamily:"'DM Sans',sans-serif",
                    background:'none', border:'none', cursor:'pointer', width:'100%',
                    textAlign:'left', transition:'background 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.background='rgba(96,165,250,0.1)'}
                  onMouseOut={e => e.currentTarget.style.background='transparent'}
                ><LogOut size={15} /> Log out</button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <Link to="/login"
              style={{ color:'#93c5fd', textDecoration:'none', fontWeight:600, fontSize:14,
                padding:'8px 16px', borderRadius:20, transition:'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background='rgba(96,165,250,0.08)'; }}
              onMouseOut={e => { e.currentTarget.style.background='transparent'; }}
            >Login</Link>
            <Link to="/signup"
              style={{ background:'linear-gradient(135deg,#2563eb,#3b82f6)', color:'#fff',
                textDecoration:'none', fontWeight:700, fontSize:14, padding:'9px 22px',
                borderRadius:20, fontFamily:"'Syne',sans-serif", transition:'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 8px 20px rgba(37,99,235,0.4)'; }}
              onMouseOut={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}
            >Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

/* ─── Hero ─── */
const HeroSection: React.FC = () => (
  <section style={{ position:'relative', background:'#0f2952', overflow:'hidden',
    padding:'100px 24px 80px', minHeight:'100vh', display:'flex', alignItems:'center' }}>
    {/* Deep navy blob top-left, cobalt blob bottom-right */}
    <Blob style={{ width:640, height:640, background:'#1a4fbf', top:-180, left:-220 }} />
    <Blob style={{ width:420, height:420, background:'#0b1d3a', top:320, right:-120 }} />
    {/* Pastel ice glow center */}
    <div style={{ position:'absolute', top:'35%', left:'45%', width:500, height:500,
      background:'radial-gradient(circle, rgba(147,197,253,0.07) 0%, transparent 70%)',
      pointerEvents:'none' }} />

    <div style={{ maxWidth:1200, margin:'0 auto', width:'100%' }}>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:60,
        animation:'fadeUp 0.6s ease both' }}>
        <span className="pill-dark">💧 Bridging Ancient &amp; Modern Medicine</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }}>
        {/* Left copy */}
        <div style={{ animation:'fadeUp 0.7s ease both' }}>
          <h1 style={{ fontFamily:"'DM Serif Display',serif",
            fontSize:'clamp(48px,6vw,76px)', lineHeight:1.05,
            color:'#eff6ff', margin:'0 0 24px', letterSpacing:'-0.02em' }}>
            Where <em style={{ color:'#60a5fa', fontStyle:'italic' }}>Ancient</em><br />
            Meets <em style={{ color:'#93c5fd', fontStyle:'italic' }}>Modern</em><br />
            <span style={{ color:'#bfdbfe' }}>Healing</span>
          </h1>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:17, lineHeight:1.75,
            color:'rgba(191,219,254,0.72)', margin:'0 0 40px', maxWidth:460 }}>
            AyurSamhita connects you with 500+ certified practitioners, dual-medicine search
            across 150+ remedies, and real-time teleconsultation — all in one platform.
          </p>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:48 }}>
            <Link to="/doctors" className="btn-primary">Find a Doctor →</Link>
            <Link to="/herbs"   className="btn-outline-dark">Explore Herbs</Link>
          </div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {[{icon:'👨‍⚕️',text:'500+ Practitioners'},{icon:'🌿',text:'150+ Remedies'},{icon:'📹',text:'Video Consults'}]
              .map(s => (
                <span key={s.text} className="stat-chip">
                  <span style={{ fontSize:16 }}>{s.icon}</span>{s.text}
                </span>
              ))}
          </div>
        </div>

        {/* Right — floating cards */}
        <div style={{ position:'relative', height:480, animation:'fadeUp 0.9s ease both' }}>
          {/* Main card */}
          <div className="floating-card" style={{ position:'absolute', top:40, left:20, right:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
              <div style={{ width:48, height:48, background:'rgba(96,165,250,0.18)',
                borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Search size={22} color="#60a5fa" />
              </div>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:'#eff6ff', fontSize:15 }}>Dual Medicine Search</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", color:'rgba(191,219,254,0.6)', fontSize:13 }}>Ayurvedic + Allopathic</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {/* Herb tags in different pastel blues */}
              {[['Ashwagandha','#dbeafe','#1a4fbf'],['Turmeric','#e0e7ff','#4338ca'],['Triphala','#bfdbfe','#1e40af']]
                .map(([h,bg,col]) => (
                  <span key={h} style={{ background:bg, borderRadius:20, padding:'5px 13px',
                    color:col, fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:500 }}>{h}</span>
                ))}
            </div>
          </div>

          {/* Bottom-left */}
          <div className="floating-card" style={{ position:'absolute', bottom:60, left:10, width:184,
            animationDelay:'1.2s', animationDuration:'4.5s' }}>
            <Stethoscope size={24} color="#60a5fa" style={{ marginBottom:10 }} />
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:'#eff6ff', fontSize:14 }}>Live Consult</div>
            <div style={{ display:'flex', marginTop:12, alignItems:'center' }}>
              {[['#2563eb','#eff6ff'],['#60a5fa','#05102b'],['#bfdbfe','#1a4fbf']].map(([bg,border],i) => (
                <div key={i} style={{ width:28, height:28, borderRadius:'50%', background:bg,
                  border:`2px solid ${border}`, marginLeft:i>0?-8:0 }} />
              ))}
              <span style={{ marginLeft:10, color:'rgba(191,219,254,0.6)',
                fontFamily:"'DM Sans',sans-serif", fontSize:12 }}>+42 online</span>
            </div>
          </div>

          {/* Bottom-right */}
          <div className="floating-card" style={{ position:'absolute', bottom:40, right:10, width:184,
            animationDelay:'2s', animationDuration:'5s' }}>
            <div style={{ display:'flex', gap:3, marginBottom:10 }}>
              {[1,2,3,4,5].map(j => <Star key={j} size={13} color="#fbbf24" fill="#fbbf24" />)}
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", color:'#eff6ff', fontSize:13, lineHeight:1.5 }}>
              "Found relief in 2 weeks with Ayurvedic care!"
            </div>
            <div style={{ marginTop:10, color:'rgba(191,219,254,0.5)',
              fontFamily:"'DM Sans',sans-serif", fontSize:11 }}>— Priya S.</div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ─── Who is this for ─── */
const AudienceSection: React.FC = () => (
  <section style={{ background:'#eff6ff', padding:'80px 24px', position:'relative', overflow:'hidden' }}>
    {/* Subtle grid */}
    <div style={{ position:'absolute', inset:0, pointerEvents:'none',
      backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(37,99,235,0.045) 39px,rgba(37,99,235,0.045) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(37,99,235,0.045) 39px,rgba(37,99,235,0.045) 40px)' }} />
    <div style={{ maxWidth:1200, margin:'0 auto', position:'relative' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }}>
        <div>
          <span className="pill-light">Who is this for?</span>
          <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(36px,4vw,52px)',
            color:'#05102b', lineHeight:1.15, margin:'0 0 20px' }}>
            For anyone seeking <em style={{ color:'#2563eb', fontStyle:'italic' }}>complete</em> healthcare
          </h2>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:16, lineHeight:1.75,
            color:'#1e3a5f', margin:'0 0 32px', maxWidth:420 }}>
            Whether you're exploring Ayurveda for the first time or looking to complement your
            allopathic treatment — AyurSamhita is your guide.
          </p>
          <Link to="/signup" className="btn-primary" style={{ padding:'14px 32px', fontSize:14 }}>Join Free →</Link>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {[
            {icon:'🌿', title:'Wellness Seekers', desc:'Explore herbs by condition or symptom', accent:'#dbeafe', text:'#1e40af'},
            {icon:'🏥', title:'Patients',         desc:'Book consultations with verified specialists', accent:'#e0e7ff', text:'#4338ca'},
            {icon:'👨‍⚕️', title:'Practitioners',  desc:'Reach patients and manage appointments', accent:'#bfdbfe', text:'#1a4fbf'},
            {icon:'📚', title:'Researchers',       desc:'Access 150+ ancient remedies & treatments', accent:'#ede9fe', text:'#5b21b6'},
          ].map(({icon,title,desc,accent,text}) => (
            <div key={title} className="audience-card">
              <div style={{ width:44, height:44, background:accent, borderRadius:14,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:22, marginBottom:14 }}>{icon}</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:'#05102b', fontSize:15, marginBottom:8 }}>{title}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", color:'#1e3a5f', fontSize:13, lineHeight:1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

/* ─── Features ─── */
const FeaturesSection: React.FC = () => {
  /* Each card gets its own icon bg shade */
  const features = [
    { icon:<Search  size={26} color="#60a5fa" />, iconBg:'rgba(96,165,250,0.14)',
      title:"Dual-Medicine Search",    tag:"Smart Discovery",    tagColor:'#bfdbfe', tagBg:'rgba(191,219,254,0.12)',
      description:"Type any disease and instantly get Ayurvedic herbs alongside allopathic treatments from 150+ verified remedies.", link:"/herbs" },
    { icon:<Users   size={26} color="#818cf8" />, iconBg:'rgba(129,140,248,0.14)',
      title:"Expert Practitioners",    tag:"Doctor Directory",   tagColor:'#c7d2fe', tagBg:'rgba(199,210,254,0.12)',
      description:"Browse 500+ certified doctors. Filter by specialization, experience, location, and consultation type.", link:"/doctors" },
    { icon:<Video   size={26} color="#38bdf8" />, iconBg:'rgba(56,189,248,0.14)',
      title:"Teleconsultation",         tag:"Real-Time",          tagColor:'#bae6fd', tagBg:'rgba(186,230,253,0.12)',
      description:"HD video calls via MiroTalk SFU — right in your browser. No downloads. Consult from anywhere.", link:"/doctors" },
    { icon:<Calendar size={26} color="#93c5fd" />, iconBg:'rgba(147,197,253,0.14)',
      title:"Easy Booking",             tag:"Instant Scheduling", tagColor:'#bfdbfe', tagBg:'rgba(191,219,254,0.12)',
      description:"Schedule appointments in seconds. Choose video, audio, or in-person at your convenience.", link:"/doctors" },
    { icon:<Heart   size={26} color="#f472b6" />, iconBg:'rgba(244,114,182,0.12)',
      title:"Patient Dashboard",        tag:"Health Hub",         tagColor:'#fbcfe8', tagBg:'rgba(251,207,232,0.1)',
      description:"Manage appointments, saved medicines, health records, and your profile — all in one secure space.", link:"/dashboard" },
    { icon:<Shield  size={26} color="#4ade80" />, iconBg:'rgba(74,222,128,0.12)',
      title:"Secure & Private",         tag:"Protected",          tagColor:'#bbf7d0', tagBg:'rgba(187,247,208,0.1)',
      description:"Enterprise-grade JWT + Google OAuth security. Your health data stays encrypted and yours.", link:"/dashboard" },
  ];

  return (
    <section style={{ background:'#0b1d3a', padding:'100px 24px' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:64 }}>
          <span className="pill-dark">What's in store?</span>
          <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(36px,4vw,52px)',
            color:'#eff6ff', lineHeight:1.15, margin:'0 auto 16px', maxWidth:560 }}>
            Everything you need for holistic health
          </h2>
          <p style={{ fontFamily:"'DM Sans',sans-serif", color:'rgba(191,219,254,0.6)',
            fontSize:16, maxWidth:480, margin:'0 auto' }}>
            The perfect blend of 5000-year-old Ayurvedic wisdom and modern medical convenience.
          </p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))', gap:20 }}>
          {features.map((f,i) => (
            <div key={i} className="feature-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
                <div style={{ width:54, height:54, background:f.iconBg, borderRadius:16,
                  display:'flex', alignItems:'center', justifyContent:'center' }}>{f.icon}</div>
                <span style={{ background:f.tagBg, border:`1px solid ${f.tagColor}33`,
                  borderRadius:20, padding:'4px 12px', color:f.tagColor,
                  fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:500 }}>{f.tag}</span>
              </div>
              <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:18,
                color:'#eff6ff', margin:'0 0 12px' }}>{f.title}</h3>
              <p style={{ fontFamily:"'DM Sans',sans-serif", color:'rgba(191,219,254,0.62)',
                fontSize:14, lineHeight:1.7, margin:'0 0 20px' }}>{f.description}</p>
              <Link to={f.link} style={{ color:'#60a5fa', textDecoration:'none',
                fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13,
                display:'flex', alignItems:'center', gap:6 }}>
                Learn more <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── How It Works ─── */
const HowItWorksSection: React.FC = () => {
  const steps = [
    { step:'01', title:'Create Your Profile', icon:'👤',
      desc:'Sign up with email or Google. Complete your health profile to unlock personalized recommendations.',
      accent:'#dbeafe', num:'#2563eb' },
    { step:'02', title:'Search & Discover', icon:'🔍',
      desc:'Enter any disease or symptom to get Ayurvedic and allopathic options side-by-side from our verified database.',
      accent:'#e0e7ff', num:'#4338ca' },
    { step:'03', title:'Consult & Heal', icon:'💊',
      desc:'Book video, audio, or in-person consultations with specialists. Follow your personalized treatment plan.',
      accent:'#bfdbfe', num:'#1a4fbf' },
  ];

  return (
    <section style={{ background:'#eff6ff', padding:'100px 24px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:-100, right:-100, width:380, height:380,
        background:'rgba(37,99,235,0.06)', borderRadius:'60% 40% 70% 30% / 40% 60% 30% 70%',
        pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:-80, left:-80, width:300, height:300,
        background:'rgba(129,140,248,0.06)', borderRadius:'50%', pointerEvents:'none' }} />
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:64 }}>
          <span className="pill-light">How it works</span>
          <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(36px,4vw,52px)',
            color:'#05102b', lineHeight:1.15, margin:'0 auto 16px' }}>
            Three simple steps to wellness
          </h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:28 }}>
          {steps.map((s,i) => (
            <div key={i} className="step-card">
              {/* Step number bubble */}
              <div style={{ width:52, height:52, background:s.accent,
                border:`2px solid ${s.num}`, borderRadius:'50%',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, color:s.num,
                margin:'0 auto 20px' }}>{s.step}</div>
              <div style={{ fontSize:36, marginBottom:16 }}>{s.icon}</div>
              <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:19,
                color:'#05102b', margin:'0 0 12px' }}>{s.title}</h3>
              <p style={{ fontFamily:"'DM Sans',sans-serif", color:'#1e3a5f',
                fontSize:14, lineHeight:1.7, margin:0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── Success Stories ─── */
const SuccessStoriesSection: React.FC = () => {
  const stories = [
    { name:"Priya Sharma",  role:"Software Engineer", condition:"Stress & Anxiety",
      content:"The dual-medicine search was a revelation. Got Ashwagandha recommendations alongside my doctor's prescription — and finally sleeping well.",
      stars:5, avatar:'PS', avatarBg:'rgba(96,165,250,0.18)',  avatarBorder:'#60a5fa',  avatarText:'#93c5fd',
      tagBg:'rgba(96,165,250,0.12)', tagBorder:'rgba(96,165,250,0.25)', tagText:'#93c5fd' },
    { name:"Rajesh Kumar",  role:"Business Owner",    condition:"Digestive Health",
      content:"Booked a teleconsult in minutes. My doctor recommended Triphala alongside dietary changes. Three weeks later — transformed.",
      stars:5, avatar:'RK', avatarBg:'rgba(129,140,248,0.18)', avatarBorder:'#818cf8', avatarText:'#c7d2fe',
      tagBg:'rgba(129,140,248,0.12)', tagBorder:'rgba(129,140,248,0.25)', tagText:'#c7d2fe' },
    { name:"Anita Desai",   role:"School Teacher",    condition:"Natural Wellness",
      content:"The herb browser is incredible. I can look up any symptom and get trusted Ayurvedic remedies with clear dosage guidance.",
      stars:5, avatar:'AD', avatarBg:'rgba(56,189,248,0.18)',  avatarBorder:'#38bdf8',  avatarText:'#bae6fd',
      tagBg:'rgba(56,189,248,0.12)', tagBorder:'rgba(56,189,248,0.25)', tagText:'#bae6fd' },
  ];

  return (
    <section style={{ background:'#05102b', padding:'100px 24px' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:64 }}>
          <span className="pill-dark">Success Stories</span>
          <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(36px,4vw,52px)',
            color:'#eff6ff', lineHeight:1.15, margin:'0 auto 16px' }}>
            Real people, real results
          </h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
          {stories.map((s,i) => (
            <div key={i} className="story-card">
              <div style={{ display:'flex', gap:3, marginBottom:20 }}>
                {Array(s.stars).fill(0).map((_,j)=><Star key={j} size={14} color="#fbbf24" fill="#fbbf24"/>)}
              </div>
              <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:16, lineHeight:1.68,
                color:'rgba(239,246,255,0.88)', margin:'0 0 28px', fontStyle:'italic' }}>
                "{s.content}"
              </p>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:'50%',
                    background:s.avatarBg, border:`1.5px solid ${s.avatarBorder}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:12,
                    color:s.avatarText }}>{s.avatar}</div>
                  <div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:'#eff6ff', fontSize:14 }}>{s.name}</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", color:'rgba(191,219,254,0.5)', fontSize:12 }}>{s.role}</div>
                  </div>
                </div>
                <span style={{ background:s.tagBg, border:`1px solid ${s.tagBorder}`,
                  borderRadius:20, padding:'4px 10px', color:s.tagText,
                  fontFamily:"'DM Sans',sans-serif", fontSize:11 }}>{s.condition}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── FAQ ─── */
const FAQSection: React.FC = () => {
  const [open, setOpen] = useState<number|null>(null);
  const faqs = [
    { q:'What is AyurSamhita?', a:'AyurSamhita is a comprehensive digital healthcare platform that uniquely integrates Ayurvedic remedies with modern allopathic medicine — letting you search diseases, consult practitioners, and book appointments in one place.' },
    { q:'How does the dual-medicine search work?', a:'Enter any disease or symptom and our system instantly retrieves both Ayurvedic herbal remedies and allopathic treatment options from our verified database of 150+ remedies.' },
    { q:'Are the practitioners certified?', a:'Yes. All practitioners go through verification. Ayurvedic doctors hold BAMS/MD (Ayurveda) degrees, and allopathic specialists are verified against their respective medical councils.' },
    { q:'Can I do teleconsultation from anywhere?', a:'Absolutely. Our teleconsultation is powered by MiroTalk SFU and runs entirely in your browser — no download needed. Consult from home, office, or anywhere with internet access.' },
    { q:'Is my health data private?', a:'Yes. We use enterprise-grade security, JWT-based authentication, and comply with data privacy best practices. Your health records are encrypted and never shared without consent.' },
    { q:'Is AyurSamhita free to use?', a:'Creating an account, searching remedies, and browsing doctors are completely free. Individual consultation fees are set by each practitioner.' },
  ];

  return (
    <section style={{ background:'#eff6ff', padding:'100px 24px' }}>
      <div style={{ maxWidth:760, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <span className="pill-light">FAQ's</span>
          <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(36px,4vw,48px)',
            color:'#05102b', lineHeight:1.15, margin:0 }}>Frequently asked questions</h2>
        </div>
        {faqs.map((faq,i) => (
          <div key={i} className="faq-item" onClick={()=>setOpen(open===i?null:i)}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span className="faq-q" style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16,
                color: open===i ? '#2563eb' : '#05102b', flex:1, paddingRight:24,
                transition:'color 0.2s' }}>{faq.q}</span>
              <ChevronDown size={20} color={open===i ? '#3b82f6' : '#1e3a5f'}
                style={{ transform: open===i ? 'rotate(180deg)' : 'none', transition:'transform 0.3s', flexShrink:0 }} />
            </div>
            {open===i && (
              <p style={{ fontFamily:"'DM Sans',sans-serif", color:'#1e3a5f', fontSize:15,
                lineHeight:1.7, margin:'16px 0 4px', paddingRight:32 }}>{faq.a}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

/* ─── CTA ─── */
const CTASection: React.FC = () => (
  <section style={{ background:'#0f2952', padding:'100px 24px', position:'relative', overflow:'hidden' }}>
    {/* Pastel radial glows */}
    <div style={{ position:'absolute', inset:0, pointerEvents:'none',
      backgroundImage:'radial-gradient(circle at 18% 50%, rgba(96,165,250,0.12) 0%, transparent 48%), radial-gradient(circle at 82% 50%, rgba(129,140,248,0.1) 0%, transparent 48%)' }} />
    {/* Decorative rings */}
    <div style={{ position:'absolute', top:36, right:80, width:84, height:84,
      border:'2px dashed rgba(147,197,253,0.25)', borderRadius:'50%',
      animation:'spin 22s linear infinite', pointerEvents:'none' }} />
    <div style={{ position:'absolute', bottom:36, left:80, width:52, height:52,
      border:'2px dashed rgba(199,210,254,0.2)', borderRadius:'50%',
      animation:'spin 16s linear infinite reverse', pointerEvents:'none' }} />

    <div style={{ maxWidth:700, margin:'0 auto', textAlign:'center', position:'relative' }}>
      <div style={{ fontSize:48, marginBottom:24 }}>💧</div>
      <h2 style={{ fontFamily:"'DM Serif Display',serif",
        fontSize:'clamp(40px,5vw,60px)', color:'#eff6ff', lineHeight:1.1, margin:'0 0 20px' }}>
        Ready to stay ahead of your{' '}
        <em style={{ color:'#93c5fd', fontStyle:'italic' }}>health?</em>
      </h2>
      <p style={{ fontFamily:"'DM Sans',sans-serif", color:'rgba(191,219,254,0.7)',
        fontSize:17, lineHeight:1.7, margin:'0 0 40px' }}>
        Join thousands discovering the power of integrated medicine.
        Your journey to holistic health starts with one click.
      </p>
      <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
        <Link to="/signup" className="btn-primary"
          style={{ padding:'16px 40px', boxShadow:'0 8px 30px rgba(37,99,235,0.45)' }}>
          Get Started Free
        </Link>
        <Link to="/doctors" className="btn-outline-dark" style={{ padding:'16px 40px' }}>
          Book Consultation
        </Link>
      </div>
    </div>
  </section>
);

/* ─── Footer ─── */
const Footer: React.FC = () => (
  <footer style={{ background:'#05102b', padding:'48px 24px',
    borderTop:'1px solid rgba(96,165,250,0.09)' }}>
    <div style={{ maxWidth:1200, margin:'0 auto' }}>
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:48, marginBottom:40 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <img src="/logo.jpg" alt="ॐ" style={{ height:32, width:32, borderRadius:'50%', objectFit:'cover', border:'2px solid rgba(96,165,250,0.3)' }} />
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18, color:'#eff6ff' }}>AyurSamhita</span>
          </div>
          <p style={{ fontFamily:"'DM Sans',sans-serif", color:'rgba(191,219,254,0.42)',
            fontSize:13, lineHeight:1.7, maxWidth:260, margin:0 }}>
            A platform built for those who believe in the wisdom of ancient healing, enhanced by modern science.
          </p>
        </div>
        {[
          {title:'Platform', links:['Find Doctors','Explore Herbs','Teleconsult','Dashboard']},
          {title:'Company',  links:['About Us','Blog','Careers','Press']},
          {title:'Legal',    links:['Privacy Policy','Terms of Service','Code of Conduct','FAQ']},
        ].map(col => (
          <div key={col.title}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13,
              color:'#bfdbfe', marginBottom:16, textTransform:'uppercase', letterSpacing:'0.08em' }}>
              {col.title}
            </div>
            {col.links.map(l => (
              <div key={l} style={{ fontFamily:"'DM Sans',sans-serif",
                color:'rgba(191,219,254,0.38)', fontSize:13, marginBottom:10, cursor:'pointer' }}>{l}</div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ borderTop:'1px solid rgba(96,165,250,0.07)', paddingTop:24,
        display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontFamily:"'DM Sans',sans-serif", color:'rgba(191,219,254,0.28)', fontSize:12 }}>
          © 2025 AyurSamhita. All rights reserved.
        </span>
        <span style={{ fontFamily:"'DM Sans',sans-serif", color:'rgba(191,219,254,0.28)', fontSize:12 }}>
          Privacy Policy
        </span>
      </div>
    </div>
  </footer>
);

/* ─── Root ─── */
export const LandingPage: React.FC = () => (
  <div style={{ minHeight:'100vh', fontFamily:"'DM Sans',sans-serif" }}>
    <GlobalStyles />
    <Navbar />
    <div style={{ paddingTop:64 }}>
      <HeroSection />
      <Marquee />
      <AudienceSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SuccessStoriesSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  </div>
);