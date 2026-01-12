import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Sparkles, RefreshCw, Video, Volume2, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useABTesting } from '@/hooks/useABTesting';
import { ConversationOverlay } from './ConversationOverlay';
import { SimulatedMessage } from '@/data/mockConversation';
import { motion } from 'framer-motion';
import { VideoControls } from './VideoControls';

interface VideoRecordingFlowProps {
  onClose: () => void;
  onVideoRecorded: (videoBlob: Blob) => void;
  isMobile?: boolean;
}

export const VideoRecordingFlow: React.FC<VideoRecordingFlowProps> = ({
  onClose,
  onVideoRecorded,
  isMobile = false,
}) => {
  const [stage, setStage] = useState<'confirmation' | 'recording'>('confirmation');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [currentUserMessage, setCurrentUserMessage] = useState<SimulatedMessage | null>(null);
  const [currentAiMessage, setCurrentAiMessage] = useState<SimulatedMessage | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isAiMuted, setIsAiMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null); // Restored for stable stream reference
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isSwitchingCameraRef = useRef(false);
  const { toast } = useToast();
  const { currentVideoConfirmation } = useABTesting();

  // Effect to attach the stream to the video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    // Failsafe cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Effect for recording timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  const startRecording = async (currentFacingMode: 'user' | 'environment') => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { ideal: currentFacingMode }
        },
        audio: true
      });

      streamRef.current = mediaStream; // Use ref
      setStream(mediaStream);
      setIsCameraOn(true);
      setIsMicOn(true);

      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (isSwitchingCameraRef.current) {
          isSwitchingCameraRef.current = false;
          return;
        }
        
        const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' });
        if (videoBlob.size > 0) {
          onVideoRecorded(videoBlob);
        }
        
        // Full cleanup, using the ref
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        setStream(null);
        setIsRecording(false);
        onClose();
      };

      mediaRecorder.start();
      if (!isRecording) {
        setIsRecording(true);
        setStage('recording');
        setRecordingTime(0);
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to record video.",
        variant: "destructive"
      });
    }
  };

  const switchCamera = async () => {
    if (!isRecording) return;

    isSwitchingCameraRef.current = true;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Wait a moment for resources to release
    await new Promise(resolve => setTimeout(resolve, 100));

    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    await startRecording(newFacingMode);
  };

  const handleStopSession = () => {
    // This is now the single point of entry for stopping the session.
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop(); // Triggers the onstop event for full cleanup
    } else {
      // If not recording, just clean up and close immediately
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      onClose();
    }
  };

  const handleToggleCamera = () => {
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach(track => {
          track.enabled = !track.enabled;
        });
        setIsCameraOn(prev => !prev);
      }
    }
  };

  const handleToggleMic = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks.forEach(track => {
          track.enabled = !track.enabled;
        });
        setIsMicOn(prev => !prev);
      }
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newUserMessage: SimulatedMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputValue,
    };
    setCurrentUserMessage(newUserMessage);
    setCurrentAiMessage(null);
    setInputValue('');

    setTimeout(() => {
      const aiResponse: SimulatedMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: "That's a great question! Let me look into that for you.",
      };
      setCurrentAiMessage(aiResponse);
    }, 1200);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Confirmation Modal
  if (stage === 'confirmation') {
    return (
      <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-xl flex items-end lg:items-center justify-center p-4">
        {/* Mobile: Slide up from bottom */}
        <motion.div
          initial={{ opacity: 0, y: isMobile ? '100%' : 20, scale: isMobile ? 1 : 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: isMobile ? '100%' : 20, scale: isMobile ? 1 : 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-md lg:max-w-lg bg-white/15 backdrop-blur-lg rounded-2xl lg:rounded-3xl shadow-2xl border border-white/20 p-6 lg:p-8 transform transition-all duration-500 ease-out animate-slide-in-right lg:animate-scale-in"
        >
          
          {/* Glowing border effect */}
          <div className="absolute inset-0 rounded-2xl lg:rounded-3xl bg-gradient-to-r from-orange-400/20 via-red-400/20 to-amber-400/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          {/* Close button */}
          <button 
            onClick={handleStopSession}
            aria-label="Close"
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-105"
          >
            <X className="w-4 h-4 text-white/80" />
          </button>

          <div className="text-center space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="text-xl lg:text-2xl font-inter font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-amber-300"
              >
                {currentVideoConfirmation.title}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="text-sm lg:text-base text-white/70 font-inter tracking-tight"
              >
                {currentVideoConfirmation.description}
              </motion.p>
            </div>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="flex flex-col lg:flex-row gap-3 lg:gap-4"
            >
              <Button
                onClick={() => startRecording(facingMode)}
                className="w-full lg:flex-1 bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/50 rounded-full py-3 lg:py-4 font-inter tracking-tight transition-all duration-200 hover:scale-105 hover:shadow-lg relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400/10 to-red-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Play className="w-4 h-4 mr-2" />
                Start Recording
              </Button>
              
              <Button
                onClick={handleStopSession}
                variant="ghost"
                className="w-full lg:flex-1 text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full py-3 lg:py-4 font-inter tracking-tight transition-all duration-200 hover:bg-white/10"
              >
                Cancel
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Recording State
  if (stage === 'recording') {
    return (
      <div className="fixed inset-0 z-[100] bg-black">
        {/* Video Preview */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover brightness-75"
        />

        <ConversationOverlay 
          currentUserMessage={currentUserMessage}
          currentAiMessage={currentAiMessage}
        />

        {/* --- Bottom Controls --- */}
        <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-4 pointer-events-auto">
          <VideoControls 
            isMobile={isMobile}
            isCameraOn={isCameraOn}
            isMicOn={isMicOn}
            isAiMuted={isAiMuted}
            facingMode={facingMode}
            onToggleCamera={handleToggleCamera}
            onToggleMic={handleToggleMic}
            onSwitchCamera={switchCamera}
            onToggleAiMuted={() => setIsAiMuted(prev => !prev)}
          />

          {/* Bottom input bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="flex items-center gap-2 p-2 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 shadow-lg w-[92%] max-w-lg"
          >
            <input
              type="text"
              placeholder="Ask Anything"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              className="flex-1 bg-transparent text-white placeholder:text-white/50 text-base px-3 py-2 border-none focus:outline-none focus:ring-0"
            />
            <motion.button
              onClick={handleStopSession}
              whileTap={{ scale: 0.95 }}
              className="px-5 py-2.5 rounded-full bg-white/90 text-black font-semibold flex items-center gap-2"
            >
              <div className="w-2.5 h-2.5 bg-black rounded-sm" />
              Stop
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
};

export default VideoRecordingFlow;