import { useState, useEffect, useRef } from 'react';
import { Chatbot } from "@/components/Chatbot";
import { ThoughtProcess } from "@/components/ThoughtProcess";
import { Header } from "@/components/Header";
import { LandingPage } from "@/components/LandingPage";
import { VideoTrigger } from "@/components/VideoTrigger";
import { ThoughtStep } from '@/data/schema';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
  const [isLeftoversOpen, setIsLeftoversOpen] = useState(false);
  const [thoughtSteps, setThoughtSteps] = useState<ThoughtStep[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [pendingAIMessage, setPendingAIMessage] = useState<string | null>(null);
  const [showVideoFlow, setShowVideoFlow] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Check for pending AI message from shared shopping list import
  useEffect(() => {
    const checkPendingMessage = () => {
      const message = localStorage.getItem('pendingAIMessage');
      if (message) {
        setPendingAIMessage(message);
        localStorage.removeItem('pendingAIMessage');
      }
    };

    // Check immediately and also when the window gains focus
    checkPendingMessage();
    window.addEventListener('focus', checkPendingMessage);
    
    return () => window.removeEventListener('focus', checkPendingMessage);
  }, []);

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isRightPanelOpen) {
      setIsRightPanelOpen(false);
        // Return focus to toggle button
        toggleButtonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isRightPanelOpen]);

  // Focus management for accessibility
  useEffect(() => {
    if (isRightPanelOpen && sidebarRef.current) {
      // Focus the sidebar when it opens
      sidebarRef.current.focus();
    }
  }, [isRightPanelOpen]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsAuthChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGetStarted = () => {
    navigate('/auth');
  };

  const toggleSidebar = () => {
    setIsRightPanelOpen(prev => !prev);
  };

  const handleVideoTrigger = () => {
    setShowVideoFlow(true);
  };

  const handleVideoClose = () => {
    setShowVideoFlow(false);
  };

  // Show loading state while checking auth
  if (isAuthChecking) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page if not authenticated
  if (!session) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  // Show authenticated app
  return (
    <div className="h-screen-safe bg-background text-foreground flex flex-col relative">
      <Header 
        onShoppingListOpen={() => setIsShoppingListOpen(true)} 
        onLeftoversOpen={() => setIsLeftoversOpen(true)}
        onVideoTrigger={handleVideoTrigger}
        isMobile={isMobile}
      />
      
      {/* Video Recording Trigger */}
      <VideoTrigger 
        isMobile={isMobile} 
        showVideoFlow={showVideoFlow}
        onClose={handleVideoClose}
      />
      
      {/* Main content area - full width, chat interface is always accessible */}
      <div className="flex-1 pt-20 relative min-h-0">
        <div className="w-full h-full chat-interface">
          <Chatbot
            isShoppingListOpen={isShoppingListOpen}
            setIsShoppingListOpen={setIsShoppingListOpen}
            isLeftoversOpen={isLeftoversOpen}
            setIsLeftoversOpen={setIsLeftoversOpen}
            setThoughtSteps={setThoughtSteps}
            session={session}
            thoughtSteps={thoughtSteps}
            pendingMessage={pendingAIMessage}
            onMessageSent={() => setPendingAIMessage(null)}
          />
        </div>
        
        {/* Desktop Sidebar Toggle Button - Fixed positioning for consistent access */}
          <button
          ref={toggleButtonRef}
          aria-label={isRightPanelOpen ? "Close thought process sidebar" : "Open thought process sidebar"}
          aria-expanded={isRightPanelOpen ? "true" : "false"}
          aria-controls="thought-process-sidebar"
          onClick={toggleSidebar}
          className="hidden lg:flex fixed top-24 right-4 z-toggle bg-white text-gray-700 border border-gray-200 rounded-full shadow-md hover:shadow-lg w-10 h-10 items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {isRightPanelOpen ? (
            <ChevronRight className="w-4 h-4 transition-transform duration-200" />
            ) : (
            <ChevronLeft className="w-4 h-4 transition-transform duration-200" />
            )}
          </button>

        {/* Desktop Sidebar Overlay */}
        <div 
          id="thought-process-sidebar"
          ref={sidebarRef}
          role="complementary"
          aria-label="Thought process sidebar"
          tabIndex={-1}
          className={`hidden lg:flex fixed top-20 right-0 bottom-0 z-sidebar sidebar-width sidebar-glass shadow-2xl transform transition-all duration-500 ease-out flex-col ${
            isRightPanelOpen 
              ? 'translate-x-0 opacity-100' 
              : 'translate-x-full opacity-0 pointer-events-none'
          }`}
        >
          {/* Sidebar Header */}
          <div className="flex-shrink-0 p-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">AI Thought Process</h2>
              <button
                onClick={toggleSidebar}
                aria-label="Close sidebar"
                className="p-2 rounded-full hover:bg-muted transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
        </div>

          {/* Sidebar Content with Independent Scrolling */}
          <div className="flex-1 min-h-0 p-4 sidebar-scroll chat-interface">
            <ThoughtProcess steps={thoughtSteps} />
          </div>
        </div>

        {/* Desktop Backdrop */}
        {isRightPanelOpen && (
          <div 
            className="hidden lg:block fixed inset-0 bg-black/10 z-backdrop transition-opacity duration-500 ease-out animate-fade-in"
            style={{ top: '80px' }}
            onClick={toggleSidebar}
            aria-hidden="true"
          />
        )}

        {/* Mobile Sidebar Toggle Button */}
        <button
          aria-label={isRightPanelOpen ? "Close thought process sidebar" : "Open thought process sidebar"}
          aria-expanded={isRightPanelOpen}
          aria-controls="mobile-thought-process-sidebar"
          onClick={toggleSidebar}
          className="lg:hidden fixed top-24 right-4 z-toggle bg-white text-gray-700 border border-gray-200 rounded-full shadow-md hover:shadow-lg w-10 h-10 flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          {isRightPanelOpen ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Mobile Sidebar Overlay */}
        <div 
          id="mobile-thought-process-sidebar"
          role="complementary"
          aria-label="Thought process sidebar"
          className={`lg:hidden fixed inset-y-0 right-0 z-sidebar mobile-sidebar-width bg-background border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
            isRightPanelOpen ? 'translate-x-0' : 'translate-x-full'
          }`} 
          style={{ top: '80px' }}
        >
          {/* Mobile Sidebar Header */}
          <div className="flex-shrink-0 p-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">AI Thought Process</h2>
              <button
                onClick={toggleSidebar}
                aria-label="Close sidebar"
                className="p-2 rounded-full hover:bg-muted transition-colors duration-200 focus-ring"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Mobile Sidebar Content */}
          <div className="flex-1 min-h-0 p-4 sidebar-scroll">
            <ThoughtProcess steps={thoughtSteps} />
          </div>
        </div>

        {/* Mobile Backdrop */}
        {isRightPanelOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/30 z-backdrop transition-opacity duration-300 animate-fade-in"
            style={{ top: '80px' }}
            onClick={toggleSidebar}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
};

export default Index;
