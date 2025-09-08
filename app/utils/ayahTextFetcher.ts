// Utility function to fetch ayah text from AlQuran Cloud API
// Uses Muhammad Asad's translation as default, with English fallback

export interface AyahTextResponse {
  text: string;
  surah: {
    number: number;
    name: string;
    englishName: string;
  };
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean;
}

export interface AlQuranApiResponse {
  code: number;
  status: string;
  data: AyahTextResponse;
}

// Fetch ayah text using global ayah number
export const fetchAyahText = async (globalAyahNumber: number): Promise<string | null> => {
  try {
    // First try Muhammad Asad's translation
    const asadResponse = await fetch(`http://api.alquran.cloud/v1/ayah/${globalAyahNumber}/en.asad`);
    
    if (asadResponse.ok) {
      const asadData: AlQuranApiResponse = await asadResponse.json();
      if (asadData.code === 200 && asadData.data && asadData.data.text) {
        console.log(`✅ Fetched ayah text from Asad translation for global ayah ${globalAyahNumber}`);
        return asadData.data.text;
      }
    }
    
    console.log(`⚠️ Asad translation failed for global ayah ${globalAyahNumber}, trying English fallback`);
    
    // Fallback to English translation
    const englishResponse = await fetch(`http://api.alquran.cloud/v1/ayah/${globalAyahNumber}/en`);
    
    if (englishResponse.ok) {
      const englishData: AlQuranApiResponse = await englishResponse.json();
      if (englishData.code === 200 && englishData.data && englishData.data.text) {
        console.log(`✅ Fetched ayah text from English translation for global ayah ${globalAyahNumber}`);
        return englishData.data.text;
      }
    }
    
    console.log(`⚠️ English translation failed for global ayah ${globalAyahNumber}, trying Arabic fallback`);
    
    // Final fallback to Arabic
    const arabicResponse = await fetch(`http://api.alquran.cloud/v1/ayah/${globalAyahNumber}`);
    
    if (arabicResponse.ok) {
      const arabicData: AlQuranApiResponse = await arabicResponse.json();
      if (arabicData.code === 200 && arabicData.data && arabicData.data.text) {
        console.log(`✅ Fetched ayah text from Arabic for global ayah ${globalAyahNumber}`);
        return arabicData.data.text;
      }
    }
    
    console.log(`❌ Failed to fetch ayah text for global ayah ${globalAyahNumber} from all translations (Asad, English, Arabic)`);
    return null;
    
  } catch (error) {
    console.error(`🚨 Error fetching ayah text for global ayah ${globalAyahNumber}:`, error);
    return null;
  }
};

// Fetch multiple ayahs for a range (e.g., 23:1-11)
export const fetchAyahRangeText = async (surahNumber: number, startAyah: number, endAyah: number): Promise<string | null> => {
  try {
    console.log(`🔍 Fetching ayah range ${surahNumber}:${startAyah}-${endAyah}`);
    
    const ayahTexts: string[] = [];
    
    // Fetch each ayah in the range
    for (let ayahNum = startAyah; ayahNum <= endAyah; ayahNum++) {
      const ayahText = await fetchAyahTextBySurahAyah(surahNumber, ayahNum);
      if (ayahText) {
        ayahTexts.push(ayahText);
      } else {
        console.log(`⚠️ Failed to fetch ayah ${surahNumber}:${ayahNum}`);
      }
    }
    
    if (ayahTexts.length > 0) {
      // Combine all ayahs with proper spacing
      const combinedText = ayahTexts.join(' ');
      console.log(`✅ Successfully fetched ${ayahTexts.length} ayahs for range ${surahNumber}:${startAyah}-${endAyah}`);
      return combinedText;
    } else {
      console.log(`❌ Failed to fetch any ayahs for range ${surahNumber}:${startAyah}-${endAyah}`);
      return null;
    }
    
  } catch (error) {
    console.error(`🚨 Error fetching ayah range ${surahNumber}:${startAyah}-${endAyah}:`, error);
    return null;
  }
};

// Fetch Arabic text for single ayah using global ayah number
export const fetchArabicAyahText = async (globalAyahNumber: number): Promise<string | null> => {
  try {
    const response = await fetch(`http://api.alquran.cloud/v1/ayah/${globalAyahNumber}`);
    
    if (response.ok) {
      const data: AlQuranApiResponse = await response.json();
      if (data.code === 200 && data.data && data.data.text) {
        console.log(`✅ Fetched Arabic text for global ayah ${globalAyahNumber}`);
        return data.data.text;
      }
    }
    
    console.log(`❌ Failed to fetch Arabic text for global ayah ${globalAyahNumber}`);
    return null;
    
  } catch (error) {
    console.error(`🚨 Error fetching Arabic text for global ayah ${globalAyahNumber}:`, error);
    return null;
  }
};

// Fetch Arabic text for ayah range
export const fetchArabicAyahRangeText = async (surahNumber: number, startAyah: number, endAyah: number): Promise<string | null> => {
  try {
    console.log(`🔍 Fetching Arabic ayah range for ${surahNumber}:${startAyah}-${endAyah}`);
    
    const ayahTexts: string[] = [];
    
    // Fetch each ayah in the range
    for (let ayahNum = startAyah; ayahNum <= endAyah; ayahNum++) {
      const response = await fetch(`http://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNum}`);
      if (response.ok) {
        const data: AlQuranApiResponse = await response.json();
        if (data.code === 200 && data.data && data.data.text) {
          ayahTexts.push(data.data.text);
          console.log(`   ✅ Fetched Arabic text for ${surahNumber}:${ayahNum}`);
        } else {
          console.log(`   ⚠️ Failed to fetch Arabic text for ${surahNumber}:${ayahNum}`);
        }
      } else {
        console.log(`   ⚠️ API error for ${surahNumber}:${ayahNum}: ${response.status}`);
      }
    }
    
    if (ayahTexts.length > 0) {
      // Combine all ayahs with proper spacing
      const combinedText = ayahTexts.join(' ');
      console.log(`✅ Successfully fetched ${ayahTexts.length} Arabic ayahs for range ${surahNumber}:${startAyah}-${endAyah}`);
      return combinedText;
    } else {
      console.log(`❌ Failed to fetch any Arabic ayahs for range ${surahNumber}:${startAyah}-${endAyah}`);
      return null;
    }
    
  } catch (error) {
    console.error(`🚨 Error fetching Arabic ayah range ${surahNumber}:${startAyah}-${endAyah}:`, error);
    return null;
  }
};

// Fetch ayah text using surah number and ayah number
export const fetchAyahTextBySurahAyah = async (surahNumber: number, ayahNumber: number): Promise<string | null> => {
  try {
    // First try Muhammad Asad's translation
    const asadResponse = await fetch(`http://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}/en.asad`);
    
    if (asadResponse.ok) {
      const asadData: AlQuranApiResponse = await asadResponse.json();
      if (asadData.code === 200 && asadData.data && asadData.data.text) {
        console.log(`✅ Fetched ayah text from Asad translation for ${surahNumber}:${ayahNumber}`);
        return asadData.data.text;
      }
    }
    
    console.log(`⚠️ Asad translation failed for ${surahNumber}:${ayahNumber}, trying English fallback`);
    
    // Fallback to English translation
    const englishResponse = await fetch(`http://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}/en`);
    
    if (englishResponse.ok) {
      const englishData: AlQuranApiResponse = await englishResponse.json();
      if (englishData.code === 200 && englishData.data && englishData.data.text) {
        console.log(`✅ Fetched ayah text from English translation for ${surahNumber}:${ayahNumber}`);
        return englishData.data.text;
      }
    }
    
    console.log(`⚠️ English translation failed for ${surahNumber}:${ayahNumber}, trying Arabic fallback`);
    
    // Final fallback to Arabic
    const arabicResponse = await fetch(`http://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}`);
    
    if (arabicResponse.ok) {
      const arabicData: AlQuranApiResponse = await arabicResponse.json();
      if (arabicData.code === 200 && arabicData.data && arabicData.data.text) {
        console.log(`✅ Fetched ayah text from Arabic for ${surahNumber}:${ayahNumber}`);
        return arabicData.data.text;
      }
    }
    
    console.log(`❌ Failed to fetch ayah text for ${surahNumber}:${ayahNumber} from all translations (Asad, English, Arabic)`);
    return null;
    
  } catch (error) {
    console.error(`🚨 Error fetching ayah text for ${surahNumber}:${ayahNumber}:`, error);
    return null;
  }
};
