// Utility function to process content links
export const processContentLinks = (content: string): string => {
  if (!content) return '';
  
  // Remove markdown link patterns like [Al-Isra: 36](https://alquran...)
  // This removes the entire markdown link syntax from the output
  let processedContent = content.replace(
    /\[([^\]]+)\]\s*\(https?:\/\/alquran[^)]*\)/gi,
    ''
  );
  
  // Also remove any incomplete markdown links (in case they're cut off)
  processedContent = processedContent.replace(
    /\[([^\]]+)\]\s*\(https?:\/\/alquran[^)]*/gi,
    ''
  );
  
  // Clean up any extra whitespace that might be left after removal
  processedContent = processedContent
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace multiple newlines with double newline
    .trim();
  
  return processedContent;
};

// Utility function to extract plain text from HTML content
export const extractPlainText = (htmlContent: string): string => {
  if (!htmlContent) return '';
  
  // Create a temporary DOM element to parse HTML
  if (typeof window !== 'undefined') {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Remove script and style elements
    const scripts = tempDiv.querySelectorAll('script, style');
    scripts.forEach(el => el.remove());
    
    // Get text content
    let text = tempDiv.textContent || tempDiv.innerText || '';
    
    // Clean up whitespace
    text = text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
      .trim();
    
    return text;
  }
  
  // Fallback for server-side: simple regex-based HTML tag removal
  return htmlContent
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
    .trim();
};
