import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, Loader2, Droplets, Stethoscope, User, UserCircle } from 'lucide-react';
import { useAuth } from '../../App';

declare global {
  interface Window { google: any; }
}

const Blob: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div style={{
    position: 'absolute', borderRadius: '60% 40% 70% 30% / 40% 60% 30% 70%',
    opacity: 0.15, pointerEvents: 'none', ...style
  }} />
);

export const LoginPage: React.FC = () => {
  const [role, setRole] = useState<'Patient' | 'Doctor'>('Patient');
  // Patient fields
  const [email, setEmail] = useState('');
  // Doctor fields  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  // Shared
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { login, googleLogin, logout, doctorLogin } = useAuth();
  const navigate = useNavigate();

  // Initialize Google Sign-In (only for Patient)
  useEffect(() => {
    if (role !== 'Patient') return;
    const initializeGoogleSignIn = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: '172222448657-8qanqq7lktmbl11t9431sjoujk73254k.apps.googleusercontent.com',
          callback: handleGoogleSignIn,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        const el = document.getElementById('googleSignInButton');
        if (el) {
          el.innerHTML = '';
          window.google.accounts.id.renderButton(el, {
            theme: 'outline', size: 'large', width: 360,
            text: 'signin_with', logo_alignment: 'left'
          });
        }
      }
    };
    if (!document.querySelector('#google-signin-script')) {
      const script = document.createElement('script');
      script.id = 'google-signin-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true; script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.head.appendChild(script);
    } else {
      setTimeout(initializeGoogleSignIn, 100);
    }
  }, [role]);

  const handleGoogleSignIn = async (response: any) => {
    setIsGoogleLoading(true);
    try {
      const accountType = await googleLogin(response.credential);
      if (accountType === 'Doctor') {
        await logout();
        toast.error('Doctors cannot sign in with Google. Please use the Doctor tab.');
        return;
      }
      toast.success('Signed in successfully with Google!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Google sign-in failed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setIsLoading(true);
    try {
      const accountType = await login(email, password);
      if (accountType === 'Doctor') {
        await logout();
        toast.error('This is a doctor account. Please use the Doctor tab.');
        return;
      }
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !password) {
      toast.error('Please enter your first name, last name and password');
      return;
    }
    setIsLoading(true);
    try {
      await doctorLogin(firstName.trim(), lastName.trim(), password);
      toast.success(`Welcome, Dr. ${firstName}!`);
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Doctor login failed. Check your name and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const isDoctor = role === 'Doctor';

  const inputStyle = (accent: string): React.CSSProperties => ({
    width: '100%', padding: '13px 14px 13px 42px',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid rgba(${accent},0.2)`, borderRadius: 14,
    color: '#eff6ff', fontFamily: "'DM Sans',sans-serif",
    fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const,
  });

  const accent = isDoctor ? '52,211,153' : '96,165,250';
  const accentColor = isDoctor ? '#34d399' : '#60a5fa';

  return (
    <div style={{
      minHeight: '100vh', background: '#0f2952', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', position: 'relative', overflow: 'hidden',
      fontFamily: "'DM Sans',sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .login-input:focus { border-color: rgba(${accent},0.5) !important; }
        .role-tab { transition: all 0.25s ease; cursor: pointer; border: none; outline: none; }
        .role-tab:hover { opacity: 0.85; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); }
      `}</style>

      <Blob style={{ width: 640, height: 640, background: '#1a4fbf', top: -180, left: -220 }} />
      <Blob style={{ width: 420, height: 420, background: isDoctor ? '#0d3a2e' : '#0b1d3a', bottom: -100, right: -120 }} />

      <div style={{
        maxWidth: 960, width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 48, alignItems: 'center', animation: 'fadeUp 0.7s ease both', position: 'relative', zIndex: 1
      }}>

        {/* Left — branding */}
        <div style={{ padding: '20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <Droplets size={28} color="#60a5fa" />
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: '#eff6ff' }}>AyurSamhita</span>
          </div>
          <h1 style={{
            fontFamily: "'DM Serif Display',serif", fontSize: 'clamp(36px,4vw,52px)',
            lineHeight: 1.1, color: '#eff6ff', margin: '0 0 20px'
          }}>
            {isDoctor
              ? <>Doctor <em style={{ color: '#34d399', fontStyle: 'italic' }}>Portal</em></>
              : <>Welcome <em style={{ color: '#60a5fa', fontStyle: 'italic' }}>Back</em></>
            }
          </h1>
          <p style={{
            fontSize: 15, lineHeight: 1.7, color: 'rgba(191,219,254,0.65)',
            margin: '0 0 40px', maxWidth: 380
          }}>
            {isDoctor
              ? 'Login with your registered name to access patient appointments, collaborate with colleagues, and manage your practice.'
              : 'Continue your healthcare journey. Access Ayurvedic remedies, consult practitioners, and manage your holistic health.'}
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {isDoctor ? (
              [['Name-based', 'Login'], ['Patient', 'Details'], ['Collaborate', 'Doctors'], ['Jitsi', 'Video Call']].map(([n, l], i) => (
                <div key={l} style={{
                  background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(52,211,153,0.22)', borderRadius: 16, padding: '14px 18px',
                  animation: 'float 4s ease-in-out infinite', animationDelay: `${i * 0.5}s`
                }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: '#eff6ff', fontSize: 13 }}>{n}</div>
                  <div style={{ color: 'rgba(191,219,254,0.5)', fontSize: 11 }}>{l}</div>
                </div>
              ))
            ) : (
              [['500+', 'Practitioners'], ['150+', 'Remedies'], ['24/7', 'Teleconsult']].map(([n, l], i) => (
                <div key={l} style={{
                  background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(96,165,250,0.22)', borderRadius: 16, padding: '14px 18px',
                  animation: 'float 4s ease-in-out infinite', animationDelay: `${i}s`
                }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: '#eff6ff', fontSize: 13 }}>{n}</div>
                  <div style={{ color: 'rgba(191,219,254,0.5)', fontSize: 11 }}>{l}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right — Login Form */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)',
          border: `1px solid rgba(${accent},0.18)`, borderRadius: 28, padding: '40px 36px'
        }}>

          {/* Role Toggle */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.25)', borderRadius: 50, padding: 4, marginBottom: 28, gap: 4 }}>
            {(['Patient', 'Doctor'] as const).map(r => (
              <button key={r} className="role-tab" onClick={() => { setRole(r); setPassword(''); setEmail(''); setFirstName(''); setLastName(''); }}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 50, fontSize: 14, fontWeight: 700,
                  fontFamily: "'Syne',sans-serif", display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 7,
                  background: role === r
                    ? r === 'Doctor' ? 'linear-gradient(135deg,#059669,#34d399)' : 'linear-gradient(135deg,#2563eb,#3b82f6)'
                    : 'transparent',
                  color: role === r ? '#fff' : 'rgba(191,219,254,0.5)',
                  boxShadow: role === r ? '0 4px 15px rgba(0,0,0,0.3)' : 'none',
                }}>
                {r === 'Patient' ? <User size={14} /> : <Stethoscope size={14} />}
                {r}
              </button>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: '#eff6ff', margin: '0 0 6px' }}>
              {isDoctor ? 'Doctor Sign In' : 'Patient Sign In'}
            </h2>
            <p style={{ color: 'rgba(191,219,254,0.5)', fontSize: 13, margin: 0 }}>
              {isDoctor ? 'Enter your registered name and password' : 'Enter your credentials to continue'}
            </p>
          </div>

          {/* ── PATIENT FORM ── */}
          {!isDoctor && (
            <>
              <div style={{ marginBottom: 20 }}>
                <div id="googleSignInButton" style={{ marginBottom: 8 }} />
                {isGoogleLoading && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}>
                    <Loader2 size={16} color="#93c5fd" style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ color: 'rgba(191,219,254,0.6)', fontSize: 13 }}>Signing in with Google...</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(96,165,250,0.15)' }} />
                  <span style={{
                    fontFamily: "'Syne',sans-serif", fontSize: 10, fontWeight: 700,
                    color: 'rgba(191,219,254,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em'
                  }}>Or</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(96,165,250,0.15)' }} />
                </div>
              </div>
              <form onSubmit={handlePatientSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: '#bfdbfe', display: 'block', marginBottom: 8 }}>Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} color={accentColor} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      placeholder="Enter your email" className="login-input" style={inputStyle(accent)} />
                  </div>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: '#bfdbfe', display: 'block', marginBottom: 8 }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} color={accentColor} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                      placeholder="Enter your password" className="login-input" style={{ ...inputStyle(accent), paddingRight: 44 }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {showPassword ? <EyeOff size={15} color="rgba(191,219,254,0.4)" /> : <Eye size={15} color="rgba(191,219,254,0.4)" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={isLoading} className="submit-btn"
                  style={{
                    width: '100%', padding: '14px', background: 'linear-gradient(135deg,#2563eb,#3b82f6)',
                    color: '#fff', borderRadius: 50, border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s', opacity: isLoading ? 0.7 : 1
                  }}>
                  {isLoading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Signing in...</> : 'Sign In'}
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <span style={{ color: 'rgba(191,219,254,0.4)', fontSize: 14 }}>Don't have an account? </span>
                <Link to="/signup" style={{ color: '#60a5fa', textDecoration: 'none', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14 }}>Sign up</Link>
              </div>
            </>
          )}

          {/* ── DOCTOR FORM ── */}
          {isDoctor && (
            <>
              <div style={{
                background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)',
                borderRadius: 12, padding: '11px 14px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 10
              }}>
                <Stethoscope size={15} color="#34d399" />

              </div>
              <form onSubmit={handleDoctorSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: '#6ee7b7', display: 'block', marginBottom: 8 }}>First Name</label>
                    <div style={{ position: 'relative' }}>
                      <UserCircle size={15} color="#34d399" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                      <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required
                        placeholder="e.g. Arpit" className="login-input"
                        style={{ ...inputStyle(accent), paddingLeft: 36 }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: '#6ee7b7', display: 'block', marginBottom: 8 }}>Last Name</label>
                    <div style={{ position: 'relative' }}>
                      <UserCircle size={15} color="#34d399" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                      <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required
                        placeholder="e.g. Jaiswal" className="login-input"
                        style={{ ...inputStyle(accent), paddingLeft: 36 }} />
                    </div>
                  </div>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: '#6ee7b7', display: 'block', marginBottom: 8 }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} color="#34d399" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                      placeholder="
                      " className="login-input"
                      style={{ ...inputStyle(accent), paddingRight: 44 }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {showPassword ? <EyeOff size={15} color="rgba(191,219,254,0.4)" /> : <Eye size={15} color="rgba(191,219,254,0.4)" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={isLoading} className="submit-btn"
                  style={{
                    width: '100%', padding: '14px', background: 'linear-gradient(135deg,#059669,#34d399)',
                    color: '#fff', borderRadius: 50, border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s', opacity: isLoading ? 0.7 : 1
                  }}>
                  {isLoading
                    ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Signing in...</>
                    : <><Stethoscope size={15} /> Sign In as Doctor</>}
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: 18 }}>
                <button onClick={() => setRole('Patient')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(52,211,153,0.6)',
                    fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 13
                  }}>
                  ← Switch to Patient Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};