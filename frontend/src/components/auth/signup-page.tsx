import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User, Loader2, Stethoscope, User as PatientIcon, X, ChevronLeft, ChevronRight, Upload, FileText } from 'lucide-react';
import { useAuth } from '../../App';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

declare global {
  interface Window {
    google: any;
  }
}

export const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    password: '',
    confirmPassword: '',
    accountType: 'Patient', // Default to Patient
    // Doctor-specific fields
    medicalLicenseNumber: '',
    specialization: '',
    consultantFee: '',
    experience: '',
    degrees: '',
    certification: '',
    availableDays: [] as string[],
    availableTimeSlot: {
      start: '',
      end: ''
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [medicalCertificateFile, setMedicalCertificateFile] = useState<File | null>(null);
  
  const { signup, googleLogin } = useAuth();
  const navigate = useNavigate();

  const termsSections = [
    {
      title: "Acceptance of Terms",
      content: "Welcome to AyurSamhita. By accessing or using our platform, you agree to be bound by these Terms of Service and our Privacy Policy. If you disagree with any part of the terms, you may not access our service."
    },
    {
      title: "Description of Service",
      content: "AyurSamhita provides a comprehensive healthcare platform connecting patients with healthcare providers, offering telemedicine consultations, appointment scheduling, medical record management, and health tracking services."
    },
    {
      title: "User Accounts",
      content: "You must be at least 18 years old to create an account. You are responsible for maintaining the confidentiality of your account credentials and must provide accurate information during registration."
    },
    {
      title: "Medical Disclaimer",
      content: "AyurSamhita is a platform that facilitates connections between patients and healthcare providers. We do not provide medical advice, diagnosis, or treatment. The content is for informational purposes only."
    },
    {
      title: "Healthcare Provider Relationships",
      content: "Any interactions between patients and healthcare providers are solely between those parties. AyurSamhita is not responsible for the quality of medical services provided by healthcare professionals."
    },
    {
      title: "Privacy and Data Security",
      content: "We are committed to protecting your personal health information in accordance with applicable laws. Please review our Privacy Policy for detailed information about data protection."
    },
    {
      title: "Prohibited Activities",
      content: "Users may not impersonate others, access unauthorized accounts, distribute malicious code, engage in illegal activities, or share inappropriate content."
    },
    {
      title: "Intellectual Property",
      content: "All content on the AyurSamhita platform, including text, graphics, logos, and software, is the property of AyurSamhita and protected by intellectual property laws."
    },
    {
      title: "Termination",
      content: "We may terminate or suspend your account immediately for conduct that violates these Terms or is harmful to other users, without prior notice."
    },
    {
      title: "Limitation of Liability",
      content: "To the maximum extent permitted by law, AyurSamhita shall not be liable for any indirect, incidental, special, consequential, or punitive damages."
    },
    {
      title: "Changes to Terms",
      content: "We reserve the right to modify these terms at any time. Users will be notified of material changes via email or platform notifications."
    },
    {
      title: "Contact Information",
      content: "For questions about these Terms, contact us at legal@ayursamhita.com"
    }
  ];

  const privacySections = [
    {
      title: "Information We Collect",
      content: "We collect personal information (name, email, phone), health information (medical history, treatments), usage data, and payment information processed securely by our partners."
    },
    {
      title: "How We Use Your Information",
      content: "To provide healthcare services, facilitate communication between patients and providers, process payments, send important notifications, improve our platform, and comply with legal obligations."
    },
    {
      title: "Data Sharing and Disclosure",
      content: "We share medical information with healthcare professionals you consult with, work with trusted service providers, and may disclose information when required by law."
    },
    {
      title: "Data Security",
      content: "We implement industry-standard security measures including encryption and access controls to protect your personal and health information."
    },
    {
      title: "Health Information Protection",
      content: "We treat your health information with the highest level of confidentiality and comply with applicable healthcare privacy laws. Medical records are accessible only to you and authorized providers."
    },
    {
      title: "Your Rights",
      content: "You can access and review your information, request corrections, delete your account, export health records, opt-out of marketing, and withdraw consent."
    },
    {
      title: "Data Retention",
      content: "We retain personal information as long as necessary to provide services and comply with legal obligations. Medical records are retained as required by healthcare regulations."
    },
    {
      title: "Cookies and Tracking",
      content: "We use cookies to enhance your experience, analyze platform usage, and deliver personalized content. You can control cookie preferences through browser settings."
    },
    {
      title: "International Data Transfers",
      content: "Your information may be processed in other countries. We ensure appropriate safeguards are in place to protect your data according to this policy and applicable laws."
    },
    {
      title: "Children's Privacy",
      content: "Our services are not intended for children under 18. We do not knowingly collect personal information from children and will delete such information if discovered."
    },
    {
      title: "Changes to Privacy Policy",
      content: "We may update this policy periodically. Significant changes will be notified through email or platform notifications."
    },
    {
      title: "Contact Us",
      content: "For questions about privacy or your data, contact our Data Protection Officer at privacy@ayursamhita.com"
    }
  ];

  // Initialize Google Sign-In only for patients
  useEffect(() => {
    if (formData.accountType === 'Patient') {
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
              text: 'signup_with',
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
    }
  }, [formData.accountType]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTimeSlotChange = (field: 'start' | 'end', value: string) => {
    setFormData(prev => ({
      ...prev,
      availableTimeSlot: {
        ...prev.availableTimeSlot,
        [field]: value
      }
    }));
  };

  const handleAvailableDaysChange = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a PDF, JPEG, or PNG file');
        return;
      }

      if (file.size > maxSize) {
        toast.error('File size should be less than 5MB');
        return;
      }

      setMedicalCertificateFile(file);
      toast.success('Medical certificate uploaded successfully');
    }
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      toast.error('Please enter your first name');
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error('Please enter your last name');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Please enter your email');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (!formData.contactNumber.trim()) {
      toast.error('Please enter your contact number');
      return false;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    // Doctor-specific validations
    if (formData.accountType === 'Doctor') {
      if (!formData.medicalLicenseNumber.trim()) {
        toast.error('Please enter your medical license number');
        return false;
      }
      if (!formData.specialization.trim()) {
        toast.error('Please enter your specialization');
        return false;
      }
      if (!formData.consultantFee || parseFloat(formData.consultantFee) <= 0) {
        toast.error('Please enter a valid consultant fee');
        return false;
      }
      if (!formData.experience || parseInt(formData.experience) <= 0) {
        toast.error('Please enter valid years of experience');
        return false;
      }
      if (!formData.degrees.trim()) {
        toast.error('Please enter your degrees');
        return false;
      }
      if (!medicalCertificateFile) {
        toast.error('Please upload your medical certificate');
        return false;
      }
      if (formData.availableDays.length === 0) {
        toast.error('Please select at least one available day');
        return false;
      }
      if (!formData.availableTimeSlot.start || !formData.availableTimeSlot.end) {
        toast.error('Please enter your available time slot');
        return false;
      }
    }

    if (!acceptTerms) {
      toast.error('Please accept the terms and conditions');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      // For doctors, simulate verification and auto-login
      if (formData.accountType === 'Doctor') {
        // First create the account
        await signup(
          formData.firstName,
          formData.lastName,
          formData.email,
          formData.contactNumber,
          formData.password,
          formData.accountType
        );

        // Simulate doctor verification (in real app, this would be an API call)
        setTimeout(() => {
          toast.success('Doctor account verified successfully! You can now log in.');
          // Auto-login the doctor
          // In a real app, you would call login here with the credentials
          navigate('/dashboard');
        }, 2000);
      } else {
        // Regular patient signup
        await signup(
          formData.firstName,
          formData.lastName,
          formData.email,
          formData.contactNumber,
          formData.password,
          formData.accountType
        );
        toast.success('Account created successfully!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const nextSection = (sections: any[]) => {
    setCurrentSection(prev => (prev + 1) % sections.length);
  };

  const prevSection = (sections: any[]) => {
    setCurrentSection(prev => (prev - 1 + sections.length) % sections.length);
  };

  const isDoctor = formData.accountType === 'Doctor';

  return (
    <div 
      className="min-h-screen bg-cover bg-center flex items-center justify-center py-12 px-4" 
      style={{ backgroundImage: 'url("/bg.png")' }}
    >
      <div className="max-w-4xl w-full grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Image */}
        {/* Left side - Image */}
<div className="hidden lg:block">
  <div className="relative h-full">
    <div className="w-full h-[680px] bg-black rounded-2xl shadow-xl flex items-center justify-center overflow-hidden">
      <img 
        src="/left.png" 
        alt="Healthcare illustration" 
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/40 rounded-2xl" />
    </div>
    <div className="absolute bottom-8 left-8 text-white">
      <h3 className="text-2xl font-bold mb-2">
        {isDoctor ? 'Join as Healthcare Provider' : 'Join Our Community'}
      </h3>
      <p className="text-white/90">
        {isDoctor ? 'Start providing healthcare services' : 'Start your journey to better healthcare'}
      </p>
    </div>
  </div>
</div>

        {/* Right side - Signup Form */}
        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {isDoctor ? 'Doctor Registration' : 'Create Account'}
              </CardTitle>
              <CardDescription>
                {isDoctor 
                  ? 'Join AyurSamhita as a Healthcare Provider' 
                  : 'Join AyurSamhita - Your Complete Healthcare Platform'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Google Sign-In Button - Only for Patients */}
              {!isDoctor && (
                <div className="space-y-4">
                  <div id="googleSignInButton"></div>
                  {isGoogleLoading && (
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">Signing in with Google...</span>
                    </div>
                  )}
                </div>
              )}

              {!isDoctor && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Account Type Selection */}
                <div className="space-y-2">
                  <Label htmlFor="accountType">I am a</Label>
                  <Select 
                    value={formData.accountType} 
                    onValueChange={(value) => handleSelectChange('accountType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Patient">
                        <div className="flex items-center">
                          <PatientIcon className="mr-2 h-4 w-4" />
                          Patient
                        </div>
                      </SelectItem>
                      <SelectItem value="Doctor">
                        <div className="flex items-center">
                          <Stethoscope className="mr-2 h-4 w-4" />
                          Doctor
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input
                    id="contactNumber"
                    name="contactNumber"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Doctor-specific fields */}
                {isDoctor && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="medicalLicenseNumber">Medical License Number</Label>
                      <Input
                        id="medicalLicenseNumber"
                        name="medicalLicenseNumber"
                        type="text"
                        placeholder="Enter your medical license number"
                        value={formData.medicalLicenseNumber}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialization">Specialization</Label>
                      <Input
                        id="specialization"
                        name="specialization"
                        type="text"
                        placeholder="e.g., Cardiology, Dermatology"
                        value={formData.specialization}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="consultantFee">Consultant Fee (₹)</Label>
                        <Input
                          id="consultantFee"
                          name="consultantFee"
                          type="number"
                          placeholder="Fee amount"
                          value={formData.consultantFee}
                          onChange={handleChange}
                          min="0"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="experience">Experience (Years)</Label>
                        <Input
                          id="experience"
                          name="experience"
                          type="number"
                          placeholder="Years of experience"
                          value={formData.experience}
                          onChange={handleChange}
                          min="0"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="degrees">Degrees & Qualifications</Label>
                      <Input
                        id="degrees"
                        name="degrees"
                        type="text"
                        placeholder="e.g., MBBS, MD, MS"
                        value={formData.degrees}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="certification">Certifications</Label>
                      <Input
                        id="certification"
                        name="certification"
                        type="text"
                        placeholder="Additional certifications"
                        value={formData.certification}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Available Days</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                          <div key={day} className="flex items-center space-x-2">
                            <Checkbox
                              id={`day-${day}`}
                              checked={formData.availableDays.includes(day)}
                              onCheckedChange={() => handleAvailableDaysChange(day)}
                            />
                            <Label htmlFor={`day-${day}`} className="text-sm">
                              {day.slice(0, 3)}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="timeStart">Available From</Label>
                        <Input
                          id="timeStart"
                          type="time"
                          value={formData.availableTimeSlot.start}
                          onChange={(e) => handleTimeSlotChange('start', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timeEnd">Available Until</Label>
                        <Input
                          id="timeEnd"
                          type="time"
                          value={formData.availableTimeSlot.end}
                          onChange={(e) => handleTimeSlotChange('end', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="medicalCertificate">
                        Medical Certificate
                      </Label>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                        <Input
                          id="medicalCertificate"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <Label 
                          htmlFor="medicalCertificate" 
                          className="cursor-pointer flex flex-col items-center space-y-2"
                        >
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {medicalCertificateFile ? medicalCertificateFile.name : 'Upload Medical Certificate'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            PDF, JPG, PNG up to 5MB
                          </span>
                        </Label>
                      </div>
                      {medicalCertificateFile && (
                        <div className="flex items-center space-x-2 text-sm text-green-600">
                          <FileText className="h-4 w-4" />
                          <span>Certificate uploaded successfully</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 6 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked: boolean) => setAcceptTerms(checked)}
                  />
                  <Label htmlFor="terms" className="text-sm text-muted-foreground">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setShowTermsDialog(true);
                        setCurrentSection(0);
                      }}
                      className="text-primary hover:underline"
                    >
                      Terms of Service
                    </button>
                    {' '}and{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setShowPrivacyDialog(true);
                        setCurrentSection(0);
                      }}
                      className="text-primary hover:underline"
                    >
                      Privacy Policy
                    </button>
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isDoctor ? 'Verifying...' : 'Creating account...'}
                    </>
                  ) : (
                    isDoctor ? 'Verify and Create Account' : 'Create Account'
                  )}
                </Button>
              </form>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Terms of Service Dialog - Horizontal Layout */}
      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent className="max-w-4xl w-[90vw] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Terms of Service</span>
            </DialogTitle>
            <DialogDescription>
              Section {currentSection + 1} of {termsSections.length} • Last updated: {new Date().toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 bg-muted/20 rounded-lg p-6 overflow-y-auto">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-primary mb-2">
                  {termsSections[currentSection].title}
                </h3>
                <div className="w-20 h-1 bg-primary/30 mx-auto rounded-full"></div>
              </div>
              
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed text-center text-lg">
                  {termsSections[currentSection].content}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => prevSection(termsSections)}
                disabled={currentSection === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                {termsSections.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSection(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentSection ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              
              <Button
                variant="outline"
                onClick={() => nextSection(termsSections)}
                disabled={currentSection === termsSections.length - 1}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog - Horizontal Layout */}
      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="max-w-4xl w-[90vw] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Privacy Policy</span>
            </DialogTitle>
            <DialogDescription>
              Section {currentSection + 1} of {privacySections.length} • Last updated: {new Date().toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 bg-muted/20 rounded-lg p-6 overflow-y-auto">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-primary mb-2">
                  {privacySections[currentSection].title}
                </h3>
                <div className="w-20 h-1 bg-primary/30 mx-auto rounded-full"></div>
              </div>
              
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed text-center text-lg">
                  {privacySections[currentSection].content}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => prevSection(privacySections)}
                disabled={currentSection === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                {privacySections.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSection(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentSection ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              
              <Button
                variant="outline"
                onClick={() => nextSection(privacySections)}
                disabled={currentSection === privacySections.length - 1}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster position="top-right" />
    </div>
  );
};