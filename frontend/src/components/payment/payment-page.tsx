import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { CreditCard, Shield, Lock, CheckCircle, ArrowLeft, Calendar, User, Clock, Video, MessageSquare } from 'lucide-react';
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
  type: 'card' | 'wallet' | 'bank';
  icon: React.ReactNode;
  description: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    type: 'card',
    icon: <CreditCard className="h-5 w-5" />,
    description: 'Pay securely with your card'
  }
];

export const PaymentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '4242 4242 4242 4242',
    expiryDate: '12/28',
    cvv: '123',
    cardholderName: 'John Doe'
  });

  const { appointmentData, doctor, amount } = location.state || {};

  useEffect(() => {
    if (!appointmentData || !doctor) {
      navigate('/doctors');
    }
  }, [appointmentData, doctor, navigate]);

  if (!appointmentData || !doctor) return null;

  const handleCardInputChange = (field: keyof typeof cardDetails, value: string) => {
    if (field === 'cardNumber') {
      value = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
    } else if (field === 'expiryDate') {
      value = value.replace(/\D/g, '').replace(/(\d{2})(\d{2})/, '$1/$2');
    } else if (field === 'cvv') {
      value = value.replace(/\D/g, '').slice(0, 4);
    }
    
    setCardDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateCardDetails = () => {
    if (selectedPaymentMethod === 'card') {
      if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, '').length < 16) {
        toast.error('Please enter a valid card number');
        return false;
      }
      if (!cardDetails.expiryDate || cardDetails.expiryDate.length < 5) {
        toast.error('Please enter a valid expiry date');
        return false;
      }
      if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
        toast.error('Please enter a valid CVV');
        return false;
      }
      if (!cardDetails.cardholderName.trim()) {
        toast.error('Please enter the cardholder name');
        return false;
      }
    }
    return true;
  };

  const handlePayment = async () => {
  if (!validateCardDetails()) return;
  
  setIsProcessing(true);
  
  try {
    // Prepare appointment data
    const newAppointment = {
      _id: `apt_${Date.now()}`,
      patient: {
        name: appointmentData.patientInfo.name,
        email: appointmentData.patientInfo.email,
        phone: appointmentData.patientInfo.phone,
        age: appointmentData.patientInfo.age,
        gender: appointmentData.patientInfo.gender
      },
      doctor: {
        _id: doctor.id,
        user: {
          firstName: doctor.name.replace('Dr. ', '').split(' ')[0],
          lastName: doctor.name.replace('Dr. ', '').split(' ')[1] || '',
          image: doctor.image
        },
        specialization: doctor.specializations[0],
        experience: doctor.experience,
        consultantFee: parseInt(doctor.consultationFee.replace('₹', '')) || doctor.consultationFee
      },
      date: appointmentData.selectedDate,
      timeSlot: {
        start: appointmentData.selectedTime,
        end: calculateEndTime(appointmentData.selectedTime)
      },
      description: appointmentData.symptoms,
      paymentStatus: true,
      consultationType: appointmentData.consultationType,
      amount: amount,
      paymentMethod: 'card',
      paymentId: `PAY_${Date.now()}`,
      status: 'upcoming',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store appointment in localStorage
    const storageKey = getUserStorageKey('userAppointments');
    const existingAppointments = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const updatedAppointments = [newAppointment, ...existingAppointments];
    localStorage.setItem(storageKey, JSON.stringify(updatedAppointments));

    toast.success('Payment successful! Your appointment has been confirmed.');
    
    // Navigate to dashboard with the new appointment data
    navigate('/dashboard', { 
      state: { 
        newAppointment: newAppointment
      }
    });
    
  } catch (error: any) {
    console.error('Payment error:', error);
    toast.error('Payment processing failed. Please try again.');
  } finally {
    setIsProcessing(false);
  }
};

// Add this helper function to PaymentPage
const getUserStorageKey = (baseKey: string) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user?.id || user?._id ? `${baseKey}_${user.id || user._id}` : baseKey;
};

  const calculateEndTime = (startTime: string): string => {
    const [time, period] = startTime.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    startDate.setMinutes(startDate.getMinutes() + 30);
    
    const endHours = startDate.getHours();
    const endMinutes = startDate.getMinutes();
    const endPeriod = endHours >= 12 ? 'PM' : 'AM';
    const formattedHours = endHours % 12 || 12;
    
    return `${formattedHours}:${endMinutes.toString().padStart(2, '0')} ${endPeriod}`;
  };

  const subtotal = amount;
  const platformFee = amount * 0.05;
  const taxes = (subtotal + platformFee) * 0.18;
  const total = subtotal + platformFee + taxes;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Booking
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span>Secure Payment</span>
                </CardTitle>
                <CardDescription>
                  Your payment information is encrypted and secure
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium mb-4 block">Select Payment Method</Label>
                  <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                        <RadioGroupItem value={method.id} id={method.id} />
                        <Label htmlFor={method.id} className="flex items-center space-x-3 cursor-pointer flex-1">
                          {method.icon}
                          <div>
                            <div className="font-medium">{method.name}</div>
                            <div className="text-sm text-muted-foreground">{method.description}</div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {selectedPaymentMethod === 'card' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardDetails.cardNumber}
                        onChange={(e) => handleCardInputChange('cardNumber', e.target.value)}
                        maxLength={19}
                      />
                      <p className="text-xs text-muted-foreground">Test card: 4242 4242 4242 4242</p>
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
                        placeholder="John Doe"
                        value={cardDetails.cardholderName}
                        onChange={(e) => handleCardInputChange('cardholderName', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>Your payment information is secure and encrypted</span>
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
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
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
                    <AvatarFallback>{doctor.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{doctor.name}</div>
                    <div className="text-sm text-muted-foreground">{doctor.specializations[0]}</div>
                  </div>
                </div>

                <Separator />

                {/* Appointment Details */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{appointmentData.selectedDate}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{appointmentData.selectedTime}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    {appointmentData.consultationType === 'video' ? (
                      <Video className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="capitalize">{appointmentData.consultationType.replace('-', ' ')} Consultation</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{appointmentData.patientInfo.name}</span>
                  </div>
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Consultation Fee</span>
                    <span>₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Platform Fee</span>
                    <span>₹{platformFee.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Taxes (18% GST)</span>
                    <span>₹{taxes.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-medium">
                    <span>Total Amount</span>
                    <span className="text-primary">₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm text-green-700 dark:text-green-300">
                    <CheckCircle className="h-4 w-4" />
                    <span>Instant booking confirmation</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  <p>
                    By proceeding with payment, you agree to our Terms of Service and Privacy Policy. 
                    You can cancel or reschedule your appointment up to 24 hours before the scheduled time.
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

