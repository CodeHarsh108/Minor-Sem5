import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { Mail, CheckCircle, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../../App';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export const EmailVerificationPage: React.FC = () => {
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // For demo purposes, we'll skip actual email verification
    // In production, you would check verification status from backend
    const checkVerification = async () => {
      setIsChecking(true);
      try {
        // Simulate API call to check verification status
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // For demo, auto-verify after 2 seconds
        setTimeout(() => {
          setIsVerified(true);
          toast.success('Email verified successfully!');
          setTimeout(() => navigate('/dashboard'), 2000);
        }, 2000);
        
      } catch (error) {
        toast.error('Failed to check verification status');
      } finally {
        setIsChecking(false);
      }
    };

    checkVerification();
  }, [user, navigate]);

  useEffect(() => {
    let interval: number | undefined;
    if (countdown > 0) {
      interval = window.setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    }
    return () => {
      if (interval !== undefined) {
        window.clearInterval(interval);
      }
    };
  }, [countdown]);

  const handleResendEmail = async () => {
    setIsResending(true);
    
    try {
      // Simulate resending verification email
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Verification email sent! Please check your inbox.');
      setCountdown(60); // 60 second cooldown
    } catch (error) {
      toast.error('Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center py-12 px-4">
      <div className="max-w-4xl w-full grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Image */}
        <div className="hidden lg:block">
          <div className="relative">
            <div className="w-full h-[600px] bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl shadow-xl flex items-center justify-center">
              <div className="text-center text-primary">
                <div className="text-6xl mb-4">📧</div>
                <h3 className="text-2xl font-bold mb-4">Arogya Healthcare</h3>
                <p className="text-lg font-medium">Email Verification</p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-2xl" />
            <div className="absolute bottom-8 left-8 text-white">
              <h3 className="text-2xl font-bold mb-2">Almost There!</h3>
              <p className="text-white/90">Complete your registration</p>
            </div>
          </div>
        </div>

        {/* Right side - Verification Content */}
        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                {isVerified ? (
                  <CheckCircle className="h-16 w-16 text-green-500" />
                ) : isChecking ? (
                  <Loader2 className="h-16 w-16 text-primary animate-spin" />
                ) : (
                  <Mail className="h-16 w-16 text-primary" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {isVerified ? 'Welcome to Arogya!' : 'Verifying Your Email'}
              </CardTitle>
              <CardDescription className="text-lg">
                {isVerified 
                  ? 'Your account is ready! Redirecting...'
                  : `Welcome, ${user.firstName}! Setting up your ${user.accountType} account...`
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {!isVerified ? (
                <>
                  <div className="text-center space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <p className="text-blue-700 dark:text-blue-300 text-sm">
                        <strong>Account Type:</strong> {user.accountType}<br />
                        <strong>Email:</strong> {user.email}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Setting up your account...</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={handleBackToLogin}
                      className="w-full"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Login
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <p className="text-green-700 dark:text-green-300">
                      Your {user.accountType.toLowerCase()} account has been successfully created!
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Redirecting to dashboard...</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};