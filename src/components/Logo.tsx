import React from 'react';

/**
 * Simple word-mark logo for Mise.
 * Uses a subtle orange gradient + inset shadow for a crisp modern look.
 */
export const Logo = ({ className = "" }: { className?: string }) => (
  <span
    className={
      `inline-block text-transparent bg-clip-text bg-gradient-to-br ` +
      `from-orange-500 via-orange-500 to-orange-400 font-extrabold tracking-tight ` +
      `drop-shadow-sm ${className}`
    }
  >
    Mise
  </span>
); 