import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import VideoRecordingFlow from './VideoRecordingFlow';
import { useToast } from '@/hooks/use-toast';

interface VideoTriggerProps {
  isMobile?: boolean;
  showVideoFlow?: boolean;
  onClose?: () => void;
}

export const VideoTrigger: React.FC<VideoTriggerProps> = ({ 
  isMobile = false, 
  showVideoFlow = false, 
  onClose 
}) => {
  const [internalShowVideoFlow, setInternalShowVideoFlow] = useState(false);
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const { toast } = useToast();

  // Use external control if provided, otherwise use internal state
  const videoFlowActive = showVideoFlow || internalShowVideoFlow;

  // Mobile swipe gesture detection - now horizontal
  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const screenWidth = window.innerWidth;
      const triggerZone = screenWidth * 0.1; // Left 10% of screen
      
      if (touch.clientX < triggerZone) {
        setSwipeStartX(touch.clientX);
        setIsSwipeActive(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwipeActive || swipeStartX === null) return;
      
      const touch = e.touches[0];
      const swipeDistance = touch.clientX - swipeStartX;
      const minSwipeDistance = 100;
      
      if (swipeDistance > minSwipeDistance) {
        setInternalShowVideoFlow(true);
        setIsSwipeActive(false);
        setSwipeStartX(null);
      }
    };

    const handleTouchEnd = () => {
      setIsSwipeActive(false);
      setSwipeStartX(null);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, swipeStartX, isSwipeActive]);

  const handleVideoRecorded = (videoBlob: Blob) => {
    // Handle the recorded video
    console.log('Video recorded:', videoBlob);
    
    // Here you would typically:
    // 1. Upload the video to your backend
    // 2. Create a new AI session
    // 3. Process the video with AI
    
    // Removed toast message to eliminate processing step perception.
    
    setInternalShowVideoFlow(false);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalShowVideoFlow(false);
    }
  };

  // Mobile: Swipe indicator (optional visual feedback)
  if (isMobile && isSwipeActive) {
    return (
      <div className="fixed left-0 top-0 bottom-0 w-32 pointer-events-none z-50">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <div className="bg-white/20 backdrop-blur-md rounded-full px-4 py-2 border border-white/30">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
              <span className="text-white text-sm font-inter tracking-tight">
                Swipe right for AI Video
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Return the video flow when triggered (both mobile and desktop)
  return videoFlowActive ? (
    <VideoRecordingFlow
      onClose={handleClose}
      onVideoRecorded={handleVideoRecorded}
      isMobile={isMobile}
    />
  ) : null;
};

export default VideoTrigger;