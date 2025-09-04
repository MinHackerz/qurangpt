// Utility function to process content links
export const processContentLinks = (content: string): string => {
  if (!content) return '';
  
  // Check if content already contains HTML (like audio buttons or ayah boxes)
  // If it does, only process markdown links that are not inside HTML tags
  if (content.includes('<') && content.includes('>')) {
    // Skip processing if content contains ayah boxes (stylish-ayah-reference class)
    // This prevents interference with the ayah box formatting
    if (content.includes('stylish-ayah-reference')) {
      return content;
    }
    
    // Content contains HTML, process markdown links more carefully
    return content.replace(
      /(?<!<[^>]*)\[([^\]]+)\]\s*\(([^)]+)\)(?!\s*<)/g,
      (match, linkText, url) => {
        // Extract surah name and ayah number from the link text
        const surahMatch = linkText.match(/^([^:]+):\s*(\d+(?:-\d+)?)$/);
        if (surahMatch) {
          const surahName = surahMatch[1].trim();
          const ayahNumbers = surahMatch[2].trim();
          
          // Create a clickable link with proper styling
          return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-200 font-medium text-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
            ${surahName}: ${ayahNumbers}
          </a>`;
        }
        
        // Fallback for other link formats
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline">${linkText}</a>`;
      }
    );
  }
  
  // Content is plain text, process all markdown links
  return content.replace(
    /\[([^\]]+)\]\s*\(([^)]+)\)/g,
    (match, linkText, url) => {
      // Extract surah name and ayah number from the link text
      const surahMatch = linkText.match(/^([^:]+):\s*(\d+(?:-\d+)?)$/);
      if (surahMatch) {
        const surahName = surahMatch[1].trim();
        const ayahNumbers = surahMatch[2].trim();
        
        // Create a clickable link with proper styling
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-200 font-medium text-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
          </svg>
          ${surahName}: ${ayahNumbers}
        </a>`;
      }
      
      // Fallback for other link formats
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline">${linkText}</a>`;
    }
  );
};
