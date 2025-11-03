'use client';

import { motion } from 'framer-motion';

interface WaveAnimationContainerProps {
  isVisible: boolean;
  className?: string;
}

export default function WaveAnimationContainer({ 
  isVisible, 
  className = "" 
}: WaveAnimationContainerProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`flex items-center justify-center w-full h-full pointer-events-none z-10 ${className}`}
    >
      {/* Container for the loading animation GIF - centered on both mobile and desktop */}
      <img
        src="/qurangpt_loading_animation_with_text.gif"
        alt="Loading..."
        className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 object-contain"
        loading="eager"
        decoding="async"
      />
    </motion.div>
  );
}
