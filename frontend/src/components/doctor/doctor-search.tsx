import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, Calendar, Filter, Heart, Award, Clock, Video, MessageSquare } from 'lucide-react';
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

const API_BASE_URL = 'http://localhost:8002/api/v1';

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
}

interface ApiResponse {
  success: boolean;
  message: string;
  doctors: Doctor[];
}

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
          setDoctors(response.data.doctors);
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

      return matchesSearch && matchesSpecialization;
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
  }, [doctors, searchTerm, selectedSpecialization, sortBy, showVideoOnly]);

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
      <div className="min-h-screen bg-background py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading doctors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2">Error loading doctors</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Find Medical Practitioners
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Connect with certified medical practitioners for personalized consultations. 
            Book appointments and get expert guidance for your healthcare needs.
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-card p-6 rounded-lg shadow-lg mb-8">
          <div className="grid md:grid-cols-4 gap-4 mb-4 items-center ">
            <div className="md:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search doctors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
              <SelectTrigger>
                <SelectValue placeholder="Select specialization" />
              </SelectTrigger>
              <SelectContent>
                {specializations.map(spec => (
                  <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="experience">Experience</SelectItem>
                <SelectItem value="fee">Consultation Fee</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant={showVideoOnly ? "default" : "outline"} 
              onClick={() => setShowVideoOnly(!showVideoOnly)}
              className="flex items-center space-x-2"
            >
              <Video className="h-4 w-4" />
              <span>{showVideoOnly ? 'Video Only' : 'All Types'}</span>
            </Button>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing {filteredDoctors.length} doctors</span>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filters applied: {[selectedSpecialization].filter(f => !f.includes('All')).length + (showVideoOnly ? 1 : 0)}</span>
            </div>
          </div>
        </div>

        {/* Doctors Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map(doctor => {
            // Skip rendering if user is null
            if (!doctor.user) return null;
            
            const doctorName = `${doctor.user.firstName} ${doctor.user.lastName}`;
            const mainSpecialization = doctor.specialization?.split(' - ')[0] || 'General Medicine';
            const subSpecializations = doctor.specialization?.split(' - ')[1]?.split(', ') || [];

            return (
              <Card key={doctor._id} className="hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="relative">
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={doctor.user.image} alt={doctorName} />
                      <AvatarFallback>
                        {doctor.user.firstName[0]}{doctor.user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">Dr. {doctorName}</CardTitle>
                      <CardDescription>{doctor.experience}+ years experience</CardDescription>
                      <div className="flex items-center space-x-1 mt-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm">4.8</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(doctor._id)}
                    >
                      <Heart 
                        className={`h-4 w-4 ${favorites.includes(doctor._id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
                      />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {mainSpecialization}
                      </Badge>
                      {subSpecializations.slice(0, 2).map((spec: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {spec.trim()}
                        </Badge>
                      ))}
                      {subSpecializations.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{subSpecializations.length - 2} more
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                      <Award className="h-4 w-4" />
                      <span>{doctor.degrees?.split(',')[0] || 'Medical Professional'}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-green-500" />
                        <span className="text-green-600">
                          {doctor.availableTimeSlot ? 
                            `${formatTime(doctor.availableTimeSlot.start)}-${formatTime(doctor.availableTimeSlot.end)}` : 
                            'Check availability'
                          }
                        </span>
                      </div>
                      <span className="font-bold text-primary">₹{doctor.consultantFee}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Video className="h-3 w-3" />
                      <span>Video</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>In-person</span>
                    </div>
                    <span>•</span>
                    <span>{doctor.availableDays?.slice(0, 2).join(', ') || 'Mon-Fri'}</span>
                  </div>

                  <div className="flex space-x-2">
                    <DoctorDetailModal doctor={doctor}>
                      <Button variant="outline" size="sm" className="flex-1">
                        View Profile
                      </Button>
                    </DoctorDetailModal>
                    
                    <Button 
                      size="sm" 
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                      onClick={() => navigate(`/appointment/${doctor._id}`)}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredDoctors.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👨‍⚕️</div>
            <h3 className="text-xl font-semibold mb-2">No doctors found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or browse all doctors
            </p>
            <Button 
              onClick={() => {
                setSearchTerm('');
                setSelectedSpecialization('All Specializations');
                setShowVideoOnly(false);
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};