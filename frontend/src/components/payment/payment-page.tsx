import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { CreditCard, Shield, Lock, CheckCircle, ArrowLeft, Calendar, User, Clock, Video, MessageSquare, Smartphone, Landmark, Wallet, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8002/api/v1';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'upi' | 'wallet' | 'netbanking';
  icon: React.ReactNode;
  description: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    type: 'card',
    icon: <CreditCard className="h-5 w-5" />,
    description: 'Visa, Mastercard, RuPay'
  },
  {
    id: 'upi',
    name: 'UPI',
    type: 'upi',
    icon: <Smartphone className="h-5 w-5" />,
    description: 'Google Pay, PhonePe, Paytm'
  },
  {
    id: 'wallet',
    name: 'Digital Wallet',
    type: 'wallet',
    icon: <Wallet className="h-5 w-5" />,
    description: 'Paytm Wallet, Amazon Pay'
  },
  {
    id: 'netbanking',
    name: 'Net Banking',
    type: 'netbanking',
    icon: <Landmark className="h-5 w-5" />,
    description: 'All major banks supported'
  }
];

export const PaymentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '4242 4242 4242 4242',
    expiryDate: '12/28',
    cvv: '123',
    cardholderName: 'Test User'
  });
  const [upiId, setUpiId] = useState('testuser@ybl');

  const { appointmentData, doctor, amount, patientMedicalData } = location.state || {};

  useEffect(() => {
    if (!appointmentData || !doctor) {
      toast.error('Invalid appointment data');
      navigate('/doctors');
    }
  }, [appointmentData, doctor, navigate]);

  // Safe amount calculation with defaults
  const getAmountValues = () => {
    const baseAmount = amount ||
      (doctor?.consultantFee && typeof doctor.consultantFee === 'number' ? doctor.consultantFee :
        (typeof doctor?.consultationFee === 'string' ? parseInt(doctor.consultationFee.replace('₹', '')) || 500 : 500));

    const subtotal = Number(baseAmount) || 500;
    const platformFee = subtotal * 0.05;
    const taxes = (subtotal + platformFee) * 0.18;
    const total = subtotal + platformFee + taxes;

    return { subtotal, platformFee, taxes, total };
  };

  const { subtotal, platformFee, taxes, total } = getAmountValues();

  const handleCardInputChange = (field: keyof typeof cardDetails, value: string) => {
    if (field === 'cardNumber') {
      value = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
    } else if (field === 'expiryDate') {
      value = value.replace(/\D/g, '').replace(/(\d{2})(\d{2})/, '$1/$2');
    } else if (field === 'cvv') {
      value = value.replace(/\D/g, '').slice(0, 4);
    }
    setCardDetails(prev => ({ ...prev, [field]: value }));
  };

  const processingSteps = [
    'Verifying payment details...',
    'Contacting payment gateway...',
    'Processing transaction...',
    'Confirming booking...',
    'Almost done...'
  ];

  const handlePayment = async () => {
    setIsProcessing(true);
    setProcessingStep(0);

    try {
      // Simulate payment processing steps with delay
      for (let i = 0; i < processingSteps.length - 1; i++) {
        await new Promise(resolve => setTimeout(resolve, 600));
        setProcessingStep(i + 1);
      }

      // Convert 12-hour time to 24-hour "HH:MM" for backend
      const convertTo24h = (time12: string): string => {
        const [time, period] = time12.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      };

      const startTime24 = convertTo24h(appointmentData.selectedTime);
      const endTime24 = calculateEndTime24(startTime24);

      const dateObj = new Date(appointmentData.selectedDate);
      const isoDate = dateObj.toISOString();

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const patientId = currentUser?.id || currentUser?._id;

      if (!patientId) {
        toast.error('You must be logged in to book an appointment.');
        setIsProcessing(false);
        return;
      }

      // Call real backend API (payment is mock, booking is real)
      const response = await axios.post(`${API_BASE_URL}/user/book-appointment`, {
        user: patientId,
        doctor: doctor.id,
        date: isoDate,
        timeSlot: {
          start: startTime24,
          end: endTime24
        },
        description: appointmentData.symptoms || 'General consultation',
        paymentStatus: true,
        medicalHistory: patientMedicalData?.medicalHistory || '',
        medications: patientMedicalData?.currentMedications || '',
        savedMedicines: patientMedicalData?.savedMedicines || []
      }, { withCredentials: true });

      if (response.data.success) {
        const savedAppointment = response.data.appointment;

        // Show success animation
        setPaymentSuccess(true);

        // Wait for user to see the success screen
        setTimeout(() => {
          navigate('/dashboard', {
            state: { newAppointment: savedAppointment }
          });
        }, 3000);
      } else {
        toast.error(response.data.message || 'Failed to book appointment.');
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error('Payment/Booking error:', error);
      const msg = error?.response?.data?.message || 'Payment processing failed. Please try again.';
      toast.error(msg);
      setIsProcessing(false);
    }
  };

  const calculateEndTime24 = (start24: string): string => {
    const [h, m] = start24.split(':').map(Number);
    const d = new Date(2000, 0, 1, h, m + 30);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  // Payment Success Screen
  if (paymentSuccess) {
    return (
      <div className="ayur-page-dark" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
        <style>{`
          @keyframes successPop {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes confetti {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(-100px) rotate(720deg); opacity: 0; }
          }
          .confetti-piece {
            position: absolute;
            width: 8px;
            height: 8px;
            border-radius: 2px;
            animation: confetti 1.5s ease-out forwards;
          }
        `}</style>
        <div style={{ textAlign:'center', position:'relative' }}>
          {/* Confetti pieces */}
          {[...Array(12)].map((_, i) => (
            <div key={i} className="confetti-piece" style={{
              left: `${50 + (Math.random() - 0.5) * 200}%`,
              top: `${50 + (Math.random() - 0.5) * 100}%`,
              background: ['#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#a78bfa'][i % 5],
              animationDelay: `${i * 0.1}s`,
              transform: `rotate(${Math.random() * 360}deg)`
            }} />
          ))}
          <div style={{ animation: 'successPop 0.6s ease-out forwards' }}>
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(16,185,129,0.1))',
              border: '3px solid #34d399',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 0 40px rgba(52,211,153,0.3)'
            }}>
              <CheckCircle size={48} color="#34d399" />
            </div>
          </div>
          <h2 style={{
            fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 28,
            color: '#eff6ff', margin: '0 0 8px',
            animation: 'fadeUp 0.5s ease-out 0.3s both'
          }}>Payment Successful!</h2>
          <p style={{
            color: 'rgba(191,219,254,0.6)', fontSize: 15, margin: '0 0 24px',
            animation: 'fadeUp 0.5s ease-out 0.5s both'
          }}>
            Your appointment has been confirmed. Redirecting to dashboard...
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 50,
            background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)',
            color: '#34d399', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14,
            animation: 'fadeUp 0.5s ease-out 0.7s both'
          }}>
            <CheckCircle size={16} /> ₹{formatCurrency(total)} paid via {
              selectedPaymentMethod === 'card' ? 'Card' :
              selectedPaymentMethod === 'upi' ? 'UPI' :
              selectedPaymentMethod === 'wallet' ? 'Wallet' : 'Net Banking'
            }
          </div>
        </div>
      </div>
    );
  }

  if (!appointmentData || !doctor) {
    return (
      <div className="ayur-page-dark" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:56, marginBottom:16 }}>⚠️</div>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:20, color:'#eff6ff', marginBottom:8 }}>Invalid Appointment Data</h3>
          <p style={{ color:'rgba(191,219,254,0.55)', marginBottom:20 }}>Please book an appointment first.</p>
          <button className="ayur-btn-primary" onClick={() => navigate('/doctors')}>
            Find a Doctor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ayur-page-dark" style={{ paddingTop:8, paddingBottom:40 }}>
      <Toaster position="top-right" />
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 24px', position:'relative', zIndex:1 }}>
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Booking
          </Button>
        </div>

        {/* Mock Payment Banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px',
          background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(245,158,11,0.05))',
          border: '1px solid rgba(251,191,36,0.25)', borderRadius: 14,
          marginBottom: 24
        }}>
          <Sparkles size={18} color="#fbbf24" />
          <div>
            <span style={{ color: '#fbbf24', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13 }}>
              DEMO MODE
            </span>
            <span style={{ color: 'rgba(191,219,254,0.55)', fontSize: 13, marginLeft: 8 }}>
              This is a mock payment. No real money will be charged. All payments are auto-approved.
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span>Secure Payment</span>
                  <Badge variant="outline" className="ml-2 text-amber-500 border-amber-500/30">Mock</Badge>
                </CardTitle>
                <CardDescription>
                  Select a payment method below — all methods work in demo mode
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium mb-4 block">Select Payment Method</Label>
                  <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {paymentMethods.map((method) => (
                        <div key={method.id} className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedPaymentMethod === method.id 
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                            : 'hover:bg-muted/50'
                        }`} onClick={() => setSelectedPaymentMethod(method.id)}>
                          <RadioGroupItem value={method.id} id={method.id} />
                          <Label htmlFor={method.id} className="flex items-center space-x-3 cursor-pointer flex-1">
                            {method.icon}
                            <div>
                              <div className="font-medium text-sm">{method.name}</div>
                              <div className="text-xs text-muted-foreground">{method.description}</div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                {/* Card Details */}
                {selectedPaymentMethod === 'card' && (
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold">Card Details</h4>
                      <Badge variant="secondary" className="text-xs">Pre-filled for demo</Badge>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardDetails.cardNumber}
                        onChange={(e) => handleCardInputChange('cardNumber', e.target.value)}
                        maxLength={19}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          placeholder="MM/YY"
                          value={cardDetails.expiryDate}
                          onChange={(e) => handleCardInputChange('expiryDate', e.target.value)}
                          maxLength={5}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          type="password"
                          value={cardDetails.cvv}
                          onChange={(e) => handleCardInputChange('cvv', e.target.value)}
                          maxLength={4}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardholderName">Cardholder Name</Label>
                      <Input
                        id="cardholderName"
                        placeholder="Test User"
                        value={cardDetails.cardholderName}
                        onChange={(e) => handleCardInputChange('cardholderName', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* UPI */}
                {selectedPaymentMethod === 'upi' && (
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold">UPI Details</h4>
                      <Badge variant="secondary" className="text-xs">Pre-filled for demo</Badge>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="upiId">UPI ID</Label>
                      <Input
                        id="upiId"
                        placeholder="yourname@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter any UPI ID — demo mode accepts all
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                        <div key={app} className="flex items-center gap-2 px-3 py-1.5 bg-background border rounded-full text-xs cursor-pointer hover:border-primary/50 transition-colors">
                          <Smartphone size={12} />
                          {app}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Wallet */}
                {selectedPaymentMethod === 'wallet' && (
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold">Select Wallet</h4>
                      <Badge variant="secondary" className="text-xs">Demo mode</Badge>
                    </div>
                    <div className="space-y-2">
                      {['Paytm Wallet', 'Amazon Pay', 'MobiKwik', 'Freecharge'].map(wallet => (
                        <div key={wallet} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <Wallet size={16} className="text-primary" />
                            <span className="text-sm font-medium">{wallet}</span>
                          </div>
                          <Badge variant="outline" className="text-xs text-green-500 border-green-500/30">
                            ₹10,000 balance
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Net Banking */}
                {selectedPaymentMethod === 'netbanking' && (
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold">Select Bank</h4>
                      <Badge variant="secondary" className="text-xs">Demo mode</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map(bank => (
                        <div key={bank} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                          <Landmark size={14} className="text-primary flex-shrink-0" />
                          <span className="text-xs font-medium">{bank}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>Mock payment — no real charges will be made</span>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              size="lg"
              className="w-full"
            >
              {isProcessing ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{processingSteps[processingStep]}</span>
                </div>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay ₹{formatCurrency(total)} (Mock)
                </>
              )}
            </Button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Appointment Summary</CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Doctor Info */}
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={doctor.image} alt={doctor.name} />
                    <AvatarFallback>
                      {doctor.name ? doctor.name.split(' ').map((n: string) => n[0]).join('') : 'DR'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{doctor.name || 'Doctor'}</div>
                    <div className="text-sm text-muted-foreground">
                      {doctor.specializations?.[0] || 'General Medicine'}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Appointment Details */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{appointmentData.selectedDate || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{appointmentData.selectedTime || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    {appointmentData.consultationType === 'video' ? (
                      <Video className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="capitalize">
                      {appointmentData.consultationType ? appointmentData.consultationType.replace('-', ' ') : 'video'} Consultation
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{appointmentData.patientInfo?.name || 'Patient'}</span>
                  </div>
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Consultation Fee</span>
                    <span>₹{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Platform Fee</span>
                    <span>₹{formatCurrency(platformFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Taxes (18% GST)</span>
                    <span>₹{formatCurrency(taxes)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total Amount</span>
                    <span className="text-primary">₹{formatCurrency(total)}</span>
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm text-green-700 dark:text-green-300">
                    <CheckCircle className="h-4 w-4" />
                    <span>Instant booking confirmation</span>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm text-amber-700 dark:text-amber-300">
                    <Sparkles className="h-4 w-4" />
                    <span>Demo mode — payment always succeeds</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  <p>
                    This is a mock payment for demonstration purposes.
                    No real transaction will be processed. Your appointment will be booked immediately.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};