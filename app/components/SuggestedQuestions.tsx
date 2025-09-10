'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { useState, useEffect, useCallback } from 'react';
import { detectLanguage, validateLanguageCode } from '../utils/languageDetection';



interface SuggestedQuestionsProps {
  userQuestion: string;
  onQuestionClick: (question: string) => void;
  isVisible: boolean;
  currentLanguage?: string;
  translatedQuestions?: string[];
  onQuestionsGenerated?: (questions: string[]) => void; // Callback to notify parent of new questions
  isTextLarge?: boolean; // Text size state from parent
  autoGenerate?: boolean; // Whether to auto-generate questions when component becomes visible
}

interface AIQuestionResponse {
  success: boolean;
  questions: string[];
  error?: string;
}

export default function SuggestedQuestions({ 
  userQuestion, 
  onQuestionClick, 
  isVisible,
  currentLanguage = 'en',
  translatedQuestions,
  onQuestionsGenerated,
  isTextLarge = false,
  autoGenerate = true
}: SuggestedQuestionsProps) {
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<string[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [generationError, setGenerationError] = useState<string>('');
  const [questionCache, setQuestionCache] = useState<Map<string, string[]>>(new Map());

  // Generate AI-powered suggested questions
  const generateAISuggestedQuestions = useCallback(async (question: string) => {
    if (!question || question.trim().length === 0) {
      // No user question provided, skipping AI generation
      return;
    }

    // Detect language from user question
    const detectedLanguage = detectLanguage(question);
    
    // Validate and sanitize the detected language
    const safeLanguage = validateLanguageCode(detectedLanguage);

    // Check cache first
    const cacheKey = `${question.toLowerCase().trim()}_${safeLanguage}`;
    const cachedQuestions = questionCache.get(cacheKey);
    
    if (cachedQuestions && cachedQuestions.length > 0) {
      setAiGeneratedQuestions(cachedQuestions);
      return;
    }

    setIsGeneratingQuestions(true);
    setGenerationError('');

    // Enhanced filtering function to clean questions
    const cleanQuestion = (question: string): string => {
      let cleaned = question.trim();
      
      // Remove text that ends with ":" (including the colon)
      const colonIndex = cleaned.lastIndexOf(':');
      if (colonIndex !== -1 && colonIndex < cleaned.length - 1) {
        // Check if there's actual content after the colon
        const afterColon = cleaned.substring(colonIndex + 1).trim();
        if (afterColon.length > 0) {
          cleaned = afterColon;
        }
      }
      
      return cleaned.trim();
    };

    // Translation metadata patterns to detect and remove (multiline support)
    const translationMetadataPatterns = [
      // English patterns (multiline support with \s* for whitespace including newlines)
      /^here\s+is\s+the\s+(english|arabic|urdu|hindi|bengali|persian|turkish|indonesian|malay|chinese|japanese|korean|russian|spanish|french|german|portuguese|italian|dutch|swedish|danish|norwegian|finnish|polish|czech|slovak|hungarian|romanian|bulgarian|croatian|serbian|bosnian|slovenian|macedonian|albanian|greek|georgian|armenian|hebrew|yiddish|kurdish|pashto|sindhi|uyghur|mongolian|thai|vietnamese|khmer|lao|myanmar|tamil|telugu|malayalam|kannada|gujarati|punjabi|odia|assamese|marathi|nepali|sinhala|swahili|hausa|yoruba|igbo|amharic|somali|afrikaans|zulu|xhosa|sotho|tswana|swati|venda|tsonga|ndebele|kinyarwanda|kirundi|luganda|akan|twi|fulah|wolof|bambara|dyula|ewe|ga|tigrinya|oromo|quechua|guarani|nahuatl|aymara|maori|samoan|tongan|fijian|hawaiian|esperanto|latin|javanese|sundanese|cebuano|filipino|hmong|corsican|frisian|haitian|luxembourgish|malagasy|chichewa|shona|belarusian|ukrainian|catalan|galician|basque|icelandic|maltese|irish|welsh|latvian|lithuanian|estonian)\s+translation\s+from\s+(hindi|arabic|urdu|bengali|persian|turkish|indonesian|malay|chinese|japanese|korean|russian|spanish|french|german|portuguese|italian|dutch|swedish|danish|norwegian|finnish|polish|czech|slovak|hungarian|romanian|bulgarian|croatian|serbian|bosnian|slovenian|macedonian|albanian|greek|georgian|armenian|hebrew|yiddish|kurdish|pashto|sindhi|uyghur|mongolian|thai|vietnamese|khmer|lao|myanmar|tamil|telugu|malayalam|kannada|gujarati|punjabi|odia|assamese|marathi|nepali|sinhala|swahili|hausa|yoruba|igbo|amharic|somali|afrikaans|zulu|xhosa|sotho|tswana|swati|venda|tsonga|ndebele|kinyarwanda|kirundi|luganda|akan|twi|fulah|wolof|bambara|dyula|ewe|ga|tigrinya|oromo|quechua|guarani|nahuatl|aymara|maori|samoan|tongan|fijian|hawaiian|esperanto|latin|javanese|sundanese|cebuano|filipino|hmong|corsican|frisian|haitian|luxembourgish|malagasy|chichewa|shona|belarusian|ukrainian|catalan|galician|basque|icelandic|maltese|irish|welsh|latvian|lithuanian|estonian)[\s\S]*?:/i,
      /^translated\s+from\s+(hindi|arabic|urdu|bengali|persian|turkish|indonesian|malay|chinese|japanese|korean|russian|spanish|french|german|portuguese|italian|dutch|swedish|danish|norwegian|finnish|polish|czech|slovak|hungarian|romanian|bulgarian|croatian|serbian|bosnian|slovenian|macedonian|albanian|greek|georgian|armenian|hebrew|yiddish|kurdish|pashto|sindhi|uyghur|mongolian|thai|vietnamese|khmer|lao|myanmar|tamil|telugu|malayalam|kannada|gujarati|punjabi|odia|assamese|marathi|nepali|sinhala|swahili|hausa|yoruba|igbo|amharic|somali|afrikaans|zulu|xhosa|sotho|tswana|swati|venda|tsonga|ndebele|kinyarwanda|kirundi|luganda|akan|twi|fulah|wolof|bambara|dyula|ewe|ga|tigrinya|oromo|quechua|guarani|nahuatl|aymara|maori|samoan|tongan|fijian|hawaiian|esperanto|latin|javanese|sundanese|cebuano|filipino|hmong|corsican|frisian|haitian|luxembourgish|malagasy|chichewa|shona|belarusian|ukrainian|catalan|galician|basque|icelandic|maltese|irish|welsh|latvian|lithuanian|estonian)\s+to\s+(english|arabic|urdu|hindi|bengali|persian|turkish|indonesian|malay|chinese|japanese|korean|russian|spanish|french|german|portuguese|italian|dutch|swedish|danish|norwegian|finnish|polish|czech|slovak|hungarian|romanian|bulgarian|croatian|serbian|bosnian|slovenian|macedonian|albanian|greek|georgian|armenian|hebrew|yiddish|kurdish|pashto|sindhi|uyghur|mongolian|thai|vietnamese|khmer|lao|myanmar|tamil|telugu|malayalam|kannada|gujarati|punjabi|odia|assamese|marathi|nepali|sinhala|swahili|hausa|yoruba|igbo|amharic|somali|afrikaans|zulu|xhosa|sotho|tswana|swati|venda|tsonga|ndebele|kinyarwanda|kirundi|luganda|akan|twi|fulah|wolof|bambara|dyula|ewe|ga|tigrinya|oromo|quechua|guarani|nahuatl|aymara|maori|samoan|tongan|fijian|hawaiian|esperanto|latin|javanese|sundanese|cebuano|filipino|hmong|corsican|frisian|haitian|luxembourgish|malagasy|chichewa|shona|belarusian|ukrainian|catalan|galician|basque|icelandic|maltese|irish|welsh|latvian|lithuanian|estonian)[\s\S]*?:/i,
      /^here's\s+the\s+(english|arabic|urdu|hindi|bengali|persian|turkish|indonesian|malay|chinese|japanese|korean|russian|spanish|french|german|portuguese|italian|dutch|swedish|danish|norwegian|finnish|polish|czech|slovak|hungarian|romanian|bulgarian|croatian|serbian|bosnian|slovenian|macedonian|albanian|greek|georgian|armenian|hebrew|yiddish|kurdish|pashto|sindhi|uyghur|mongolian|thai|vietnamese|khmer|lao|myanmar|tamil|telugu|malayalam|kannada|gujarati|punjabi|odia|assamese|marathi|nepali|sinhala|swahili|hausa|yoruba|igbo|amharic|somali|afrikaans|zulu|xhosa|sotho|tswana|swati|venda|tsonga|ndebele|kinyarwanda|kirundi|luganda|akan|twi|fulah|wolof|bambara|dyula|ewe|ga|tigrinya|oromo|quechua|guarani|nahuatl|aymara|maori|samoan|tongan|fijian|hawaiian|esperanto|latin|javanese|sundanese|cebuano|filipino|hmong|corsican|frisian|haitian|luxembourgish|malagasy|chichewa|shona|belarusian|ukrainian|catalan|galician|basque|icelandic|maltese|irish|welsh|latvian|lithuanian|estonian)\s+translation[\s\S]*?:/i,
      /^translation[\s\S]*?:/i,
      /^translated[\s\S]*?:/i,
      /^here\s+is\s+the\s+translation[\s\S]*?:/i,
      /^here's\s+the\s+translation[\s\S]*?:/i,
      
      // Bengali patterns (multiline support)
      /^এখানে\s+ইংরেজি\s+থেকে\s+বাংলা\s+অনুবাদ\s+করা\s+হলো[\s\S]*?:/i,
      /^এখানে\s+বাংলা\s+থেকে\s+ইংরেজি\s+অনুবাদ\s+করা\s+হলো[\s\S]*?:/i,
      /^এখানে\s+অনুবাদ\s+করা\s+হলো[\s\S]*?:/i,
      /^অনুবাদ[\s\S]*?:/i,
      /^এখানে\s+ইংরেজি\s+অনুবাদ[\s\S]*?:/i,
      /^এখানে\s+বাংলা\s+অনুবাদ[\s\S]*?:/i,
      
      // Arabic patterns (multiline support)
      /^هنا\s+الترجمة\s+من\s+الإنجليزية\s+إلى\s+العربية[\s\S]*?:/i,
      /^هنا\s+الترجمة\s+من\s+العربية\s+إلى\s+الإنجليزية[\s\S]*?:/i,
      /^الترجمة[\s\S]*?:/i,
      /^تم\s+الترجمة[\s\S]*?:/i,
      
      // Urdu patterns (multiline support)
      /^یہاں\s+انگریزی\s+سے\s+اردو\s+ترجمہ\s+کیا\s+گیا[\s\S]*?:/i,
      /^یہاں\s+اردو\s+سے\s+انگریزی\s+ترجمہ\s+کیا\s+گیا[\s\S]*?:/i,
      /^ترجمہ[\s\S]*?:/i,
      /^یہاں\s+ترجمہ[\s\S]*?:/i,
      
      // Hindi patterns (multiline support)
      /^यहाँ\s+अंग्रेजी\s+से\s+हिंदी\s+अनुवाद\s+किया\s+गया[\s\S]*?:/i,
      /^यहाँ\s+हिंदी\s+से\s+अंग्रेजी\s+अनुवाद\s+किया\s+गया[\s\S]*?:/i,
      /^अनुवाद[\s\S]*?:/i,
      /^यहाँ\s+अनुवाद[\s\S]*?:/i,
      
      // Persian patterns (multiline support)
      /^اینجا\s+ترجمه\s+از\s+انگلیسی\s+به\s+فارسی[\s\S]*?:/i,
      /^اینجا\s+ترجمه\s+از\s+فارسی\s+به\s+انگلیسی[\s\S]*?:/i,
      /^ترجمه[\s\S]*?:/i,
      /^اینجا\s+ترجمه[\s\S]*?:/i,
      
      // Turkish patterns (multiline support)
      /^işte\s+ingilizce'den\s+türkçe'ye\s+çeviri[\s\S]*?:/i,
      /^işte\s+türkçe'den\s+ingilizce'ye\s+çeviri[\s\S]*?:/i,
      /^çeviri[\s\S]*?:/i,
      /^işte\s+çeviri[\s\S]*?:/i,
      
      // Spanish patterns (multiline support)
      /^aquí\s+está\s+la\s+traducción\s+del\s+inglés\s+al\s+español[\s\S]*?:/i,
      /^aquí\s+está\s+la\s+traducción\s+del\s+español\s+al\s+inglés[\s\S]*?:/i,
      /^traducción[\s\S]*?:/i,
      /^aquí\s+está\s+la\s+traducción[\s\S]*?:/i,
      
      // French patterns (multiline support)
      /^voici\s+la\s+traduction\s+de\s+l'anglais\s+vers\s+le\s+français[\s\S]*?:/i,
      /^voici\s+la\s+traduction\s+du\s+français\s+vers\s+l'anglais[\s\S]*?:/i,
      /^traduction[\s\S]*?:/i,
      /^voici\s+la\s+traduction[\s\S]*?:/i,
      
      // German patterns (multiline support)
      /^hier\s+ist\s+die\s+übersetzung\s+aus\s+dem\s+englischen\s+ins\s+deutsche[\s\S]*?:/i,
      /^hier\s+ist\s+die\s+übersetzung\s+aus\s+dem\s+deutschen\s+ins\s+englische[\s\S]*?:/i,
      /^übersetzung[\s\S]*?:/i,
      /^hier\s+ist\s+die\s+übersetzung[\s\S]*?:/i,
      
      // Chinese patterns (multiline support)
      /^这是从英语到中文的翻译[\s\S]*?:/i,
      /^这是从中文到英语的翻译[\s\S]*?:/i,
      /^翻译[\s\S]*?:/i,
      /^这是翻译[\s\S]*?:/i,
      
      // Japanese patterns (multiline support)
      /^これは英語から日本語への翻訳です[\s\S]*?:/i,
      /^これは日本語から英語への翻訳です[\s\S]*?:/i,
      /^翻訳[\s\S]*?:/i,
      /^これは翻訳[\s\S]*?:/i,
      
      // Korean patterns (multiline support)
      /^여기는\s+영어에서\s+한국어로의\s+번역입니다[\s\S]*?:/i,
      /^여기는\s+한국어에서\s+영어로의\s+번역입니다[\s\S]*?:/i,
      /^번역[\s\S]*?:/i,
      /^여기는\s+번역[\s\S]*?:/i,
      
      // Russian patterns (multiline support)
      /^вот\s+перевод\s+с\s+английского\s+на\s+русский[\s\S]*?:/i,
      /^вот\s+перевод\s+с\s+русского\s+на\s+английский[\s\S]*?:/i,
      /^перевод[\s\S]*?:/i,
      /^вот\s+перевод[\s\S]*?:/i
    ];

    // Check if any questions contain unexpected language/translation messages
    const unexpectedMessages = [
      'the provided text is already in', 'there\'s nothing to translate',
      'already in', 'nothing to translate', 'preserving', 'religious accuracy',
      'islamic terms', 'translation', 'translate', 'translating', 'translated'
    ];

    try {
      const response = await fetch('/api/suggested-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userQuestion: question,
          language: safeLanguage 
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate questions: ${response.status}`);
      }

      const data: AIQuestionResponse = await response.json();
      
      if (data.success && data.questions && data.questions.length > 0) {
        
        // Clean and filter questions
        const cleanedQuestions = data.questions
          .map(cleanQuestion)
          .filter(q => {
            // Remove empty questions after cleaning
            if (!q || q.trim().length === 0) return false;
            
            // Check for translation metadata patterns
            const hasTranslationMetadata = translationMetadataPatterns.some(pattern => 
              pattern.test(q.toLowerCase())
            );
            
            if (hasTranslationMetadata) return false;
            
            // Check for other unexpected messages
            const hasUnexpectedMessage = unexpectedMessages.some(msg => 
              q.toLowerCase().includes(msg.toLowerCase())
            );
            
            return !hasUnexpectedMessage;
          })
          .filter(q => q.length > 0); // Final filter for non-empty questions
        
        if (cleanedQuestions.length > 0) {
          setAiGeneratedQuestions(cleanedQuestions);
          setQuestionCache(prev => new Map(prev).set(cacheKey, cleanedQuestions));
          onQuestionsGenerated?.(cleanedQuestions);
        } else {
          throw new Error(`All generated questions contained translation metadata or unexpected content for language: ${safeLanguage}`);
        }
      } else {
        throw new Error(data.error || 'Failed to generate questions');
      }
    } catch (error) {
      if (error instanceof Error && (
        error.message.includes('translation') || 
        error.message.includes('unexpected content') ||
        error.message.includes('language') ||
        /(Bengali|Arabic|Urdu|Hindi|Persian|Turkish|Indonesian|Malay|Chinese|Japanese|Korean|Russian|Spanish|French|German|Portuguese|Italian|Dutch|Swedish|Danish|Norwegian|Finnish|Polish|Czech|Slovak|Hungarian|Romanian|Bulgarian|Croatian|Serbian|Bosnian|Slovenian|Macedonian|Albanian|Greek|Georgian|Armenian|Hebrew|Yiddish|Kurdish|Pashto|Sindhi|Uyghur|Mongolian|Thai|Vietnamese|Khmer|Lao|Myanmar|Tamil|Telugu|Malayalam|Kannada|Gujarati|Punjabi|Odia|Assamese|Marathi|Nepali|Sinhala|Swahili|Hausa|Yoruba|Igbo|Amharic|Somali|Afrikaans|Zulu|Xhosa|Sotho|Tswana|Swati|Venda|Tsonga|Ndebele|Kinyarwanda|Kirundi|Luganda|Akan|Twi|Fulah|Wolof|Bambara|Dyula|Ewe|Ga|Tigrinya|Oromo|Quechua|Guarani|Nahuatl|Aymara|Maori|Samoan|Tongan|Fijian|Hawaiian|Esperanto|Latin|Javanese|Sundanese|Cebuano|Filipino|Hmong|Corsican|Frisian|Haitian|Luxembourgish|Malagasy|Chichewa|Shona|Belarusian|Ukrainian|Catalan|Galician|Basque|Icelandic|Maltese|Irish|Welsh|Latvian|Lithuanian|Estonian)/i.test(error.message)
      )) {
        try {
          const fallbackResponse = await fetch('/api/suggested-questions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              userQuestion: question,
              language: safeLanguage 
            }),
          });

          if (fallbackResponse.ok) {
            const fallbackData: AIQuestionResponse = await fallbackResponse.json();
            if (fallbackData.success && fallbackData.questions && fallbackData.questions.length > 0) {
              // Apply the same cleaning logic to fallback questions
              const cleanedFallbackQuestions = fallbackData.questions
                .map(cleanQuestion)
                .filter(q => {
                  if (!q || q.trim().length === 0) return false;
                  
                  const hasTranslationMetadata = translationMetadataPatterns.some(pattern => 
                    pattern.test(q.toLowerCase())
                  );
                  
                  if (hasTranslationMetadata) return false;
                  
                  const hasUnexpectedMessage = unexpectedMessages.some(msg => 
                    q.toLowerCase().includes(msg.toLowerCase())
                  );
                  
                  return !hasUnexpectedMessage;
                })
                .filter(q => q.length > 0);
              
              if (cleanedFallbackQuestions.length > 0) {
                setAiGeneratedQuestions(cleanedFallbackQuestions);
                setQuestionCache(prev => new Map(prev).set(`${question.toLowerCase().trim()}_${safeLanguage}`, cleanedFallbackQuestions));
                onQuestionsGenerated?.(cleanedFallbackQuestions);
                return;
              }
            }
          }
        } catch (fallbackError) {
          // Fallback failed
        }
        
        setAiGeneratedQuestions([]);
        setGenerationError('Failed to generate questions in the requested language');
      }
      
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate questions');
      setAiGeneratedQuestions([]);
    } finally {
      setIsGeneratingQuestions(false);
    }
  }, [questionCache, onQuestionsGenerated]);

  // Generate questions when user question changes (only if autoGenerate is enabled)
  useEffect(() => {
    if (isVisible && userQuestion && userQuestion.trim().length > 0 && autoGenerate) {
      generateAISuggestedQuestions(userQuestion);
    }
  }, [isVisible, userQuestion, generateAISuggestedQuestions, autoGenerate]);



  // Determine which questions to show based on current language and available translations
  const relevantQuestions = (() => {
    // If autoGenerate is false, don't show any existing questions
    if (!autoGenerate) {
      return [];
    }
    
    // For non-English languages, show translated questions if available
    if (currentLanguage !== 'en' && translatedQuestions && translatedQuestions.length > 0) {
      return translatedQuestions;
    }
    
    // For English, show translated questions if available, otherwise show AI-generated questions
    if (currentLanguage === 'en' && translatedQuestions && translatedQuestions.length > 0) {
      return translatedQuestions;
    }
    
    // Fallback to AI-generated questions if no translations available
    if (aiGeneratedQuestions && aiGeneratedQuestions.length > 0) {
      return aiGeneratedQuestions;
    }
    
    return [];
  })();
  
  // Show appropriate message when no questions are available
  const hasQuestions = relevantQuestions && relevantQuestions.length > 0;

  // Ensure suggested question buttons remain clickable
  useEffect(() => {
    const ensureQuestionButtonsClickable = () => {
      const questionItems = document.querySelectorAll('[data-suggested-question]');
      const questionButtons = document.querySelectorAll('[data-suggested-question] button');
      
      questionItems.forEach((item) => {
        const element = item as HTMLElement;
        element.style.pointerEvents = 'auto';
        element.style.cursor = 'pointer';
        element.style.position = 'relative';
        element.style.zIndex = '3';
      });
      
      questionButtons.forEach((button) => {
        const btn = button as HTMLElement;
        btn.style.pointerEvents = 'auto';
        btn.style.cursor = 'pointer';
        btn.style.position = 'relative';
        btn.style.zIndex = '4';
        if (btn instanceof HTMLButtonElement) {
          btn.disabled = false;
        }
      });
    };

    // Run immediately when questions are available
    if (hasQuestions) {
      setTimeout(ensureQuestionButtonsClickable, 100);
    }

    // Set up interval to periodically check
    const interval = setInterval(ensureQuestionButtonsClickable, 2000);

    return () => clearInterval(interval);
  }, [hasQuestions, relevantQuestions]);

  if (!isVisible || !userQuestion || userQuestion.trim().length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-4xl mx-auto px-3 sm:px-4 lg:px-0 mb-8 sm:mb-0"
        style={{ zIndex: 60 }}
      >
        {/* Suggested Questions Container */}
        <div className="bg-transparent border-0" style={{ zIndex: 2, position: 'relative' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-0 py-0 mb-4">
            <div className="flex items-center space-x-3">
              <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Suggested questions
              </h3>
              {isGeneratingQuestions && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border border-emerald-300 dark:border-emerald-600 border-t-emerald-500 dark:border-t-emerald-400 rounded-full"
                />
              )}
            </div>
          </div>
          
          {/* Questions List */}
          <div className="space-y-0 pb-8 sm:pb-6 lg:pb-6">
            {isGeneratingQuestions ? (
              // Loading state
              <div className="px-0 py-4 text-center">
                <div className="flex items-center justify-center space-x-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border border-emerald-300 dark:border-emerald-600 border-t-emerald-500 dark:border-t-emerald-400 rounded-full"
                  />
                  <span className="text-gray-600 dark:text-gray-400 text-sm">
                    Generating relevant questions...
                  </span>
                </div>
              </div>
            ) : generationError ? (
              // Error state
              <div className="px-0 py-4 text-center">
                <div className="text-red-500 dark:text-red-400 text-sm">
                  <p>Failed to generate questions</p>
                  <button 
                    onClick={() => generateAISuggestedQuestions(userQuestion)}
                    className="mt-2 px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md text-xs hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : hasQuestions ? (
              // Questions list
              relevantQuestions.map((question, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="px-0 py-3 border-b border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors duration-200 cursor-pointer group select-none bg-transparent rounded-none"
                  data-suggested-question="true"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Add visual feedback
                    const target = e.currentTarget as HTMLElement;
                    target.style.transform = 'scale(0.98)';
                    setTimeout(() => {
                      target.style.transform = '';
                    }, 100);
                    
                    // Execute the click handler
                    onQuestionClick(question);
                  }}
                  onMouseDown={(e) => {
                    // Don't prevent default to ensure click events work properly
                    e.stopPropagation();
                  }}
                  onTouchStart={(e) => {
                    // Ensure touch events work properly
                    e.stopPropagation();
                  }}
                  style={{ 
                    pointerEvents: 'auto',
                    touchAction: 'manipulation',
                    position: 'relative',
                    zIndex: 3
                  }}
                >
                  <div className="flex items-start justify-between space-x-3">
                    <p 
                      className={`flex-1 text-gray-700 dark:text-gray-300 leading-relaxed group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-200 pr-2 break-words ${
                        isTextLarge ? 'text-base' : 'text-sm'
                      }`}
                      style={{ 
                        pointerEvents: 'none',
                        userSelect: 'none'
                      }}
                    >
                      {question}
                    </p>
                    <button 
                      className="flex-shrink-0 w-6 h-6 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110 mt-0.5"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Add visual feedback
                        const target = e.currentTarget as HTMLElement;
                        target.style.transform = 'scale(0.9)';
                        setTimeout(() => {
                          target.style.transform = '';
                        }, 100);
                        
                        // Execute the click handler
                        onQuestionClick(question);
                      }}
                      style={{ 
                        pointerEvents: 'auto',
                        position: 'relative',
                        zIndex: 4,
                        cursor: 'pointer'
                      }}
                    >
                      <svg className="w-3 h-3 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              // No questions state
              <div className="px-0 py-4 text-center">
                {!autoGenerate ? (
                  // Manual generation mode - show generate button
                  <div className="space-y-3">
                    <span className="text-gray-500 dark:text-gray-400 text-sm block">
                      Suggested questions will be generated for new questions only.
                    </span>
                    <button 
                      onClick={() => generateAISuggestedQuestions(userQuestion)}
                      disabled={isGeneratingQuestions}
                      className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingQuestions ? 'Generating...' : 'Generate Questions for This Content'}
                    </button>
                  </div>
                ) : (
                  // Auto-generation mode - show waiting message
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    {currentLanguage === 'en' 
                      ? 'No suggested questions available yet. Questions will appear after you ask a question.'
                      : 'No suggested questions available yet. Questions will appear after you ask a question.'
                    }
                  </span>
                )}
              </div>
            )}
            {/* Extra bottom spacing for mobile to prevent last question cutoff */}
            <div className="h-8 sm:h-6 lg:h-6"></div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
