import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Pill,
  AlertCircle,
  Loader2,
  Heart,
  Plus,
  X,
  Info,
  Sparkles,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';
import { useAuth } from '../../App';
import { DoshaType } from '../dosha/dosha-quiz';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

const API_BASE_URL = 'http://localhost:8002/api/v1';

// Backend response interface
interface MedicineResponse {
  disease: string;
  Allopathic: string[];
  Ayurvedic: string[];
}

interface MedicinePopupProps {
  medicine: string;
  disease: string;
  type: 'allopathic' | 'ayurvedic';
  isOpen: boolean;
  onClose: () => void;
  onAddToList: (medicine: string, type: string, disease: string) => void;
}

// Medicine Popup Component - Updated to be small and square
const MedicinePopup: React.FC<MedicinePopupProps> = ({
  medicine,
  disease,
  type,
  isOpen,
  onClose,
  onAddToList,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xs w-80 p-0 rounded-lg">
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${type === 'allopathic' ? 'bg-blue-100' : 'bg-green-100'}`}>
              <Pill className={`h-5 w-5 ${type === 'allopathic' ? 'text-blue-600' : 'text-green-600'}`} />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">{medicine}</DialogTitle>
              <DialogDescription className="text-sm">
                {type === 'allopathic' ? 'Modern Medicine' : 'Ayurvedic Remedy'}
              </DialogDescription>
            </div>
          </div>

          {/* Medicine Info - Simple and clean */}
          <div className="space-y-3">
            <div className="flex items-start space-x-2 p-3 rounded-lg bg-muted/50">
              <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Used for: {disease}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="f"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                onAddToList(medicine, type, disease);
                onClose();
              }}
              className=""
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const HerbBrowser: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [medicineData, setMedicineData] = useState<MedicineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<{
    medicine: string;
    disease: string;
    type: 'allopathic' | 'ayurvedic';
  } | null>(null);
  const [doshaProfile, setDoshaProfile] = useState<DoshaType>(null);

  const { user } = useAuth();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Load dosha profile
  useEffect(() => {
    if (user) {
      const savedDosha = localStorage.getItem(`doshaProfile_${user.id || user._id}`);
      if (savedDosha) {
        setDoshaProfile(savedDosha as DoshaType);
      }
    }
  }, [user]);

  // Dynamic search with debouncing
  useEffect(() => {
    if (searchTerm.trim()) {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Set new timeout for search
      searchTimeoutRef.current = setTimeout(() => {
        fetchMedicineData(searchTerm.trim());
      }, 500); // 500ms debounce
    } else {
      setMedicineData(null);
      setError(null);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Fetch medicine data
  const fetchMedicineData = async (diseaseName: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<MedicineResponse>(
        `${API_BASE_URL}/user/medicines?diseaseName=${encodeURIComponent(
          diseaseName.toLowerCase(),
        )}`,
        { withCredentials: true },
      );

      setMedicineData(response.data);

      // Save to search history
      if (!searchHistory.includes(diseaseName.toLowerCase())) {
        setSearchHistory((prev) => [
          diseaseName.toLowerCase(),
          ...prev.slice(0, 4),
        ]);
      }
    } catch (err: any) {
      console.error('Error fetching medicine data:', err);
      setError(
        'Failed to fetch medicine information. Please check the disease name and try again.',
      );
      setMedicineData(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle manual search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      fetchMedicineData(searchTerm.trim());
    }
  };

  // Quick search helper
  const handleQuickSearch = (diseaseName: string) => {
    setSearchTerm(diseaseName);
  };

  // Handle medicine click
  const handleMedicineClick = (medicine: string, type: 'allopathic' | 'ayurvedic') => {
    if (medicineData) {
      setSelectedMedicine({
        medicine,
        disease: medicineData.disease,
        type,
      });
    }
  };

  // Get user-specific storage key
  const getUserStorageKey = (baseKey: string) => {
    return user ? `${baseKey}_${user.id || user._id}` : baseKey;
  };

  // Add medicine to favorites
  const handleAddToFavorites = (medicine: string, type: string, disease: string) => {
    try {
      if (!user) {
        toast.error('Please login to save medicines');
        return;
      }

      // Create a medicine item
      const medicineItem = {
        _id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: medicine,
        type: 'medicine' as const,
        disease: disease,
        medicineType: type,
        addedAt: new Date().toISOString()
      };

      // Get user-specific storage key
      const storageKey = getUserStorageKey('favoriteMedicines');

      // Get existing favorites for this user
      const existingFavorites = JSON.parse(localStorage.getItem(storageKey) || '[]');

      // Check if already exists
      const alreadyExists = existingFavorites.some((item: any) =>
        item.name === medicine && item.disease === disease && item.medicineType === type
      );

      if (alreadyExists) {
        toast.success(`${medicine} is already in your favorites!`);
        return;
      }

      // Add new medicine
      const updatedFavorites = [...existingFavorites, medicineItem];

      // Save to localStorage with user-specific key
      localStorage.setItem(storageKey, JSON.stringify(updatedFavorites));

      // Show success message
      toast.success(`Added ${medicine} to your favorites!`);

      // Trigger storage event to update dashboard
      window.dispatchEvent(new Event('storage'));

    } catch (error) {
      console.error('Error adding medicine to favorites:', error);
      toast.error('Failed to add medicine to favorites');
    }
  };

  // Common disease list
  const commonDiseases = [
    'Common Cold',
    'Fever',
    'Infection',
    'Diabetes',
    'Dengue',
    'Chicken Pox',
    'Jaundice',
    'Migraine',
  ];

  // Helper to determine if a herb is recommended for a dosha (mock mapping for demonstration)
  const isHerbRecommendedForDosha = (herb: string, dosha: DoshaType) => {
    if (!dosha) return false;
    const herbName = herb.toLowerCase();
    
    const doshaHerbs = {
      Vata: ['ashwagandha', 'tulsi', 'ginger', 'haritaki', 'sesame', 'cardamom'],
      Pitta: ['amla', 'brahmi', 'shatavari', 'coriander', 'fennel', 'sandalwood', 'mint'],
      Kapha: ['turmeric', 'trikatu', 'cinnamon', 'clove', 'black pepper', 'guggulu']
    };

    return doshaHerbs[dosha]?.some(h => herbName.includes(h)) || false;
  };

  // Shared tag styling
  const tagBaseClasses =
    'cursor-pointer px-3 py-1 rounded-full text-sm font-medium shadow-md border transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-1';

  return (
    <div className="ayur-page-dark" style={{ paddingTop:8, paddingBottom:40 }}>
      <div className="max-w-4xl mx-auto" style={{ padding:'0 24px', position:'relative', zIndex:1 }}>
        {/* Header */}
        <div className="ayur-section-header">
          <span className="ayur-pill">🌿 Dual Medicine Search</span>
          <h1>Find <em>Medicines</em> for Your Condition</h1>
          <p>
            Search for any health condition to discover both Allopathic and
            Ayurvedic treatment options.
          </p>
        </div>

        {/* Dosha Personalization Banner */}
        {doshaProfile && (
          <div className="mb-8 p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground text-sm">Personalized for {doshaProfile} Dosha</h3>
                <p className="text-xs text-muted-foreground">Ayurvedic remedies highlighted with ⭐ are especially beneficial for your constitution.</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/dosha-quiz'}>
              Retake Quiz
            </Button>
          </div>
        )}

        {/* Search Section */}
        <div className="ayur-glass-card" style={{ padding:'36px', marginBottom:48 }}>
          <form onSubmit={handleSearch}>
            <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
              <Search size={20} color="#60a5fa" style={{ position:'absolute', left:18, pointerEvents:'none' }} />
              <input
                placeholder="Search for a health condition (e.g., cold, fever, headache)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width:'100%', padding:'18px 160px 18px 52px',
                  background:'rgba(255,255,255,0.06)', border:'1px solid rgba(96,165,250,0.2)',
                  borderRadius:16, color:'#eff6ff', fontFamily:"'DM Sans',sans-serif",
                  fontSize:16, outline:'none', boxSizing:'border-box' }}
                onFocus={e => e.target.style.borderColor='rgba(96,165,250,0.5)'}
                onBlur={e => e.target.style.borderColor='rgba(96,165,250,0.2)'}
              />
              <button
                type="submit"
                disabled={loading || !searchTerm.trim()}
                style={{ position:'absolute', right:8, padding:'11px 24px',
                  background: (loading || !searchTerm.trim()) ? 'rgba(37,99,235,0.4)' : 'linear-gradient(135deg,#2563eb,#3b82f6)',
                  color:'#fff', border:'none', borderRadius:12, cursor: (loading || !searchTerm.trim()) ? 'not-allowed' : 'pointer',
                  fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14,
                  display:'flex', alignItems:'center', gap:8, transition:'all 0.2s' }}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <><Search size={18} /><span>Search</span></>}
              </button>
            </div>
          </form>

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div style={{ marginTop:24 }}>
              <h3 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600,
                color:'rgba(191,219,254,0.5)', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                Recent Searches
              </h3>
              <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                {searchHistory.map((disease, index) => (
                  <button key={index} onClick={() => handleQuickSearch(disease)}
                    style={{ padding:'6px 16px', borderRadius:20, border:'1px solid rgba(96,165,250,0.25)',
                      background:'rgba(96,165,250,0.08)', color:'#93c5fd', cursor:'pointer',
                      fontFamily:"'DM Sans',sans-serif", fontSize:13, transition:'all 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.background='rgba(96,165,250,0.18)'}
                    onMouseOut={e => e.currentTarget.style.background='rgba(96,165,250,0.08)'}
                  >{disease}</button>
                ))}
              </div>
            </div>
          )}

          {/* Common Conditions */}
          <div style={{ marginTop:24 }}>
            <h3 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600,
              color:'rgba(191,219,254,0.5)', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.05em' }}>
              Common Conditions
            </h3>
            <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
              {commonDiseases.map((disease, index) => (
                <button key={index} onClick={() => handleQuickSearch(disease)}
                  style={{ padding:'6px 16px', borderRadius:20, border:'1px solid rgba(52,211,153,0.3)',
                    background:'rgba(52,211,153,0.08)', color:'#34d399', cursor:'pointer',
                    fontFamily:"'DM Sans',sans-serif", fontSize:13, transition:'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.background='rgba(52,211,153,0.18)'; e.currentTarget.style.color='#fff'; }}
                  onMouseOut={e => { e.currentTarget.style.background='rgba(52,211,153,0.08)'; e.currentTarget.style.color='#34d399'; }}
                >{disease}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              Searching for treatments...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Unable to Find Information
            </h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => setError(null)} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Results */}
        {medicineData && !loading && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Treatment Options for {medicineData.disease}
              </h2>
              <p className="text-muted-foreground">
                Comprehensive medical approaches for{' '}
                {medicineData.disease.toLowerCase()}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Allopathic */}
               <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="bg-green-50 dark:bg-green-900/20 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Pill className="h-6 w-6 text-green-600" />
                      <CardTitle className="text-xl">
                        Allopathic Medicine
                      </CardTitle>
                    </div>
                    <Badge variant="default" className="bg-blue-600">
                      {medicineData.Allopathic.length} options
                    </Badge>
                  </div>
                  <CardDescription>
                    Modern medical treatments and medications
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {medicineData.Allopathic.map((medicine, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start p-4 h-auto hover:bg-green-50  hover:border-blue-200 transition-colors group hover:text-green-600"
                        onClick={() => handleMedicineClick(medicine, 'allopathic')}
                      >
                        <div className="flex items-center space-x-3 w-full">
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          <p className="text-sm font-medium flex-1 text-left group-hover:text-blue-600 transition-colors">
                            {medicine}
                          </p>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Pill className="h-4 w-4 text-blue-500" />
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Ayurvedic */}
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="bg-green-50 dark:bg-green-900/20 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Pill className="h-6 w-6 text-green-600" />
                      <CardTitle className="text-xl">
                        Ayurvedic Medicine
                      </CardTitle>
                    </div>
                    <Badge variant="default" className="bg-blue-600">
                      {medicineData.Ayurvedic.length} options
                    </Badge>
                  </div>
                  <CardDescription>
                    Traditional herbal treatments and remedies
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {medicineData.Ayurvedic.map((medicine, index) => {
                      const isRecommended = isHerbRecommendedForDosha(medicine, doshaProfile);
                      return (
                        <Button
                          key={index}
                          variant="outline"
                          className={`w-full justify-start p-4 h-auto transition-colors group ${
                            isRecommended 
                              ? 'border-yellow-400 bg-yellow-50/50 hover:bg-yellow-100 dark:border-yellow-600/50 dark:bg-yellow-900/10 dark:hover:bg-yellow-900/20' 
                              : 'hover:bg-green-50 hover:border-green-200 hover:text-green-600'
                          }`}
                          onClick={() => handleMedicineClick(medicine, 'ayurvedic')}
                        >
                          <div className="flex items-center space-x-3 w-full">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isRecommended ? 'bg-yellow-500' : 'bg-green-500'}`} />
                            <div className="flex-1 text-left">
                              <p className={`text-sm font-medium transition-colors ${
                                isRecommended ? 'text-yellow-700 dark:text-yellow-400' : 'group-hover:text-green-600'
                              }`}>
                                {medicine} {isRecommended && <span className="ml-1 text-xs">⭐ Recommended</span>}
                              </p>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Pill className={`h-4 w-4 ${isRecommended ? 'text-yellow-600' : 'text-green-500'}`} />
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Disclaimer */}
            <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                      Important Medical Disclaimer
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      This information is for educational purposes only. Always
                      consult a qualified healthcare practitioner before
                      starting any new treatment. Do not self-medicate without
                      professional advice.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <div className="text-center pt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setMedicineData(null);
                }}
              >
                Search for Another Condition
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!medicineData && !loading && !error && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Search for Health Conditions
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Enter a health condition above to discover both modern and
              traditional treatment options.
            </p>
          </div>
        )}

        {/* Medicine Popup */}
        {selectedMedicine && (
          <MedicinePopup
            medicine={selectedMedicine.medicine}
            disease={selectedMedicine.disease}
            type={selectedMedicine.type}
            isOpen={!!selectedMedicine}
            onClose={() => setSelectedMedicine(null)}
            onAddToList={handleAddToFavorites}
          />
        )}
      </div>
    </div>
  );
};