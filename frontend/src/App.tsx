import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { BookOpen, Menu, X, User, LogOut, ArrowLeft } from 'lucide-react';
import axios from 'axios';

// Import components
import { LandingPage } from './components/landing-page';
import { LoginPage } from './components/auth/login-page';
import { SignupPage } from './components/auth/signup-page';
import { EmailVerificationPage } from './components/auth/email-verification-page';
import { HerbBrowser } from './components/herb-browser/herb-browser';
import { DoctorSearch } from './components/doctor/doctor-search';
import { AppointmentBooking } from './components/appointment/appointment-booking';
import { PaymentPage } from './components/payment/payment-page';
import { UserDashboard } from './components/dashboard/user-dashboard';
import { DoshaQuiz } from './components/dosha/dosha-quiz';
import { Button } from './components/ui/button';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './components/ui/dropdown-menu';

const API_BASE_URL = 'http://localhost:8002/api/v1';
const GOOGLE_CLIENT_ID = '172222448657-8qanqq7lktmbl11t9431sjoujk73254k.apps.googleusercontent.com';

// User interface matching your backend
interface User {
  id: string;
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  accountType: 'Patient' | 'Doctor' | 'Admin';
  image?: string;
  contactNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  verified?: boolean;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<string>;
  signup: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    contactNumber: string;
    password: string;
    accountType: string;
    // Optional doctor fields
    medicalLicenseNumber?: string;
    specialization?: string;
    consultantFee?: number;
    experience?: number;
    degrees?: string;
    certification?: string;
    availableDays?: string[];
    availableTimeSlot?: {
      start: string;
      end: string;
    };
  }) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  googleLogin: (credential: string) => Promise<string>;
  doctorLogin: (firstName: string, lastName: string, password: string) => Promise<string>;
  updateUser?: (userData: Partial<User>) => void;
}


const AuthContext = React.createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize axios defaults
  useEffect(() => {
    axios.defaults.withCredentials = true;
    // NOTE: Do NOT set axios.defaults.baseURL here — it causes path doubling
    // when components use relative paths like '/api/v1/...'.
    // All components must use full URLs: 'http://localhost:8002/api/v1/...'

    // Check for existing session on app load
    checkAuthStatus();
  }, []);


  const checkAuthStatus = async () => {
    try {
      const token = getTokenFromCookies();
      if (token) {
        // Try to get user data from localStorage first
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }

        // Verify token is still valid by making a simple request
        try {
          // This would be your /me endpoint if available
          // const response = await axios.get(`${API_BASE_URL}/auth/me`);
          // setUser(response.data.user);
        } catch (error) {
          console.error('Token validation failed:', error);
          // Token is invalid, clear it
          clearToken();
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const getTokenFromCookies = (): string | null => {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('access_token='));
    return tokenCookie ? tokenCookie.split('=')[1] : null;
  };

  const clearToken = () => {
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    localStorage.removeItem('user');
  };

  const signup = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    contactNumber: string;
    password: string;
    accountType: string;
    medicalLicenseNumber?: string;
    specialization?: string;
    consultantFee?: number;
    experience?: number;
    degrees?: string;
    certification?: string;
    availableDays?: string[];
    availableTimeSlot?: {
      start: string;
      end: string;
    };
  }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/signup`, userData);

      if (response.status === 201) {
        // Auto-login after successful signup
        await login(userData.email, userData.password);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<string> => {
    try {
      const response = await axios.post<{
        success: boolean;
        message: string;
        user: any;
        profile?: any;
        token?: string;
        access_token?: string;
      }>(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });

      const { user: userData, token, access_token } = response.data;

      // Use token or access_token (backend might use either)
      const authToken = token || access_token;

      if (authToken) {
        document.cookie = `access_token=${authToken}; path=/; max-age=28800;`; // 8 hours
      }

      // Set user data
      const userInfo: User = {
        id: userData.id || userData._id,
        _id: userData._id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        accountType: userData.accountType,
        image: userData.image,
        contactNumber: userData.contactNumber,
        dateOfBirth: userData.dateOfBirth,
        gender: userData.gender,
        bloodGroup: userData.bloodGroup,
        verified: userData.verified
      };

      setUser(userInfo);

      // Store user in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(userInfo));

      return userData.accountType as string;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const googleLogin = async (credential: string): Promise<string> => {
    try {
      const response = await axios.post<{
        success: boolean;
        message: string;
        user: any;
        token?: string;
        access_token?: string;
      }>(`${API_BASE_URL}/auth/google`, {
        credential
      });

      const { user: userData, token, access_token } = response.data;

      const authToken = token || access_token;

      if (authToken) {
        document.cookie = `access_token=${authToken}; path=/; max-age=28800;`;
      }

      const userInfo: User = {
        id: userData.id || userData._id,
        _id: userData._id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        accountType: userData.accountType,
        image: userData.image,
        contactNumber: userData.contactNumber,
        dateOfBirth: userData.dateOfBirth,
        gender: userData.gender,
        bloodGroup: userData.bloodGroup,
        verified: userData.verified
      };

      setUser(userInfo);
      localStorage.setItem('user', JSON.stringify(userInfo));

      return userData.accountType as string;
    } catch (error: any) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const doctorLogin = async (firstName: string, lastName: string, password: string): Promise<string> => {
    try {
      const response = await axios.post<{
        success: boolean;
        message: string;
        user: any;
        token?: string;
      }>(`${API_BASE_URL}/auth/doctor-login`, { firstName, lastName, password });

      const { user: userData, token } = response.data;

      if (token) {
        document.cookie = `access_token=${token}; path=/; max-age=28800;`;
      }

      const userInfo: User = {
        id: userData.id || userData._id,
        _id: userData._id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        accountType: userData.accountType,
        image: userData.image,
        contactNumber: userData.contactNumber,
        dateOfBirth: userData.dateOfBirth,
        gender: userData.gender,
        bloodGroup: userData.bloodGroup,
        verified: userData.verified
      };

      setUser(userInfo);
      localStorage.setItem('user', JSON.stringify(userInfo));

      return userData.accountType as string;
    } catch (error: any) {
      console.error('Doctor login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await axios.get(`${API_BASE_URL}/auth/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      clearToken();
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  // Load user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const contextValue = React.useMemo(() => ({
    user,
    login,
    signup,
    logout,
    googleLogin,
    doctorLogin,
    updateUser,
    loading
  }), [user, loading]);

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:'#0b1d3a', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <img src="/logo.jpg" alt="ॐ" style={{ height:48, width:'auto' }} />
          <span style={{ fontSize:16, color:'rgba(191,219,254,0.55)', fontFamily:"'DM Sans',sans-serif" }}>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Theme context
const ThemeContext = React.createContext<{
  isDark: boolean;
  toggleTheme: () => void;
}>({
  isDark: false,
  toggleTheme: () => { }
});

export const useTheme = () => React.useContext(ThemeContext);

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = React.useCallback(() => {
    setIsDark(prev => {
      const newValue = !prev;
      if (newValue) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', newValue ? 'dark' : 'light');
      return newValue;
    });
  }, []);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

      if (shouldBeDark) {
        setIsDark(true);
        document.documentElement.classList.add('dark');
      } else {
        setIsDark(false);
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  }, []);

  const contextValue = React.useMemo(() => ({
    isDark,
    toggleTheme
  }), [isDark, toggleTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Navigation component
const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  // Theme toggle removed per user request
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleUserDataUpdate = (event: CustomEvent) => {
      const { firstName, lastName } = event.detail;
      // Update your local state or context here
    };

    window.addEventListener('userDataUpdated', handleUserDataUpdate as EventListener);

    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    };
  }, []);

  const showBackButton = location.pathname !== '/' &&
    location.pathname !== '/login' &&
    location.pathname !== '/signup' &&
    location.pathname !== '/verify-email';

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const NavLink: React.FC<{ to: string; children: React.ReactNode; className?: string }> = ({ to, children, className = "" }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`text-foreground hover:text-primary transition-colors ${isActive ? 'text-primary font-medium' : ''} ${className}`}
      >
        {children}
      </Link>
    );
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    return `${(user.firstName || 'U').charAt(0)}${(user.lastName || '').charAt(0)}`.toUpperCase();
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`;
  };

  const navStyle: React.CSSProperties = {
    background: 'rgba(5,16,43,0.95)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(96,165,250,0.15)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    fontFamily: "'DM Sans',sans-serif",
  };

  const linkStyle: React.CSSProperties = {
    color: '#93c5fd',
    textDecoration: 'none',
    fontSize: 15,
    fontWeight: 500,
    transition: 'color 0.2s',
  };

  const activeLinkStyle: React.CSSProperties = {
    ...linkStyle,
    color: '#bfdbfe',
    fontWeight: 700,
  };

  return (
    <nav style={navStyle}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 64 }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {showBackButton && (
              <button
                onClick={handleBackClick}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93c5fd',
                  display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, padding: '6px 12px',
                  borderRadius: 20, transition: 'background 0.2s' }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(96,165,250,0.1)')}
                onMouseOut={e => (e.currentTarget.style.background = 'none')}
              >
                <ArrowLeft size={16} /> Back
              </button>
            )}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <img src="/logo.jpg" alt="ॐ" style={{ height: 38, width: 38, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(96,165,250,0.3)' }} />
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: '#eff6ff' }}>
                AyurSamhita
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex" style={{ gap: 32, alignItems: 'center' }}>
            {[{ to: '/', label: 'Home' }, { to: '/herbs', label: 'Herbs' }, { to: '/doctors', label: 'Doctors' },
              ...(user ? [{ to: '/dashboard', label: 'Dashboard' }] : [])].map(({ to, label }) => (
              <Link key={to} to={to}
                style={location.pathname === to ? activeLinkStyle : linkStyle}
                onMouseOver={e => (e.currentTarget.style.color = '#dbeafe')}
                onMouseOut={e => (e.currentTarget.style.color = location.pathname === to ? '#bfdbfe' : '#93c5fd')}
              >{label}</Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 12 }}>


            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button style={{ background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)',
                    borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', color: '#93c5fd',
                    fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, display: 'flex',
                    alignItems: 'center', justifyContent: 'center' }}>
                    {getUserInitials()}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start p-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{getUserDisplayName()}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {user.accountType.toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center w-full cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Link to="/login"
                  style={{ color: '#93c5fd', textDecoration: 'none', fontWeight: 600, fontSize: 14,
                    padding: '8px 16px', borderRadius: 20, transition: 'all 0.2s',
                    border: '1px solid transparent' }}
                  onMouseOver={e => { e.currentTarget.style.border = '1px solid rgba(96,165,250,0.3)'; e.currentTarget.style.background = 'rgba(96,165,250,0.08)'; }}
                  onMouseOut={e => { e.currentTarget.style.border = '1px solid transparent'; e.currentTarget.style.background = 'none'; }}
                >Login</Link>
                <Link to="/signup"
                  style={{ background: 'linear-gradient(135deg,#2563eb,#3b82f6)', color: '#fff',
                    textDecoration: 'none', fontWeight: 700, fontSize: 14,
                    padding: '9px 22px', borderRadius: 20, transition: 'all 0.2s',
                    fontFamily: "'Syne',sans-serif" }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(37,99,235,0.4)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >Sign Up</Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93c5fd', padding: 8 }}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div style={{ borderTop: '1px solid rgba(96,165,250,0.12)', padding: '16px 0', background: 'rgba(5,16,43,0.98)' }}>
            {showBackButton && (
              <button onClick={handleBackClick}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93c5fd',
                  display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, padding: '10px 16px', width: '100%' }}
              ><ArrowLeft size={16} /> Back</button>
            )}
            {[{ to: '/', label: 'Home' }, { to: '/herbs', label: 'Herbs' }, { to: '/doctors', label: 'Doctors' },
              ...(user ? [{ to: '/dashboard', label: 'Dashboard' }] : [])].map(({ to, label }) => (
              <Link key={to} to={to}
                style={{ ...linkStyle, display: 'block', padding: '10px 16px',
                  ...(location.pathname === to ? { color: '#bfdbfe', fontWeight: 700 } : {}) }}
              >{label}</Link>
            ))}

            {user ? (
              <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(96,165,250,0.1)', marginTop: 8 }}>
                <p style={{ color: '#bfdbfe', fontSize: 14, marginBottom: 4 }}>{getUserDisplayName()}</p>
                <p style={{ color: '#93c5fd', fontSize: 12, marginBottom: 12, textTransform: 'capitalize' }}>{user.accountType.toLowerCase()}</p>
                <button onClick={handleLogout}
                  style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)',
                    color: '#bfdbfe', padding: '8px 20px', borderRadius: 20, cursor: 'pointer',
                    fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center' }}
                ><LogOut size={14} /> Log out</button>
              </div>
            ) : (
              <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 10,
                borderTop: '1px solid rgba(96,165,250,0.1)', marginTop: 8 }}>
                <Link to="/login"
                  style={{ color: '#93c5fd', textDecoration: 'none', padding: '10px 16px',
                    borderRadius: 20, textAlign: 'center', border: '1px solid rgba(96,165,250,0.25)',
                    fontWeight: 600, fontSize: 14 }}
                >Login</Link>
                <Link to="/signup"
                  style={{ background: 'linear-gradient(135deg,#2563eb,#3b82f6)', color: '#fff',
                    textDecoration: 'none', padding: '10px 16px', borderRadius: 20,
                    textAlign: 'center', fontWeight: 700, fontSize: 14,
                    fontFamily: "'Syne',sans-serif" }}
                >Sign Up</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:'#0b1d3a', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <img src="/logo.jpg" alt="ॐ" style={{ height:48, width:'auto' }} />
          <span style={{ fontSize:16, color:'rgba(191,219,254,0.55)', fontFamily:"'DM Sans',sans-serif" }}>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route component (redirect to dashboard if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:'#0b1d3a', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <img src="/logo.jpg" alt="ॐ" style={{ height:48, width:'auto' }} />
          <span style={{ fontSize:16, color:'rgba(191,219,254,0.55)', fontFamily:"'DM Sans',sans-serif" }}>Loading...</span>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight:'100vh', background:'#0b1d3a', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 24px' }}>
          <div style={{ textAlign:'center' }}>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:24, color:'#eff6ff', marginBottom:12 }}>Something went wrong</h1>
            <p style={{ color:'rgba(191,219,254,0.55)', fontFamily:"'DM Sans',sans-serif", marginBottom:20 }}>
              We apologize for the inconvenience. Please try refreshing the page.
            </p>
            <button className="ayur-btn-primary" onClick={() => window.location.reload()}>
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main App component
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div style={{ minHeight:'100vh', background:'#0b1d3a', fontFamily:"'DM Sans',sans-serif" }}>
              <Navigation />
              <main>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route
                    path="/login"
                    element={
                      <PublicRoute>
                        <LoginPage />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/signup"
                    element={
                      <PublicRoute>
                        <SignupPage />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/verify-email"
                    element={
                      <PublicRoute>
                        <EmailVerificationPage />
                      </PublicRoute>
                    }
                  />
                  <Route path="/herbs" element={<HerbBrowser />} />
                  <Route path="/doctors" element={<DoctorSearch />} />
                  <Route
                    path="/appointment/:doctorId"
                    element={
                      <ProtectedRoute>
                        <AppointmentBooking />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/payment"
                    element={
                      <ProtectedRoute>
                        <PaymentPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <UserDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dosha-quiz"
                    element={
                      <ProtectedRoute>
                        <DoshaQuiz />
                      </ProtectedRoute>
                    }
                  />
                  {/* Catch-all route for unmatched paths */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Toaster
                position="top-right"
                closeButton
                richColors
                expand={false}
                visibleToasts={5}
              />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}