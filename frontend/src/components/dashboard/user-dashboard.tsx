import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { Calendar, Clock, Video, MessageSquare, User, Star, MapPin, Phone, Mail, FileText, Activity, Bell, Settings, LogOut, Heart, Pill, TrendingUp, Plus, Target, CheckCircle, Clock as ClockIcon, AlertTriangle, Edit, Save, X, Map, Stethoscope, Calendar as CalendarIcon, Award, GraduationCap, Briefcase, Headset } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { Progress } from '../ui/progress';
import { useAuth } from '../../App';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

const API_BASE_URL = 'http://localhost:8002/api/v1';

// Types based on your backend response
interface UserInfo {
  _id: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  accountType: string;
  gender: string;
  image?: string;
}

interface MeetingRoom {
  roomName: string;
  doctorName: string;
  meetingTime: string;
  appointmentId: string;
}

interface DeleteAppointmentResponse {
  success: boolean;
  message: string;
}

interface DoctorInfo {
  _id: string;
  consultantFee: number;
  user: UserInfo;
  specialization?: string;
  experience?: number;
}

interface Appointment {
  _id: string;
  patient: string | UserInfo;
  doctor: DoctorInfo;
  date: string;
  timeSlot: {
    start: string;
    end: string;
  };
  description: string;
  paymentStatus: boolean;
  consultationType: string;
  amount: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}

interface FavoriteMedicine {
  _id: string;
  name: string;
  type: 'medicine';
  disease: string;
  medicineType: 'allopathic' | 'ayurvedic';
  addedAt: string;
}

interface HealthMetric {
  totalMedicines: number;
  completedConsultations: number;
  upcomingConsultations: number;
  conditionsTracked: number;
  healthEngagement: number;
}

interface UserActivity {
  totalAppointments: number;
  completedAppointments: number;
  upcomingAppointments: number;
  favoriteMedicines: FavoriteMedicine[];
  healthMetrics: HealthMetric;
  lastActivity: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  results: number;
  data: Appointment[];
}

interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalHistory?: {
    allergies: string[];
    chronicConditions: string[];
    surgeries: string[];
    currentMedications: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface DoctorProfile {
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
}

interface EditForm {
  firstName: string;
  lastName: string;
  contactNumber: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalHistory: {
    allergies: string[];
    chronicConditions: string[];
    surgeries: string[];
    currentMedications: string[];
  };
}

// API Response Types
interface UpdateProfileResponse {
  success: boolean;
  message: string;
  user?: UserProfile;
  Profile?: UserProfile;
}

interface DoctorsResponse {
  success: boolean;
  doctors: any[];
}

export const UserDashboard: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity>({
    totalAppointments: 0,
    completedAppointments: 0,
    upcomingAppointments: 0,
    favoriteMedicines: [],
    healthMetrics: {
      totalMedicines: 0,
      completedConsultations: 0,
      upcomingConsultations: 0,
      conditionsTracked: 0,
      healthEngagement: 0
    },
    lastActivity: ''
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAppointmentLinks, setShowAppointmentLinks] = useState(false);
  const [upcomingMeetingRooms, setUpcomingMeetingRooms] = useState<MeetingRoom[]>([]);
  const [editForm, setEditForm] = useState<EditForm>({
    firstName: '',
    lastName: '',
    contactNumber: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    medicalHistory: {
      allergies: [''],
      chronicConditions: [''],
      surgeries: [''],
      currentMedications: ['']
    }
  });

  // Use useMemo for better performance - calculated values
  const upcomingAppointments = useMemo(() => 
    appointments.filter(apt => apt.status === 'upcoming'), 
    [appointments]
  );
  
  const completedAppointments = useMemo(() => 
    appointments.filter(apt => apt.status === 'completed'), 
    [appointments]
  );

  const recentAppointments = useMemo(() => 
    appointments.slice(0, 5), 
    [appointments]
  );

  const recentMedicines = useMemo(() => 
    userActivity.favoriteMedicines.slice(0, 4), 
    [userActivity.favoriteMedicines]
  );

  // Get user-specific storage key
  const getUserStorageKey = useMemo(() => (baseKey: string) => {
    return user ? `${baseKey}_${user.id || user._id}` : baseKey;
  }, [user]);

  // Calculate real health metrics based on user activity
  const calculateHealthMetrics = (
    userAppointments: Appointment[], 
    favoriteMedicines: FavoriteMedicine[]
  ): HealthMetric => {
    const completedConsultations = userAppointments.filter(apt => apt.status === 'completed').length;
    const upcomingConsultations = userAppointments.filter(apt => apt.status === 'upcoming').length;
    const totalMedicines = favoriteMedicines.length;
    
    // Calculate unique conditions tracked
    const uniqueConditions = new Set(favoriteMedicines.map(med => med.disease)).size;
    
    // Calculate health engagement score (0-100)
    let healthEngagement = 0;
    
    // Points for completed consultations
    healthEngagement += Math.min(completedConsultations * 20, 40);
    
    // Points for upcoming consultations (planning)
    healthEngagement += Math.min(upcomingConsultations * 15, 30);
    
    // Points for medicine research
    healthEngagement += Math.min(totalMedicines * 5, 20);
    
    // Points for tracking multiple conditions
    healthEngagement += Math.min(uniqueConditions * 5, 10);
    
    return {
      totalMedicines,
      completedConsultations,
      upcomingConsultations,
      conditionsTracked: uniqueConditions,
      healthEngagement: Math.min(healthEngagement, 100)
    };
  };

  const getLastActivityDate = (userAppointments: Appointment[], favoriteMedicines: FavoriteMedicine[]): string => {
    const allActivities = [
      ...userAppointments.map(apt => new Date(apt.date)),
      ...favoriteMedicines.map(med => new Date(med.addedAt))
    ];
    
    if (allActivities.length === 0) return 'No recent activity';
    
    const latestActivity = new Date(Math.max(...allActivities.map(d => d.getTime())));
    return latestActivity.toLocaleDateString();
  };

  // Helper function to get doctor name safely
  const getDoctorName = (appointment: Appointment) => {
    if (typeof appointment.doctor.user === 'object') {
      return `Dr. ${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`;
    }
    return 'Doctor';
  };

  // Helper function to get doctor image safely
  const getDoctorImage = (appointment: Appointment) => {
    if (typeof appointment.doctor.user === 'object' && appointment.doctor.user.image) {
      return appointment.doctor.user.image;
    }
    return '/api/placeholder/150/150';
  };

  // Helper function to get doctor initials safely
  const getDoctorInitials = (appointment: Appointment) => {
    if (typeof appointment.doctor.user === 'object') {
      return `${appointment.doctor.user.firstName[0]}${appointment.doctor.user.lastName[0]}`;
    }
    return 'DR';
  };

  // Get health engagement message
  const getHealthEngagementMessage = (score: number): string => {
    if (score >= 90) return 'Excellent health management! You are very proactive about your health.';
    if (score >= 75) return 'Great job! You are actively managing your health needs.';
    if (score >= 60) return 'Good progress! Continue exploring health options.';
    if (score >= 40) return 'Getting started! Keep building your health knowledge.';
    return 'Begin your health journey by exploring medicines and booking consultations.';
  };

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
      return 'Invalid date';
    }
  };

  const formatTime = (timeString: string) => {
    try {
      // Handle time strings like "14:30" or "2:30 PM"
      let timeToFormat = timeString;
      
      // If it's already in 12-hour format with AM/PM, return as is
      if (timeString.includes('AM') || timeString.includes('PM')) {
        return timeString.replace(/\s?AM AM|\s?PM PM/gi, '').trim(); // Remove duplicate AM/PM
      }
      
      // Handle 24-hour format
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${ampm}`;
    } catch (error) {
      return timeString;
    }
  };

  const handleRemoveFromFavorites = (itemId: string) => {
    const storageKey = getUserStorageKey('favoriteMedicines');
    const updatedMedicines = userActivity.favoriteMedicines.filter(medicine => medicine._id !== itemId);
    
    localStorage.setItem(storageKey, JSON.stringify(updatedMedicines));
    
    const updatedMetrics = calculateHealthMetrics(appointments, updatedMedicines);
    
    setUserActivity(prev => ({
      ...prev,
      favoriteMedicines: updatedMedicines,
      healthMetrics: updatedMetrics
    }));
    
    toast.success('Removed from favorites');
    window.dispatchEvent(new Event('storage'));
  };

  const handleAddSampleMedicines = () => {
    if (!user) {
      toast.error('Please login to add medicines');
      return;
    }

    const sampleMedicines: FavoriteMedicine[] = [
      {
        _id: 'sample-med-1',
        name: 'Paracetamol',
        type: 'medicine',
        disease: 'Common Cold',
        medicineType: 'allopathic',
        addedAt: new Date().toISOString()
      },
      {
        _id: 'sample-med-2',
        name: 'Tulsi leaves',
        type: 'medicine',
        disease: 'Common Cold',
        medicineType: 'ayurvedic',
        addedAt: new Date().toISOString()
      }
    ];

    const storageKey = getUserStorageKey('favoriteMedicines');
    localStorage.setItem(storageKey, JSON.stringify(sampleMedicines));
    
    const updatedMetrics = calculateHealthMetrics(appointments, sampleMedicines);
    
    setUserActivity(prev => ({
      ...prev,
      favoriteMedicines: sampleMedicines,
      healthMetrics: updatedMetrics
    }));
    
    toast.success('Sample medicines added! Click medicines in Herb Browser to add more.');
    window.dispatchEvent(new Event('storage'));
  };

  // Load local profile data from localStorage
  const loadLocalProfileData = () => {
    if (!user) return null;
    
    try {
      const storageKey = getUserStorageKey('localProfileData');
      const savedData = localStorage.getItem(storageKey);
      return savedData ? JSON.parse(savedData) : null;
    } catch (error) {
      console.error('Error loading local profile data:', error);
      return null;
    }
  };

  // Save local profile data to localStorage
  const saveLocalProfileData = (data: any) => {
    if (!user) return;
    
    try {
      const storageKey = getUserStorageKey('localProfileData');
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving local profile data:', error);
    }
  };

  // Initialize user profile from auth context and localStorage
  const initializeUserProfile = () => {
    if (!user) return;
    
    // Load local data from localStorage
    const localData = loadLocalProfileData();
    
    const basicProfile: UserProfile = {
      _id: user.id || user._id || '',
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      contactNumber: user.contactNumber || '',
      gender: user.gender || '',
      bloodGroup: user.bloodGroup || '',
      dateOfBirth: user.dateOfBirth || '',
      // Merge local data with basic profile
      address: localData?.address || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      emergencyContact: localData?.emergencyContact || {
        name: '',
        relationship: '',
        phone: ''
      },
      medicalHistory: localData?.medicalHistory || {
        allergies: [''],
        chronicConditions: [''],
        surgeries: [''],
        currentMedications: ['']
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setUserProfile(basicProfile);
    
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      contactNumber: user.contactNumber || '',
      dateOfBirth: user.dateOfBirth || '',
      gender: user.gender || '',
      bloodGroup: user.bloodGroup || '',
      address: basicProfile.address || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      emergencyContact: basicProfile.emergencyContact || {
        name: '',
        relationship: '',
        phone: ''
      },
      medicalHistory: basicProfile.medicalHistory || {
        allergies: [''],
        chronicConditions: [''],
        surgeries: [''],
        currentMedications: ['']
      }
    });
  };

  // Fetch doctor profile if user is a doctor
  const fetchDoctorProfile = async () => {
    if (!user || user.accountType !== 'Doctor') return;
    
    try {
      const response = await axios.get<DoctorsResponse>(`${API_BASE_URL}/user/doctors`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        const currentDoctor = response.data.doctors.find(
          doctor => doctor.user._id === (user.id || user._id)
        );
        if (currentDoctor) {
          setDoctorProfile({
            specialization: currentDoctor.specialization,
            consultantFee: currentDoctor.consultantFee,
            experience: currentDoctor.experience,
            degrees: currentDoctor.degrees,
            certification: currentDoctor.certification,
            availableDays: currentDoctor.availableDays,
            availableTimeSlot: currentDoctor.availableTimeSlot
          });
        }
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!user) return;
    
    try {
      // Show confirmation dialog
      if (!window.confirm('Are you sure you want to cancel this appointment? This action cannot be undone.')) {
        return;
      }

      // Make API call to delete appointment
      const response = await axios.delete<DeleteAppointmentResponse>(
        `${API_BASE_URL}/user/delete-appointment/${appointmentId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        // Remove from local state
        const updatedAppointments = appointments.filter(apt => apt._id !== appointmentId);
        setAppointments(updatedAppointments);
        
        // Update user activity
        const deletedAppointment = appointments.find(apt => apt._id === appointmentId);
        const wasUpcoming = deletedAppointment?.status === 'upcoming';
        
        setUserActivity(prev => ({
          ...prev,
          totalAppointments: prev.totalAppointments - 1,
          upcomingAppointments: wasUpcoming ? prev.upcomingAppointments - 1 : prev.upcomingAppointments,
          completedAppointments: !wasUpcoming ? prev.completedAppointments - 1 : prev.completedAppointments,
          healthMetrics: calculateHealthMetrics(updatedAppointments, prev.favoriteMedicines)
        }));

        // Remove from localStorage
        const storageKey = getUserStorageKey('userAppointments');
        const savedAppointments = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const filteredAppointments = savedAppointments.filter((apt: Appointment) => apt._id !== appointmentId);
        localStorage.setItem(storageKey, JSON.stringify(filteredAppointments));

        toast.success('Appointment cancelled successfully');
      } else {
        throw new Error(response.data.message || 'Failed to delete appointment');
      }
    } catch (error: any) {
      console.error('Error deleting appointment:', error);
      
      // If API fails, still remove from local state (for demo purposes)
      const updatedAppointments = appointments.filter(apt => apt._id !== appointmentId);
      setAppointments(updatedAppointments);
      
      const storageKey = getUserStorageKey('userAppointments');
      const savedAppointments = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const filteredAppointments = savedAppointments.filter((apt: Appointment) => apt._id !== appointmentId);
      localStorage.setItem(storageKey, JSON.stringify(filteredAppointments));
      
      toast.success('Appointment cancelled locally');
    }
  };

  // Update profile function - Only saves basic info to backend, local data to localStorage
  const handleUpdateProfile = async () => {
    if (!user || !userProfile) return;
    
    try {
      // Clean up the medical history arrays to remove empty strings
      const cleanedMedicalHistory = {
        allergies: editForm.medicalHistory.allergies.filter(item => item.trim() !== ''),
        chronicConditions: editForm.medicalHistory.chronicConditions.filter(item => item.trim() !== ''),
        surgeries: editForm.medicalHistory.surgeries.filter(item => item.trim() !== ''),
        currentMedications: editForm.medicalHistory.currentMedications.filter(item => item.trim() !== '')
      };

      // Save local data (address, medical history, emergency contact) to localStorage
      const localData = {
        address: editForm.address,
        emergencyContact: editForm.emergencyContact,
        medicalHistory: cleanedMedicalHistory
      };
      saveLocalProfileData(localData);

      // Prepare ONLY BASIC data for backend update (no address, medical history, emergency contact)
      const updateData: any = {
        accountType: user.accountType,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        contactNumber: editForm.contactNumber,
        dateOfBirth: editForm.dateOfBirth || undefined,
        gender: editForm.gender || undefined,
        bloodGroup: editForm.bloodGroup || undefined,
      };

      console.log('Sending BASIC update data to backend:', updateData);

      const response = await axios.post<UpdateProfileResponse>(
        `${API_BASE_URL}/user/update-profile/${user.id || user._id}`,
        updateData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Update response:', response.data);

      if (response.data.success) {
        const updatedUser = response.data.user || response.data.Profile;
        
        // Update user profile state with both backend and local data
        const updatedProfile: UserProfile = {
          _id: user.id || user._id || '',
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          email: user.email,
          contactNumber: editForm.contactNumber,
          dateOfBirth: editForm.dateOfBirth || '',
          gender: editForm.gender || '',
          bloodGroup: editForm.bloodGroup || '',
          // Keep local data
          address: editForm.address,
          emergencyContact: editForm.emergencyContact,
          medicalHistory: cleanedMedicalHistory,
          createdAt: userProfile.createdAt,
          updatedAt: new Date().toISOString()
        };
        
        setUserProfile(updatedProfile);
        
        // Update the auth context user data to reflect name changes
        updateAuthUserData(editForm.firstName, editForm.lastName);
        
        setIsEditing(false);
        toast.success('Profile updated successfully');
        
      } else {
        throw new Error(response.data.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to update profile. Please try again.';
      toast.error(errorMessage);
    }
  };

  // Function to update auth context user data (for navbar initials)
  const updateAuthUserData = (firstName: string, lastName: string) => {
    // Update localStorage user data
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      const updatedUser = {
        ...userData,
        firstName: firstName,
        lastName: lastName
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    // Dispatch a custom event that the navbar can listen to
    window.dispatchEvent(new CustomEvent('userDataUpdated', {
      detail: { firstName, lastName }
    }));
  };

  // Handle form input changes
  const handleInputChange = (field: keyof EditForm, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle cancel editing
  const handleCancelEdit = () => {
    if (userProfile) {
      // Reset the form to current profile data
      setEditForm({
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        contactNumber: userProfile.contactNumber,
        dateOfBirth: userProfile.dateOfBirth || '',
        gender: userProfile.gender || '',
        bloodGroup: userProfile.bloodGroup || '',
        address: userProfile.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        },
        emergencyContact: userProfile.emergencyContact || {
          name: '',
          relationship: '',
          phone: ''
        },
        medicalHistory: userProfile.medicalHistory || {
          allergies: [''],
          chronicConditions: [''],
          surgeries: [''],
          currentMedications: ['']
        }
      });
    }
    setIsEditing(false);
  };

  // Handle nested object changes
  const handleNestedChange = (parent: keyof EditForm, field: string, value: any) => {
    setEditForm(prev => {
      const currentParent = prev[parent] as Record<string, any>;
      return {
        ...prev,
        [parent]: {
          ...currentParent,
          [field]: value
        }
      };
    });
  };

  // Handle array field changes
  const handleArrayChange = (parent: string, index: number, value: string) => {
    const [parentKey, childKey] = parent.split('.') as [keyof EditForm, string];
    
    setEditForm(prev => {
      if (childKey) {
        const parentObj = prev[parentKey] as Record<string, any>;
        const currentArray = (parentObj[childKey] as string[]) || [];
        
        // Ensure we have enough array items
        const newArray = [...currentArray];
        while (newArray.length <= index) {
          newArray.push('');
        }
        newArray[index] = value;
        
        return {
          ...prev,
          [parentKey]: {
            ...parentObj,
            [childKey]: newArray
          }
        };
      }
      
      return prev;
    });
  };

  // Add new item to array field
  const handleAddArrayItem = (parent: string) => {
    const [parentKey, childKey] = parent.split('.') as [keyof EditForm, string];
    
    setEditForm(prev => {
      if (childKey) {
        const parentObj = prev[parentKey] as Record<string, any>;
        const currentArray = (parentObj[childKey] as string[]) || [];
        
        return {
          ...prev,
          [parentKey]: {
            ...parentObj,
            [childKey]: [...currentArray, '']
          }
        };
      }
      
      return prev;
    });
  };

  // Remove item from array field
  const handleRemoveArrayItem = (parent: string, index: number) => {
    const [parentKey, childKey] = parent.split('.') as [keyof EditForm, string];
    
    setEditForm(prev => {
      if (childKey) {
        const parentObj = prev[parentKey] as Record<string, any>;
        const currentArray = (parentObj[childKey] as string[]) || [];
        
        // Don't remove if it's the last item and empty, just clear it
        if (currentArray.length === 1 && currentArray[0].trim() === '') {
          const newArray = [''];
          return {
            ...prev,
            [parentKey]: {
              ...parentObj,
              [childKey]: newArray
            }
          };
        } else {
          const newArray = currentArray.filter((_, i) => i !== index);
          return {
            ...prev,
            [parentKey]: {
              ...parentObj,
              [childKey]: newArray
            }
          };
        }
      }
      
      return prev;
    });
  };

  // Fetch user appointments and activity
  const fetchUserData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load appointments from user-specific localStorage
      const storageKey = getUserStorageKey('userAppointments');
      const savedAppointments = localStorage.getItem(storageKey);
      let userAppointments: Appointment[] = [];
      
      if (savedAppointments) {
        userAppointments = JSON.parse(savedAppointments).map((apt: any) => {
          const appointmentDate = new Date(apt.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          appointmentDate.setHours(0, 0, 0, 0);
          
          return {
            ...apt,
            status: appointmentDate >= today ? 'upcoming' as const : 'completed' as const
          };
        });
      }

      // Also fetch from API if available
      try {
        const appointmentsResponse = await axios.get<ApiResponse>(
          `${API_BASE_URL}/user/patients-bookings/${user.id || user._id}`,
          { withCredentials: true }
        );

        if (appointmentsResponse.data.success) {
          const apiAppointments = appointmentsResponse.data.data.map(apt => {
            const appointmentDate = new Date(apt.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            appointmentDate.setHours(0, 0, 0, 0);
            
            return {
              ...apt,
              status: appointmentDate >= today ? 'upcoming' as const : 'completed' as const
            };
          });
          
          const existingIds = new Set(userAppointments.map(apt => apt._id));
          apiAppointments.forEach(apt => {
            if (!existingIds.has(apt._id)) {
              userAppointments.push(apt);
            }
          });
            localStorage.setItem(storageKey, JSON.stringify(userAppointments));

        }
      } catch (apiError) {
        console.log('API fetch failed, using localStorage data only');
      }

      setAppointments(userAppointments);

      // Load medicines from user-specific localStorage
      const medicineStorageKey = getUserStorageKey('favoriteMedicines');
      const savedMedicines = localStorage.getItem(medicineStorageKey);
      const favoriteMedicines = savedMedicines ? JSON.parse(savedMedicines) : [];
      
      // Calculate health metrics
      const healthMetrics = calculateHealthMetrics(userAppointments, favoriteMedicines);
      
      // Update user activity
      const completedApps = userAppointments.filter(apt => apt.status === 'completed').length;
      const upcomingApps = userAppointments.filter(apt => apt.status === 'upcoming').length;
      
      setUserActivity({
        totalAppointments: userAppointments.length,
        completedAppointments: completedApps,
        upcomingAppointments: upcomingApps,
        favoriteMedicines: favoriteMedicines,
        healthMetrics: healthMetrics,
        lastActivity: getLastActivityDate(userAppointments, favoriteMedicines)
      });

    } catch (error: any) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const generateMeetingRooms = (upcomingApps: Appointment[]): MeetingRoom[] => {
    return upcomingApps.map(appointment => {
      const doctorName = getDoctorName(appointment);
      const roomName = `room-${appointment._id.slice(-8)}-${doctorName.replace(/\s+/g, '-').toLowerCase()}`;
      
      return {
        roomName,
        doctorName,
        meetingTime: `${formatDate(appointment.date)} at ${formatTime(appointment.timeSlot.start)}`,
        appointmentId: appointment._id
      };
    });
  };

  // Copy room name to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Room name copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy room name');
    });
  };

  const handleJoinMeeting = (roomName: string) => {
    window.open(`https://sfu.mirotalk.com/join?room=${roomName}`, '_blank');
  };

  useEffect(() => {
    if (upcomingAppointments.length > 0) {
      const meetingRooms = generateMeetingRooms(upcomingAppointments);
      setUpcomingMeetingRooms(meetingRooms);
    } else {
      setUpcomingMeetingRooms([]);
    }
  }, [upcomingAppointments]);

  // Load favorite medicines from localStorage on component mount
  useEffect(() => {
    const loadFavorites = () => {
      try {
        const storageKey = getUserStorageKey('favoriteMedicines');
        const savedMedicines = localStorage.getItem(storageKey);
        return savedMedicines ? JSON.parse(savedMedicines) : [];
      } catch (error) {
        console.error('Error loading favorites:', error);
        return [];
      }
    };

    const medicines = loadFavorites();
    setUserActivity(prev => ({
      ...prev,
      favoriteMedicines: medicines
    }));
  }, [user, getUserStorageKey]);

  // Main data fetching effect
  useEffect(() => {
    if (user) {
      initializeUserProfile();
      fetchUserData();
      fetchDoctorProfile();
    }
  }, [user]);

  // Listen for storage events to update favorites in real-time
  useEffect(() => {
    const handleStorageChange = () => {
      const storageKey = getUserStorageKey('favoriteMedicines');
      const savedMedicines = localStorage.getItem(storageKey);
      const favoriteMedicines = savedMedicines ? JSON.parse(savedMedicines) : [];
      
      const healthMetrics = calculateHealthMetrics(appointments, favoriteMedicines);
      
      setUserActivity(prev => ({
        ...prev,
        favoriteMedicines: favoriteMedicines,
        healthMetrics: healthMetrics
      }));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [appointments, user, getUserStorageKey]);

  // Handle new appointments from payment completion
  // Handle new appointments from payment completion - FIXED
useEffect(() => {
  if (location.state?.newAppointment) {
    const newAppointmentData = location.state.newAppointment;
    
    // Check if appointment already exists to prevent duplicates
    const appointmentExists = appointments.some(apt => apt._id === newAppointmentData._id);
    
    if (!appointmentExists) {
      const newAppointment: Appointment = {
        ...newAppointmentData,
        status: 'upcoming' as const
      };
      
      const storageKey = getUserStorageKey('userAppointments');
      const existingAppointments = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // Check again in localStorage to be sure
      const existsInStorage = existingAppointments.some((apt: Appointment) => apt._id === newAppointmentData._id);
      
      if (!existsInStorage) {
        const updatedAppointments = [newAppointment, ...existingAppointments];
        localStorage.setItem(storageKey, JSON.stringify(updatedAppointments));
        
        setAppointments(prev => [newAppointment, ...prev]);
        
        const updatedMetrics = calculateHealthMetrics([newAppointment, ...appointments], userActivity.favoriteMedicines);
        
        setUserActivity(prev => ({
          ...prev,
          totalAppointments: prev.totalAppointments + 1,
          upcomingAppointments: prev.upcomingAppointments + 1,
          healthMetrics: updatedMetrics,
          lastActivity: new Date().toLocaleDateString()
        }));
        
        toast.success('Your appointment has been confirmed!');
      }
      
      window.history.replaceState({}, document.title);
    }
  }
}, [location.state, appointments, userActivity.favoriteMedicines, getUserStorageKey]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your health dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome back, {user.firstName}!</h1>
            <p className="text-muted-foreground mt-1">
              Here's your health overview for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAppointmentLinks(true)}
              className="relative"
            >
              <Headset className="h-4 w-4 mr-2" />
              Appointment Links
              {upcomingMeetingRooms.length > 0 && (
                <span className="absolute top-7 left-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {upcomingMeetingRooms.length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Appointment Links Dialog */}
        <Dialog open={showAppointmentLinks} onOpenChange={setShowAppointmentLinks}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Your Appointment Links</DialogTitle>
              <DialogDescription>
                Join your upcoming video consultations. Copy the room name and join when it's time.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {upcomingMeetingRooms.length > 0 ? (
                upcomingMeetingRooms.map((room, index) => (
                  <Card key={room.appointmentId} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">{index + 1}</span>
                          </div>
                          <h3 className="font-semibold text-lg">{room.doctorName}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {room.meetingTime}
                        </p>
                        
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-sm font-medium">Room:</span>
                          <code className="text-xs bg-muted px-2 py-1 rounded flex-1 font-mono">
                            {room.roomName}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(room.roomName)}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        
                        <Button
                          onClick={() => handleJoinMeeting(room.roomName)}
                          className="w-full"
                        >
                          <Video className="h-4 w-4 mr-2" />
                          Join Meeting
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <Headset className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No upcoming appointments</h3>
                  <p className="text-muted-foreground mb-4">
                    You don't have any upcoming video consultations.
                  </p>
                  <Button asChild>
                    <Link to="/doctors" onClick={() => setShowAppointmentLinks(false)}>
                      Book an Appointment
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="medicines">My Medicines</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Health Engagement Card */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-primary">Health Engagement</span>
                    </div>
                    <h3 className="text-3xl font-bold text-foreground mb-2">
                      {userActivity.healthMetrics.healthEngagement}%
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {getHealthEngagementMessage(userActivity.healthMetrics.healthEngagement)}
                    </p>
                    <div className="mt-4">
                      <Progress value={userActivity.healthMetrics.healthEngagement} className="h-2" />
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 md:ml-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{userActivity.healthMetrics.completedConsultations}</div>
                        <div className="text-muted-foreground">Consultations</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{userActivity.healthMetrics.totalMedicines}</div>
                        <div className="text-muted-foreground">Medicines</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Health Metrics */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Medicines Saved</CardTitle>
                  <Pill className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userActivity.healthMetrics.totalMedicines}</div>
                  <p className="text-xs text-muted-foreground">
                    From Herb Browser
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Consultations Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userActivity.healthMetrics.completedConsultations}</div>
                  <p className="text-xs text-muted-foreground">
                    Health consultations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
                  <ClockIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userActivity.healthMetrics.upcomingConsultations}</div>
                  <p className="text-xs text-muted-foreground">
                    Scheduled consultations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conditions Tracked</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userActivity.healthMetrics.conditionsTracked}</div>
                  <p className="text-xs text-muted-foreground">
                    Health conditions
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Appointments</CardTitle>
                  <CardDescription>Your latest health consultations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentAppointments.map(appointment => (
                    <div key={appointment._id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3 flex-1">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={getDoctorImage(appointment)} alt={getDoctorName(appointment)} />
                          <AvatarFallback>
                            {getDoctorInitials(appointment)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {getDoctorName(appointment)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(appointment.date)} at {formatTime(appointment.timeSlot.start)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {appointment.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={appointment.status === 'upcoming' ? 'default' : 'secondary'}>
                          {appointment.status}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteAppointment(appointment._id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {appointments.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">No appointments yet</p>
                      <Button asChild size="sm" className="mt-2">
                        <Link to="/doctors">Book Your First Consultation</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Medicines Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Recently Added Medicines</CardTitle>
                  <CardDescription>Medicines you've recently saved</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentMedicines.map(medicine => (
                    <div key={medicine._id} className="flex items-center space-x-3 p-3 rounded-lg border">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className={medicine.medicineType === 'allopathic' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}>
                          <Pill className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{medicine.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {medicine.medicineType === 'allopathic' ? 'Allopathic' : 'Ayurvedic'} • For {medicine.disease}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoveFromFavorites(medicine._id)}
                      >
                        <Heart className="h-4 w-4 text-red-500 fill-current" />
                      </Button>
                    </div>
                  ))}
                  {userActivity.favoriteMedicines.length === 0 && (
                    <div className="text-center py-8">
                      <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">No medicines saved yet</p>
                      <p className="text-xs text-muted-foreground mb-4">
                        Click on medicines in Herb Browser to add them to your collection
                      </p>
                      <div className="flex space-x-2 justify-center">
                        <Button asChild size="sm">
                          <Link to="/herbs">Explore Herb Browser</Link>
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleAddSampleMedicines}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Samples
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">My Appointments</h2>
                <p className="text-muted-foreground">
                  {appointments.length} total appointments • {upcomingAppointments.length} upcoming
                </p>
              </div>
              <Button asChild>
                <Link to="/doctors">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book New Appointment
                </Link>
              </Button>
            </div>

            {/* Upcoming Appointments */}
            {upcomingAppointments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Upcoming Appointments</h3>
                <div className="space-y-4">
                  {upcomingAppointments.map(appointment => (
                    <Card key={appointment._id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={getDoctorImage(appointment)} alt={getDoctorName(appointment)} />
                              <AvatarFallback>
                                {getDoctorInitials(appointment)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{getDoctorName(appointment)}</h4>
                              <p className="text-muted-foreground">{appointment.doctor.specialization}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4 text-primary" />
                                  <span>{formatDate(appointment.date)}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4 text-primary" />
                                  <span>{formatTime(appointment.timeSlot.start)} - {formatTime(appointment.timeSlot.end)}</span>
                                </div>
                                <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                                  Confirmed
                                </Badge>
                              </div>
                              {appointment.description && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  <strong>Reason:</strong> {appointment.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end space-y-2">
                            <div className="text-lg font-bold text-primary">₹{appointment.doctor.consultantFee}</div>
                            <div className="text-sm text-muted-foreground">Paid</div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteAppointment(appointment._id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              Cancel Appointment
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Appointments */}
            {completedAppointments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Completed Appointments</h3>
                <div className="space-y-4">
                  {completedAppointments.map(appointment => (
                    <Card key={appointment._id} className="hover:shadow-lg transition-shadow border-muted">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={getDoctorImage(appointment)} alt={getDoctorName(appointment)} />
                              <AvatarFallback>
                                {getDoctorInitials(appointment)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{getDoctorName(appointment)}</h4>
                              <p className="text-muted-foreground">{appointment.doctor.specialization}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span>{formatDate(appointment.date)}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span>{formatTime(appointment.timeSlot.start)} - {formatTime(appointment.timeSlot.end)}</span>
                                </div>
                                <Badge variant="secondary">Completed</Badge>
                              </div>
                              {appointment.description && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  <strong>Reason:</strong> {appointment.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end space-y-2">
                            <div className="text-lg font-bold text-muted-foreground">₹{appointment.doctor.consultantFee}</div>
                            <div className="text-sm text-muted-foreground">Paid</div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteAppointment(appointment._id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              Delete Record
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* No Appointments State */}
            {appointments.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No appointments yet</h3>
                <p className="text-muted-foreground mb-4">
                  Book your first consultation with our expert doctors
                </p>
                <Button asChild size="lg">
                  <Link to="/doctors">Find a Doctor</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* My Medicines Tab */}
          <TabsContent value="medicines" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">My Medicines</h2>
                <p className="text-muted-foreground">
                  {userActivity.favoriteMedicines.length} saved medicines • From Herb Browser
                </p>
              </div>
              <Button asChild>
                <Link to="/herbs">
                  <Plus className="h-4 w-4 mr-2" />
                  Add More from Herb Browser
                </Link>
              </Button>
            </div>

            {userActivity.favoriteMedicines.length > 0 ? (
              <div className="space-y-4">
                {userActivity.favoriteMedicines.map(medicine => (
                  <Card key={medicine._id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-full ${medicine.medicineType === 'allopathic' ? 'bg-blue-100' : 'bg-green-100'}`}>
                            <Pill className={`h-6 w-6 ${medicine.medicineType === 'allopathic' ? 'text-blue-600' : 'text-green-600'}`} />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{medicine.name}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant={medicine.medicineType === 'allopathic' ? 'default' : 'secondary'}>
                                {medicine.medicineType === 'allopathic' ? 'Allopathic' : 'Ayurvedic'}
                              </Badge>
                              <span className="text-sm text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground">For {medicine.disease}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Added on {new Date(medicine.addedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemoveFromFavorites(medicine._id)}
                        >
                          <Heart className="h-5 w-5 text-red-500 fill-current" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Pill className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No medicines saved yet</h3>
                <p className="text-muted-foreground mb-4">
                  Visit the Herb Browser and click on medicines to add them to your collection
                </p>
                <div className="flex space-x-4 justify-center">
                  <Button asChild size="lg">
                    <Link to="/herbs">Go to Herb Browser</Link>
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleAddSampleMedicines}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Sample Medicines
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">My Profile</h2>
                <p className="text-muted-foreground">
                  Manage your personal information and account settings
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  💡 Address, Medical History & Emergency Contact are saved locally on this device only
                </p>
              </div>
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleUpdateProfile}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Personal Information */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>
                      Your basic profile details (saved to your account)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">First Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            className="w-full p-2 border rounded-md"
                          />
                        ) : (
                          <p className="text-foreground">{userProfile?.firstName}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Last Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            className="w-full p-2 border rounded-md"
                          />
                        ) : (
                          <p className="text-foreground">{userProfile?.lastName}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Email</label>
                        <p className="text-foreground">{userProfile?.email}</p>
                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Phone</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.contactNumber}
                            onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                            className="w-full p-2 border rounded-md"
                          />
                        ) : (
                          <p className="text-foreground">{userProfile?.contactNumber}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Date of Birth</label>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editForm.dateOfBirth}
                            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                            className="w-full p-2 border rounded-md"
                          />
                        ) : (
                          <p className="text-foreground">
                            {userProfile?.dateOfBirth ? new Date(userProfile.dateOfBirth).toLocaleDateString() : 'Not set'}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Gender</label>
                        {isEditing ? (
                          <select
                            value={editForm.gender}
                            onChange={(e) => handleInputChange('gender', e.target.value)}
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        ) : (
                          <p className="text-foreground">{userProfile?.gender || 'Not set'}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Blood Group</label>
                        {isEditing ? (
                          <select
                            value={editForm.bloodGroup}
                            onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="">Select Blood Group</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                          </select>
                        ) : (
                          <p className="text-foreground">{userProfile?.bloodGroup || 'Not set'}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Address Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Address Information
                    </CardTitle>
                    <CardDescription>
                      Your current address details (saved locally on this device only)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Street Address</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.address.street}
                          onChange={(e) => handleNestedChange('address', 'street', e.target.value)}
                          className="w-full p-2 border rounded-md"
                        />
                      ) : (
                        <p className="text-foreground">{userProfile?.address?.street || 'Not set'}</p>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">City</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.address.city}
                            onChange={(e) => handleNestedChange('address', 'city', e.target.value)}
                            className="w-full p-2 border rounded-md"
                          />
                        ) : (
                          <p className="text-foreground">{userProfile?.address?.city || 'Not set'}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">State</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.address.state}
                            onChange={(e) => handleNestedChange('address', 'state', e.target.value)}
                            className="w-full p-2 border rounded-md"
                          />
                        ) : (
                          <p className="text-foreground">{userProfile?.address?.state || 'Not set'}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">ZIP Code</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.address.zipCode}
                            onChange={(e) => handleNestedChange('address', 'zipCode', e.target.value)}
                            className="w-full p-2 border rounded-md"
                          />
                        ) : (
                          <p className="text-foreground">{userProfile?.address?.zipCode || 'Not set'}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Country</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.address.country}
                            onChange={(e) => handleNestedChange('address', 'country', e.target.value)}
                            className="w-full p-2 border rounded-md"
                          />
                        ) : (
                          <p className="text-foreground">{userProfile?.address?.country || 'Not set'}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Medical History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Medical History
                    </CardTitle>
                    <CardDescription>
                      Your medical background information (saved locally on this device only)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Allergies */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Allergies</label>
                      {isEditing ? (
                        <div className="space-y-2">
                          {editForm.medicalHistory.allergies.map((allergy, index) => (
                            <div key={index} className="flex space-x-2">
                              <input
                                type="text"
                                value={allergy}
                                onChange={(e) => handleArrayChange('medicalHistory.allergies', index, e.target.value)}
                                className="flex-1 p-2 border rounded-md"
                                placeholder="Enter allergy"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveArrayItem('medicalHistory.allergies', index)}
                                disabled={editForm.medicalHistory.allergies.length === 1}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddArrayItem('medicalHistory.allergies')}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Allergy
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {userProfile?.medicalHistory?.allergies?.filter(a => a).map((allergy, index) => (
                            <Badge key={index} variant="secondary">
                              {allergy}
                            </Badge>
                          )) || <p className="text-muted-foreground">No allergies recorded</p>}
                        </div>
                      )}
                    </div>

                    {/* Chronic Conditions */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Chronic Conditions</label>
                      {isEditing ? (
                        <div className="space-y-2">
                          {editForm.medicalHistory.chronicConditions.map((condition, index) => (
                            <div key={index} className="flex space-x-2">
                              <input
                                type="text"
                                value={condition}
                                onChange={(e) => handleArrayChange('medicalHistory.chronicConditions', index, e.target.value)}
                                className="flex-1 p-2 border rounded-md"
                                placeholder="Enter condition"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveArrayItem('medicalHistory.chronicConditions', index)}
                                disabled={editForm.medicalHistory.chronicConditions.length === 1}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddArrayItem('medicalHistory.chronicConditions')}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Condition
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {userProfile?.medicalHistory?.chronicConditions?.filter(c => c).map((condition, index) => (
                            <Badge key={index} variant="secondary">
                              {condition}
                            </Badge>
                          )) || <p className="text-muted-foreground">No chronic conditions recorded</p>}
                        </div>
                      )}
                    </div>

                    {/* Current Medications */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Current Medications</label>
                      {isEditing ? (
                        <div className="space-y-2">
                          {editForm.medicalHistory.currentMedications.map((medication, index) => (
                            <div key={index} className="flex space-x-2">
                              <input
                                type="text"
                                value={medication}
                                onChange={(e) => handleArrayChange('medicalHistory.currentMedications', index, e.target.value)}
                                className="flex-1 p-2 border rounded-md"
                                placeholder="Enter medication"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveArrayItem('medicalHistory.currentMedications', index)}
                                disabled={editForm.medicalHistory.currentMedications.length === 1}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddArrayItem('medicalHistory.currentMedications')}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Medication
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {userProfile?.medicalHistory?.currentMedications?.filter(m => m).map((medication, index) => (
                            <Badge key={index} variant="secondary">
                              {medication}
                            </Badge>
                          )) || <p className="text-muted-foreground">No current medications</p>}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Emergency Contact */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Phone className="h-5 w-5 mr-2" />
                      Emergency Contact
                    </CardTitle>
                    <CardDescription>
                      Emergency contact information (saved locally on this device only)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.emergencyContact.name}
                          onChange={(e) => handleNestedChange('emergencyContact', 'name', e.target.value)}
                          className="w-full p-2 border rounded-md"
                        />
                      ) : (
                        <p className="text-foreground">{userProfile?.emergencyContact?.name || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Relationship</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.emergencyContact.relationship}
                          onChange={(e) => handleNestedChange('emergencyContact', 'relationship', e.target.value)}
                          className="w-full p-2 border rounded-md"
                        />
                      ) : (
                        <p className="text-foreground">{userProfile?.emergencyContact?.relationship || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Phone</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.emergencyContact.phone}
                          onChange={(e) => handleNestedChange('emergencyContact', 'phone', e.target.value)}
                          className="w-full p-2 border rounded-md"
                        />
                      ) : (
                        <p className="text-foreground">{userProfile?.emergencyContact?.phone || 'Not set'}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Profile Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-16 h-16">
                        <AvatarFallback className="text-lg">
                          {userProfile?.firstName?.[0]}{userProfile?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{userProfile?.firstName} {userProfile?.lastName}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{user?.accountType?.toLowerCase()}</p>
                        <p className="text-xs text-muted-foreground">
                          Member since {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Appointments</span>
                        <span className="text-sm font-medium">{userActivity.totalAppointments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Medicines Saved</span>
                        <span className="text-sm font-medium">{userActivity.healthMetrics.totalMedicines}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Health Score</span>
                        <span className="text-sm font-medium">{userActivity.healthMetrics.healthEngagement}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Doctor Profile (if user is a doctor) */}
                {user?.accountType === 'Doctor' && doctorProfile && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Stethoscope className="h-4 w-4 mr-2" />
                        Professional Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Specialization</label>
                        <p className="text-foreground">{doctorProfile.specialization}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Experience</label>
                        <p className="text-foreground">{doctorProfile.experience} years</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Consultation Fee</label>
                        <p className="text-foreground">₹{doctorProfile.consultantFee}</p>
                      </div>
                      {doctorProfile.degrees && (
                        <div>
                          <label className="text-sm font-medium mb-1 block">Degrees</label>
                          <p className="text-foreground">{doctorProfile.degrees}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Account Actions */}
                <Card>
                  <CardHeader>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" onClick={logout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};