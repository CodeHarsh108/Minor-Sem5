import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { Calendar, Clock, Video, MessageSquare, User, Phone, Mail, FileText, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { useAuth } from '../../App';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8002/api/v1';

// Types based on your backend
interface Doctor {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    image: string;
    contactNumber: string;
    gender?: string;
  };
  specialization: string;
  experience: number;
  consultantFee: number;
  degrees: string;
  certification: string;
  availableDays: string[];
  availableTimeSlot: {
    start: string;
    end: string;
  };
  approvalStatus: boolean;
}

interface BookingData {
  doctorId: string;
  consultationType: 'video' | 'in-person';
  selectedDate: string;
  selectedTime: string;
  patientInfo: {
    name: string;
    email: string;
    phone: string;
    age: string;
    gender: string;
  };
  symptoms: string;
  medicalHistory: string;
  currentMedications: string;
}

interface AvailableSlot {
  date: string;
  slots: string[];
}

export const AppointmentBooking: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState<BookingData>({
    doctorId: doctorId || '',
    consultationType: 'video',
    selectedDate: '',
    selectedTime: '',
    patientInfo: {
      name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
      email: user?.email || '',
      phone: user?.contactNumber || '',
      age: '',
      gender: user?.gender || ''
    },
    symptoms: '',
    medicalHistory: '',
    currentMedications: ''
  });

  // Fetch doctor details
  useEffect(() => {
    const fetchDoctorDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get<{ success: boolean; doctors: Doctor[] }>(`${API_BASE_URL}/user/doctors`, {
          withCredentials: true
        });
        
        if (response.data.success) {
          const foundDoctor = response.data.doctors.find((d: Doctor) => d._id === doctorId);
          if (foundDoctor) {
            setDoctor(foundDoctor);
          } else {
            toast.error('Doctor not found');
            navigate('/doctors');
          }
        }
      } catch (error: any) {
        console.error('Error fetching doctor:', error);
        toast.error('Failed to load doctor details');
        navigate('/doctors');
      } finally {
        setLoading(false);
      }
    };

    if (doctorId) {
      fetchDoctorDetails();
    }
  }, [doctorId, navigate]);

  // Generate available time slots based on doctor's availability
  useEffect(() => {
    if (doctor) {
      const slots = generateTimeSlots(doctor);
      setAvailableSlots(slots);
    }
  }, [doctor]);

  const generateTimeSlots = (doctorData: Doctor): AvailableSlot[] => {
    const slots: AvailableSlot[] = [];
    const today = new Date();
    
    // Get doctor's available days and time
    const availableDays = doctorData.availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const startTime = doctorData.availableTimeSlot?.start || "09:00";
    const endTime = doctorData.availableTimeSlot?.end || "17:00";
    
    // Convert time to 12-hour format
    const formatTime = (timeString: string) => {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${ampm}`;
    };

    // Generate slots for the next 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      // Check if doctor is available on this day
      if (availableDays.includes(dayName)) {
        const timeSlots = [];
        const startHour = parseInt(startTime.split(':')[0]);
        const endHour = parseInt(endTime.split(':')[0]);
        
        // Generate time slots every 30 minutes
        for (let hour = startHour; hour < endHour; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            timeSlots.push(formatTime(timeString));
          }
        }
        
        // Randomly remove some slots to simulate booked appointments
        const availableTimeSlots = timeSlots.filter(() => Math.random() > 0.3);
        
        if (availableTimeSlots.length > 0) {
          slots.push({
            date: date.toDateString(),
            slots: availableTimeSlots
          });
        }
      }
    }
    
    return slots;
  };

  useEffect(() => {
    if (!doctor && !loading) {
      navigate('/doctors');
    }
  }, [doctor, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading doctor details...</p>
        </div>
      </div>
    );
  }

  if (!doctor) return null;

  const handleInputChange = (field: keyof BookingData['patientInfo'], value: string) => {
    setBookingData(prev => ({
      ...prev,
      patientInfo: {
        ...prev.patientInfo,
        [field]: value
      }
    }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!bookingData.selectedDate || !bookingData.selectedTime) {
        toast.error('Please select a date and time for your appointment');
        return;
      }
    } else if (currentStep === 2) {
      if (!bookingData.patientInfo.name || !bookingData.patientInfo.email || !bookingData.patientInfo.phone) {
        toast.error('Please fill in all required patient information');
        return;
      }
    } else if (currentStep === 3) {
      if (!bookingData.symptoms) {
        toast.error('Please describe your symptoms or reason for consultation');
        return;
      }
    }
    
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleBookAppointment = async () => {
    try {
      // Prepare appointment data for backend
      const appointmentData = {
        user: user?.id || user?._id,
        doctor: doctor._id,
        date: bookingData.selectedDate,
        timeSlot: {
          start: bookingData.selectedTime.split(' ')[0] + ':00',
          end: calculateEndTime(bookingData.selectedTime)
        },
        description: bookingData.symptoms,
        paymentStatus: false // Will be set to true after payment
      };

      // In a real app, you would make the API call here
      // const response = await axios.post(`${API_BASE_URL}/user/book-appointment`, appointmentData, {
      //   withCredentials: true
      // });

      // For now, we'll simulate success
      toast.success('Appointment details saved! Proceeding to payment...');
      
      navigate('/payment', { 
        state: { 
          appointmentData: bookingData,
          doctor: {
            id: doctor._id,
            name: `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`,
            image: doctor.user.image,
            specializations: [doctor.specialization],
            experience: doctor.experience,
            consultationFee: `₹${doctor.consultantFee}`,
            videoConsultation: true
          },
          amount: doctor.consultantFee
        }
      });
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      toast.error('Failed to book appointment. Please try again.');
    }
  };

  const calculateEndTime = (startTime: string): string => {
    // Add 30 minutes to start time
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Select Consultation Type</h3>
              <RadioGroup
                value={bookingData.consultationType}
                onValueChange={(value: string) => setBookingData(prev => ({ ...prev, consultationType: value as 'video' | 'in-person' }))}
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="video" id="video" />
                  <Label htmlFor="video" className="flex items-center space-x-2 cursor-pointer flex-1">
                    <Video className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Video Consultation</div>
                      <div className="text-sm text-muted-foreground">Consult from the comfort of your home</div>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="in-person" id="in-person" />
                  <Label htmlFor="in-person" className="flex items-center space-x-2 cursor-pointer flex-1">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">In-Person Consultation</div>
                      <div className="text-sm text-muted-foreground">Visit the clinic for direct consultation</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Select Date & Time</h3>
              <div className="grid gap-4">
                {availableSlots.map((daySlots, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">{daySlots.date}</h4>
                    {daySlots.slots.length > 0 ? (
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                        {daySlots.slots.map(slot => (
                          <Button
                            key={slot}
                            variant={
                              bookingData.selectedDate === daySlots.date && bookingData.selectedTime === slot
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => setBookingData(prev => ({
                              ...prev,
                              selectedDate: daySlots.date,
                              selectedTime: slot
                            }))}
                          >
                            {slot}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No slots available</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">Patient Information</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={bookingData.patientInfo.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={bookingData.patientInfo.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={bookingData.patientInfo.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={bookingData.patientInfo.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="Enter your age"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select 
                  value={bookingData.patientInfo.gender} 
                  onValueChange={(value: string) => handleInputChange('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">Medical Information</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="symptoms">Symptoms / Reason for Consultation *</Label>
                <Textarea
                  id="symptoms"
                  value={bookingData.symptoms}
                  onChange={(e) => setBookingData(prev => ({ ...prev, symptoms: e.target.value }))}
                  placeholder="Please describe your symptoms, concerns, or reason for consultation..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalHistory">Medical History</Label>
                <Textarea
                  id="medicalHistory"
                  value={bookingData.medicalHistory}
                  onChange={(e) => setBookingData(prev => ({ ...prev, medicalHistory: e.target.value }))}
                  placeholder="Any relevant medical history, past surgeries, chronic conditions..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentMedications">Current Medications</Label>
                <Textarea
                  id="currentMedications"
                  value={bookingData.currentMedications}
                  onChange={(e) => setBookingData(prev => ({ ...prev, currentMedications: e.target.value }))}
                  placeholder="List any medications, supplements, or treatments you're currently taking..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Confirm Your Appointment</h3>
              <p className="text-muted-foreground">Please review your appointment details before proceeding to payment</p>
            </div>

            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-3">Appointment Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="font-medium">{bookingData.selectedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span className="font-medium">{bookingData.selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium capitalize">{bookingData.consultationType.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-medium">30 minutes</span>
                  </div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-3">Patient Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Name:</span>
                    <span className="font-medium">{bookingData.patientInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <span className="font-medium">{bookingData.patientInfo.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span className="font-medium">{bookingData.patientInfo.phone}</span>
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Consultation Fee:</span>
                  <span className="text-2xl font-bold text-primary">₹{doctor.consultantFee}</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const doctorName = `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`;
  const doctorImage = doctor.user.image || "/api/placeholder/150/150";

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/doctors')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Doctors
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Doctor Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={doctorImage} alt={doctorName} />
                    <AvatarFallback>{doctor.user.firstName[0]}{doctor.user.lastName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{doctorName}</CardTitle>
                    <CardDescription>{doctor.experience}+ years experience</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Specializations</h4>
                  <div className="flex flex-wrap gap-1">
                    {doctor.specialization.split(', ').map((spec, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">{spec.trim()}</Badge>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Rating:</span>
                    <span className="font-medium">4.8/5 (127 reviews)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location:</span>
                    <span className="font-medium">Available for consultation</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Consultation Fee:</span>
                    <span className="font-bold text-primary">₹{doctor.consultantFee}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Book Appointment</CardTitle>
                    <CardDescription>Step {currentStep} of 4</CardDescription>
                  </div>
                  
                  {/* Progress indicators */}
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          step <= currentStep
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {renderStepContent()}
                
                <div className="flex justify-between pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  
                  {currentStep < 4 ? (
                    <Button onClick={handleNext}>
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleBookAppointment}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      Proceed to Payment
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};