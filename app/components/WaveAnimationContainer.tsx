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
      className={`absolute inset-0 pointer-events-none z-10 ${className}`}
    >
      {/* Invisible container that doesn't affect layout */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center justify-center space-x-2 w-full">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 rounded-full bg-gray-400 dark:bg-gray-600"
              animate={{
                height: ['20px', '60px', '20px'],
                opacity: [0.4, 0.8, 0.4]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.1,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
