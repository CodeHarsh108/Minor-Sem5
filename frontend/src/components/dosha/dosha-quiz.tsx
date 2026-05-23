import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { ArrowRight, ArrowLeft, Leaf, Flame, Droplets, Activity } from 'lucide-react';
import { toast } from 'sonner';

export type DoshaType = 'Vata' | 'Pitta' | 'Kapha' | null;

interface Question {
  id: string;
  text: string;
  options: {
    label: string;
    value: DoshaType;
  }[];
}

const quizQuestions: Question[] = [
  {
    id: 'bodyFrame',
    text: 'How would you describe your body frame?',
    options: [
      { label: 'Thin, slender, prominent joints', value: 'Vata' },
      { label: 'Medium, well-proportioned, muscular', value: 'Pitta' },
      { label: 'Broad, heavy, solid build', value: 'Kapha' },
    ]
  },
  {
    id: 'skin',
    text: 'What is your skin type usually like?',
    options: [
      { label: 'Dry, rough, thin, cool to touch', value: 'Vata' },
      { label: 'Warm, reddish, prone to acne or freckles', value: 'Pitta' },
      { label: 'Thick, oily, cool, smooth', value: 'Kapha' },
    ]
  },
  {
    id: 'sleep',
    text: 'How do you generally sleep?',
    options: [
      { label: 'Light, interrupted, easily awakened', value: 'Vata' },
      { label: 'Sound, medium duration, intense dreams', value: 'Pitta' },
      { label: 'Deep, heavy, hard to wake up', value: 'Kapha' },
    ]
  },
  {
    id: 'digestion',
    text: 'How is your digestion and appetite?',
    options: [
      { label: 'Irregular, prone to gas or bloating', value: 'Vata' },
      { label: 'Strong, intense hunger, prone to acidity', value: 'Pitta' },
      { label: 'Slow, steady, can skip meals easily', value: 'Kapha' },
    ]
  },
  {
    id: 'temperament',
    text: 'Under stress, how do you typically react?',
    options: [
      { label: 'Anxious, worried, fearful', value: 'Vata' },
      { label: 'Irritable, angry, impatient', value: 'Pitta' },
      { label: 'Withdraw, depressed, stubborn', value: 'Kapha' },
    ]
  }
];

export const getDoshaDetails = (dosha: DoshaType) => {
  switch (dosha) {
    case 'Vata':
      return {
        name: 'Vata (Air & Space)',
        icon: <Activity className="w-8 h-8 text-blue-400" />,
        color: 'text-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        description: 'Vata governs movement in the body. When in balance, you are creative and energetic. When out of balance, you may experience anxiety and dryness.',
        diet: 'Favor warm, moist, grounding foods like cooked grains, root vegetables, and warm milk. Avoid cold, raw, and dry foods.',
        lifestyle: 'Maintain a regular daily routine, practice gentle yoga, and ensure adequate rest and warmth.'
      };
    case 'Pitta':
      return {
        name: 'Pitta (Fire & Water)',
        icon: <Flame className="w-8 h-8 text-orange-500" />,
        color: 'text-orange-500',
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        description: 'Pitta governs digestion and metabolism. When in balance, you are intelligent and a good leader. When out of balance, you may be prone to anger and inflammation.',
        diet: 'Favor cooling, slightly dry, and heavy foods like sweet fruits, bitter greens, and grains. Avoid spicy, sour, and overly salty foods.',
        lifestyle: 'Avoid excessive heat, practice moderation, and engage in calming activities like swimming or evening walks.'
      };
    case 'Kapha':
      return {
        name: 'Kapha (Earth & Water)',
        icon: <Droplets className="w-8 h-8 text-green-500" />,
        color: 'text-green-500',
        bg: 'bg-green-50 dark:bg-green-900/20',
        description: 'Kapha provides structure and lubrication. When in balance, you are calm and loving. When out of balance, you may feel lethargic and possessive.',
        diet: 'Favor light, warm, and spicy foods like vegetables, legumes, and warming spices. Avoid heavy, oily, and sweet foods.',
        lifestyle: 'Engage in vigorous exercise, seek variety, and wake up early to avoid lethargy.'
      };
    default:
      return null;
  }
};

export const DoshaQuiz: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, DoshaType>>({});
  const [result, setResult] = useState<DoshaType>(null);

  // Load existing profile if any
  React.useEffect(() => {
    if (user) {
      const savedDosha = localStorage.getItem(`doshaProfile_${user.id || user._id}`);
      if (savedDosha) {
        setResult(savedDosha as DoshaType);
      }
    }
  }, [user]);

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [quizQuestions[currentStep].id]: value as DoshaType
    }));
  };

  const calculateResult = () => {
    const counts = { Vata: 0, Pitta: 0, Kapha: 0 };
    Object.values(answers).forEach(val => {
      if (val) counts[val]++;
    });

    let primaryDosha: DoshaType = 'Vata';
    let max = counts.Vata;
    
    if (counts.Pitta > max) {
      max = counts.Pitta;
      primaryDosha = 'Pitta';
    }
    if (counts.Kapha > max) {
      primaryDosha = 'Kapha';
    }

    setResult(primaryDosha);
    
    // Save to localStorage
    if (user) {
      localStorage.setItem(`doshaProfile_${user.id || user._id}`, primaryDosha!);
      toast.success('Your Dosha profile has been saved successfully!');
    }
  };

  const handleNext = () => {
    if (!answers[quizQuestions[currentStep].id]) {
      toast.error('Please select an option');
      return;
    }

    if (currentStep < quizQuestions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      calculateResult();
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentStep(0);
    setResult(null);
    if (user) {
      localStorage.removeItem(`doshaProfile_${user.id || user._id}`);
    }
  };

  if (result) {
    const details = getDoshaDetails(result);
    if (!details) return null;

    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl pt-24">
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">{details.icon}</div>
            <CardTitle className="text-3xl font-bold font-serif mb-2 text-primary">Your Primary Dosha</CardTitle>
            <CardDescription className="text-xl font-medium">{details.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className={`${details.bg} p-6 rounded-xl border border-primary/10`}>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Leaf className={`w-5 h-5 ${details.color}`} /> 
                About {result}
              </h3>
              <p className="text-muted-foreground leading-relaxed">{details.description}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">🥗 Recommended Diet</h4>
                <p className="text-sm text-muted-foreground">{details.diet}</p>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">🧘 Lifestyle (Dinacharya)</h4>
                <p className="text-sm text-muted-foreground">{details.lifestyle}</p>
              </div>
            </div>
            
            <div className="bg-primary/5 p-4 rounded-lg mt-6">
              <p className="text-sm text-center text-muted-foreground">
                Your Dosha profile is now saved. The Herb Browser and Dashboard will now provide personalized recommendations.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-6">
            <Button variant="outline" onClick={handleRetake}>Retake Quiz</Button>
            <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const question = quizQuestions[currentStep];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl pt-24">
      <div className="text-center mb-8">
        <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
          Discover Your True Nature
        </span>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-4">Dosha Profiling Quiz</h1>
        <p className="text-muted-foreground">Answer these quick questions to find out your Ayurvedic mind-body type.</p>
      </div>

      <Card className="shadow-md border-primary/10">
        <CardHeader>
          <div className="flex justify-between text-sm text-muted-foreground mb-4">
            <span>Question {currentStep + 1} of {quizQuestions.length}</span>
            <span>{Math.round(((currentStep + 1) / quizQuestions.length) * 100)}% Completed</span>
          </div>
          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-300 ease-in-out" 
              style={{ width: `${((currentStep + 1) / quizQuestions.length) * 100}%` }}
            />
          </div>
          <CardTitle className="text-xl mt-6 leading-relaxed">{question.text}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={answers[question.id] || ''} 
            onValueChange={handleAnswer}
            className="space-y-4 mt-4"
          >
            {question.options.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-3 border p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <RadioGroupItem value={option.value!} id={`option-${idx}`} />
                <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer text-base font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-6">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button onClick={handleNext}>
            {currentStep === quizQuestions.length - 1 ? 'See Results' : 'Next'} 
            {currentStep < quizQuestions.length - 1 && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
