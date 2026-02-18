'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { detectLanguage } from '../utils/languageDetection';

export interface AskQuranGPTInputProps {
  // content control (optional - if provided, component is controlled)
  value?: string;
  onChange?: (value: string) => void;

  // options control (optional - if provided, component is controlled)
  selectedContentTypes?: {
    tafsir: boolean;
    hadith: boolean;
    webSearch: boolean;
    suggestedQuestions: boolean;
  };
  onContentTypeChange?: (types: {
    tafsir: boolean;
    hadith: boolean;
    webSearch: boolean;
    suggestedQuestions: boolean;
  }) => void;

  onSend: (question: string, options: {
    tafsir: boolean;
    hadith: boolean;
    webSearch: boolean;
    suggestedQuestions: boolean;
    textSize: 'small' | 'medium' | 'large';
  }) => void;
  onReset?: () => void;
  isProcessing?: boolean; // To disable input during processing
  placeholder?: string;
}

export default function AskQuranGPTInput({
  value,
  onChange,
  selectedContentTypes: externalSelectedContentTypes,
  onContentTypeChange,
  onSend,
  onReset,
  isProcessing = false,
  placeholder = "Ask QuranGPT..."
}: AskQuranGPTInputProps) {
  // Internal state for uncontrolled mode
  const [internalValue, setInternalValue] = useState('');
  const [internalSelectedContentTypes, setInternalSelectedContentTypes] = useState({
    tafsir: true,
    hadith: false,
    webSearch: false,
    suggestedQuestions: false
  });

  // Derived state
  const inputValue = value !== undefined ? value : internalValue;
  const currentContentTypes = externalSelectedContentTypes !== undefined ? externalSelectedContentTypes : internalSelectedContentTypes;

  const [showContentTypeDropdown, setShowContentTypeDropdown] = useState(false);
  const [textSize, setTextSize] = useState<'small' | 'medium' | 'large'>('small');
  const [isImproving, setIsImproving] = useState(false);
  const [hasBeenImproved, setHasBeenImproved] = useState(false);
  const isImprovingRef = useRef(false);

  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const accumulatedTextRef = useRef<string>('');

  // Check if speech recognition is supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isSupported = !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function' && typeof MediaRecorder !== 'undefined');
      setIsSpeechSupported(isSupported);
    }
  }, []);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      audioChunksRef.current = [];
      accumulatedTextRef.current = '';
    };
  }, []);

  // Reset hasBeenImproved when input value changes (user is typing new text)
  // Skip reset if we just improved the question
  useEffect(() => {
    if (!isImprovingRef.current) {
      setHasBeenImproved(false);
    }
    isImprovingRef.current = false;
  }, [inputValue]);

  // Click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showContentTypeDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('.content-type-dropdown') && !target.closest('.plus-icon-button')) {
          setShowContentTypeDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showContentTypeDropdown]);

  // Handle value change
  const handleValueChange = (newValue: string) => {
    if (onChange) {
      onChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  // Handle send
  const handleSend = () => {
    if (!inputValue.trim()) {
      return;
    }
    onSend(inputValue.trim(), {
      ...currentContentTypes,
      textSize
    });
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle content type toggle
  const handleContentTypeToggle = (contentType: 'tafsir' | 'hadith' | 'webSearch' | 'suggestedQuestions') => {
    const newTypes = {
      ...currentContentTypes,
      [contentType]: !currentContentTypes[contentType]
    };

    if (onContentTypeChange) {
      onContentTypeChange(newTypes);
    } else {
      setInternalSelectedContentTypes(newTypes);
    }
  };

  // Check if input has minimum words for improvement
  const hasMinimumWords = (text: string) => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length >= 3;
  };

  // Handle improve question
  const handleImproveQuestion = async () => {
    if (!inputValue.trim() || isImproving || hasBeenImproved || !hasMinimumWords(inputValue)) return;

    setIsImproving(true);
    try {
      const language = detectLanguage(inputValue);
      const response = await fetch('/api/improve-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: inputValue.trim(),
          language: language
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to improve question (Status: ${response.status})`);
      }

      const data = await response.json();
      if (data.improvedQuestion) {
        isImprovingRef.current = true; // Mark that we're setting improved value
        handleValueChange(data.improvedQuestion);
        setHasBeenImproved(true);
      }
    } catch (error) {
      console.error('Error improving question:', error);
    } finally {
      setIsImproving(false);
    }
  };

  // Start speech recognition using ElevenLabs
  const startRecognition = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices || !MediaRecorder) {
      console.warn('MediaRecorder is not supported in this browser');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      accumulatedTextRef.current = '';

      const initialContent = inputValue.trim();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          if (audioChunksRef.current.length > 0) {
            const completeAudioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });

            if (completeAudioBlob.size > 1000) {
              const formData = new FormData();
              formData.append('file', completeAudioBlob, 'recording.webm');

              const response = await fetch('/api/speech-to-text', {
                method: 'POST',
                body: formData,
              });

              if (!response.ok) {
                const errorData = await response.json();
                console.error('ElevenLabs STT error:', errorData.error || 'Failed to transcribe audio');
                return;
              }

              const data = await response.json();
              const transcription = data.text || '';

              if (transcription.trim()) {
                const newContent = initialContent
                  ? `${initialContent} ${transcription}`.trim()
                  : transcription.trim();
                handleValueChange(newContent);
              }
            }
          }
        } catch (error) {
          console.error('Error processing transcription:', error);
        } finally {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          audioChunksRef.current = [];
          accumulatedTextRef.current = '';
        }
      };

      mediaRecorder.start();
      setIsListening(true);
      return true;
    } catch (error: any) {
      console.error('Error starting recording:', error);
      setIsListening(false);
      return false;
    }
  }, [inputValue, onChange, internalValue]); // handleValueChange dependency is implicit

  // Handle speech recognition
  const handleSpeechRecognition = useCallback(() => {
    if (isListening) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
          setIsListening(false);
        } catch (e) {
          console.error('Error stopping recording:', e);
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
      return;
    }

    // Start recognition
    startRecognition();
  }, [isListening, startRecognition]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-4xl mx-auto px-4 sm:px-0"
      >
        {/* Content Type Dropdown - Floating above input */}
        <AnimatePresence>
          {showContentTypeDropdown && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              className="absolute z-[60] bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-xl shadow-xl shadow-gray-900/5 dark:shadow-black/30 py-2 px-1 min-w-[180px] content-type-dropdown bottom-[110%] left-4"
            >
              {[
                { id: 'tafsir', label: 'Tafsir' },
                { id: 'hadith', label: 'Hadith' },
                { id: 'webSearch', label: 'Web Search' },
                { id: 'suggestedQuestions', label: 'Follow-up' }
              ].map((type) => {
                const isActive = currentContentTypes[type.id as keyof typeof currentContentTypes];
                return (
                  <button
                    key={type.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleContentTypeToggle(type.id as any);
                    }}
                    className="w-full px-3 py-2 flex items-center justify-between gap-4 rounded-lg transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-900/50 group"
                  >
                    <span className={`text-sm font-medium transition-colors ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      {type.label}
                    </span>
                    <div className={`w-8 h-5 rounded-full p-0.5 transition-all duration-200 ${isActive ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${isActive ? 'translate-x-3' : 'translate-x-0'}`} />
                    </div>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wave Animation & Voice Input Status */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              key="voice-wave"
              layout
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="flex flex-col items-center justify-center overflow-hidden w-full relative z-50"
            >
              <div className="flex items-center justify-center gap-1.5 h-12 mb-2 p-2 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-100 dark:border-gray-700/50">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 bg-amber-500 dark:bg-amber-400 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                    animate={{
                      height: [8, 32, 8],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400 animate-pulse text-center">
                Listening...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative group">
          {/* Running Line Border - Shows when typing */}
          {inputValue.trim() && (
            <>
              {/* Light mode: neon green animation */}
              <div
                className="absolute -inset-[1px] rounded-2xl animate-border-run-smooth pointer-events-none dark:hidden"
                style={{
                  background: `conic-gradient(from var(--border-angle, 0deg), 
                    rgba(245, 158, 11, 0.4) 0deg,
                    rgba(251, 191, 36, 0.7) 35deg,
                    rgba(252, 211, 77, 1) 45deg,
                    rgba(251, 191, 36, 0.7) 55deg,
                    rgba(245, 158, 11, 0.2) 100deg,
                    rgba(209, 213, 219, 0.15) 180deg,
                    rgba(245, 158, 11, 0.2) 260deg,
                    rgba(245, 158, 11, 0.4) 360deg
                  )`,
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude',
                  WebkitMaskComposite: 'xor',
                  padding: '1.5px',
                  filter: 'drop-shadow(0 0 2px rgba(245, 158, 11, 0.5))',
                }}
              />
              {/* Dark mode: bright white/green animation */}
              <div
                className="absolute -inset-[1px] rounded-2xl animate-border-run-smooth pointer-events-none hidden dark:block"
                style={{
                  background: `conic-gradient(from var(--border-angle, 0deg), 
                    rgba(251, 191, 36, 0.5) 0deg,
                    rgba(253, 230, 138, 0.8) 30deg,
                    rgba(255, 255, 255, 0.95) 45deg,
                    rgba(253, 230, 138, 0.8) 60deg,
                    rgba(251, 191, 36, 0.4) 90deg,
                    rgba(75, 85, 99, 0.3) 180deg,
                    rgba(251, 191, 36, 0.4) 270deg,
                    rgba(251, 191, 36, 0.5) 360deg
                  )`,
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude',
                  WebkitMaskComposite: 'xor',
                  padding: '1px',
                }}
              />
            </>
          )}

          {/* Input Container */}
          <div className={`relative bg-gray-50 dark:bg-gray-950 ${inputValue.trim() ? '' : 'border border-gray-200 dark:border-gray-800'} rounded-2xl transition-all duration-300 ${isProcessing ? 'opacity-70 pointer-events-none' : ''}`}>

            {/* Text Area */}
            <textarea
              value={inputValue}
              onChange={(e) => handleValueChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              rows={2}
              disabled={isProcessing}
              className="w-full bg-transparent text-gray-900 dark:text-white border-none resize-none focus:outline-none text-base sm:text-lg leading-relaxed placeholder:text-gray-400 dark:placeholder:text-gray-500 py-4 px-3 sm:px-4 pb-12 overflow-y-auto scrollbar-hide"
              style={{
                minHeight: '80px',
                maxHeight: '160px',
              }}
            />

            {/* Floating Action Buttons - Bottom Right */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
              {/* Speech Button */}
              <AnimatePresence>
                {isSpeechSupported && !inputValue.trim() && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSpeechRecognition();
                    }}
                    disabled={isProcessing}
                    className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${isListening
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-500 animate-pulse border border-red-300 dark:border-red-500/50'
                      : 'text-amber-500 dark:text-amber-400/70 border border-amber-200 dark:border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                      }`}
                    title="Voice input"
                    type="button"
                  >
                    {isListening ? (
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="2" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    )}
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Improve Button */}
              <AnimatePresence>
                {inputValue.trim() && hasMinimumWords(inputValue) && !hasBeenImproved && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={handleImproveQuestion}
                    disabled={isImproving || isProcessing}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-amber-500 border border-amber-200 dark:border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
                    title="Improve question"
                  >
                    {isImproving ? (
                      <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    )}
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Clear Button - Always visible when onReset is provided */}
              {onReset && (
                <button
                  onClick={onReset}
                  disabled={isProcessing}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-red-400 dark:text-red-400/70 border border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  title="Clear"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isProcessing}
                className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${inputValue.trim() && !isProcessing
                  ? 'bg-amber-500 text-white hover:bg-amber-600 hover:scale-105 active:scale-95'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600'
                  }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Floating Tools Button - Bottom Left */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
              <button
                onClick={() => setShowContentTypeDropdown(!showContentTypeDropdown)}
                disabled={isProcessing}
                className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${showContentTypeDropdown
                  ? 'bg-amber-500 text-white'
                  : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:text-gray-500 dark:hover:text-amber-400 dark:hover:bg-amber-900/20'
                  }`}
                title="Tools"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>

              {/* Active Tools Pills - Full text with minimal styling */}
              <AnimatePresence mode="popLayout">
                {Object.entries(currentContentTypes).map(([key, active]) => {
                  if (!active) return null;
                  let label = '';
                  if (key === 'tafsir') label = 'Tafsir';
                  if (key === 'hadith') label = 'Hadith';
                  if (key === 'webSearch') label = 'Search';
                  if (key === 'suggestedQuestions') label = 'Q&A';

                  return (
                    <motion.button
                      key={key}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={() => handleContentTypeToggle(key as any)}
                      disabled={isProcessing}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all"
                    >
                      {label}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Hint Text */}

        </div>
      </motion.div>
    </>
  );
}
