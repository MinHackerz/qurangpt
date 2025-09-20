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
      const ayahPlaceholders: string[] = [];
      
      ayahBoxes.forEach((ayahBox, index) => {
        const placeholder = `__AYAH_BOX_${index}__`;
        ayahPlaceholders.push(ayahBox.outerHTML);
        ayahBox.outerHTML = placeholder;
      });
      
      // Find all hadith boxes and replace them with placeholders
      const hadithBoxes = tempDiv.querySelectorAll('.stylish-hadith-reference');
      const hadithPlaceholders: string[] = [];
      
      hadithBoxes.forEach((hadithBox, index) => {
        const placeholder = `__HADITH_BOX_${index}__`;
        hadithPlaceholders.push(hadithBox.outerHTML);
        hadithBox.outerHTML = placeholder;
      });
      
      // Find all suggested questions sections and replace them with placeholders
      const suggestedQuestionsSections = tempDiv.querySelectorAll('.suggested-questions-section');
      const suggestedQuestionsPlaceholders: string[] = [];
      
      suggestedQuestionsSections.forEach((suggestedSection, index) => {
        const placeholder = `__SUGGESTED_QUESTIONS_${index}__`;
        suggestedQuestionsPlaceholders.push(suggestedSection.outerHTML);
        suggestedSection.outerHTML = placeholder;
      });
      
      // Store placeholders for later restoration
      (tempDiv as any).ayahPlaceholders = ayahPlaceholders;
      (tempDiv as any).hadithPlaceholders = hadithPlaceholders;
      (tempDiv as any).suggestedQuestionsPlaceholders = suggestedQuestionsPlaceholders;
      
      // Return the HTML with ayah, hadith, and suggested questions sections replaced by placeholders
      return tempDiv.innerHTML;
    } catch (error) {
      // Error extracting AI content
      // Fallback: simple text extraction without DOM manipulation
      return formattedResponse.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
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

  // Function to translate suggested questions within HTML content
  const translateSuggestedQuestionsInHTML = useCallback(async (suggestedQuestionsHTML: string, targetLanguage: string = 'en') => {
    try {
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = suggestedQuestionsHTML;
      
      // Find all suggested question items
      const questionItems = tempDiv.querySelectorAll('.suggested-question-item p');
      const questions = Array.from(questionItems).map(p => p.textContent || '').filter(q => q.trim());
      
      
      if (questions.length === 0) {
        return suggestedQuestionsHTML; // No questions to translate
      }
      
      // Translate the questions
      const questionsText = questions.join('\n\n');
      
      // Detect source language instead of assuming English
      const { detectLanguage } = await import('../utils/languageDetection');
      const sourceLanguage = detectLanguage(questionsText);
      
      // Skip translation if source and target are the same
      if (sourceLanguage === targetLanguage) {
        return suggestedQuestionsHTML;
      }
      
      const translatedQuestionsText = await translateAIContent(questionsText, targetLanguage, sourceLanguage);
      const translatedQuestions = translatedQuestionsText.split('\n\n').filter(q => q.trim());
      
      
      // Replace the question text in the HTML
      questionItems.forEach((p, index) => {
        if (translatedQuestions[index]) {
          p.textContent = translatedQuestions[index];
        }
      });
      
      return tempDiv.innerHTML;
    } catch (error) {
      return suggestedQuestionsHTML; // Return original if translation fails
    }
  }, [translateAIContent]);

  // Function to merge translated AI content with preserved API content
  const mergeTranslatedContent = useCallback(async (originalFormattedResponse: string, translatedAIContent: string, targetLanguage: string = 'en') => {
    try {
      // Extract ayah boxes from original response
      const originalDiv = document.createElement('div');
      originalDiv.innerHTML = originalFormattedResponse;
      const ayahBoxes = originalDiv.querySelectorAll('.stylish-ayah-reference');
      const ayahBoxesArray = Array.from(ayahBoxes).map(box => box.outerHTML);
      
      // Extract hadith boxes from original response
      const hadithBoxes = originalDiv.querySelectorAll('.stylish-hadith-reference');
      const hadithBoxesArray = Array.from(hadithBoxes).map(box => box.outerHTML);
      
      // Extract suggested questions sections from original response
      const suggestedQuestionsSections = originalDiv.querySelectorAll('.suggested-questions-section');
      const suggestedQuestionsArray = Array.from(suggestedQuestionsSections).map(section => section.outerHTML);
      
      
      // Replace placeholders in translated content with original boxes
      let mergedContent = translatedAIContent;
      
      // Replace ayah placeholders
      ayahBoxesArray.forEach((ayahBox, index) => {
        const placeholder = `__AYAH_BOX_${index}__`;
        mergedContent = mergedContent.replace(placeholder, ayahBox);
      });
      
      // Replace hadith placeholders
      hadithBoxesArray.forEach((hadithBox, index) => {
        const placeholder = `__HADITH_BOX_${index}__`;
        mergedContent = mergedContent.replace(placeholder, hadithBox);
      });
      
      // Replace suggested questions placeholders with translated versions
      for (let index = 0; index < suggestedQuestionsArray.length; index++) {
        const placeholder = `__SUGGESTED_QUESTIONS_${index}__`;
        const originalSection = suggestedQuestionsArray[index];
        
        
        // Extract and translate the suggested questions within the section
        const translatedSection = await translateSuggestedQuestionsInHTML(originalSection, targetLanguage);
        mergedContent = mergedContent.replace(placeholder, translatedSection);
        
      }
      
      // Process any new ayah references that might have been created in the translated text
      const processedContent = await formatResponse(mergedContent);
      
      return processedContent;
    } catch (error) {
      // Error merging translated content
      // Fallback: return the translated content directly if merging fails
      return translatedAIContent;
    }
  }, [formatResponse, translateSuggestedQuestionsInHTML]);



  // Function to extract ayah information from ayah boxes for copying
  const extractAyahInfoForCopy = useCallback((formattedResponse: string) => {
    try {
      // Create a temporary DOM element to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = formattedResponse;
      
      // Find all ayah boxes and extract their information
      const ayahBoxes = tempDiv.querySelectorAll('.stylish-ayah-reference');
      const ayahInfo: Array<{text: string, surahName: string, ayahNumber: string, surahNumber: string}> = [];
      
      ayahBoxes.forEach((ayahBox) => {
        // Find the ayah text - it's in a blockquote element
        const ayahTextElement = ayahBox.querySelector('blockquote');
        const ayahText = ayahTextElement ? ayahTextElement.textContent?.trim() : '';
        
        if (ayahText) {
          // Extract surah name and ayah number from data attributes
          const surahName = ayahBox.getAttribute('data-surah-name') || '';
          const ayahNumber = ayahBox.getAttribute('data-ayah-number') || '';
          const surahNumber = ayahBox.getAttribute('data-surah-number') || '';
          
          ayahInfo.push({
            text: ayahText,
            surahName: surahName,
            ayahNumber: ayahNumber,
            surahNumber: surahNumber
          });
        }
      });
      return ayahInfo;
    } catch (error) {
      return [];
    }
  }, []);

  // Function to extract hadith information for copying
  const extractHadithInfoForCopy = useCallback((formattedResponse: string) => {
    try {
      // Create a temporary DOM element to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = formattedResponse;
      
      // Find all hadith boxes and extract their information
      const hadithBoxes = tempDiv.querySelectorAll('.stylish-hadith-reference');
      const hadithInfo: Array<{
        text: string;
        bookName: string;
        hadithNumber: string;
        narrator: string;
        aiSummary: string;
        status: string;
      }> = [];
      
      hadithBoxes.forEach((hadithBox) => {
        const bookName = hadithBox.getAttribute('data-book-name');
        const hadithNumber = hadithBox.getAttribute('data-hadith-number');
        
        if (bookName && hadithNumber) {
          // Try to find the hadith text within the hadith box
          const hadithTextElement = hadithBox.querySelector('.hadith-text-english, .hadith-text-arabic');
          const hadithText = hadithTextElement ? hadithTextElement.textContent?.trim() || '' : '';
          
          // Try to find the narrator
          const narratorElement = hadithBox.querySelector('.hadith-narrator');
          const narrator = narratorElement ? narratorElement.textContent?.replace(/^—\s*/, '').trim() || '' : '';
          
          // Try to find the AI summary
          const summaryElement = hadithBox.querySelector('.hadith-ai-summary');
          const aiSummary = summaryElement ? summaryElement.textContent?.trim() || '' : '';
          
          // Try to find the status (Sahih, Hasan, etc.)
          const statusElement = hadithBox.querySelector('span[class*="px-2"][class*="py-0"]');
          const status = statusElement ? statusElement.textContent?.trim() || 'Unknown' : 'Unknown';
          
          hadithInfo.push({
            text: hadithText,
            bookName: bookName,
            hadithNumber: hadithNumber,
            narrator: narrator,
            aiSummary: aiSummary,
            status: status
          });
        }
      });
      
      return hadithInfo;
    } catch (error) {
      return [];
    }
  }, []);

  // Function to copy only AI-generated content (excluding API components)
  const copyAIContentOnly = useCallback(async (displayedContent: string, summary: string, setCopied: (copied: boolean) => void) => {
    try {
      // Create structured copy: AI content → Ayah + explanation → Hadith + explanation
      let structuredContent = '';
      
      try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = displayedContent || summary;
        
        // Remove suggested questions section
        const suggestedQuestionsSection = tempDiv.querySelector('.suggested-questions-section, .related-questions-section');
        if (suggestedQuestionsSection) {
          suggestedQuestionsSection.remove();
        }
        
        // Get all content elements and process them in order
        const allElements = Array.from(tempDiv.children);
        
        // First, collect general AI content and ayah/hadith with their explanations
        const ayahWithExplanations: Array<{
          text: string;
          surahName: string;
          ayahNumber: string;
          surahNumber: string;
          aiExplanation: string;
        }> = [];
        const hadithWithExplanations: Array<{
          text: string;
          narrator: string;
          bookName: string;
          hadithNumber: string;
          status: string;
          aiSummary: string;
        }> = [];
        let generalAIContent = '';
        
        allElements.forEach((element, index) => {
          if (element.classList.contains('stylish-ayah-reference')) {
            // Process ayah box
            const surahName = element.getAttribute('data-surah-name') || 'Unknown';
            const ayahNumber = element.getAttribute('data-ayah-number') || 'Unknown';
            const surahNumber = element.getAttribute('data-surah-number') || 'Unknown';
            
            // Extract ayah text from blockquote
            const blockquote = element.querySelector('blockquote');
            let ayahText = '';
            if (blockquote) {
              ayahText = blockquote.textContent?.trim() || '';
              ayahText = ayahText.replace(/\s+/g, ' ').trim();
            }
            
            if (ayahText) {
              // Look for AI explanation that follows this ayah box
              let aiExplanation = '';
              for (let i = index + 1; i < Math.min(index + 3, allElements.length); i++) {
                const nextElement = allElements[i];
                if (nextElement.classList.contains('stylish-ayah-reference') || 
                    nextElement.classList.contains('stylish-hadith-reference')) {
                  break; // Stop if we hit another ayah or hadith box
                }
                
                const textContent = nextElement.textContent?.trim() || '';
                if (textContent && textContent.length > 20) { // Only include substantial text
                  aiExplanation = textContent;
                  break; // Only take the first substantial text block after the ayah
                }
              }
              
              ayahWithExplanations.push({
                text: ayahText,
                surahName,
                ayahNumber,
                surahNumber,
                aiExplanation
              });
            }
          } else if (element.classList.contains('stylish-hadith-reference')) {
            // Process hadith box
            const bookName = element.getAttribute('data-book-name') || 'Unknown';
            const hadithNumber = element.getAttribute('data-hadith-number') || 'Unknown';
            const status = element.getAttribute('data-status') || '';
            
            // Extract hadith text from blockquote
            const blockquote = element.querySelector('blockquote');
            let hadithText = '';
            if (blockquote) {
              hadithText = blockquote.textContent?.trim() || '';
              hadithText = hadithText.replace(/\s+/g, ' ').trim();
            }
            
            // Extract narrator if available
            const narratorElement = element.querySelector('.hadith-narrator');
            let narrator = '';
            if (narratorElement) {
              narrator = narratorElement.textContent?.trim() || '';
              narrator = narrator.replace(/^—\s*/, '').trim(); // Remove leading dash
            }
            
            // Extract AI summary if available
            const summaryElement = element.querySelector('.hadith-ai-summary');
            let aiSummary = '';
            if (summaryElement) {
              aiSummary = summaryElement.textContent?.trim() || '';
              aiSummary = aiSummary.replace(/\s+/g, ' ').trim();
            }
            
            if (hadithText) {
              hadithWithExplanations.push({
                text: hadithText,
                narrator,
                bookName,
                hadithNumber,
                status,
                aiSummary
              });
            }
          } else {
            // Collect general AI content (before ayah/hadith sections)
            const textContent = element.textContent?.trim() || '';
            if (textContent && textContent.length > 20) {
              if (generalAIContent.trim()) {
                generalAIContent += '\n\n';
              }
              generalAIContent += textContent.replace(/\s+/g, ' ').trim();
            }
          }
        });
        
        // Build the structured content in the desired order: AI content → Ayahs → Hadiths
        
        // 1. Add general AI content first
        if (generalAIContent.trim()) {
          structuredContent += generalAIContent.trim();
        }
        
        // 2. Add ayah references with their explanations (always before hadiths)
        if (ayahWithExplanations.length > 0) {
          if (structuredContent.trim()) {
            structuredContent += '\n\n';
          }
          ayahWithExplanations.forEach((ayah, index) => {
            if (index > 0) {
              structuredContent += '\n';
            }
            structuredContent += `"${ayah.text}"\n---Surah ${ayah.surahNumber}: ${ayah.surahName}, Ayah ${ayah.ayahNumber}`;
            if (ayah.aiExplanation) {
              structuredContent += `\n\n${ayah.aiExplanation}`;
            }
          });
        }
        
        // 3. Add hadith references with their explanations (always after ayahs)
        if (hadithWithExplanations.length > 0) {
          if (structuredContent.trim()) {
            structuredContent += '\n\n';
          }
          structuredContent += 'Related Hadiths:';
          hadithWithExplanations.forEach((hadith, index) => {
            structuredContent += `\n\n"${hadith.text}"`;
            if (hadith.narrator) {
              structuredContent += ` — ${hadith.narrator}`;
            }
            structuredContent += `\n---${hadith.bookName}, Hadith #${hadith.hadithNumber}`;
            if (hadith.status && hadith.status !== 'Unknown') {
              structuredContent += ` (${hadith.status})`;
            }
            if (hadith.aiSummary) {
              structuredContent += `\n\n${hadith.aiSummary}`;
            }
          });
        }
        
      } catch (error) {
        // Fallback to simple text extraction
        structuredContent = (displayedContent || summary)
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up extra whitespace
          .replace(/^\s+|\s+$/gm, '') // Trim lines
          .trim();
      }
      
      // Final cleanup to remove any remaining HTML artifacts
      structuredContent = structuredContent
        .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up extra line breaks
        .replace(/^\s+|\s+$/gm, '') // Trim each line
        .trim();
      
      if (!structuredContent.trim()) {
        // Fallback to summary if no content extracted
        await navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }

      await navigator.clipboard.writeText(structuredContent);
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
  }, []);

  // Function to translate only hadith summaries while preserving hadith boxes
  const translateHadithSummaries = useCallback(async (formattedResponse: string, targetLanguage: string, sourceLanguage?: string): Promise<string> => {
    try {
      // Create a temporary DOM element to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = formattedResponse;
      
      // Find all hadith boxes
      const hadithBoxes = tempDiv.querySelectorAll('.stylish-hadith-reference');
      
      // Translate each hadith summary
      for (let i = 0; i < hadithBoxes.length; i++) {
        const hadithBox = hadithBoxes[i];
        const summaryElement = hadithBox.querySelector('.mt-3');
        
        if (summaryElement && summaryElement.textContent?.trim()) {
          const originalSummary = summaryElement.textContent.trim();
          
          try {
            // Translate the summary
            const translatedSummary = await translateAIContent(originalSummary, targetLanguage, sourceLanguage);
            
            // Update the summary element with translated text
            summaryElement.textContent = translatedSummary;
          } catch (error) {
            // Keep original summary if translation fails
          }
        }
      }
      
      return tempDiv.innerHTML;
    } catch (error) {
      return formattedResponse; // Return original if translation fails
    }
  }, [translateAIContent]);

  return {
    extractAIContentForTranslation,
    extractAyahInfoForCopy,
    extractHadithInfoForCopy,
    mergeTranslatedContent,
    translateAIContent,
    translateHadithSummaries,
    copyAIContentOnly,
  };
};
