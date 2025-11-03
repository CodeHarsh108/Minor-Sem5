import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, Calendar, Shield, Star, ArrowRight, Heart, ScrollText, BookOpen } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
// Note: place poster.jpg in the public folder (public/poster.jpg) and use <img src="/poster.jpg" /> in the component instead of importing it.

const HeroSection: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="w-fit">
                🌿 Traditional Healing, Modern Convenience
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                Your Gateway to
                <span className="text-primary block">Ayurvedic Wisdom</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Connect with certified Ayurvedic practitioners, discover traditional herbs and medicines, 
                and embark on your journey to holistic health and well-being.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className='bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105'>
                <Link to="/doctors">Find a Doctor</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/herbs">Explore Herbs</Link>
              </Button>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>500+ Certified Practitioners</span>
              </div>
              <div className="flex items-center space-x-2">
                <ScrollText className="h-4 w-4" />
                <span>1000+ Ancient Remedies</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative z-10">
              <div className="w-full h-[400px] bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl shadow-xl flex items-center justify-center">
                <div className="text-center text-primary">
                  <img src="/poster.jpg" alt="" />
                </div>
              </div>
            </div>
            <div className="absolute top-4 right-4 bg-card p-4 rounded-xl shadow-lg z-20">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold">Certified</div>
                  <div className="text-xs text-muted-foreground">Practitioners</div>
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
    </section>
  );
};

// Features Section Component
const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <Search className="h-8 w-8 text-primary" />,
      title: "Smart Herb Discovery",
      description: "Find the right herbs and medicines based on your specific health conditions and symptoms.",
      link: "/herbs"
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Expert Practitioners",
      description: "Connect with certified Ayurvedic doctors and practitioners for personalized consultations.",
      link: "/doctors"
    },
    {
      icon: <Calendar className="h-8 w-8 text-primary" />,
      title: "Easy Booking",
      description: "Schedule appointments with your preferred practitioners at your convenience.",
      link: "/doctors"
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: "Secure Platform",
      description: "Your health data and personal information are protected with enterprise-grade security.",
      link: "/dashboard"
    }
  ];

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Why Choose AyurSamhita Platform?
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Experience the perfect blend of traditional Ayurvedic wisdom and modern digital convenience
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto mb-4">
                  {feature.icon}
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {feature.description}
                </CardDescription>
                {feature.link ? (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={feature.link} className="text-primary">
                      Learn More <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" disabled>
                    Learn More <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// How It Works Section
const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      step: "1",
      title: "Create Your Profile",
      description: "Sign up and complete your health profile to get personalized recommendations",
    },
    {
      step: "2", 
      title: "Discover & Consult",
      description: "Browse herbs by condition or find and book consultations with expert practitioners",
    },
    {
      step: "3",
      title: "Begin Your Journey",
      description: "Follow personalized treatment plans and track your progress towards better health",
    }
  ];

  return (
    <section className="py-20 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Start your Ayurvedic wellness journey in three simple steps
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((item, index) => (
            <div key={index} className="text-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto font-bold text-xl">
                  {item.step}
                </div>
                {/* <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary">
                  {item.icon}
                </div> */}
              </div>
              <h3 className="text-xl font-semibold mb-4">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Success Stories Section
const SuccessStoriesSection: React.FC = () => {
  const stories = [
    {
      name: "Priya Sharma",
      role: "Software Engineer",
      content: "The platform helped me connect with an experienced Ayurvedic practitioner who provided personalized treatment for my chronic stress.",
      condition: "Stress Management"
    },
    {
      name: "Rajesh Kumar",
      role: "Business Owner", 
      content: "Through this platform, I found expert consultation and finally got relief from my digestive issues using traditional Ayurvedic methods.",
      condition: "Digestive Health"
    },
    {
      name: "Anita Desai",
      role: "Teacher",
      content: "The herb browser feature helped me discover natural remedies. The detailed information about each herb and its benefits is incredibly valuable.",
      condition: "Natural Wellness"
    }
  ];

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Success Stories
          </h2>
          <p className="text-lg text-muted-foreground">
            Real experiences from people who found healing through our platform
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {stories.map((story, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Badge variant="secondary" className="w-fit mb-2">
                  {story.condition}
                </Badge>
                <CardTitle className="text-lg">{story.name}</CardTitle>
                <CardDescription>{story.role}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground italic">"{story.content}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// CTA Section
const CTASection: React.FC = () => {
  return (
    <section className="py-20 px-4 bg-primary">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground mb-6">
          Ready to Start Your Wellness Journey?
        </h2>
        <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
          Join thousands of people who have discovered the wisdom of ancient Ayurvedic texts. 
          Create your account today and take the first step towards holistic health.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" variant="secondary" asChild>
            <Link to="/signup">Get Started Free</Link>
          </Button>
          <Button size="lg" className="bg-white text-green-600 hover:bg-green-50 border-2 border-white hover:border-green-100 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" asChild>
            <Link to="/doctors">Book Consultation</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

// Main Landing Page Component
export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SuccessStoriesSection />
      <CTASection />
    </div>
  );
};