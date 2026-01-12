import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SimulatedMessage } from '@/data/mockConversation';
import { cn } from '@/lib/utils';

interface ConversationOverlayProps {
  currentUserMessage: SimulatedMessage | null;
  currentAiMessage: SimulatedMessage | null;
}

const messageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.95 },
};

export const ConversationOverlay: React.FC<ConversationOverlayProps> = ({ 
  currentUserMessage, 
  currentAiMessage 
}) => {
  return (
    <div 
      className="absolute inset-x-4 top-6 pointer-events-none flex flex-col justify-start"
      aria-live="polite"
      role="log"
    >
      <AnimatePresence>
        {currentUserMessage && (
          <motion.div
            key={`user-${currentUserMessage.id}`}
            variants={messageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="self-end max-w-[80%] mb-4"
          >
            <div
              className={cn(
                "rounded-2xl px-5 py-3 text-white/95 font-medium tracking-tight",
                "bg-white/10 backdrop-blur-2xl border border-white/5 shadow-2xl shadow-black/20"
              )}
            >
              <p>{currentUserMessage.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentAiMessage && (
          <motion.div
            key={`ai-${currentAiMessage.id}`}
            variants={messageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
            className="self-start max-w-[80%]"
          >
            <div
              className={cn(
                "rounded-2xl px-5 py-3 text-white/80 font-medium tracking-tight",
                "bg-black/10 backdrop-blur-2xl border border-white/5 shadow-2xl shadow-black/20"
              )}
            >
              <p>{currentAiMessage.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 