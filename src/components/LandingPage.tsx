import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, ShoppingCart, Package, Utensils, ArrowRight, Star, Users, CheckCircle } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useNavigate } from 'react-router-dom';
import { TypingAnimation } from '@/components/TypingAnimation';
import { useABTesting } from '@/hooks/useABTesting';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage = ({ onGetStarted }: LandingPageProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // Use the automatic A/B testing hook
  const {
    currentCTAText,
    currentHeadline,
    showSocialProof,
    trackConversion,
    trackEvent
  } = useABTesting();

  const handleGetStarted = async () => {
    setIsLoading(true);
    
    // Track conversion event for A/B testing
    trackConversion('cta_click');
    
    try {
      await onGetStarted();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    trackEvent('sign_in_click', { location: 'header' });
    navigate('/auth');
  };

  // Social Proof Data
  const testimonials = [
    {
      name: "Sarah K.",
      location: "Austin, TX",
      quote: "Mise has transformed our weeknight dinners! No more food waste.",
      rating: 5
    },
    {
      name: "Mike R.",
      location: "Portland, OR", 
      quote: "Finally, an app that knows what I have in my fridge. Game changer!",
      rating: 5
    },
    {
      name: "Jennifer L.",
      location: "Chicago, IL",
      quote: "I save $200+ monthly on groceries and eat better. Worth every penny.",
      rating: 5
    }
  ];

  // Add keyframes for card animation
  const slideUpKeyframes = `
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes borderGlow {
      0% {
        border-color: rgba(249, 115, 22, 0.2);
        box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.1);
      }
      50% {
        border-color: rgba(249, 115, 22, 0.6);
        box-shadow: 0 0 15px 2px rgba(249, 115, 22, 0.3);
      }
      100% {
        border-color: rgba(249, 115, 22, 0.2);
        box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.1);
      }
    }

    .feature-card {
      position: relative;
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }

    .feature-card:hover {
      animation: borderGlow 1.5s ease-in-out infinite;
      transform: translateY(-2px);
    }

    .testimonial-fade-in {
      animation: slideUp 0.8s ease-out forwards;
    }
  `;

  // Insert keyframes into document head
  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = slideUpKeyframes;
    if (!document.head.querySelector('style[data-slide-up]')) {
      style.setAttribute('data-slide-up', 'true');
      document.head.appendChild(style);
    }
  }

  const featureTexts = [
    "ChatGPT for your kitchen.",
    "Your personal sous chef that never sleeps.",
    "Turn leftovers into gourmet meals.",
    "Smart shopping lists with Amazon integration.",
    "Track every ingredient you own.",
    "Get meal suggestions based on your inventory.",
    "Reduce food waste with AI intelligence.",
    "Personalized nutrition guidance.",
    "Never wonder 'what's for dinner' again.",
    "Your kitchen's memory and brain.",
    "Meal planning made effortless.",
    "Dietary restrictions? No problem."
  ];

  // Social Proof Component
  const SocialProofSection = () => (
    <div className="max-w-4xl mx-auto mt-16 mb-8">
      {/* User Count Badge */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
          <Users className="h-4 w-4" />
          Join over 10,000 home cooks saving time and reducing food waste
        </div>
      </div>

      {/* Testimonials Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <Card 
            key={index}
            className="glass-card border-glass-border/30 testimonial-fade-in"
            style={{
              animationDelay: `${index * 200}ms`,
              opacity: 0
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-muted-foreground mb-4 italic">
                "{testimonial.quote}"
              </blockquote>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-sm">{testimonial.name}</div>
                  <div className="text-xs text-muted-foreground">{testimonial.location}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const features = [
    {
      icon: ChefHat,
      title: "Instant Meal Ideas",
      description: "Ask 'What's for dinner?' and get instant, single-meal suggestions from your personal AI chef."
    },
    {
      icon: Package,
      title: "Know Your Inventory",
      description: "Mise tracks every ingredient you own, so you always know what you have before you shop."
    },
    {
      icon: Utensils,
      title: "End Food Waste",
      description: "Unlock the potential of your leftovers with creative ideas that save you money."
    },
    {
      icon: ShoppingCart,
      title: "Shop Smarter",
      description: "Auto-generate shopping lists and instantly check prices on Amazon."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 flex flex-col font-inter">
      {/* Header */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl z-50">
        <div className="flex items-center justify-between px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full shadow-lg">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-lg hidden sm:inline text-gray-800 dark:text-white">
              Mise
            </span>
          </div>

          {/* Navigation Links - Hidden on mobile */}
          {/* <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-700 dark:text-gray-300">
            <a href="#features" className="hover:text-orange-500 transition-colors duration-200">Features</a>
            <a href="#pricing" className="hover:text-orange-500 transition-colors duration-200">Pricing</a>
            <a href="#about" className="hover:text-orange-500 transition-colors duration-200">About</a>
          </div> */}

          {/* Right Section */}
          <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            onClick={handleSignIn}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-orange-500 hover:bg-white/20 transition-all duration-200 rounded-full border border-transparent hover:border-white/30"
          >
            Sign In
          </Button>
            {/* Mobile menu button */}
            <button 
              className="lg:hidden p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
              title="Open mobile menu"
              aria-label="Open mobile menu"
            >
              <svg className="h-5 w-5 text-gray-800 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center p-6 pt-24">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight min-h-[120px] lg:min-h-[160px] tracking-tight">
              <span className="block">{currentHeadline.line1}</span>
              <span className="block text-primary glass-shimmer">{currentHeadline.line2}</span>
              {currentHeadline.useTypingAnimation && (
              <div className="mt-4 text-2xl lg:text-3xl text-muted-foreground">
                <TypingAnimation 
                  texts={featureTexts}
                  typingSpeed={80}
                  deletingSpeed={40}
                  pauseDuration={3000}
                />
              </div>
              )}
            </h1>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleGetStarted}
                disabled={isLoading}
                className="glass-button-primary px-8 py-3 text-lg h-12 glass-glow"
                title={currentCTAText}
              >
                {isLoading ? 'Getting Started...' : currentCTAText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground/80">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                No credit card required
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Setup in 2 minutes
              </span>
            </div>
          </div>

          {/* Right Content - Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="glass-card glass-hover border-glass-border/30 animate-slide-up"
                style={{
                  animationDelay: `${index * 150}ms`,
                  opacity: 0,
                  transform: 'translateY(20px)',
                  animation: `slideUp 0.6s ease-out forwards ${index * 150}ms`
                }}
              >
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 glass-light rounded-2xl flex items-center justify-center mb-3 border border-primary/20">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg tracking-tight">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground tracking-tight">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Social Proof Section */}
      {showSocialProof && (
        <section className="py-12 px-6">
          <SocialProofSection />
        </section>
      )}

      {/* Footer */}
      <footer className="p-6 text-center text-muted-foreground/60 text-sm">
        <div className="max-w-6xl mx-auto">
          © 2025 Mise AI. Empowering kitchens with intelligent nutrition assistance.
        </div>
      </footer>
    </div>
  );
};
