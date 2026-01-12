import { useEffect, useState } from 'react';

export type ABTestVariant = 'control' | 'variantA' | 'variantB';

interface ABTestConfig {
  ctaText: {
    control: string;
    variantA: string;
    variantB: string;
  };
  headline: {
    control: { line1: string; line2: string; useTypingAnimation: boolean };
    variantA: { line1: string; line2: string; useTypingAnimation: boolean };
    variantB: { line1: string; line2: string; useTypingAnimation: boolean };
  };
  showSocialProof: boolean;
  videoConfirmation: {
    control: {
      title: string;
      description: string;
    };
    variantA: {
      title: string;
      description: string;
    };
    variantB: {
      title: string;
      description: string;
    };
  };
}

interface ABTestResult {
  activeCTA: ABTestVariant;
  activeHeadline: ABTestVariant;
  currentCTAText: string;
  currentHeadline: { line1: string; line2: string; useTypingAnimation: boolean };
  showSocialProof: boolean;
  currentVideoConfirmation: {
    title: string;
    description: string;
  };
  trackEvent: (eventName: string, properties?: Record<string, any>) => void;
  trackImpression: () => void;
  trackConversion: (action: string) => void;
}

const AB_TEST_CONFIG: ABTestConfig = {
  ctaText: {
    control: "Get Started Free",
    variantA: "Plan My Meals for Free",
    variantB: "Organize My Kitchen Free"
  },
  headline: {
    control: {
      line1: "Transform your kitchen into",
      line2: "your personal nutritionist.",
      useTypingAnimation: true
    },
    variantA: {
      line1: "The AI assistant that knows",
      line2: "what's in your pantry.",
      useTypingAnimation: true
    },
    variantB: {
      line1: "Stop guessing what's for dinner.",
      line2: "Start cooking with what you have.",
      useTypingAnimation: true
    }
  },
  showSocialProof: true,
  videoConfirmation: {
    control: {
      title: "Launch AI Video Environment",
      description: "Your recording will be securely analyzed by AI in real-time to identify items."
    },
    variantA: {
      title: "Ready to Scan Your Kitchen?",
      description: "Point your camera at your food items for instant, AI-powered inventory."
    },
    variantB: {
      title: "Start Your AI Kitchen Scan",
      description: "Let Mise identify your ingredients for smarter meal planning."
    }
  }
};

// Google Analytics tracking functions
const trackToGA = (eventName: string, properties: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, {
      event_category: 'AB_Test',
      event_label: `${properties.cta_variant || 'unknown'}_${properties.headline_variant || 'unknown'}`,
      // Custom parameters for detailed analysis
      ab_test_cta_variant: properties.cta_variant,
      ab_test_headline_variant: properties.headline_variant,
      ab_test_cta_text: properties.cta_text,
      ab_test_headline_text: properties.headline_text,
      custom_parameter_1: properties.cta_variant,
      custom_parameter_2: properties.headline_variant,
      value: properties.value || 1,
      ...properties
    });
  }
  
  // Also log to console for debugging
  console.log(`[A/B Test] ${eventName}:`, properties);
};

// Random assignment function
const getRandomVariant = (): ABTestVariant => {
  const random = Math.random();
  if (random < 0.33) return 'control';
  if (random < 0.66) return 'variantA';
  return 'variantB';
};

export const useABTesting = (): ABTestResult => {
  const [ctaVariant, setCTAVariant] = useState<ABTestVariant>('control');
  const [headlineVariant, setHeadlineVariant] = useState<ABTestVariant>('control');
  const [videoVariant, setVideoVariant] = useState<ABTestVariant>('control');
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);

  useEffect(() => {
    // Get or assign CTA variant
    let storedCTAVariant = localStorage.getItem('ab_test_cta_variant') as ABTestVariant;
    if (!storedCTAVariant || !['control', 'variantA', 'variantB'].includes(storedCTAVariant)) {
      storedCTAVariant = getRandomVariant();
      localStorage.setItem('ab_test_cta_variant', storedCTAVariant);
      
      // Track new user assignment
      trackToGA('ab_test_assigned', {
        variant: storedCTAVariant,
        test_type: 'cta_button',
        timestamp: Date.now()
      });
    }
    setCTAVariant(storedCTAVariant);

    // Get or assign headline variant
    let storedHeadlineVariant = localStorage.getItem('ab_test_headline_variant') as ABTestVariant;
    if (!storedHeadlineVariant || !['control', 'variantA', 'variantB'].includes(storedHeadlineVariant)) {
      storedHeadlineVariant = getRandomVariant();
      localStorage.setItem('ab_test_headline_variant', storedHeadlineVariant);
      
      // Track new user assignment
      trackToGA('ab_test_assigned', {
        variant: storedHeadlineVariant,
        test_type: 'headline',
        timestamp: Date.now()
      });
    }
    setHeadlineVariant(storedHeadlineVariant);

    // Get or assign video variant
    let storedVideoVariant = localStorage.getItem('ab_test_video_variant') as ABTestVariant;
    if (!storedVideoVariant || !['control', 'variantA', 'variantB'].includes(storedVideoVariant)) {
      storedVideoVariant = getRandomVariant();
      localStorage.setItem('ab_test_video_variant', storedVideoVariant);
      
      // Track new user assignment
      trackToGA('ab_test_assigned', {
        variant: storedVideoVariant,
        test_type: 'video_confirmation',
        timestamp: Date.now()
      });
    }
    setVideoVariant(storedVideoVariant);
  }, []);

  // Track impression when component mounts (only once per session)
  useEffect(() => {
    if (!hasTrackedImpression && ctaVariant && headlineVariant) {
      const sessionKey = `ab_test_impression_${Date.now().toString().slice(0, -6)}`; // Daily session
      const hasTrackedToday = sessionStorage.getItem(sessionKey);
      
      if (!hasTrackedToday) {
        trackToGA('ab_test_impression', {
          cta_variant: ctaVariant,
          headline_variant: headlineVariant,
          page: 'landing_page'
        });
        sessionStorage.setItem(sessionKey, 'true');
        setHasTrackedImpression(true);
      }
    }
  }, [ctaVariant, headlineVariant, hasTrackedImpression]);

  const trackEvent = (eventName: string, properties: Record<string, any> = {}) => {
    trackToGA(eventName, {
      cta_variant: ctaVariant,
      headline_variant: headlineVariant,
      cta_text: AB_TEST_CONFIG.ctaText[ctaVariant],
      headline_text: `${AB_TEST_CONFIG.headline[headlineVariant].line1} ${AB_TEST_CONFIG.headline[headlineVariant].line2}`,
      ...properties
    });
  };

  const trackImpression = () => {
    trackEvent('ab_test_page_view', {
      page: 'landing_page',
      impression_type: 'page_load'
    });
  };

  const trackConversion = (action: string) => {
    // Track the main conversion event
    trackEvent('ab_test_conversion', {
      action,
      conversion_type: action,
      cta_variant: ctaVariant,
      headline_variant: headlineVariant,
      cta_text: AB_TEST_CONFIG.ctaText[ctaVariant],
      headline_text: `${AB_TEST_CONFIG.headline[headlineVariant].line1} ${AB_TEST_CONFIG.headline[headlineVariant].line2}`,
      timestamp: Date.now(),
      value: 1 // Conversion value for GA4
    });

    // Also track a specific event for the button click with clear naming
    trackToGA(`button_click_${ctaVariant}`, {
      event_category: 'CTA_Performance',
      event_label: AB_TEST_CONFIG.ctaText[ctaVariant],
      button_text: AB_TEST_CONFIG.ctaText[ctaVariant],
      button_variant: ctaVariant,
      headline_shown: `${AB_TEST_CONFIG.headline[headlineVariant].line1} ${AB_TEST_CONFIG.headline[headlineVariant].line2}`,
      value: 1
    });
  };

  return {
    activeCTA: ctaVariant,
    activeHeadline: headlineVariant,
    currentCTAText: AB_TEST_CONFIG.ctaText[ctaVariant],
    currentHeadline: AB_TEST_CONFIG.headline[headlineVariant],
    showSocialProof: AB_TEST_CONFIG.showSocialProof,
    currentVideoConfirmation: AB_TEST_CONFIG.videoConfirmation[videoVariant],
    trackEvent,
    trackImpression,
    trackConversion
  };
}; 