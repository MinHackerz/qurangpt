'use client';

import { useEffect, useState, useRef } from 'react';

interface UseScrollDetectionProps {
  threshold?: number; // Percentage of content scrolled to show button
  enabled?: boolean; // Whether scroll detection is enabled
  containerRef?: React.RefObject<HTMLElement | null>; // External ref to use
}

export function useScrollDetection({ 
  threshold = 0.8, 
  enabled = true,
  containerRef: externalRef
}: UseScrollDetectionProps = {}) {
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const internalRef = useRef<HTMLElement | null>(null);
  const containerRef = externalRef || internalRef;

  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      if (!containerRef.current) return;

      const element = containerRef.current;
      const { scrollTop, scrollHeight, clientHeight } = element;
      
      // Calculate scroll percentage
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
      
      // Check if user has scrolled past threshold
      setIsScrolled(scrollPercentage > 0.1);
      
      // Check if user is near bottom (within threshold)
      setIsAtBottom(scrollPercentage >= threshold);
    };

    // Set up scroll listener
    const element = containerRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll);
      // Initial check
      handleScroll();
    }

    return () => {
      if (element) {
        element.removeEventListener('scroll', handleScroll);
      }
    };
  }, [threshold, enabled, containerRef]);

  // Also listen to window scroll for cases where content might be in main scroll
  useEffect(() => {
    if (!enabled) return;

    const handleWindowScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
      
      setIsScrolled(scrollPercentage > 0.1);
      setIsAtBottom(scrollPercentage >= threshold);
    };

    // Use a more robust scroll detection
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const windowHeight = window.innerHeight;
      const documentHeight = document.body.scrollHeight;
      
      // Calculate how much of the page has been scrolled
      const scrollPercentage = scrollTop / (documentHeight - windowHeight);
      
      setIsScrolled(scrollPercentage > 0.1);
      setIsAtBottom(scrollPercentage >= threshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold, enabled]);

  return {
    isAtBottom,
    isScrolled,
    containerRef
  };
}
