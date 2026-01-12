import React from 'react';
import { motion } from 'framer-motion';
import { Video, VideoOff, Mic, MicOff, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoControlsProps {
  isMobile: boolean;
  isCameraOn: boolean;
  isMicOn: boolean;
  isAiMuted: boolean;
  facingMode?: 'environment' | 'user';
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onSwitchCamera: () => void;
  onToggleAiMuted: () => void;
}

const buttonVariants = {
  tap: { scale: 0.9, transition: { duration: 0.1 } },
};

export const VideoControls: React.FC<VideoControlsProps> = ({
  isMobile,
  isCameraOn,
  isMicOn,
  isAiMuted,
  facingMode = 'environment',
  onToggleCamera,
  onToggleMic,
  onSwitchCamera,
  onToggleAiMuted,
}) => {
  const commonButtonClass = "p-2.5 rounded-full transition-colors duration-200";
  const activeButtonClass = "bg-white/90 text-black";
  const inactiveButtonClass = "bg-white/10 hover:bg-white/20 text-white";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="flex items-center gap-2 p-1.5 rounded-full bg-black/25 backdrop-blur-xl border border-white/10 shadow-lg"
    >
      {/* Turn On/Off Camera */}
      <motion.button
        variants={buttonVariants}
        whileTap="tap"
        onClick={onToggleCamera}
        className={cn(commonButtonClass, isCameraOn ? activeButtonClass : inactiveButtonClass)}
        aria-label={isCameraOn ? "Turn off camera" : "Turn on camera"}
      >
        {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
      </motion.button>
      
      {/* Mute/Unmute Mic */}
      <motion.button
        variants={buttonVariants}
        whileTap="tap"
        onClick={onToggleMic}
        className={cn(commonButtonClass, isMicOn ? activeButtonClass : inactiveButtonClass)}
        aria-label={isMicOn ? "Mute microphone" : "Unmute microphone"}
      >
        {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
      </motion.button>

      {isMobile ? (
        // Mobile: Switch Camera
        <motion.button
          variants={buttonVariants}
          whileTap="tap"
          onClick={onSwitchCamera}
          className={cn(commonButtonClass, "bg-black/30 hover:bg-black/50 text-white border border-white/20")}
          aria-label="Switch camera"
        >
          <motion.div
            animate={{ 
              rotateY: facingMode === 'user' ? 180 : 0 
            }}
            transition={{ 
              duration: 0.6,
              ease: "easeInOut"
            }}
          >
            <RefreshCw className="w-4 h-4" />
          </motion.div>
        </motion.button>
      ) : (
        // Desktop: Mute AI Voice
        <motion.button
          variants={buttonVariants}
          whileTap="tap"
          onClick={onToggleAiMuted}
          className={cn(commonButtonClass, isAiMuted ? activeButtonClass : inactiveButtonClass)}
          aria-label={isAiMuted ? "Unmute AI response" : "Mute AI response"}
        >
          {isAiMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </motion.button>
      )}
    </motion.div>
  );
}; 