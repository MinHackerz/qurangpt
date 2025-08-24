'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface Translation {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  translationId: string;
}

interface TranslationCache {
  [key: string]: {
    translation: Translation;
    timestamp: number;
    accessCount: number;
  };
}

interface TranslationError {
  message: string;
  code: string;
  timestamp: number;
}

interface UseTranslationOptions {
  context?: 'islamic' | 'general' | 'quran';
  preserveFormatting?: boolean;
  cacheTimeout?: number; // in milliseconds
  maxRetries?: number;
  retryDelay?: number; // in milliseconds
}

interface UseTranslationReturn {
  translate: (text: string, targetLanguage: string, sourceLanguage?: string) => Promise<Translation>;
  isLoading: boolean;
  error: TranslationError | null;
  cache: TranslationCache;
  clearCache: () => void;
  getCachedTranslation: (text: string, targetLanguage: string) => Translation | null;
  getTranslationStats: () => {
    totalTranslations: number;
    cacheHits: number;
    cacheSize: number;
    averageConfidence: number;
  };
  detectLanguage: (text: string) => Promise<string>;
  getSupportedLanguages: () => Promise<any>;
}

export function useTranslation(options: UseTranslationOptions = {}): UseTranslationReturn {
  const {
    context = 'general',
    preserveFormatting = true,
    cacheTimeout = 60 * 60 * 1000, // 1 hour default
    maxRetries = 3,
    retryDelay = 1000
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<TranslationError | null>(null);
  const [cache, setCache] = useState<TranslationCache>({});
  const [stats, setStats] = useState({
    totalTranslations: 0,
    cacheHits: 0
  });
  const cacheHitsRef = useRef(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRequestTime = useRef<number>(0);
  const MIN_REQUEST_INTERVAL = 1000; // Minimum 1 second between requests

  // Load cache from localStorage on mount
  useEffect(() => {
    try {
      const savedCache = localStorage.getItem('quran-gpt-translation-cache');
      if (savedCache) {
        const parsedCache = JSON.parse(savedCache);
        // Filter out expired entries
        const now = Date.now();
        const validCache: TranslationCache = {};
        
        Object.entries(parsedCache).forEach(([key, value]) => {
          const cacheEntry = value as TranslationCache[string];
          if (now - cacheEntry.timestamp < cacheTimeout) {
            validCache[key] = cacheEntry;
          }
        });
        
        setCache(validCache);
      }
    } catch (err) {
      console.warn('Failed to load translation cache from localStorage:', err);
    }
  }, [cacheTimeout]);

  // Save cache to localStorage when it changes, but debounced to prevent excessive writes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem('quran-gpt-translation-cache', JSON.stringify(cache));
      } catch (err) {
        console.warn('Failed to save translation cache to localStorage:', err);
      }
    }, 1000); // Debounce by 1 second
    
    return () => clearTimeout(timeoutId);
  }, [cache]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const generateCacheKey = useCallback((text: string, targetLanguage: string): string => {
    // Use first 200 chars of text for cache key to handle long texts
    const textKey = text.substring(0, 200);
    return `${textKey}_${targetLanguage}_${context}`;
  }, [context]);

  const getCachedTranslation = useCallback((text: string, targetLanguage: string): Translation | null => {
    const cacheKey = generateCacheKey(text, targetLanguage);
    const cached = cache[cacheKey];
    
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > cacheTimeout) {
      // Remove expired cache entry
      setCache(prev => {
        const newCache = { ...prev };
        delete newCache[cacheKey];
        return newCache;
      });
      return null;
    }

    // Update access count and timestamp only if significant time has passed (more than 1 minute)
    if (now - cached.timestamp > 60000) { // 1 minute
      setCache(prev => ({
        ...prev,
        [cacheKey]: {
          ...cached,
          accessCount: cached.accessCount + 1,
          timestamp: now // Refresh timestamp on access
        }
      }));
    }

    // Track cache hits without causing re-renders
    cacheHitsRef.current += 1;
    return cached.translation;
  }, [cache, cacheTimeout, generateCacheKey]);

  const detectLanguage = useCallback(async (text: string): Promise<string> => {
    // Advanced language detection using multiple heuristics
    const patterns = {
      ar: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/,
      fa: /[\u0600-\u06FF].*[\u06A9\u06AF\u06CC\u067E\u0686\u0698]/,
      ur: /[\u0600-\u06FF].*[\u0627\u0628\u067E\u062A\u0679]/,
      hi: /[\u0900-\u097F]/,
      bn: /[\u0980-\u09FF]/,
      ta: /[\u0B80-\u0BFF]/,
      te: /[\u0C00-\u0C7F]/,
      ml: /[\u0D00-\u0D7F]/,
      zh: /[\u4e00-\u9fff]/,
      ja: /[\u3040-\u309f\u30a0-\u30ff]/,
      ko: /[\uac00-\ud7af]/,
      ru: /[\u0400-\u04FF]/,
      th: /[\u0E00-\u0E7F]/,
      am: /[\u1200-\u137F]/,
      so: /[qxc].*[aeiou]|dh|kh|sh/i,
      sw: /na|wa|ya|ni|ku|m[aeiou]/i,
    };

    // Check for script-based detection first
    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }

    // Statistical analysis for Latin-script languages
    const textLower = text.toLowerCase();
    const words = textLower.split(/\s+/).filter(word => word.length > 2);
    
    if (words.length === 0) return 'en';

    // Language-specific word patterns and frequency analysis
    const languageIndicators = {
      es: ['que', 'con', 'una', 'por', 'para', 'como', 'más', 'pero', 'sus', 'les'],
      fr: ['que', 'des', 'les', 'une', 'sur', 'avec', 'son', 'dans', 'pour', 'tout'],
      de: ['der', 'die', 'und', 'den', 'das', 'von', 'ist', 'mit', 'auf', 'für'],
      it: ['che', 'con', 'una', 'per', 'sono', 'come', 'più', 'dalla', 'anche', 'loro'],
      pt: ['que', 'com', 'uma', 'para', 'são', 'como', 'mais', 'pela', 'seus', 'tem'],
      id: ['yang', 'dan', 'ini', 'itu', 'untuk', 'pada', 'dalam', 'dengan', 'dari', 'akan'],
      ms: ['yang', 'dan', 'ini', 'itu', 'untuk', 'pada', 'dalam', 'dengan', 'dari', 'akan'],
      tr: ['bir', 'bu', 've', 'de', 'da', 'ile', 'için', 'var', 'olan', 'gibi'],
      vi: ['của', 'và', 'có', 'trong', 'với', 'để', 'được', 'cho', 'từ', 'này']
    };

    let maxScore = 0;
    let detectedLang = 'en';

    for (const [lang, indicators] of Object.entries(languageIndicators)) {
      const matches = words.filter(word => indicators.includes(word)).length;
      const score = matches / Math.min(words.length, 20); // Normalize by text length
      
      if (score > maxScore) {
        maxScore = score;
        detectedLang = lang;
      }
    }

    return maxScore > 0.1 ? detectedLang : 'en';
  }, []);

  const translate = useCallback(async (
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<Translation> => {
    if (!text.trim()) {
      throw new Error('Text cannot be empty');
    }

    // Check cache first
    const cached = getCachedTranslation(text, targetLanguage);
    if (cached) {
      return cached;
    }

    // Detect source language if not provided
    const detectedSourceLang = sourceLanguage || await detectLanguage(text);
    
    // Skip translation if source and target are the same
    if (detectedSourceLang === targetLanguage) {
      const sameLanguageResult: Translation = {
        translatedText: text,
        sourceLanguage: detectedSourceLang,
        targetLanguage,
        confidence: 1.0,
        translationId: `same_${Date.now()}`
      };
      return sameLanguageResult;
    }

    // Rate limiting - ensure minimum interval between requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    lastRequestTime.current = Date.now();

    setIsLoading(true);
    setError(null);

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const attemptTranslation = async (attempt: number): Promise<Translation> => {
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            targetLanguage,
            sourceLanguage: detectedSourceLang,
            context,
            preserveFormatting
          }),
          signal: abortControllerRef.current?.signal
        });

        if (!response.ok) {
          const errorData = await response.json();
          
          // Handle quota exceeded error specifically
          if (response.status === 429 || errorData.error?.includes('quota') || errorData.error?.includes('rate limit')) {
            const errorMessage = response.status === 429 
              ? 'Too many translation requests. Please wait a moment before trying again.'
              : 'Translation quota exceeded. Please try again later.';
            throw new Error(errorMessage);
          }
          
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const translation: Translation = await response.json();
        
        // Cache the successful translation
        const cacheKey = generateCacheKey(text, targetLanguage);
        setCache(prev => ({
          ...prev,
          [cacheKey]: {
            translation,
            timestamp: Date.now(),
            accessCount: 1
          }
        }));

        setStats(prev => ({
          ...prev,
          totalTranslations: prev.totalTranslations + 1
        }));

        return translation;

      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw err;
        }

        if (attempt < maxRetries) {
          // For quota errors, wait longer before retrying
          const isQuotaError = err instanceof Error && 
            (err.message.includes('quota') || err.message.includes('rate limit') || err.message.includes('Too many'));
          const waitTime = isQuotaError ? retryDelay * Math.pow(2, attempt) * 1000 : retryDelay * attempt * 1000;
          
          // Update loading state to show retry progress
          setIsLoading(true);
          
          await new Promise(resolve => {
            retryTimeoutRef.current = setTimeout(resolve, waitTime);
          });
          return attemptTranslation(attempt + 1);
        }
        
        // All retries failed, provide helpful error message
        if (err instanceof Error && err.message.includes('quota')) {
          throw new Error('Translation service is currently unavailable due to high usage. Please try again later or use cached translations if available.');
        }
        
        throw err;
      }
    };

    try {
      const result = await attemptTranslation(1);
      return result;
    } catch (err) {
      const error: TranslationError = {
        message: err instanceof Error ? err.message : 'Translation failed',
        code: 'TRANSLATION_ERROR',
        timestamp: Date.now()
      };
      setError(error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [
    context,
    preserveFormatting,
    maxRetries,
    retryDelay,
    getCachedTranslation,
    generateCacheKey,
    detectLanguage
  ]);

  const getSupportedLanguages = useCallback(async () => {
    try {
      const response = await fetch('/api/translate');
      if (!response.ok) {
        throw new Error('Failed to fetch supported languages');
      }
      return await response.json();
    } catch (err) {
      console.error('Error fetching supported languages:', err);
      throw err;
    }
  }, []);

  const clearCache = useCallback(() => {
    setCache({});
    setStats({ totalTranslations: 0, cacheHits: 0 });
    try {
      localStorage.removeItem('quran-gpt-translation-cache');
    } catch (err) {
      console.warn('Failed to clear translation cache from localStorage:', err);
    }
  }, []);

  const getTranslationStats = useCallback(() => {
    const translations = Object.values(cache);
    const totalConfidence = translations.reduce((sum, entry) => sum + entry.translation.confidence, 0);
    
    return {
      totalTranslations: stats.totalTranslations,
      cacheHits: cacheHitsRef.current,
      cacheSize: Object.keys(cache).length,
      averageConfidence: translations.length > 0 ? totalConfidence / translations.length : 0
    };
  }, [cache, stats]);

  return {
    translate,
    isLoading,
    error,
    cache,
    clearCache,
    getCachedTranslation,
    getTranslationStats,
    detectLanguage,
    getSupportedLanguages
  };
}
