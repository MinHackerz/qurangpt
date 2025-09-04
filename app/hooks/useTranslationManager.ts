import { useCallback } from 'react';
import { useAIResponse } from './useAIResponse';

export const useTranslationManager = () => {
  const { formatResponse } = useAIResponse();
  // Function to extract AI-generated content for translation while preserving structure
  const extractAIContentForTranslation = useCallback((formattedResponse: string) => {
    try {
      // Create a temporary DOM element to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = formattedResponse;
      
      // Find all ayah boxes and replace them with placeholders
      const ayahBoxes = tempDiv.querySelectorAll('.stylish-ayah-reference');
      const placeholders: string[] = [];
      
      ayahBoxes.forEach((ayahBox, index) => {
        const placeholder = `__AYAH_BOX_${index}__`;
        placeholders.push(ayahBox.outerHTML);
        ayahBox.outerHTML = placeholder;
      });
      
      // Store placeholders for later restoration
      (tempDiv as any).ayahPlaceholders = placeholders;
      
      // Return the HTML with ayah boxes replaced by placeholders
      return tempDiv.innerHTML;
    } catch (error) {
      // Error extracting AI content
      // Fallback: simple text extraction without DOM manipulation
      return formattedResponse.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
  }, []);

  // Function to merge translated AI content with preserved API content
  const mergeTranslatedContent = useCallback(async (originalFormattedResponse: string, translatedAIContent: string) => {
    try {
      // Extract ayah boxes from original response
      const originalDiv = document.createElement('div');
      originalDiv.innerHTML = originalFormattedResponse;
      const ayahBoxes = originalDiv.querySelectorAll('.stylish-ayah-reference');
      const ayahBoxesArray = Array.from(ayahBoxes).map(box => box.outerHTML);
      
      // Replace placeholders in translated content with original ayah boxes
      let mergedContent = translatedAIContent;
      ayahBoxesArray.forEach((ayahBox, index) => {
        const placeholder = `__AYAH_BOX_${index}__`;
        mergedContent = mergedContent.replace(placeholder, ayahBox);
      });
      
      // Process any new ayah references that might have been created in the translated text
      const processedContent = await formatResponse(mergedContent);
      
      return processedContent;
    } catch (error) {
      // Error merging translated content
      // Fallback: return the translated content directly if merging fails
      console.error('Error merging translated content:', error);
      return translatedAIContent;
    }
  }, [formatResponse]);

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
