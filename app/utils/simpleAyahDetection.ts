// Simplified ayah reference detection - works for all languages
// Detects any quoted text followed by a link and treats it as a potential ayah reference

export interface AyahMatch {
  verseText: string | null; // Can be null if no quoted text provided
  surahName: string;
  ayahNumber: string;
  url: string;
  originalMatch: string;
}

export const detectAyahReferences = (text: string): AyahMatch[] => {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const matches: AyahMatch[] = [];
  const processedTextSet = new Set<string>();

  // First check for quoted references: "any text" [anything: numbers](url)
  // This catches quoted text followed by surah:ayah references
  const quotedPattern = /"([^"]+)"\s*\[([^:]+)\:\s*(\d+(?:-\d+)?)\]\((https?:\/\/[^\s)]+)\)/g;
  
  let match;
  while ((match = quotedPattern.exec(text)) !== null) {
    // Skip if this text has already been processed
    if (processedTextSet.has(match[0])) continue;

    const verseText = match[1].trim();
    const surahName = match[2].trim();
    const ayahNumber = match[3];
    const url = match[4];

    // Create normalized match
    const normalizedMatch: AyahMatch = {
      verseText: verseText,
      surahName: surahName,
      ayahNumber: ayahNumber,
      url: url,
      originalMatch: match[0]
    };

    matches.push(normalizedMatch);
    processedTextSet.add(match[0]);
  }

  // Reset regex lastIndex
  quotedPattern.lastIndex = 0;

  // Then check for unquoted references: [anything: numbers](url)
  // This catches references without quoted text (new format)
  const unquotedPattern = /\[([^:]+)\:\s*(\d+(?:-\d+)?)\]\((https?:\/\/[^\s)]+)\)/g;
  
  while ((match = unquotedPattern.exec(text)) !== null) {
    // Skip if this text has already been processed
    if (processedTextSet.has(match[0])) continue;

    const surahName = match[1].trim();
    const ayahNumber = match[2];
    const url = match[3];

    // Create normalized match with null verseText (will be fetched from API)
    const normalizedMatch: AyahMatch = {
      verseText: null, // Will be fetched from API
      surahName: surahName,
      ayahNumber: ayahNumber,
      url: url,
      originalMatch: match[0]
    };

    matches.push(normalizedMatch);
    processedTextSet.add(match[0]);
  }

  // Reset regex lastIndex
  unquotedPattern.lastIndex = 0;

  return matches;
};
