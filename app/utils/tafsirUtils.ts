export interface TafsirData {
  surahName: string;
  surahNo: number;
  ayahNo: number;
  tafsirs: Array<{
    author: string;
    groupVerse?: string;
    content: string;
  }>;
}

export const fetchTafsir = async (surahNumber: number, ayahNumber: number): Promise<TafsirData | null> => {
  try {
    const response = await fetch(`https://quranapi.pages.dev/api/tafsir/${surahNumber}_${ayahNumber}.json`);
    
    if (!response.ok) {
      if (response.status === 404) {
        // Tafsir not found
        return null;
      }
      throw new Error(`Failed to fetch tafsir: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    // Error fetching tafsir
    return null;
  }
};

export const formatTafsirContent = (content: string): string => {
  return content
    .replace(/\n/g, '<br>')
    .replace(/##\s*(.*?)$/gm, '<h4 class="font-semibold text-gray-800 dark:text-gray-200 mt-3 mb-2">$1</h4>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-800 dark:text-gray-200">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700 dark:text-gray-300">$1</em>');
};

// Surah name to number mapping
export const surahNameToNumber: { [key: string]: number } = {
  'Al-Fatiha': 1, 'Al-Fatihah': 1, 'Al-Baqarah': 2, 'Aal-Imran': 3, 'An-Nisa': 4, 'Al-Ma\'idah': 5,
  'Al-An\'am': 6, 'Al-Anam': 6, 'Al-A\'raf': 7, 'Al-Araf': 7, 'Al-Anfal': 8, 'At-Tawbah': 9, 'Yunus': 10,
  'Hud': 11, 'Yusuf': 12, 'Ar-Ra\'d': 13, 'Ibrahim': 14, 'Al-Hijr': 15,
  'An-Nahl': 16, 'Al-Isra': 17, 'Al-Kahf': 18, 'Maryam': 19, 'Ta-Ha': 20,
  'Al-Anbya': 21, 'Al-Anbiya': 21, 'Al-Anbiyaa': 21, 'Al-Hajj': 22, 'Al-Mu\'minun': 23, 'An-Nur': 24, 'Al-Furqan': 25,
  'Ash-Shu\'ara': 26, 'An-Naml': 27, 'Al-Qasas': 28, 'Al-Ankabut': 29, 'Ar-Rum': 30,
  'Luqman': 31, 'As-Sajdah': 32, 'Al-Ahzab': 33, 'Saba': 34, 'Fatir': 35,
  'Ya-Sin': 36, 'As-Saffat': 37, 'Sad': 38, 'Az-Zumar': 39, 'Ghafir': 40,
  'Fussilat': 41, 'Ash-Shura': 42, 'Az-Zukhruf': 43, 'Ad-Dukhan': 44, 'Al-Jathiyah': 45,
  'Al-Ahqaf': 46, 'Muhammad': 47, 'Al-Fath': 48, 'Al-Hujurat': 49, 'Qaf': 50,
  'Adh-Dhariyat': 51, 'At-Tur': 52, 'An-Najm': 53, 'Al-Qamar': 54, 'Ar-Rahman': 55,
  'Al-Waqi\'ah': 56, 'Al-Hadid': 57, 'Al-Mujadila': 58, 'Al-Hashr': 59, 'Al-Mumtahanah': 60,
  'As-Saf': 61, 'Al-Jumu\'ah': 62, 'Al-Munafiqun': 63, 'At-Taghabun': 64, 'At-Talaq': 65,
  'At-Tahrim': 66, 'Al-Mulk': 67, 'Al-Qalam': 68, 'Al-Haqqah': 69, 'Al-Ma\'arij': 70,
  'Nuh': 71, 'Al-Jinn': 72, 'Al-Muzzammil': 73, 'Al-Muddathir': 74, 'Al-Qiyamah': 75,
  'Al-Insan': 76, 'Al-Mursalat': 77, 'An-Naba': 78, 'An-Nazi\'at': 79, 'Abasa': 80,
  'At-Takwir': 81, 'Al-Infitar': 82, 'Al-Mutaffifin': 83, 'Al-Inshiqaq': 84, 'Al-Buruj': 85,
  'At-Tariq': 86, 'Al-A\'la': 87, 'Al-Ghashiyah': 88, 'Al-Fajr': 89, 'Al-Balad': 90,
  'Ash-Shams': 91, 'Al-Layl': 92, 'Ad-Duha': 93, 'Ash-Sharh': 94, 'At-Tin': 95,
  'Al-Alaq': 96, 'Al-Qadr': 97, 'Al-Bayyinah': 98, 'Az-Zalzalah': 99, 'Al-Adiyat': 100,
  'Al-Qari\'ah': 101, 'At-Takathur': 102, 'Al-Asr': 103, 'Al-Humazah': 104, 'Al-Fil': 105,
  'Quraish': 106, 'Al-Ma\'un': 107, 'Al-Kawthar': 108, 'Al-Kafirun': 109, 'An-Nasr': 110,
  'Al-Masad': 111, 'Al-Ikhlas': 112, 'Al-Falaq': 113, 'An-Nas': 114
};

// Surah ayah counts for global ayah number calculation
export const surahAyahCounts = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
];

export const calculateGlobalAyahNumber = (surahNumber: number, ayahNumber: number): number => {
  let globalAyahNumber = 0;
  for (let i = 0; i < surahNumber - 1; i++) {
    globalAyahNumber += surahAyahCounts[i] || 0;
  }
  globalAyahNumber += ayahNumber;
  return globalAyahNumber;
};

// Helper function to get surah number with better matching
export const getSurahNumber = (surahName: string): number | null => {
  // Direct match
  if (surahNameToNumber[surahName]) {
    return surahNameToNumber[surahName];
  }
  
  // Case-insensitive match
  const lowerSurahName = surahName.toLowerCase();
  for (const [name, number] of Object.entries(surahNameToNumber)) {
    if (name.toLowerCase() === lowerSurahName) {
      return number;
    }
  }
  
  // Handle common variations and typos
  const variations: { [key: string]: number } = {
    'al-anbiya': 21, 'al-anbya': 21, 'al-anbiyaa': 21,
    'al-fatiha': 1, 'al-fatihah': 1,
    'al-baqarah': 2, 'al-baqara': 2,
    'aal-imran': 3, 'al-imran': 3,
    'an-nisa': 4, 'al-nisa': 4,
    'al-maidah': 5, 'al-ma\'idah': 5,
    'al-anam': 6, 'al-an\'am': 6,
    'al-araf': 7, 'al-a\'raf': 7,
    'at-tawbah': 9, 'al-tawbah': 9,
    'ash-shuara': 26, 'ash-shu\'ara': 26,
    'an-naml': 27, 'al-naml': 27,
    'al-qasas': 28, 'an-qasas': 28,
    'al-ankabut': 29, 'an-ankabut': 29,
    'ar-rum': 30, 'al-rum': 30,
    'as-sajdah': 32, 'al-sajdah': 32,
    'al-ahzab': 33, 'an-ahzab': 33,
    'ya-sin': 36, 'yasin': 36,
    'as-saffat': 37, 'al-saffat': 37,
    'az-zukhruf': 43, 'al-zukhruf': 43,
    'ad-dukhan': 44, 'al-dukhan': 44,
    'al-jathiyah': 45, 'al-jathiya': 45,
    'al-ahqaf': 46, 'an-ahqaf': 46,
    'al-fath': 48, 'an-fath': 48,
    'al-hujurat': 49, 'an-hujurat': 49,
    'adh-dhariyat': 51, 'al-dhariyat': 51,
    'at-tur': 52, 'al-tur': 52,
    'an-najm': 53, 'al-najm': 53,
    'al-qamar': 54, 'an-qamar': 54,
    'ar-rahman': 55, 'al-rahman': 55,
    'al-waqiah': 56, 'al-waqi\'ah': 56,
    'al-hadid': 57, 'an-hadid': 57,
    'al-mujadila': 58, 'an-mujadila': 58,
    'al-hashr': 59, 'an-hashr': 59,
    'al-mumtahanah': 60, 'an-mumtahanah': 60,
    'as-saf': 61, 'al-saf': 61,
    'al-jumua': 62, 'al-jumu\'ah': 62,
    'al-munafiqun': 63, 'an-munafiqun': 63,
    'at-taghabun': 64, 'al-taghabun': 64,
    'at-talaq': 65, 'al-talaq': 65,
    'at-tahrim': 66, 'al-tahrim': 66,
    'al-mulk': 67, 'an-mulk': 67,
    'al-qalam': 68, 'an-qalam': 68,
    'al-haqqah': 69, 'an-haqqah': 69,
    'al-maarij': 70, 'al-ma\'arij': 70,
    'al-muzzammil': 73, 'an-muzzammil': 73,
    'al-muddathir': 74, 'an-muddathir': 74,
    'al-qiyamah': 75, 'an-qiyamah': 75,
    'al-insan': 76, 'an-insan': 76,
    'al-mursalat': 77, 'an-mursalat': 77,
    'an-naba': 78, 'al-naba': 78,
    'an-naziat': 79, 'an-nazi\'at': 79,
    'at-takwir': 81, 'al-takwir': 81,
    'al-infitar': 82, 'an-infitar': 82,
    'al-mutaffifin': 83, 'an-mutaffifin': 83,
    'al-inshiqaq': 84, 'an-inshiqaq': 84,
    'al-buruj': 85, 'an-buruj': 85,
    'at-tariq': 86, 'al-tariq': 86,
    'al-ala': 87, 'al-a\'la': 87,
    'al-ghashiyah': 88, 'an-ghashiyah': 88,
    'al-fajr': 89, 'an-fajr': 89,
    'al-balad': 90, 'an-balad': 90,
    'ash-shams': 91, 'al-shams': 91,
    'al-layl': 92, 'an-layl': 92,
    'ad-duha': 93, 'al-duha': 93,
    'ash-sharh': 94, 'al-sharh': 94,
    'at-tin': 95, 'al-tin': 95,
    'al-alaq': 96, 'an-alaq': 96,
    'al-qadr': 97, 'an-qadr': 97,
    'al-bayyinah': 98, 'an-bayyinah': 98,
    'az-zalzalah': 99, 'al-zalzalah': 99,
    'al-adiyat': 100, 'al-adayyat': 100,
    'al-qariah': 101, 'al-qari\'ah': 101,
    'at-takathur': 102, 'al-takathur': 102,
    'al-asr': 103, 'an-asr': 103,
    'al-humazah': 104, 'an-humazah': 104,
    'al-fil': 105, 'an-fil': 105,
    'quraish': 106, 'al-quraish': 106,
    'al-maun': 107, 'an-maun': 107,
    'al-kawthar': 108, 'an-kawthar': 108,
    'al-kafirun': 109, 'an-kafirun': 109,
    'an-nasr': 110, 'al-nasr': 110,
    'al-masad': 111, 'an-masad': 111,
    'al-ikhlas': 112, 'an-ikhlas': 112,
    'al-falaq': 113, 'an-falaq': 113,
    'an-nas': 114, 'al-nas': 114
  };
  
  if (variations[lowerSurahName]) {
    return variations[lowerSurahName];
  }
  
  return null;
};
