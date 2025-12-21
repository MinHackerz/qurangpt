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
  data: AyahTextResponse | any;
}

// Fetch ayah text using global ayah number
export const fetchAyahText = async (globalAyahNumber: number): Promise<string | null> => {
  try {
    const editions = 'en.asad,en.sahih,quran-simple';
    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${globalAyahNumber}/editions/${editions}`);

    if (response.ok) {
      const data: AlQuranApiResponse = await response.json();
      if (data.code === 200 && Array.isArray(data.data)) {
        const asad = data.data.find((e: any) => e.edition.identifier === 'en.asad');
        const sahih = data.data.find((e: any) => e.edition.identifier === 'en.sahih');
        const arabic = data.data.find((e: any) => e.edition.identifier === 'quran-simple');
        return (asad || sahih || arabic)?.text || null;
      }
    }

    // Fallback
    const fallback = await fetch(`https://api.alquran.cloud/v1/ayah/${globalAyahNumber}/en.asad`);
    if (fallback.ok) {
      const data = await fallback.json();
      return data.data.text;
    }
    return null;
  } catch (error) {
    console.error(`🚨 Error fetching ayah text for global ayah ${globalAyahNumber}:`, error);
    return null;
  }
};

// Fetch multiple ayahs for a range (e.g., 23:1-11) efficiently
export const fetchAyahRangeText = async (surahNumber: number, startAyah: number, endAyah: number): Promise<string | null> => {
  try {
    const count = endAyah - startAyah + 1;
    const offset = startAyah - 1;
    const editions = 'en.asad,en.sahih,quran-simple';

    const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/${editions}?offset=${offset}&limit=${count}`);
    if (response.ok) {
      const data = await response.json();
      if (data.code === 200 && Array.isArray(data.data)) {
        const asad = data.data.find((e: any) => e.identifier === 'en.asad');
        const sahih = data.data.find((e: any) => e.identifier === 'en.sahih');
        const arabic = data.data.find((e: any) => e.identifier === 'quran-simple');
        const best = asad || sahih || arabic;
        return best ? best.ayahs.map((a: any) => a.text).join(' ') : null;
      }
    }

    // Fallback
    const fallback = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/en.asad?offset=${offset}&limit=${count}`);
    if (fallback.ok) {
      const data = await fallback.json();
      return data.data.ayahs.map((a: any) => a.text).join(' ');
    }
    return null;
  } catch (error) {
    console.error(`🚨 Error fetching ayah range ${surahNumber}:${startAyah}-${endAyah}:`, error);
    return null;
  }
};

// Fetch Arabic text for single ayah using global ayah number
export const fetchArabicAyahText = async (globalAyahNumber: number): Promise<string | null> => {
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${globalAyahNumber}/quran-simple`);
    if (response.ok) {
      const data: AlQuranApiResponse = await response.json();
      if (data.code === 200 && data.data && data.data.text) {
        return data.data.text;
      }
    }
    return null;
  } catch (error) {
    console.error(`🚨 Error fetching Arabic text for global ayah ${globalAyahNumber}:`, error);
    return null;
  }
};

// Fetch Arabic text for ayah range efficiently
export const fetchArabicAyahRangeText = async (surahNumber: number, startAyah: number, endAyah: number): Promise<string | null> => {
  try {
    const count = endAyah - startAyah + 1;
    const offset = startAyah - 1;

    const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-simple?offset=${offset}&limit=${count}`);
    if (response.ok) {
      const data = await response.json();
      if (data.code === 200 && data.data && data.data.ayahs) {
        return data.data.ayahs.map((a: any) => a.text).join(' ');
      }
    }
    return null;
  } catch (error) {
    console.error(`🚨 Error fetching Arabic ayah range ${surahNumber}:${startAyah}-${endAyah}:`, error);
    return null;
  }
};
