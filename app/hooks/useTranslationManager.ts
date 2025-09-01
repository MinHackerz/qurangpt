import { useCallback } from 'react';

export const useTranslationManager = () => {
  // Function to extract AI-generated content for translation
  const extractAIContentForTranslation = useCallback((formattedResponse: string) => {
    try {
      // Create a temporary DOM element to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = formattedResponse;
      
      // Extract only the AI-generated text content, excluding API-fetched components
      const aiContent: string[] = [];
      
      // Walk through all text nodes and extract content
      const walkTextNodes = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim();
          if (text && text.length > 0) {
            // Check if this text is not part of API-fetched components
            const parent = node.parentElement;
            if (parent && !parent.closest('.stylish-ayah-reference, .tafsir-content, .enhanced-audio-player')) {
              aiContent.push(text);
            }
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          // Skip API-fetched components
          if (!element.classList.contains('stylish-ayah-reference') && 
              !element.classList.contains('tafsir-content') && 
              !element.classList.contains('enhanced-audio-player') &&
              !element.closest('.stylish-ayah-reference, .tafsir-content, .enhanced-audio-player')) {
            // Extract text from elements that are not API-fetched
            for (const child of Array.from(element.childNodes)) {
              walkTextNodes(child);
            }
          }
        }
      };
      
      walkTextNodes(tempDiv);
      
      const result = aiContent.join('\n\n');
      // AI content extracted successfully
      return result;
    } catch (error) {
      // Error extracting AI content
      // Fallback: simple text extraction without DOM manipulation
      return formattedResponse.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
  }, []);

  // Function to merge translated AI content with preserved API content
  const mergeTranslatedContent = useCallback((originalFormattedResponse: string, translatedAIContent: string) => {
    try {
      // Create a temporary DOM element to parse the original HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = originalFormattedResponse;
      
      // Split the translated AI content into paragraphs
      const translatedParagraphs = translatedAIContent.split('\n\n').filter(p => p.trim().length > 0);
      let paragraphIndex = 0;
      
      // Function to replace AI-generated text while preserving API components
      const replaceAIText = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim();
          if (text && text.length > 0) {
            const parent = node.parentElement;
            if (parent && !parent.closest('.stylish-ayah-reference, .tafsir-content, .enhanced-audio-player')) {
              // This is AI-generated text that should be replaced
              if (paragraphIndex < translatedParagraphs.length) {
                node.textContent = translatedParagraphs[paragraphIndex];
                paragraphIndex++;
              }
            }
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          // Skip API-fetched components
          if (!element.classList.contains('stylish-ayah-reference') && 
              !element.classList.contains('tafsir-content') && 
              !element.classList.contains('enhanced-audio-player') &&
              !element.closest('.stylish-ayah-reference, .tafsir-content, .enhanced-audio-player')) {
            // Process child nodes for AI-generated content
            for (const child of Array.from(element.childNodes)) {
              replaceAIText(child);
            }
          }
        }
      };
      
      replaceAIText(tempDiv);
      
      const result = tempDiv.innerHTML;
      // Content merged successfully
      return result;
    } catch (error) {
      // Error merging translated content
      // Fallback: return the translated content directly if merging fails
      return translatedAIContent;
    }
  }, []);

  // Optimized translation function for AI content only
  const translateAIContent = useCallback(async (aiContent: string, targetLanguage: string, sourceLanguage?: string): Promise<string> => {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: aiContent,
          targetLanguage,
          sourceLanguage: sourceLanguage || undefined, // Let API detect if not provided
          context: 'islamic',
          preserveFormatting: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Translation failed with status ${response.status}`);
      }

      const result = await response.json();
      return result.translatedText;
    } catch (error) {
      // Translation API error
      throw error;
    }
  }, []);

  // Function to copy only AI-generated content (excluding API components)
  const copyAIContentOnly = useCallback(async (displayedContent: string, summary: string, setCopied: (copied: boolean) => void) => {
    try {
      // Extract only AI-generated content for copying
      const aiContentToCopy = extractAIContentForTranslation(displayedContent || summary);
      
      if (!aiContentToCopy.trim()) {
        // Fallback to summary if no AI content extracted
        await navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }

      // Clean up the AI content for copying (remove HTML tags, etc.)
      const cleanAIContent = aiContentToCopy
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up extra whitespace
        .replace(/^\s+|\s+$/gm, '') // Trim lines
        .trim();

      await navigator.clipboard.writeText(cleanAIContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Failed to copy AI content
      // Fallback to copying summary
      try {
        await navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        // Failed to copy summary as fallback
      }
    }
  }, [extractAIContentForTranslation]);

  return {
    extractAIContentForTranslation,
    mergeTranslatedContent,
    translateAIContent,
    copyAIContentOnly,
  };
};
