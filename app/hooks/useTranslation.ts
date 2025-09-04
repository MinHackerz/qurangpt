'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { detectLanguage as detectLanguageUtil, validateLanguageCode } from '../utils/languageDetection';

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
      // Failed to load translation cache from localStorage
    }
  }, [cacheTimeout]);

  // Save cache to localStorage when it changes, but debounced to prevent excessive writes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem('quran-gpt-translation-cache', JSON.stringify(cache));
      } catch (err) {
        // Failed to save translation cache to localStorage
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
    // Use the centralized language detection utility
    return detectLanguageUtil(text);
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
    
    // Validate target language
    const validatedTargetLang = validateLanguageCode(targetLanguage);
    
    // Skip translation if source and target are the same
    if (detectedSourceLang === validatedTargetLang) {
      const sameLanguageResult: Translation = {
        translatedText: text,
        sourceLanguage: detectedSourceLang,
        targetLanguage: validatedTargetLang,
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
            targetLanguage: validatedTargetLang,
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
        const cacheKey = generateCacheKey(text, validatedTargetLang);
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
    // Return comprehensive supported languages list matching languageDetection.ts
    return {
      supportedLanguages: {
        // Major languages
        'en': { name: 'English', nativeName: 'English' },
        'ar': { name: 'Arabic', nativeName: 'العربية' },
        'zh': { name: 'Chinese', nativeName: '中文' },
        'hi': { name: 'Hindi', nativeName: 'हिन्दी' },
        'es': { name: 'Spanish', nativeName: 'Español' },
        'fr': { name: 'French', nativeName: 'Français' },
        'de': { name: 'German', nativeName: 'Deutsch' },
        'ja': { name: 'Japanese', nativeName: '日本語' },
        'ko': { name: 'Korean', nativeName: '한국어' },
        'pt': { name: 'Portuguese', nativeName: 'Português' },
        'it': { name: 'Italian', nativeName: 'Italiano' },
        'ru': { name: 'Russian', nativeName: 'Русский' },
        'tr': { name: 'Turkish', nativeName: 'Türkçe' },
        'nl': { name: 'Dutch', nativeName: 'Nederlands' },
        'sv': { name: 'Swedish', nativeName: 'Svenska' },
        'da': { name: 'Danish', nativeName: 'Dansk' },
        'no': { name: 'Norwegian', nativeName: 'Norsk' },
        'fi': { name: 'Finnish', nativeName: 'Suomi' },
        'pl': { name: 'Polish', nativeName: 'Polski' },
        'cs': { name: 'Czech', nativeName: 'Čeština' },
        'hu': { name: 'Hungarian', nativeName: 'Magyar' },
        'ro': { name: 'Romanian', nativeName: 'Română' },
        'bg': { name: 'Bulgarian', nativeName: 'Български' },
        'hr': { name: 'Croatian', nativeName: 'Hrvatski' },
        'sk': { name: 'Slovak', nativeName: 'Slovenčina' },
        'sl': { name: 'Slovenian', nativeName: 'Slovenščina' },
        'et': { name: 'Estonian', nativeName: 'Eesti' },
        'lv': { name: 'Latvian', nativeName: 'Latviešu' },
        'lt': { name: 'Lithuanian', nativeName: 'Lietuvių' },
        'el': { name: 'Greek', nativeName: 'Ελληνικά' },
        'he': { name: 'Hebrew', nativeName: 'עברית' },
        'th': { name: 'Thai', nativeName: 'ไทย' },
        'vi': { name: 'Vietnamese', nativeName: 'Tiếng Việt' },
        'id': { name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
        'ms': { name: 'Malay', nativeName: 'Bahasa Melayu' },
        'tl': { name: 'Filipino', nativeName: 'Filipino' },
        'bn': { name: 'Bengali', nativeName: 'বাংলা' },
        'ur': { name: 'Urdu', nativeName: 'اردو' },
        'fa': { name: 'Persian', nativeName: 'فارسی' },
        'ta': { name: 'Tamil', nativeName: 'தமிழ்' },
        'te': { name: 'Telugu', nativeName: 'తెలుగు' },
        'ml': { name: 'Malayalam', nativeName: 'മലയാളം' },
        'kn': { name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
        'gu': { name: 'Gujarati', nativeName: 'ગુજરાતી' },
        'pa': { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
        'or': { name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
        'as': { name: 'Assamese', nativeName: 'অসমীয়া' },
        'mr': { name: 'Marathi', nativeName: 'मराठी' },
        'ne': { name: 'Nepali', nativeName: 'नेपाली' },
        'si': { name: 'Sinhala', nativeName: 'සිංහල' },
        'my': { name: 'Myanmar', nativeName: 'မြန်မာ' },
        'km': { name: 'Khmer', nativeName: 'ខ្មែរ' },
        'lo': { name: 'Lao', nativeName: 'ລາວ' },
        'sw': { name: 'Swahili', nativeName: 'Kiswahili' },
        'ha': { name: 'Hausa', nativeName: 'Hausa' },
        'yo': { name: 'Yoruba', nativeName: 'Yorùbá' },
        'ig': { name: 'Igbo', nativeName: 'Igbo' },
        'am': { name: 'Amharic', nativeName: 'አማርኛ' },
        'so': { name: 'Somali', nativeName: 'Soomaali' },
        'zu': { name: 'Zulu', nativeName: 'IsiZulu' },
        'xh': { name: 'Xhosa', nativeName: 'IsiXhosa' },
        'af': { name: 'Afrikaans', nativeName: 'Afrikaans' },
        'sq': { name: 'Albanian', nativeName: 'Shqip' },
        'mk': { name: 'Macedonian', nativeName: 'Македонски' },
        'be': { name: 'Belarusian', nativeName: 'Беларуская' },
        'uk': { name: 'Ukrainian', nativeName: 'Українська' },
        'kk': { name: 'Kazakh', nativeName: 'Қазақша' },
        'ky': { name: 'Kyrgyz', nativeName: 'Кыргызча' },
        'uz': { name: 'Uzbek', nativeName: 'Oʻzbekcha' },
        'tk': { name: 'Turkmen', nativeName: 'Türkmençe' },
        'tg': { name: 'Tajik', nativeName: 'Тоҷикӣ' },
        'mn': { name: 'Mongolian', nativeName: 'Монгол' },
        'ka': { name: 'Georgian', nativeName: 'ქართული' },
        'hy': { name: 'Armenian', nativeName: 'Հայերեն' },
        'az': { name: 'Azerbaijani', nativeName: 'Azərbaycan' },
        
        // Additional languages from languageDetection.ts
        'ku': { name: 'Kurdish', nativeName: 'Kurdî' },
        'ps': { name: 'Pashto', nativeName: 'پښتو' },
        'sd': { name: 'Sindhi', nativeName: 'سنڌي' },
        'ug': { name: 'Uyghur', nativeName: 'ئۇيغۇرچە' },
        'ckb': { name: 'Central Kurdish', nativeName: 'کوردیی ناوەندی' },
        'yi': { name: 'Yiddish', nativeName: 'ייִדיש' },
        'jv': { name: 'Javanese', nativeName: 'Basa Jawa' },
        'su': { name: 'Sundanese', nativeName: 'Basa Sunda' },
        'ceb': { name: 'Cebuano', nativeName: 'Cebuano' },
        'haw': { name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi' },
        'mi': { name: 'Maori', nativeName: 'Te Reo Māori' },
        'sm': { name: 'Samoan', nativeName: 'Gagana Samoa' },
        'to': { name: 'Tongan', nativeName: 'Lea fakatonga' },
        'fj': { name: 'Fijian', nativeName: 'Vosa Vakaviti' },
        'eo': { name: 'Esperanto', nativeName: 'Esperanto' },
        'la': { name: 'Latin', nativeName: 'Latina' },
        'hmn': { name: 'Hmong', nativeName: 'Hmoob' },
        'co': { name: 'Corsican', nativeName: 'Corsu' },
        'fy': { name: 'Frisian', nativeName: 'Frysk' },
        'ht': { name: 'Haitian Creole', nativeName: 'Kreyòl ayisyen' },
        'lb': { name: 'Luxembourgish', nativeName: 'Lëtzebuergesch' },
        'mg': { name: 'Malagasy', nativeName: 'Malagasy' },
        'ny': { name: 'Chichewa', nativeName: 'Chichewa' },
        'sn': { name: 'Shona', nativeName: 'ChiShona' },
        'ff': { name: 'Fulani', nativeName: 'Fulfulde' },
        'wo': { name: 'Wolof', nativeName: 'Wolof' },
        'bm': { name: 'Bambara', nativeName: 'Bamanankan' },
        'dyu': { name: 'Dyula', nativeName: 'Dyula' },
        'ee': { name: 'Ewe', nativeName: 'Eʋegbe' },
        'gaa': { name: 'Ga', nativeName: 'Ga' },
        'ti': { name: 'Tigrinya', nativeName: 'ትግርኛ' },
        'om': { name: 'Oromo', nativeName: 'Afaan Oromoo' },
        
        // Additional missing languages from languageDetection.ts
        'ak': { name: 'Akan', nativeName: 'Akan' },
        'bs': { name: 'Bosnian', nativeName: 'Bosanski' },
        'ca': { name: 'Catalan', nativeName: 'Català' },
        'gl': { name: 'Galician', nativeName: 'Galego' },
        'is': { name: 'Icelandic', nativeName: 'Íslenska' },
        'lg': { name: 'Luganda', nativeName: 'Luganda' },
        'nr': { name: 'Southern Ndebele', nativeName: 'IsiNdebele' },
        'rn': { name: 'Kirundi', nativeName: 'Ikirundi' },
        'rw': { name: 'Kinyarwanda', nativeName: 'Ikinyarwanda' },
        'sr': { name: 'Serbian', nativeName: 'Српски' },
        'ss': { name: 'Swati', nativeName: 'SiSwati' },
        'st': { name: 'Sesotho', nativeName: 'Sesotho' },
        'tn': { name: 'Tswana', nativeName: 'Setswana' },
        'ts': { name: 'Tsonga', nativeName: 'Xitsonga' },
        'tw': { name: 'Twi', nativeName: 'Twi' },
        've': { name: 'Venda', nativeName: 'Tshivenḓa' }
      }
    };
  }, []);

  const clearCache = useCallback(() => {
    setCache({});
    setStats({ totalTranslations: 0, cacheHits: 0 });
    try {
      localStorage.removeItem('quran-gpt-translation-cache');
    } catch (err) {
      // Failed to clear translation cache from localStorage
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
