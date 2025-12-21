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

  // 1. Pattern: [Surah Name: Ayah Number](any-url)
  const standardPattern = /\[([^:\]\n]+)\:\s*(\d+(?:\s*-\s*\d+)?)\]\((https?:\/\/[^\s)]+)\)/g;

  // 2. Pattern: [Surah Name: Ayah Number] (without URL)
  const bracketOnlyPattern = /\[([^:\]\n]+)\:\s*(\d+(?:\s*-\s*\d+)?)\](?!\()/g;

  // 3. Pattern: Verse SurahName AyahNumber or Verse SurahNumber:AyahNumber
  const versePattern = /(?:Verse|Ayat|Ayah)\s+([^:,\n\s]+)(?:\s+|:)(\d+(?:\s*-\s*\d+)?)/gi;

  // 4. Pattern: Surah Name, Ayah Number or Surah Name Ayah Number
  const surahAyahPattern = /Surah\s+([^:,\n\s]+)(?:,|\s+)(?:Ayah|Verse|Ayat)\s+(\d+(?:\s*-\s*\d+)?)/gi;

  // 5. Pattern: (Surah Name: Ayah Number) 
  const parenPattern = /\(([^:)\n]+)\:\s*(\d+(?:\s*-\s*\d+)?) \)/g;

  // 6. Quoted text before bracket pattern: "..." [Surah: Ayah](url)
  const quotedPattern = /"([^"]+)"\s*\[([^:\]\n]+)\:\s*(\d+(?:\s*-\s*\d+)?)\]\((https?:\/\/[^\s)]+)\)/g;

  let match;

  // Execute patterns in order of specificity

  // First, check quoted pattern because it's most specific
  while ((match = quotedPattern.exec(text)) !== null) {
    matches.push({
      verseText: match[1].trim(),
      surahName: match[2].trim(),
      ayahNumber: match[3].replace(/\s+/g, ''),
      url: match[4],
      originalMatch: match[0]
    });
  }

  // Then standard bracket pattern
  while ((match = standardPattern.exec(text)) !== null) {
    if (isDuplicate(match[0], matches)) continue;
    matches.push({
      verseText: null,
      surahName: match[1].trim(),
      ayahNumber: match[2].replace(/\s+/g, ''),
      url: match[3],
      originalMatch: match[0]
    });
  }

  // Then check verse pattern
  while ((match = versePattern.exec(text)) !== null) {
    if (isDuplicate(match[0], matches)) continue;
    const surahName = match[1].trim();
    const ayahNumber = match[2].replace(/\s+/g, '');
    matches.push({
      verseText: null,
      surahName: surahName,
      ayahNumber: ayahNumber,
      url: `https://alquran.cloud/ayah?reference=${surahName}:${ayahNumber}`,
      originalMatch: match[0]
    });
  }

  // Then check surah ayah pattern
  while ((match = surahAyahPattern.exec(text)) !== null) {
    if (isDuplicate(match[0], matches)) continue;
    const surahName = match[1].trim();
    const ayahNumber = match[2].replace(/\s+/g, '');
    matches.push({
      verseText: null,
      surahName: surahName,
      ayahNumber: ayahNumber,
      url: `https://alquran.cloud/ayah?reference=${surahName}:${ayahNumber}`,
      originalMatch: match[0]
    });
  }

  // Then bracket only (fallback)
  while ((match = bracketOnlyPattern.exec(text)) !== null) {
    if (isDuplicate(match[0], matches)) continue;
    const surahName = match[1].trim();
    const ayahNumber = match[2].replace(/\s+/g, '');
    matches.push({
      verseText: null,
      surahName: surahName,
      ayahNumber: ayahNumber,
      url: `https://alquran.cloud/ayah?reference=${surahName}:${ayahNumber}`,
      originalMatch: match[0]
    });
  }

  // Helper to check for overlapping or duplicate matches
  function isDuplicate(matchStr: string, currentMatches: AyahMatch[]) {
    return currentMatches.some(m => m.originalMatch.includes(matchStr) || matchStr.includes(m.originalMatch));
  }

  // Sort matches by their position in the text to ensure correct sequential processing
  return matches.sort((a, b) => text.indexOf(a.originalMatch) - text.indexOf(b.originalMatch));
};
