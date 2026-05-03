import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, Loader2, Droplets } from 'lucide-react';
import { useAuth } from '../../App';

declare global {
  interface Window {
    google: any;
  }
}

/* ─── Blob ─── */
const Blob: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div style={{ position:'absolute', borderRadius:'60% 40% 70% 30% / 40% 60% 30% 70%',
    opacity:0.15, pointerEvents:'none', ...style }} />
);

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  // Initialize Google Sign-In
  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: '172222448657-8qanqq7lktmbl11t9431sjoujk73254k.apps.googleusercontent.com',
          callback: handleGoogleSignIn,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Render Google Sign-In button
        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInButton'),
          {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
            logo_alignment: 'left'
          }
        );
      }
    };

    // Load Google Sign-In script
    const loadGoogleScript = () => {
      if (!document.querySelector('#google-signin-script')) {
        const script = document.createElement('script');
        script.id = 'google-signin-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initializeGoogleSignIn;
        document.head.appendChild(script);
      } else {
        initializeGoogleSignIn();
      }
    };

    loadGoogleScript();
  }, []);

  const handleGoogleSignIn = async (response: any) => {
    setIsGoogleLoading(true);
    try {
      await googleLogin(response.credential);
      toast.success('Signed in successfully with Google!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:'100vh', background:'#0f2952', display:'flex', alignItems:'center',
      justifyContent:'center', padding:'48px 24px', position:'relative', overflow:'hidden',
      fontFamily:"'DM Sans',sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
      `}</style>

      {/* Background blobs */}
      <Blob style={{ width:640, height:640, background:'#1a4fbf', top:-180, left:-220 }} />
      <Blob style={{ width:420, height:420, background:'#0b1d3a', bottom:-100, right:-120 }} />
      <div style={{ position:'absolute', top:'30%', left:'50%', width:500, height:500,
        background:'radial-gradient(circle, rgba(147,197,253,0.07) 0%, transparent 70%)',
        pointerEvents:'none' }} />

      <div style={{ maxWidth:960, width:'100%', display:'grid', gridTemplateColumns:'1fr 1fr',
        gap:48, alignItems:'center', animation:'fadeUp 0.7s ease both', position:'relative', zIndex:1 }}>

        {/* Left side — branding */}
        <div style={{ padding:'20px 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:32 }}>
            <Droplets size={28} color="#60a5fa" />
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22, color:'#eff6ff' }}>AyurSamhita</span>
          </div>
          <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(36px,4vw,52px)',
            lineHeight:1.1, color:'#eff6ff', margin:'0 0 20px' }}>
            Welcome <em style={{ color:'#60a5fa', fontStyle:'italic' }}>Back</em>
          </h1>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:16, lineHeight:1.7,
            color:'rgba(191,219,254,0.65)', margin:'0 0 40px', maxWidth:380 }}>
            Continue your healthcare journey. Access Ayurvedic remedies, consult practitioners,
            and manage your holistic health — all in one place.
          </p>

          {/* Floating info cards */}
          <div style={{ display:'flex', gap:16 }}>
            <div style={{ background:'rgba(255,255,255,0.05)', backdropFilter:'blur(20px)',
              border:'1px solid rgba(96,165,250,0.22)', borderRadius:16, padding:'16px 20px',
              animation:'float 4s ease-in-out infinite' }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:'#eff6ff', fontSize:14 }}>500+</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", color:'rgba(191,219,254,0.5)', fontSize:12 }}>Practitioners</div>
            </div>
            <div style={{ background:'rgba(255,255,255,0.05)', backdropFilter:'blur(20px)',
              border:'1px solid rgba(96,165,250,0.22)', borderRadius:16, padding:'16px 20px',
              animation:'float 4s ease-in-out infinite', animationDelay:'1s' }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:'#eff6ff', fontSize:14 }}>150+</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", color:'rgba(191,219,254,0.5)', fontSize:12 }}>Remedies</div>
            </div>
            <div style={{ background:'rgba(255,255,255,0.05)', backdropFilter:'blur(20px)',
              border:'1px solid rgba(96,165,250,0.22)', borderRadius:16, padding:'16px 20px',
              animation:'float 4s ease-in-out infinite', animationDelay:'2s' }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:'#eff6ff', fontSize:14 }}>24/7</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", color:'rgba(191,219,254,0.5)', fontSize:12 }}>Teleconsult</div>
            </div>
          </div>
        </div>

        {/* Right side — Login Form */}
        <div style={{ background:'rgba(255,255,255,0.04)', backdropFilter:'blur(24px)',
          border:'1px solid rgba(96,165,250,0.18)', borderRadius:28, padding:'40px 36px' }}>

          <div style={{ textAlign:'center', marginBottom:32 }}>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:24,
              color:'#eff6ff', margin:'0 0 8px' }}>Sign In</h2>
            <p style={{ fontFamily:"'DM Sans',sans-serif", color:'rgba(191,219,254,0.55)',
              fontSize:14, margin:0 }}>Enter your credentials to access your account</p>
          </div>

          {/* Google Sign-In */}
          <div style={{ marginBottom:24 }}>
            <div id="googleSignInButton"></div>
            {isGoogleLoading && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:12 }}>
                <Loader2 size={16} color="#93c5fd" style={{ animation:'spin 1s linear infinite' }} />
                <span style={{ color:'rgba(191,219,254,0.6)', fontSize:13 }}>Signing in with Google...</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24 }}>
            <div style={{ flex:1, height:1, background:'rgba(96,165,250,0.15)' }} />
            <span style={{ fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:700,
              color:'rgba(191,219,254,0.4)', textTransform:'uppercase', letterSpacing:'0.1em' }}>
              Or continue with email
            </span>
            <div style={{ flex:1, height:1, background:'rgba(96,165,250,0.15)' }} />
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom:20 }}>
              <label style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:12,
                color:'#bfdbfe', display:'block', marginBottom:8 }}>Email</label>
              <div style={{ position:'relative' }}>
                <Mail size={16} color="#60a5fa" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }} />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width:'100%', padding:'13px 14px 13px 42px', background:'rgba(255,255,255,0.05)',
                    border:'1px solid rgba(96,165,250,0.2)', borderRadius:14, color:'#eff6ff',
                    fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:'none',
                    transition:'border-color 0.2s', boxSizing:'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(96,165,250,0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(96,165,250,0.2)'}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom:28 }}>
              <label style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:12,
                color:'#bfdbfe', display:'block', marginBottom:8 }}>Password</label>
              <div style={{ position:'relative' }}>
                <Lock size={16} color="#60a5fa" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width:'100%', padding:'13px 44px 13px 42px', background:'rgba(255,255,255,0.05)',
                    border:'1px solid rgba(96,165,250,0.2)', borderRadius:14, color:'#eff6ff',
                    fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:'none',
                    transition:'border-color 0.2s', boxSizing:'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(96,165,250,0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(96,165,250,0.2)'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer', padding:0 }}>
                  {showPassword
                    ? <EyeOff size={16} color="rgba(191,219,254,0.5)" />
                    : <Eye size={16} color="rgba(191,219,254,0.5)" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={isLoading}
              style={{
                width:'100%', padding:'15px 36px', background:'linear-gradient(135deg,#2563eb,#3b82f6)',
                color:'#fff', borderRadius:50, border:'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15,
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                transition:'all 0.3s', opacity: isLoading ? 0.7 : 1, boxSizing:'border-box'
              }}
              onMouseOver={(e) => { if (!isLoading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(37,99,235,0.45)'; }}}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              {isLoading ? (
                <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }} /> Signing in...</>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Sign up link */}
          <div style={{ textAlign:'center', marginTop:24 }}>
            <span style={{ color:'rgba(191,219,254,0.45)', fontSize:14 }}>Don't have an account? </span>
            <Link to="/signup" style={{ color:'#60a5fa', textDecoration:'none',
              fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14 }}>Sign up</Link>
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
};