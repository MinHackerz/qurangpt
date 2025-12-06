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
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute z-[60] bg-white dark:bg-gray-800 border-[0.5px] border-gray-200 dark:border-gray-700 rounded-xl shadow-xl shadow-black/5 p-2 min-w-[220px] content-type-dropdown backdrop-blur-xl bottom-[110%] left-4"
            >
              <div className="space-y-0.5">
                {[
                  { id: 'tafsir', label: 'Tafsir Analysis', color: 'emerald' },
                  { id: 'hadith', label: 'Hadith References', color: 'emerald' },
                  { id: 'webSearch', label: 'Web Search', color: 'blue' },
                  { id: 'suggestedQuestions', label: 'Follow-up Questions', color: 'purple' }
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleContentTypeToggle(type.id as any);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all duration-200 flex items-center justify-between group ${currentContentTypes[type.id as keyof typeof currentContentTypes]
                      ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                      }`}
                  >
                    <span className="font-medium">{type.label}</span>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${currentContentTypes[type.id as keyof typeof currentContentTypes]
                      ? 'border-transparent bg-gray-900 dark:bg-white'
                      : 'border-gray-300 dark:border-gray-600 group-hover:border-gray-400'
                      }`}>
                      {currentContentTypes[type.id as keyof typeof currentContentTypes] && (
                        <svg className="w-2.5 h-2.5 text-white dark:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative group">
          {/* Input Container */}
          <div className={`relative bg-transparent backdrop-blur-xl border border-gray-200 dark:border-gray-700 shadow-sm focus-within:shadow-md focus-within:border-emerald-500/30 dark:focus-within:border-emerald-500/30 rounded-2xl transition-all duration-300 overflow-hidden ${isProcessing ? 'opacity-70 pointer-events-none' : ''}`}>

            {/* Text Area */}
            <textarea
              value={inputValue}
              onChange={(e) => handleValueChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              rows={1}
              disabled={isProcessing}
              className="w-full bg-transparent text-gray-900 dark:text-white border-none resize-none focus:outline-none text-base sm:text-lg leading-relaxed placeholder:text-gray-400 dark:placeholder:text-gray-500 py-4 px-5 pr-32 min-h-[64px] max-h-[300px]" // pr-32 for buttons space
              style={{
                height: 'auto',
                minHeight: '64px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto'; // Reset height
                target.style.height = `${Math.min(target.scrollHeight, 300)}px`; // Set new height capped at 300px
              }}
            />

            {/* Bottom Bar (Tools & Actions) */}
            <div className="flex items-center justify-between px-3 pb-3 pt-1">

              {/* Left: Tools */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1 max-w-[calc(100%-120px)]">
                {/* Add Button */}
                <button
                  onClick={() => setShowContentTypeDropdown(!showContentTypeDropdown)}
                  disabled={isProcessing}
                  className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors plus-icon-button ${showContentTypeDropdown
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                    }`}
                  title="Add tools"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>

                <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0" />

                {/* Active Tools Pills */}
                <AnimatePresence mode="popLayout">
                  {Object.entries(currentContentTypes).map(([key, active]) => {
                    if (!active) return null;
                    let label = '';
                    if (key === 'tafsir') label = 'Tafsir';
                    if (key === 'hadith') label = 'Hadith';
                    if (key === 'webSearch') label = 'Web';
                    if (key === 'suggestedQuestions') label = 'Q&A';

                    return (
                      <motion.button
                        key={key}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => handleContentTypeToggle(key as any)}
                        disabled={isProcessing}
                        className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                      >
                        <span>{label}</span>
                        <svg className="w-3 h-3 opacity-60 hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </motion.button>
                    );
                  })}
                  {!Object.values(currentContentTypes).some(Boolean) && (
                    <span className="text-xs text-gray-400 dark:text-gray-600 pl-1 italic">
                      No tools selected
                    </span>
                  )}
                </AnimatePresence>
              </div>


              {/* Right: Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Reset Button (only if OnReset provided) */}
                {onReset && (
                  <button
                    onClick={onReset}
                    disabled={isProcessing}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="Reset"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}

                {/* Improve Button */}
                <AnimatePresence>
                  {inputValue.trim() && hasMinimumWords(inputValue) && !hasBeenImproved && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={handleImproveQuestion}
                      disabled={isImproving || isProcessing}
                      className="p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                      title="Improve with AI"
                    >
                      {isImproving ? (
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Speech Recognition Button */}
                <AnimatePresence>
                  {isSpeechSupported && !inputValue.trim() && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ pointerEvents: 'auto', zIndex: 30 }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSpeechRecognition();
                      }}
                      disabled={isProcessing}
                      className={`group relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${isListening
                        ? 'bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/40 text-red-600 dark:text-red-400 animate-pulse'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                        }`}
                      title={isListening ? "Stop recording" : "Start voice input"}
                      type="button"
                    >
                      <div className="relative z-10 flex items-center justify-center">
                        {isListening ? (
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="6" width="12" height="12" rx="2" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        )}
                      </div>
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Send Button */}
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isProcessing}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 ${inputValue.trim() && !isProcessing
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transform hover:-translate-y-0.5'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    }`}
                >
                  <svg className="w-4 h-4 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>

            </div>
          </div>

          {/* Hint Text */}

        </div>
      </motion.div>
    </>
  );
}
