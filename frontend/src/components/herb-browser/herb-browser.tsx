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

  const { user } = useAuth();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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

  // Shared tag styling
  const tagBaseClasses =
    'cursor-pointer px-3 py-1 rounded-full text-sm font-medium shadow-md border transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-1';

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Find Medicines for Your Condition
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Search for any health condition to discover both Allopathic and
            Ayurvedic treatment options.
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-card p-10 rounded-lg mb-12">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="relative flex items-center">
              <Input
                placeholder="Search for a health condition (e.g., cold, fever, headache)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 pr-32 h-16 text-lg border-2 border-muted-foreground/30 rounded-xl shadow-md focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200 bg-gradient-to-r from-background via-card to-background"
              />

              <Button
                type="submit"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 px-6 rounded-xl bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 flex items-center gap-2"
                disabled={loading || !searchTerm.trim()}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    <span className="font-semibold">Search</span>
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Recent Searches
              </h3>
              <div className="flex flex-wrap gap-3">
                {searchHistory.map((disease, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className={`${tagBaseClasses} bg-gradient-to-r from-white/60 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-muted-foreground/10 hover:from-primary/80 hover:to-primary/40 hover:text-primary-foreground focus:ring-primary/30`}
                    onClick={() => handleQuickSearch(disease)}
                  >
                    {disease}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Common Conditions */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Common Conditions
            </h3>
            <div className="flex flex-wrap gap-3">
              {commonDiseases.map((disease, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className={`${tagBaseClasses} bg-gradient-to-r from-green-50 to-white dark:from-green-900/10 border-green-200 text-green-700 hover:from-green-400/80 hover:to-green-300/60 hover:text-white focus:ring-green-300`}
                  onClick={() => handleQuickSearch(disease)}
                >
                  {disease}
                </Badge>
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
                <CardHeader className="bg-green-50 dark:bg-blue-900/20 pb-4">
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
                    {medicineData.Ayurvedic.map((medicine, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start p-4 h-auto hover:bg-green-50 hover:border-green-200 transition-colors group hover:text-green-600"
                        onClick={() => handleMedicineClick(medicine, 'ayurvedic')}
                      >
                        <div className="flex items-center space-x-3 w-full">
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                          <p className="text-sm font-medium flex-1 text-left group-hover:text-green-600 transition-colors">
                            {medicine}
                          </p>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Pill className="h-4 w-4 text-green-500" />
                          </div>
                        </div>
                      </Button>
                    ))}
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