import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, Calendar, Filter, Heart, Award, Clock, Video, MessageSquare, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '../../App';
import axios from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = 'https://ayursamhita-backend.onrender.com/api/v1';

// Types based on your API response
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  image: string;
  bloodGroup?: string;
  dateOfBirth?: string;
  gender?: string;
  accountType: string;
}

interface Doctor {
  _id: string;
  user: User | null; // Allow user to be null
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
  images: string[];
  doctorType?: 'homeopathic' | 'allopathic'; // Classified on frontend
}

interface ApiResponse {
  success: boolean;
  message: string;
  doctors: Doctor[];
}

// Collaboration Dialog Component
const CollaborationDialog: React.FC<{ doctor: Doctor; children: React.ReactNode }> = ({ doctor, children }) => {
  const [open, setOpen] = useState(false);

  const handleCollaborationRequest = () => {
    // In a real app, this would make an API call to send collaboration request
    toast.success('Collaboration request sent to the doctor!');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Collaboration</DialogTitle>
          <DialogDescription>
            Send a collaboration request to Dr. {doctor.user ? `${doctor.user.firstName} ${doctor.user.lastName}` : 'Unknown'}?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will notify the doctor that you're interested in collaborating on patient cases.
          </p>
          <div className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCollaborationRequest}>
              <Users className="h-4 w-4 mr-2" />
              Send Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Doctor Detail Modal Component
const DoctorDetailModal: React.FC<{ doctor: Doctor; children: React.ReactNode }> = ({ doctor, children }) => {
  const navigate = useNavigate();

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Not specified';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const getAvailableSlots = () => {
    const start = doctor.availableTimeSlot?.start || "09:00";
    const end = doctor.availableTimeSlot?.end || "17:00";
    return [`${formatTime(start)}`, `${formatTime(end)}`];
  };

  const calculateYearsOfExperience = (experience: number) => {
    return experience;
  };

  // Safe user data access
  const doctorName = doctor.user ? `${doctor.user.firstName} ${doctor.user.lastName}` : 'Unknown Doctor';
  const userGender = doctor.user?.gender || 'Not specified';
  const userBloodGroup = doctor.user?.bloodGroup || 'Not specified';
  const userContact = doctor.user?.contactNumber || 'Not specified';
  const userImage = doctor.user?.image;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={userImage} alt={doctorName} />
              <AvatarFallback>
                {doctor.user ? `${doctor.user.firstName[0]}${doctor.user.lastName[0]}` : 'DR'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-2xl">Dr. {doctorName}</DialogTitle>
              <DialogDescription className="text-lg">
                {doctor.specialization}
              </DialogDescription>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span>4.8</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Award className="h-4 w-4 text-primary" />
                  <span>{calculateYearsOfExperience(doctor.experience)}+ years</span>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">About Dr. {doctor.user?.lastName || 'Unknown'}</h4>
              <p className="text-muted-foreground">
                Dr. {doctorName} is a specialized medical professional with {calculateYearsOfExperience(doctor.experience)} years of experience in {doctor.specialization?.split(' - ')[0] || 'medicine'}.
                {userGender === 'Female' ? ' She' : ' He'} provides comprehensive healthcare services with a patient-centered approach.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Specializations</h4>
                <div className="flex flex-wrap gap-2">
                  {doctor.specialization?.split(', ').map((spec: string, index: number) => (
                    <Badge key={index} variant="secondary">{spec.trim()}</Badge>
                  )) || <Badge variant="secondary">General Medicine</Badge>}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Personal Details</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Gender:</strong> {userGender}</div>
                  <div><strong>Blood Group:</strong> {userBloodGroup}</div>
                  <div><strong>Contact:</strong> {userContact}</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Certifications</h4>
              <div className="space-y-2">
                {doctor.certification ? (
                  doctor.certification.split('\n').map((cert: string, index: number) => (
                    cert.trim() && (
                      <div key={index} className="flex items-start space-x-2">
                        <Award className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                        <span>{cert.trim()}</span>
                      </div>
                    )
                  ))
                ) : (
                  <p className="text-muted-foreground">Certification details not available</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="education" className="space-y-4">
            <div>
              <h4 className="font-semibold mb-3">Educational Background</h4>
              <div className="space-y-3">
                {doctor.degrees ? (
                  doctor.degrees.split(',').map((degree: string, index: number) => (
                    <div key={index} className="border-l-2 border-primary pl-4">
                      <p className="font-medium">{degree.trim()}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Education details not available</p>
                )}
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Award className="h-5 w-5 text-primary" />
                <span className="font-medium">Professional Experience</span>
              </div>
              <p>{calculateYearsOfExperience(doctor.experience)}+ years of practice in {doctor.specialization?.split(' - ')[0] || 'medicine'}</p>
            </div>
          </TabsContent>

          <TabsContent value="availability" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Available Days & Time</h4>
                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium mb-2">Available Days:</h5>
                    <div className="flex flex-wrap gap-2">
                      {doctor.availableDays && doctor.availableDays.length > 0 ? (
                        doctor.availableDays.map((day: string, index: number) => (
                          <Badge key={index} variant="outline">{day}</Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">Not specified</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Available Time:</h5>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-green-500" />
                      <span>
                        {doctor.availableTimeSlot ?
                          `${formatTime(doctor.availableTimeSlot.start)} - ${formatTime(doctor.availableTimeSlot.end)}` :
                          'Not specified'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Consultation Options</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span>In-person consultation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Video className="h-4 w-4 text-primary" />
                      <span>Video consultation available</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Consultation Fee</h4>
                  <span className="text-2xl font-bold text-primary">₹{doctor.consultantFee}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={() => navigate(`/appointment/${doctor._id}`)}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                size="lg"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Book Appointment
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

// Main Doctor Search Component
export const DoctorSearch: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All Specializations');
  const [sortBy, setSortBy] = useState('experience');
  const [showVideoOnly, setShowVideoOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedDoctorType, setSelectedDoctorType] = useState<'all' | 'homeopathic' | 'allopathic'>('all');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch doctors from API
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const response = await axios.get<ApiResponse>(`${API_BASE_URL}/user/doctors`, {
          withCredentials: true
        });

        if (response.data.success) {
          // Filter out doctors with null user data and ensure all fields are present
          const validDoctors = response.data.doctors
            .filter(doctor => doctor.user) // Remove doctors without user
            .map((doctor, index) => ({ // Add default values
              ...doctor,
              specialization: doctor.specialization || 'General Medicine',
              experience: doctor.experience || 0,
              consultantFee: doctor.consultantFee || 500,
              degrees: doctor.degrees || 'Medical Degree',
              certification: doctor.certification || '',
              availableDays: doctor.availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
              availableTimeSlot: doctor.availableTimeSlot || { start: '09:00', end: '17:00' },
              doctorType: (index < 7 ? 'homeopathic' : 'allopathic') as 'homeopathic' | 'allopathic'
            }));

          setDoctors(validDoctors);
        } else {
          throw new Error(response.data.message || 'Failed to fetch doctors');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Extract specializations from doctors data
  const specializations = useMemo(() => {
    const specs = new Set<string>(['All Specializations']);
    doctors.forEach(doctor => {
      if (doctor.specialization) {
        const mainSpecialization = doctor.specialization.split(' - ')[0];
        specs.add(mainSpecialization);
      }
    });
    return Array.from(specs);
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    let filtered = doctors.filter(doctor => {
      // Skip doctors with null user
      if (!doctor.user) return false;

      const doctorName = `${doctor.user.firstName || ''} ${doctor.user.lastName || ''}`.toLowerCase();
      const matchesSearch = doctorName.includes(searchTerm.toLowerCase()) ||
        (doctor.specialization?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (doctor.degrees?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      const matchesSpecialization = selectedSpecialization === 'All Specializations' ||
        (doctor.specialization?.includes(selectedSpecialization) || false);

      // Filter by doctor type
      const matchesType = selectedDoctorType === 'all' || doctor.doctorType === selectedDoctorType;

      return matchesSearch && matchesSpecialization && matchesType;
    });

    // Sort doctors with null checks
    filtered.sort((a, b) => {
      // Handle cases where user might be null
      const aName = a.user ? `${a.user.firstName} ${a.user.lastName}` : '';
      const bName = b.user ? `${b.user.firstName} ${b.user.lastName}` : '';

      switch (sortBy) {
        case 'experience':
          return (b.experience || 0) - (a.experience || 0);
        case 'fee':
          return (a.consultantFee || 0) - (b.consultantFee || 0);
        case 'name':
          return aName.localeCompare(bName);
        case 'rating':
        default:
          return 0;
      }
    });

    return filtered;
  }, [doctors, searchTerm, selectedSpecialization, sortBy, showVideoOnly, selectedDoctorType]);

  const toggleFavorite = (doctorId: string) => {
    setFavorites(prev =>
      prev.includes(doctorId)
        ? prev.filter(id => id !== doctorId)
        : [...prev, doctorId]
    );
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="ayur-page-dark" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}>
          <div className="ayur-spinner"></div>
          <p style={{ color:'rgba(191,219,254,0.55)', fontFamily:"'DM Sans',sans-serif" }}>Loading doctors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ayur-page-dark" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:56, marginBottom:16 }}>⚠️</div>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:20, color:'#eff6ff', marginBottom:8 }}>Error loading doctors</h3>
          <p style={{ color:'rgba(191,219,254,0.55)', marginBottom:20 }}>{error}</p>
          <button className="ayur-btn-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ayur-page-dark" style={{ paddingTop:8, paddingBottom:40 }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', position:'relative', zIndex:1 }}>
        {/* Header */}
        <div className="ayur-section-header">
          <span className="ayur-pill">👨‍⚕️ Expert Practitioners</span>
          <h1>Find <em>Medical</em> Practitioners</h1>
          <p>
            Connect with certified medical practitioners for personalized consultations.
            Book appointments and get expert guidance for your healthcare needs.
          </p>
        </div>

        {/* Doctor Type Selector */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:32 }}>
          {/* All Doctors */}
          <button
            onClick={() => setSelectedDoctorType('all')}
            style={{
              padding:'20px 16px', borderRadius:20, cursor:'pointer', transition:'all 0.3s',
              background: selectedDoctorType === 'all' ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
              border: selectedDoctorType === 'all' ? '2px solid rgba(96,165,250,0.5)' : '1px solid rgba(96,165,250,0.15)',
              display:'flex', flexDirection:'column' as const, alignItems:'center', gap:10,
              transform: selectedDoctorType === 'all' ? 'translateY(-2px)' : 'none',
              boxShadow: selectedDoctorType === 'all' ? '0 8px 24px rgba(96,165,250,0.2)' : 'none'
            }}
          >
            <span style={{ fontSize:32 }}>👨‍⚕️</span>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15,
              color: selectedDoctorType === 'all' ? '#93c5fd' : '#bfdbfe' }}>All Doctors</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:'rgba(191,219,254,0.5)' }}>
              {doctors.length} doctors available
            </span>
          </button>

          {/* Homeopathic */}
          <button
            onClick={() => setSelectedDoctorType('homeopathic')}
            style={{
              padding:'20px 16px', borderRadius:20, cursor:'pointer', transition:'all 0.3s',
              background: selectedDoctorType === 'homeopathic'
                ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.08))'
                : 'rgba(255,255,255,0.04)',
              border: selectedDoctorType === 'homeopathic' ? '2px solid rgba(34,197,94,0.5)' : '1px solid rgba(96,165,250,0.15)',
              display:'flex', flexDirection:'column' as const, alignItems:'center', gap:10,
              transform: selectedDoctorType === 'homeopathic' ? 'translateY(-2px)' : 'none',
              boxShadow: selectedDoctorType === 'homeopathic' ? '0 8px 24px rgba(34,197,94,0.2)' : 'none'
            }}
          >
            <span style={{ fontSize:32 }}>🌿</span>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15,
              color: selectedDoctorType === 'homeopathic' ? '#4ade80' : '#bfdbfe' }}>Homeopathic</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:'rgba(191,219,254,0.5)' }}>
              {doctors.filter(d => d.doctorType === 'homeopathic').length} doctors • Natural healing
            </span>
          </button>

          {/* Allopathic */}
          <button
            onClick={() => setSelectedDoctorType('allopathic')}
            style={{
              padding:'20px 16px', borderRadius:20, cursor:'pointer', transition:'all 0.3s',
              background: selectedDoctorType === 'allopathic'
                ? 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.08))'
                : 'rgba(255,255,255,0.04)',
              border: selectedDoctorType === 'allopathic' ? '2px solid rgba(59,130,246,0.5)' : '1px solid rgba(96,165,250,0.15)',
              display:'flex', flexDirection:'column' as const, alignItems:'center', gap:10,
              transform: selectedDoctorType === 'allopathic' ? 'translateY(-2px)' : 'none',
              boxShadow: selectedDoctorType === 'allopathic' ? '0 8px 24px rgba(59,130,246,0.2)' : 'none'
            }}
          >
            <span style={{ fontSize:32 }}>💊</span>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15,
              color: selectedDoctorType === 'allopathic' ? '#60a5fa' : '#bfdbfe' }}>Allopathic</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:'rgba(191,219,254,0.5)' }}>
              {doctors.filter(d => d.doctorType === 'allopathic').length} doctors • Modern medicine
            </span>
          </button>
        </div>

        {/* Search and Filter Section */}
        <div className="ayur-glass-card" style={{ padding:24, marginBottom:32 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:12, marginBottom:16, alignItems:'center' }}>
            {/* Search */}
            <div style={{ position:'relative' }}>
              <Search size={16} color="#60a5fa" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
              <input
                placeholder="Search doctors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width:'100%', padding:'12px 14px 12px 40px', background:'rgba(255,255,255,0.06)',
                  border:'1px solid rgba(96,165,250,0.2)', borderRadius:14, color:'#eff6ff',
                  fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:'none', boxSizing:'border-box' }}
                onFocus={e => e.target.style.borderColor='rgba(96,165,250,0.5)'}
                onBlur={e => e.target.style.borderColor='rgba(96,165,250,0.2)'}
              />
            </div>

            {/* Specialization */}
            <select
              value={selectedSpecialization}
              onChange={e => setSelectedSpecialization(e.target.value)}
              style={{ width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.06)',
                border:'1px solid rgba(96,165,250,0.2)', borderRadius:14, color:'#bfdbfe',
                fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:'none', cursor:'pointer',
                boxSizing:'border-box' }}
            >
              {specializations.map(spec => (
                <option key={spec} value={spec} style={{ background:'#0b1d3a', color:'#eff6ff' }}>{spec}</option>
              ))}
            </select>

            {/* Sort by */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.06)',
                border:'1px solid rgba(96,165,250,0.2)', borderRadius:14, color:'#bfdbfe',
                fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:'none', cursor:'pointer',
                boxSizing:'border-box' }}
            >
              <option value="experience" style={{ background:'#0b1d3a' }}>Experience</option>
              <option value="fee" style={{ background:'#0b1d3a' }}>Consultation Fee</option>
              <option value="name" style={{ background:'#0b1d3a' }}>Name</option>
              <option value="rating" style={{ background:'#0b1d3a' }}>Rating</option>
            </select>

            {/* Video toggle */}
            <button
              onClick={() => setShowVideoOnly(!showVideoOnly)}
              style={{ padding:'12px 18px', borderRadius:14, border:'1px solid rgba(96,165,250,0.25)',
                background: showVideoOnly ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.06)',
                color: showVideoOnly ? '#93c5fd' : '#bfdbfe',
                fontFamily:"'DM Sans',sans-serif", fontSize:14, cursor:'pointer',
                display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap',
                transition:'all 0.2s' }}
            >
              <Video size={16} />
              {showVideoOnly ? 'Video Only' : 'All Types'}
            </button>
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'rgba(191,219,254,0.5)' }}>
            <span>Showing <strong style={{ color:'#93c5fd' }}>{filteredDoctors.length}</strong> doctors</span>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <Filter size={14} />
              <span>Filters applied: {[selectedSpecialization].filter(f => !f.includes('All')).length + (showVideoOnly ? 1 : 0)}</span>
            </div>
          </div>
        </div>

        {/* Doctors Grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:24 }}>
          {filteredDoctors.map(doctor => {
            if (!doctor.user) return null;
            const doctorName = `${doctor.user.firstName} ${doctor.user.lastName}`;
            const mainSpecialization = doctor.specialization?.split(' - ')[0] || 'General Medicine';
            const subSpecializations = doctor.specialization?.split(' - ')[1]?.split(', ') || [];
            const isFav = favorites.includes(doctor._id);

            const cardStyle: React.CSSProperties = {
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(96,165,250,0.15)',
              borderRadius: 20,
              padding: 24,
              transition: 'all 0.3s',
              cursor: 'default',
            };

            return (
              <div key={doctor._id} style={cardStyle}
                onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(96,165,250,0.35)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(96,165,250,0.15)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
              >
                {/* Header */}
                <div style={{ display:'flex', gap:16, marginBottom:16, alignItems:'flex-start' }}>
                  <div style={{ width:60, height:60, borderRadius:'50%', overflow:'hidden', flexShrink:0,
                    background:'rgba(96,165,250,0.15)', border:'2px solid rgba(96,165,250,0.25)',
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {doctor.user.image
                      ? <img src={doctor.user.image} alt={doctorName} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:20, color:'#60a5fa' }}>
                          {doctor.user.firstName[0]}{doctor.user.lastName[0]}
                        </span>
                    }
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16, color:'#eff6ff', margin:'0 0 4px' }}>
                      Dr. {doctorName}
                    </h3>
                    <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'rgba(191,219,254,0.55)', margin:'0 0 6px' }}>
                      {doctor.experience}+ years experience
                    </p>
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <Star size={13} color="#fbbf24" fill="#fbbf24" />
                      <span style={{ fontSize:13, color:'#fbbf24', fontWeight:600 }}>4.8</span>
                    </div>
                  </div>
                  <button onClick={() => toggleFavorite(doctor._id)}
                    style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
                    <Heart size={18} color={isFav ? '#ef4444' : 'rgba(191,219,254,0.4)'}
                      fill={isFav ? '#ef4444' : 'none'} />
                  </button>
                </div>

                {/* Doctor Type & Specialization badges */}
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
                  {/* Doctor type badge */}
                  <span style={{ padding:'3px 10px', borderRadius:20,
                    background: doctor.doctorType === 'homeopathic' ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)',
                    color: doctor.doctorType === 'homeopathic' ? '#4ade80' : '#60a5fa',
                    fontSize:11, fontWeight:700, fontFamily:"'DM Sans',sans-serif",
                    display:'flex', alignItems:'center', gap:4 }}>
                    {doctor.doctorType === 'homeopathic' ? '🌿' : '💊'}
                    {doctor.doctorType === 'homeopathic' ? 'Homeopathic' : 'Allopathic'}
                  </span>
                  <span style={{ padding:'3px 10px', borderRadius:20, background:'rgba(37,99,235,0.25)',
                    color:'#93c5fd', fontSize:11, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
                    {mainSpecialization}
                  </span>
                  {subSpecializations.slice(0, 2).map((spec: string, i: number) => (
                    <span key={i} style={{ padding:'3px 10px', borderRadius:20,
                      border:'1px solid rgba(96,165,250,0.2)', color:'rgba(191,219,254,0.6)',
                      fontSize:11, fontFamily:"'DM Sans',sans-serif" }}>
                      {spec.trim()}
                    </span>
                  ))}
                  {subSpecializations.length > 2 && (
                    <span style={{ padding:'3px 10px', borderRadius:20,
                      border:'1px solid rgba(96,165,250,0.2)', color:'rgba(191,219,254,0.5)',
                      fontSize:11, fontFamily:"'DM Sans',sans-serif" }}>
                      +{subSpecializations.length - 2} more
                    </span>
                  )}
                </div>

                {/* Degree */}
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10,
                  color:'rgba(191,219,254,0.5)', fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>
                  <Award size={14} />
                  <span>{doctor.degrees?.split(',')[0] || 'Medical Professional'}</span>
                </div>

                {/* Time & Fee */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                  marginBottom:14, fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, color:'#34d399' }}>
                    <Clock size={14} />
                    <span>{doctor.availableTimeSlot
                      ? `${formatTime(doctor.availableTimeSlot.start)}-${formatTime(doctor.availableTimeSlot.end)}`
                      : 'Check availability'}</span>
                  </div>
                  <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, color:'#60a5fa' }}>
                    ₹{doctor.consultantFee}
                  </span>
                </div>

                {/* Consult types */}
                <div style={{ display:'flex', gap:12, marginBottom:16,
                  fontSize:12, color:'rgba(191,219,254,0.45)', fontFamily:"'DM Sans',sans-serif" }}>
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}><Video size={12} /> Video</span>
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}><MessageSquare size={12} /> In-person</span>
                  <span>• {doctor.availableDays?.slice(0, 2).join(', ') || 'Mon-Fri'}</span>
                </div>

                {/* Action buttons */}
                <div style={{ display:'flex', gap:10 }}>
                  <DoctorDetailModal doctor={doctor}>
                    <button style={{ flex:1, padding:'10px 0', borderRadius:14,
                      border:'1px solid rgba(96,165,250,0.25)', background:'rgba(96,165,250,0.08)',
                      color:'#93c5fd', fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                      fontSize:13, cursor:'pointer', transition:'all 0.2s' }}
                      onMouseOver={e => { e.currentTarget.style.background='rgba(96,165,250,0.15)'; }}
                      onMouseOut={e => { e.currentTarget.style.background='rgba(96,165,250,0.08)'; }}
                    >
                      View Profile
                    </button>
                  </DoctorDetailModal>
                  <button
                    onClick={() => navigate(`/appointment/${doctor._id}`)}
                    style={{ flex:1, padding:'10px 0', borderRadius:14,
                      background:'linear-gradient(135deg,#2563eb,#3b82f6)', color:'#fff',
                      fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13,
                      border:'none', cursor:'pointer', transition:'all 0.2s',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
                    onMouseOver={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(37,99,235,0.4)'; }}
                    onMouseOut={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}
                  >
                    <Calendar size={14} /> Book Now
                  </button>
                </div>

                {/* Collaboration */}
                {user?.accountType === 'Doctor' && user.id !== doctor.user._id && (
                  <CollaborationDialog doctor={doctor}>
                    <button style={{ width:'100%', marginTop:10, padding:'9px 0', borderRadius:14,
                      border:'1px solid rgba(96,165,250,0.2)', background:'rgba(96,165,250,0.06)',
                      color:'rgba(191,219,254,0.6)', fontFamily:"'DM Sans',sans-serif",
                      fontSize:13, cursor:'pointer', display:'flex', alignItems:'center',
                      justifyContent:'center', gap:6 }}>
                      <Users size={14} /> Collaboration
                    </button>
                  </CollaborationDialog>
                )}
              </div>
            );
          })}
        </div>

        {filteredDoctors.length === 0 && (
          <div style={{ textAlign:'center', padding:'64px 24px' }}>
            <div style={{ fontSize:56, marginBottom:16 }}>👨‍⚕️</div>
            <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:20, color:'#eff6ff', marginBottom:8 }}>No doctors found</h3>
            <p style={{ fontFamily:"'DM Sans',sans-serif", color:'rgba(191,219,254,0.5)', marginBottom:20 }}>
              Try adjusting your search criteria or browse all doctors
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSpecialization('All Specializations');
                setShowVideoOnly(false);
              }}
              style={{ padding:'10px 28px', borderRadius:20, border:'none',
                background:'linear-gradient(135deg,#2563eb,#3b82f6)', color:'#fff',
                fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, cursor:'pointer' }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};