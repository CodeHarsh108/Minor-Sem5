import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Calendar, Clock, User, Video, MessageSquare, Phone, Mail, MapPin, Star, Award } from 'lucide-react';
import { useAuth } from '../../App';
import axios from 'axios';

const API_BASE_URL = 'https://ayursamhita-backend.onrender.com/api/v1';

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  email: string;
  gender?: string;
  accountType: string;
  image?: string;
}

interface Appointment {
  _id: string;
  patient: Patient;
  doctor: string;
  date: string;
  timeSlot: {
    start: string;
    end: string;
  };
  description: string;
  paymentStatus: boolean;
  status: 'upcoming' | 'completed' | 'cancelled';
  createdAt: string;
}

interface DoctorAppointmentsResponse {
  success: boolean;
  message: string;
  results: number;
  data: Appointment[];
}

interface DoctorProfile {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    contactNumber: string;
    image: string;
  };
  specialization: string;
  experience: number;
  consultantFee: number;
  degrees: string;
  certification: string;
  availableDays: string[];
  availableTimeSlot?: {  // Make this optional
    start: string;
    end: string;
  };
  approvalStatus: boolean;
}

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0
  });

  // Fetch doctor profile and appointments
  const fetchDoctorData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // First, get the doctor's profile using the user ID
      const doctorResponse = await axios.get<{ success: boolean; doctor: DoctorProfile }>(
        `${API_BASE_URL}/user/doctor/${user.id || user._id}`,
        { withCredentials: true }
      );

      console.log('Doctor Profile Response:', doctorResponse.data); // Debug log

      if (doctorResponse.data.success && doctorResponse.data.doctor) {
        const doctorProfile = doctorResponse.data.doctor;
        
        // Ensure availableTimeSlot exists with default values
        const profileWithDefaults = {
          ...doctorProfile,
          availableTimeSlot: doctorProfile.availableTimeSlot || { start: '09:00', end: '17:00' },
          availableDays: doctorProfile.availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          specialization: doctorProfile.specialization || 'General Medicine',
          experience: doctorProfile.experience || 0,
          consultantFee: doctorProfile.consultantFee || 500,
          degrees: doctorProfile.degrees || 'Medical Degree',
          certification: doctorProfile.certification || ''
        };
        
        setDoctorProfile(profileWithDefaults);

        // Now fetch appointments for this doctor
        const appointmentsResponse = await axios.get<DoctorAppointmentsResponse>(
          `${API_BASE_URL}/user/doctors-bookings/${doctorProfile._id}`,
          { withCredentials: true }
        );

        console.log('Appointments Response:', appointmentsResponse.data); // Debug log

        if (appointmentsResponse.data.success) {
          const doctorAppointments = appointmentsResponse.data.data;
          setAppointments(doctorAppointments);

          // Calculate stats
          const upcoming = doctorAppointments.filter(apt => {
            try {
              return new Date(apt.date) >= new Date();
            } catch (error) {
              console.error('Error parsing appointment date:', apt.date, error);
              return false;
            }
          }).length;
          
          const completed = doctorAppointments.filter(apt => {
            try {
              return new Date(apt.date) < new Date();
            } catch (error) {
              console.error('Error parsing appointment date:', apt.date, error);
              return false;
            }
          }).length;

          setStats({
            totalAppointments: doctorAppointments.length,
            upcomingAppointments: upcoming,
            completedAppointments: completed
          });
        }
      } else {
        console.log('No doctor profile found for current user');
        setAppointments([]);
        setStats({
          totalAppointments: 0,
          upcomingAppointments: 0,
          completedAppointments: 0
        });
      }
    } catch (error) {
      console.error('Error fetching doctor data:', error);
      // Set empty state on error
      setAppointments([]);
      setStats({
        totalAppointments: 0,
        upcomingAppointments: 0,
        completedAppointments: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, [user]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Not specified';
    
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${ampm}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  };

  // Safe function to get available time display
  const getAvailableTimeDisplay = () => {
    if (!doctorProfile?.availableTimeSlot) {
      return 'Not specified';
    }
    
    const start = formatTime(doctorProfile.availableTimeSlot.start);
    const end = formatTime(doctorProfile.availableTimeSlot.end);
    return `${start} - ${end}`;
  };

  const getPatientInitials = (patient: Patient) => {
    try {
      return `${patient.firstName[0]}${patient.lastName[0]}`.toUpperCase();
    } catch (error) {
      console.error('Error getting patient initials:', error);
      return 'PT';
    }
  };

  if (loading) {
    return (
      <div className="ayur-page-dark" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}>
          <div className="ayur-spinner"></div>
          <p style={{ color:'rgba(191,219,254,0.55)' }}>Loading your appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ayur-page-dark" style={{ paddingTop:8, paddingBottom:40 }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', position:'relative', zIndex:1 }}>
        {/* Header with Doctor Profile */}
        <div style={{ marginBottom:32, paddingTop:24 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:20 }}>
            <div>
              <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(28px,3vw,38px)', color:'#eff6ff', lineHeight:1.2, margin:'0 0 8px' }}>
                Doctor <em style={{ color:'#60a5fa', fontStyle:'italic' }}>Dashboard</em>
              </h1>
              <p style={{ fontFamily:"'DM Sans',sans-serif", color:'rgba(191,219,254,0.55)', fontSize:15, margin:0 }}>
                Manage your appointments and patient consultations
              </p>
            </div>
            {doctorProfile && (
              <div className="flex items-center space-x-4 bg-card p-4 rounded-lg border">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={doctorProfile.user.image} alt={`${doctorProfile.user.firstName} ${doctorProfile.user.lastName}`} />
                  <AvatarFallback>
                    {doctorProfile.user.firstName[0]}{doctorProfile.user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">Dr. {doctorProfile.user.firstName} {doctorProfile.user.lastName}</h3>
                  <p className="text-sm text-muted-foreground">{doctorProfile.specialization}</p>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Award className="h-3 w-3" />
                    <span>{doctorProfile.experience}+ years experience</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAppointments}</div>
              <p className="text-xs text-muted-foreground">All time appointments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingAppointments}</div>
              <p className="text-xs text-muted-foreground">Scheduled consultations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedAppointments}</div>
              <p className="text-xs text-muted-foreground">Past consultations</p>
            </CardContent>
          </Card>
        </div>

        {/* Appointments List */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Appointments</CardTitle>
            <CardDescription>
              Your upcoming and past patient consultations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map(appointment => (
                  <div key={appointment._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4 flex-1">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={appointment.patient.image} alt={`${appointment.patient.firstName} ${appointment.patient.lastName}`} />
                        <AvatarFallback>
                          {getPatientInitials(appointment.patient)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {appointment.patient.firstName} {appointment.patient.lastName}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(appointment.date)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatTime(appointment.timeSlot.start)} - {formatTime(appointment.timeSlot.end)}
                            </span>
                          </div>
                          {appointment.patient.contactNumber && (
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3" />
                              <span>{appointment.patient.contactNumber}</span>
                            </div>
                          )}
                          {appointment.patient.email && (
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3" />
                              <span>{appointment.patient.email}</span>
                            </div>
                          )}
                        </div>
                        {appointment.description && (
                          <p className="text-sm mt-2">
                            <strong>Reason:</strong> {appointment.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        new Date(appointment.date) >= new Date() ? 'default' : 'secondary'
                      }>
                        {new Date(appointment.date) >= new Date() ? 'Upcoming' : 'Completed'}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Video className="h-4 w-4 mr-1" />
                        Join
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No appointments yet</h3>
                <p className="text-muted-foreground">
                  Patients will appear here when they book appointments with you.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Make sure your doctor profile is properly set up and patients can find you.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Doctor Profile Details */}
        {doctorProfile && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Your Profile Details</CardTitle>
              <CardDescription>
                Information shown to patients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Professional Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Specialization:</strong> {doctorProfile.specialization}</div>
                    <div><strong>Experience:</strong> {doctorProfile.experience} years</div>
                    <div><strong>Consultation Fee:</strong> ₹{doctorProfile.consultantFee}</div>
                    <div><strong>Degrees:</strong> {doctorProfile.degrees}</div>
                    {doctorProfile.certification && (
                      <div><strong>Certifications:</strong> {doctorProfile.certification}</div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Availability</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Available Days:</strong> {doctorProfile.availableDays?.join(', ') || 'Not specified'}</div>
                    <div><strong>Available Time:</strong> {getAvailableTimeDisplay()}</div>
                    <div><strong>Status:</strong> 
                      <Badge variant={doctorProfile.approvalStatus ? "default" : "secondary"} className="ml-2">
                        {doctorProfile.approvalStatus ? "Approved" : "Pending Approval"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};