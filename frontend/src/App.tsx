import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { BookOpen, Menu, X, User, LogOut, Moon, Sun, ArrowLeft } from 'lucide-react';
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
import { Button } from './components/ui/button';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './components/ui/dropdown-menu';

const API_BASE_URL = 'http://localhost:8002/api/v1';

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
  login: (email: string, password: string) => Promise<void>;
  signup: (
    firstName: string, 
    lastName: string, 
    email: string, 
    contactNumber: string, 
    password: string, 
    accountType: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
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
    axios.defaults.baseURL = API_BASE_URL;
    
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
  };

  const signup = async (
    firstName: string,
    lastName: string,
    email: string,
    contactNumber: string,
    password: string,
    accountType: string
  ) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/signup`, {
        firstName,
        lastName,
        email,
        contactNumber,
        password,
        accountType
      });

      if (response.status === 201) {
        // Auto-login after successful signup
        await login(email, password);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
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
        bloodGroup: userData.bloodGroup
      };

      setUser(userInfo);
      
      // Store user in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(userInfo));
      
    } catch (error: any) {
      console.error('Login error:', error);
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
      localStorage.removeItem('user');
    }
  };

  // Load user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const contextValue = React.useMemo(() => ({
    user,
    login,
    signup,
    logout,
    loading
  }), [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <img src="/logo.jpg" alt="ॐ" className='h-12 w-auto'/>
          <span className="text-lg text-muted-foreground">Loading...</span>
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
  toggleTheme: () => {}
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
  const { isDark, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // In your Navigation component, add this useEffect:
useEffect(() => {
  const handleUserDataUpdate = (event: CustomEvent) => {
    const { firstName, lastName } = event.detail;
    // Update your local state or context here
    // This will trigger a re-render with new initials
  };

  window.addEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
  
  return () => {
    window.removeEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
  };
}, []);

  // Check if we should show the back button (not on home page or auth pages)
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
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`;
  };

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Back Button */}
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackClick}
                className="hidden md:flex items-center space-x-1 hover:bg-secondary"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
            )}
            <Link to="/" className="flex items-center space-x-2">
          <img src="/logo.jpg" alt="ॐ" className='h-12 w-auto' />
              <span className="text-xl font-semibold text-foreground">AyurSamhita Healthcare Platform</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/herbs">Herbs</NavLink>
            <NavLink to="/doctors">Doctors</NavLink>
            {user && (
              <NavLink to="/dashboard">Dashboard</NavLink>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 overflow-hidden group">
                    <Avatar className="h-8 w-8 ">
                      <AvatarFallback  className="text-green-600 group-hover:text-black transition-colors">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
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
              <div className="flex space-x-2">
                <Button variant="ghost" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackClick}
                  className="flex items-center space-x-2 w-full justify-start px-3 py-2 mb-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
              )}
              <NavLink to="/" className="block px-3 py-2">Home</NavLink>
              <NavLink to="/herbs" className="block px-3 py-2">Herbs</NavLink>
              <NavLink to="/doctors" className="block px-3 py-2">Doctors</NavLink>
              {user && (
                <NavLink to="/dashboard" className="block px-3 py-2">Dashboard</NavLink>
              )}
              
              <div className="flex items-center justify-between px-3 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  <span className="ml-2">{isDark ? 'Light' : 'Dark'} Mode</span>
                </Button>
              </div>
              
              {user ? (
                <div className="px-3 py-2">
                  <div className="text-sm text-muted-foreground mb-2">
                    {getUserDisplayName()}
                    <span className="block text-xs capitalize text-primary">
                      {user.accountType.toLowerCase()}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </div>
              ) : (
                <div className="px-3 py-2 space-y-2">
                  <Button variant="ghost" asChild className="w-full">
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                </div>
              )}
            </div>
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <img src="/logo.jpg" alt="ॐ" className='h-12 w-auto'/>
          <span className="text-lg text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
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
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="text-center">
v            <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-4">
              We apologize for the inconvenience. Please try refreshing the page.
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
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
            <div className="min-h-screen bg-background">
              <Navigation />
              <main>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/verify-email" element={<EmailVerificationPage />} />
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