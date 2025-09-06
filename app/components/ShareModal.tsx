'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { 
  XMarkIcon, 
  LinkIcon, 
  ClipboardDocumentIcon,
  CheckIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  title: string;
  question: string;
  isCreatingShare?: boolean;
  // Copy content functionality
  onCopyContent?: () => void;
  copied?: boolean;
  content?: string; // The AI response content to copy
}

export default function ShareModal({ 
  isOpen, 
  onClose, 
  shareUrl, 
  title, 
  question,
  isCreatingShare = false,
  onCopyContent,
  copied = false,
  content
}: ShareModalProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle copy to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      
      // Track copy link event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'share_link_copied', {
          event_category: 'engagement',
          event_label: 'copy_link',
          custom_parameter_1: question ? question.substring(0, 100) : 'unknown_question',
          custom_parameter_2: 'share_modal'
        });
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle copy content (question and response)
  const handleCopyContent = () => {
    if (onCopyContent) {
      onCopyContent();
      
      // Track copy content event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'share_content_copied', {
          event_category: 'engagement',
          event_label: 'copy_content',
          custom_parameter_1: question ? question.substring(0, 100) : 'unknown_question',
          custom_parameter_2: 'share_modal'
        });
      }
    }
  };

  // Handle native share (mobile)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: question,
          url: shareUrl,
        });
        
        // Track native share event
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'native_share', {
            event_category: 'engagement',
            event_label: 'native_share',
            custom_parameter_1: question ? question.substring(0, 100) : 'unknown_question',
            custom_parameter_2: 'share_modal'
          });
        }
        
        onClose();
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  // Handle WhatsApp share
  const handleWhatsAppShare = () => {
    const text = `QuranGPT Answer:\n\nQuestion: ${question}\n\nRead the full answer: ${shareUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    
    // Track WhatsApp share event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'social_share', {
        event_category: 'engagement',
        event_label: 'whatsapp_share',
        custom_parameter_1: question ? question.substring(0, 100) : 'unknown_question',
        custom_parameter_2: 'share_modal'
      });
    }
    
    window.open(url, '_blank');
    onClose();
  };

  // Handle Facebook share
  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    
    // Track Facebook share event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'social_share', {
        event_category: 'engagement',
        event_label: 'facebook_share',
        custom_parameter_1: question ? question.substring(0, 100) : 'unknown_question',
        custom_parameter_2: 'share_modal'
      });
    }
    
    window.open(url, '_blank', 'width=600,height=400');
    onClose();
  };

  // Handle X (Twitter) share
  const handleXShare = () => {
    const text = `QuranGPT Answer: ${question}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    
    // Track X (Twitter) share event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'social_share', {
        event_category: 'engagement',
        event_label: 'twitter_share',
        custom_parameter_1: question ? question.substring(0, 100) : 'unknown_question',
        custom_parameter_2: 'share_modal'
      });
    }
    
    window.open(url, '_blank', 'width=600,height=400');
    onClose();
  };

  // Handle LinkedIn share
  const handleLinkedInShare = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    
    // Track LinkedIn share event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'social_share', {
        event_category: 'engagement',
        event_label: 'linkedin_share',
        custom_parameter_1: question ? question.substring(0, 100) : 'unknown_question',
        custom_parameter_2: 'share_modal'
      });
    }
    
    window.open(url, '_blank', 'width=600,height=400');
    onClose();
  };

  // Handle Telegram share
  const handleTelegramShare = () => {
    const text = `QuranGPT Answer:\n\nQuestion: ${question}\n\nRead the full answer: ${shareUrl}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
    
    // Track Telegram share event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'social_share', {
        event_category: 'engagement',
        event_label: 'telegram_share',
        custom_parameter_1: question ? question.substring(0, 100) : 'unknown_question',
        custom_parameter_2: 'share_modal'
      });
    }
    
    window.open(url, '_blank');
    onClose();
  };

  // Handle email share
  const handleEmailShare = () => {
    const subject = `QuranGPT Answer: ${question}`;
    const body = `I found this interesting answer on QuranGPT:\n\nQuestion: ${question}\n\nRead the full response: ${shareUrl}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Track email share event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'social_share', {
        event_category: 'engagement',
        event_label: 'email_share',
        custom_parameter_1: question ? question.substring(0, 100) : 'unknown_question',
        custom_parameter_2: 'share_modal'
      });
    }
    
    window.location.href = url;
    onClose();
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const shareOptions = [
    {
      id: 'copy-content',
      name: 'Copy Content',
      icon: copied ? CheckIcon : ClipboardDocumentIcon,
      action: handleCopyContent,
      color: copied ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400',
      bgColor: copied ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700',
      description: copied ? 'Copied!' : 'Copy question and response'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
        </svg>
      ),
      action: handleWhatsAppShare,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30',
      description: 'Share on WhatsApp'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      action: handleFacebookShare,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30',
      description: 'Share on Facebook'
    },
    {
      id: 'x',
      name: 'X (Twitter)',
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      action: handleXShare,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700',
      description: 'Share on X'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      action: handleLinkedInShare,
      color: 'text-blue-700 dark:text-blue-300',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30',
      description: 'Share on LinkedIn'
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      ),
      action: handleTelegramShare,
      color: 'text-blue-500 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30',
      description: 'Share on Telegram'
    },
    {
      id: 'email',
      name: 'Email',
      icon: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      action: handleEmailShare,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700',
      description: 'Share via Email'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal - Minimalist */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Minimalist */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                {isCreatingShare ? 'Creating Share Link...' : 'Share'}
              </h2>
              <button
                onClick={onClose}
                disabled={isCreatingShare}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XMarkIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Share Options - Minimalist Grid */}
            <div className="p-4">
              {isCreatingShare ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-300 rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Creating share link...</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {shareOptions.slice(0, 6).map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <motion.button
                        key={option.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={option.action}
                        className={`
                          flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200
                          ${option.bgColor}
                          hover:shadow-sm
                        `}
                        title={option.name}
                      >
                        <div className={`${option.color}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {option.name}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Copy Link - Prominent */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCopyLink}
                className="w-full mt-4 flex items-center justify-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-all duration-200 border border-gray-200 dark:border-gray-700"
              >
                <ClipboardDocumentIcon className="w-4 h-4" />
                <span className="font-medium text-sm">
                  {linkCopied ? 'Copied!' : 'Copy Link'}
                </span>
              </motion.button>

              {/* Native Share Button (Mobile) */}
              {isMobile && typeof navigator !== 'undefined' && 'share' in navigator && typeof navigator.share === 'function' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNativeShare}
                  className="w-full mt-2 flex items-center justify-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg transition-all duration-200"
                >
                  <ShareIcon className="w-4 h-4" />
                  <span className="font-medium text-sm">More Options</span>
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
