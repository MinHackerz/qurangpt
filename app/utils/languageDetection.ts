// Comprehensive language detection function supporting 130+ languages
// Extracted from SuggestedQuestions.tsx for consistent language detection across the app

export const detectLanguage = (text: string): string => {
  // PRODUCTION-GRADE LANGUAGE DETECTION
  // If text is very short, default to English
  if (text.length < 10) {
    return 'en';
  }
  
  // CRITICAL: Special handling for QuickQuestions - always treat as English
  const quickQuestionPatterns = [
    'What is the purpose of life according to Islam?',
    'Who is Prophet Muhammad (PBUH)?',
    'What does the Quran say about Allah?'
  ];
  
  if (quickQuestionPatterns.some(pattern => text.includes(pattern) || pattern.includes(text))) {
    console.log('🔒 PRODUCTION: QuickQuestion detected - forcing English');
    return 'en';
  }
  
  // CRITICAL: Force English for any question that starts with English question words
  const englishQuestionStarters = /^(what|who|when|where|why|how|which|whose|whom|is|are|was|were|do|does|did|will|would|could|should|may|might|can|must|shall)\s/i;
  if (englishQuestionStarters.test(text.trim())) {
    console.log('🔒 PRODUCTION: English question starter detected - forcing English');
    return 'en';
  }
  
  // CRITICAL: Force English for any text containing Islamic terms in English
  // But only if the text is primarily in English (not just containing one Islamic term)
  const islamicEnglishTerms = /(islam|quran|allah|prophet|muhammad|purpose|life|according|says|about|question|answer|explain|tell|me|please|thank|thanks|islamic|muslim|faith|belief|prayer|fasting|charity|pilgrimage|hajj|umrah|mosque|imam|sheikh|scholar|tafsir|hadith|sunnah|sharia|fiqh|aqeedah|tawheed|salah|zakat|sawm|hajj|umrah)/i;
  if (islamicEnglishTerms.test(text)) {
    // Check if the text is primarily in English by looking for common English words
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall', 'this', 'that', 'these', 'those', 'a', 'an', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'what', 'who', 'when', 'where', 'why', 'how', 'which', 'whose', 'whom'];
    const words = text.toLowerCase().split(/\s+/);
    const englishWordCount = words.filter(word => englishWords.includes(word)).length;
    const englishRatio = englishWordCount / words.length;
    
    if (englishRatio > 0.3) { // More than 30% English words
      console.log('🔒 PRODUCTION: Islamic English terms with English context detected - forcing English');
      return 'en';
    }
  }

  // Check if text contains non-Latin characters first (skip English check if so)
  const nonLatinPattern = /[^\u0000-\u007F\u00A0-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF]/;
  if (nonLatinPattern.test(text)) {
    // Contains non-Latin characters, skip English pattern check
  } else {
    // Only check for English if text contains only Latin characters
    const englishPattern = /^[a-zA-Z0-9\s\.,!?'"()\-:;@#$%&*+=<>[\]{}|\\\/~`]+$/;
    if (englishPattern.test(text)) {
      // This could be English or another Latin-script language, continue to word analysis
    }
  }

  // Check if text contains common English words (more reliable than character-based detection)
  const commonEnglishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall', 'this', 'that', 'these', 'those', 'a', 'an', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'what', 'who', 'when', 'where', 'why', 'how', 'which', 'whose', 'whom', 'islam', 'quran', 'allah', 'prophet', 'muhammad', 'purpose', 'life', 'according', 'says', 'about', 'question', 'answer', 'explain', 'tell', 'me', 'please', 'thank', 'thanks'];
  const textWords = text.toLowerCase().match(/[a-z]+/g) || [];
  const englishWordCount = textWords.filter(word => commonEnglishWords.includes(word)).length;
  
  // More aggressive English detection for Islamic content
  if (textWords.length > 0) {
    const englishRatio = englishWordCount / textWords.length;
    // Lower threshold for English detection, especially for Islamic content
    if (englishRatio > 0.2) {
      return 'en';
    }
    
    // Special case: if text contains Islamic terms in English, likely English
    const islamicEnglishTerms = ['islam', 'quran', 'allah', 'prophet', 'muhammad', 'purpose', 'life', 'according', 'says', 'about', 'question', 'answer', 'explain', 'tell', 'me', 'please', 'thank', 'thanks', 'what', 'who', 'when', 'where', 'why', 'how', 'which', 'whose', 'whom'];
    const hasIslamicTerms = textWords.some(word => islamicEnglishTerms.includes(word));
    if (hasIslamicTerms && englishRatio > 0.1) {
      return 'en';
    }
  }

  // Unicode script-based detection for non-Latin scripts
  const scriptPatterns = {
    // Arabic and related scripts
    ar: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/,
    fa: /[\u0600-\u06FF].*[\u06A9\u06AF\u06CC\u067E\u0686\u0698]/,
    ur: /[\u0600-\u06FF].*[\u0627\u0628\u067E\u062A\u0679]/,
    ku: /[\u0600-\u06FF].*[\u06A9\u06AF\u06CC\u067E\u0686\u0698]/,
    ps: /[\u0600-\u06FF].*[\u067E\u0686\u0698\u06A9\u06AF\u06CC]/,
    sd: /[\u0600-\u06FF].*[\u0633\u0646\u0688\u06CC]/,
    ug: /[\u0600-\u06FF].*[\u0626\u06C7\u0649\u063A\u06C7\u0631]/,
    ckb: /[\u0600-\u06FF].*[\u06A9\u06AF\u06CC\u067E\u0686\u0698]/,
    
    // Hebrew and Yiddish
    he: /[\u0590-\u05FF]/,
    yi: /[\u0590-\u05FF]/,
    
    // South Asian scripts - more conservative detection
    hi: /[\u0900-\u097F]{3,}/, // Require at least 3 Devanagari characters
    bn: /[\u0980-\u09FF]{3,}/, // Require at least 3 Bengali characters
    ta: /[\u0B80-\u0BFF]{3,}/, // Require at least 3 Tamil characters
    te: /[\u0C00-\u0C7F]{3,}/, // Require at least 3 Telugu characters
    ml: /[\u0D00-\u0D7F]{3,}/, // Require at least 3 Malayalam characters
    kn: /[\u0C80-\u0CFF]{3,}/, // Require at least 3 Kannada characters
    gu: /[\u0A80-\u0AFF]{3,}/, // Require at least 3 Gujarati characters
    pa: /[\u0A00-\u0A7F]{3,}/, // Require at least 3 Gurmukhi characters
    or: /[\u0B00-\u0B7F]{3,}/, // Require at least 3 Odia characters
    as: /[\u0980-\u09FF]{3,}/, // Require at least 3 Assamese characters (same as Bengali)
    mr: /[\u0900-\u097F]{3,}/, // Require at least 3 Marathi characters (same as Devanagari)
    ne: /[\u0900-\u097F]{3,}/, // Require at least 3 Nepali characters (same as Devanagari)
    si: /[\u0D80-\u0DFF]{3,}/, // Require at least 3 Sinhala characters
    my: /[\u1000-\u109F]{3,}/, // Require at least 3 Myanmar characters
    km: /[\u1780-\u17FF]{3,}/, // Require at least 3 Khmer characters
    lo: /[\u0E80-\u0EFF]{3,}/, // Require at least 3 Lao characters
    
    // East Asian scripts - more conservative detection
    zh: /[\u4e00-\u9fff]{2,}/, // Require at least 2 Chinese characters
    ja: /[\u3040-\u309f\u30a0-\u30ff]{2,}/, // Require at least 2 Japanese characters
    ko: /[\uac00-\ud7af]{2,}/, // Require at least 2 Korean characters
    th: /[\u0E00-\u0E7F]{3,}/, // Require at least 3 Thai characters
    
    // European scripts - more conservative detection
    ru: /[\u0400-\u04FF]{3,}/, // Require at least 3 Cyrillic characters
    be: /[\u0400-\u04FF]{3,}/, // Require at least 3 Belarusian characters
    uk: /[\u0400-\u04FF]{3,}/, // Require at least 3 Ukrainian characters
    bg: /[\u0400-\u04FF]{3,}/, // Require at least 3 Bulgarian characters
    sr: /[\u0400-\u04FF]{3,}/, // Require at least 3 Serbian characters
    mk: /[\u0400-\u04FF]{3,}/, // Require at least 3 Macedonian characters
    
    // Georgian and Armenian - more conservative detection
    ka: /[\u10A0-\u10FF]{3,}/, // Require at least 3 Georgian characters
    hy: /[\u0530-\u058F]{3,}/, // Require at least 3 Armenian characters
    
    // Baltic languages - more conservative detection
    et: /[\u0100-\u017F]{3,}/, // Require at least 3 Estonian characters (Latin with diacritics)
    lv: /[\u0100-\u017F]{3,}/, // Require at least 3 Latvian characters (Latin with diacritics)
    lt: /[\u0100-\u017F]{3,}/, // Require at least 3 Lithuanian characters (Latin with diacritics)
    
    // Turkic languages - more conservative detection
    az: /[\u0100-\u017F\u0180-\u024F]{3,}/, // Require at least 3 Azerbaijani characters (Latin with extended)
    kk: /[\u0400-\u04FF\u0490-\u0491]{3,}/, // Require at least 3 Kazakh characters (Cyrillic with Kazakh-specific)
    ky: /[\u0400-\u04FF\u0490-\u0491]{3,}/, // Require at least 3 Kyrgyz characters (Cyrillic with Kyrgyz-specific)
    uz: /[\u0400-\u04FF\u0490-\u0491]{3,}/, // Require at least 3 Uzbek characters (Cyrillic with Uzbek-specific)
    tk: /[\u0400-\u04FF\u0490-\u0491]{3,}/, // Require at least 3 Turkmen characters (Cyrillic with Turkmen-specific)
    tg: /[\u0400-\u04FF\u0490-\u0491]{3,}/, // Require at least 3 Tajik characters (Cyrillic with Tajik-specific)
    
    // Central Asian scripts - more conservative detection
    mn: /[\u1800-\u18AF]{3,}/, // Require at least 3 Mongolian characters
    
    // African scripts - more conservative detection
    am: /[\u1200-\u137F]{3,}/, // Require at least 3 Amharic characters
    ti: /[\u1200-\u137F]{3,}/, // Require at least 3 Tigrinya characters
    om: /[\u1200-\u137F]{3,}/, // Require at least 3 Oromo characters
  };

  // Check for script-based detection first
  for (const [lang, pattern] of Object.entries(scriptPatterns)) {
    if (pattern.test(text)) {
      return lang;
    }
  }

  // Enhanced word-based detection for Latin script languages
  const textLower = text.toLowerCase();
  const words = textLower.split(/\s+/).filter(word => word.length > 2);
  
  if (words.length > 0) {
    const languageIndicators = {
      // Romance languages
      es: ['que', 'con', 'una', 'por', 'para', 'como', 'más', 'pero', 'sus', 'les', 'del', 'las', 'los', 'este', 'esta', 'son', 'están', 'tienen', 'hacer', 'decir'],
      fr: ['que', 'des', 'les', 'une', 'sur', 'avec', 'son', 'dans', 'pour', 'tout', 'est', 'pas', 'nous', 'vous', 'leur', 'être', 'avoir', 'faire', 'dire', 'cette'],
      it: ['che', 'con', 'una', 'per', 'sono', 'come', 'più', 'dalla', 'anche', 'loro', 'questo', 'questa', 'della', 'essere', 'avere', 'fare', 'dire', 'questo'],
      pt: ['que', 'com', 'uma', 'para', 'são', 'como', 'mais', 'pela', 'seus', 'tem', 'não', 'está', 'muito', 'ser', 'ter', 'fazer', 'dizer', 'este', 'essa'],
      ro: ['ce', 'cu', 'o', 'pentru', 'sunt', 'cum', 'mai', 'din', 'și', 'lor', 'acest', 'această', 'este', 'a', 'avea', 'face', 'spune'],
      ca: ['que', 'amb', 'una', 'per', 'són', 'com', 'més', 'de', 'i', 'llur', 'aquest', 'aquesta', 'és', 'tenir', 'fer', 'dir'],
      gl: ['que', 'coa', 'unha', 'para', 'son', 'como', 'máis', 'de', 'e', 'seu', 'este', 'esta', 'é', 'ter', 'facer', 'dicir'],
      
      // Germanic languages
      de: ['der', 'die', 'und', 'den', 'das', 'von', 'ist', 'mit', 'auf', 'für', 'sich', 'nicht', 'ein', 'eine', 'auch', 'sein', 'haben', 'machen', 'sagen'],
      nl: ['dat', 'met', 'een', 'voor', 'zijn', 'hoe', 'meer', 'van', 'en', 'hun', 'dit', 'deze', 'is', 'hebben', 'doen', 'zeggen'],
      sv: ['som', 'med', 'en', 'för', 'är', 'hur', 'mer', 'av', 'och', 'deras', 'detta', 'denna', 'är', 'ha', 'göra', 'säga'],
      da: ['som', 'med', 'en', 'for', 'er', 'hvordan', 'mere', 'af', 'og', 'deres', 'dette', 'denne', 'er', 'have', 'gøre', 'sige'],
      no: ['som', 'med', 'en', 'for', 'er', 'hvordan', 'mer', 'av', 'og', 'deres', 'dette', 'denna', 'er', 'ha', 'gjøre', 'si'],
      is: ['sem', 'með', 'einn', 'fyrir', 'er', 'hvernig', 'meira', 'af', 'og', 'þeirra', 'þetta', 'þessi', 'er', 'hafa', 'gera', 'segja'],
      fi: ['joka', 'kanssa', 'yksi', 'varten', 'on', 'miten', 'enemmän', 'ja', 'sekä', 'heidän', 'tämä', 'tämä', 'on', 'olla', 'tehdä', 'sanoa'],
      
      // Slavic languages
      pl: ['który', 'z', 'jeden', 'dla', 'jest', 'jak', 'więcej', 'z', 'i', 'ich', 'ten', 'ta', 'jest', 'mieć', 'robić', 'mówić'],
      cs: ['který', 's', 'jeden', 'pro', 'je', 'jak', 'více', 'z', 'a', 'jejich', 'tento', 'tato', 'je', 'mít', 'dělat', 'říkat'],
      sk: ['ktorý', 's', 'jeden', 'pre', 'je', 'ako', 'viac', 'z', 'a', 'ich', 'tento', 'táto', 'je', 'mať', 'robiť', 'hovoriť'],
      hu: ['amely', 'val', 'egy', 'számára', 'van', 'hogyan', 'több', 'a', 'és', 'azok', 'ez', 'ez', 'van', 'van', 'csinálni', 'mondani'],
      hr: ['koji', 's', 'jedan', 'za', 'je', 'kako', 'više', 'od', 'i', 'njihov', 'ovaj', 'ova', 'je', 'imati', 'raditi', 'reći'],
      sr: ['који', 'с', 'један', 'за', 'је', 'како', 'више', 'од', 'и', 'њихов', 'овај', 'ова', 'је', 'имати', 'радити', 'рећи'],
      bs: ['koji', 's', 'jedan', 'za', 'je', 'kako', 'više', 'od', 'i', 'njihov', 'ovaj', 'ova', 'je', 'imati', 'raditi', 'reći'],
      sl: ['ki', 'z', 'eden', 'za', 'je', 'kako', 'več', 'od', 'in', 'njihov', 'ta', 'ta', 'je', 'imeti', 'delati', 'reči'],
      mk: ['кој', 'со', 'еден', 'за', 'е', 'како', 'повеќе', 'од', 'и', 'нивниот', 'овој', 'оваа', 'е', 'има', 'прави', 'кажува'],
      sq: ['që', 'me', 'një', 'për', 'është', 'si', 'më', 'nga', 'dhe', 'tyre', 'ky', 'kjo', 'është', 'ka', 'bën', 'thotë'],
      el: ['που', 'με', 'ένα', 'για', 'είναι', 'πώς', 'περισσότερο', 'από', 'και', 'τους', 'αυτό', 'αυτή', 'είναι', 'έχει', 'κάνει', 'λέει'],
      
      // Asian languages
      id: ['yang', 'dan', 'ini', 'itu', 'untuk', 'pada', 'dalam', 'dengan', 'dari', 'akan', 'sudah', 'bisa', 'tidak', 'adalah', 'ada', 'membuat', 'mengatakan', 'dengan', 'adalah', 'akan', 'sudah', 'bisa', 'tidak', 'adalah', 'ada', 'membuat', 'mengatakan'],
      ms: ['yang', 'dan', 'ini', 'itu', 'untuk', 'pada', 'dalam', 'dengan', 'dari', 'akan', 'sudah', 'bisa', 'tidak', 'adalah', 'ada', 'membuat', 'mengatakan', 'kejayaan', 'berkait', 'rapat', 'pemahaman', 'pelaksanaan', 'tujuan', 'ditentukan', 'oleh', 'sejati', 'diukur', 'kebendaan', 'pencapaian', 'duniawi', 'ketaatan', 'keimanan', 'soleh', 'keredhaan', 'matlamat', 'mencapai', 'kebahagiaan', 'dunia', 'akhirat'],
      jv: ['sing', 'lan', 'iki', 'iku', 'kanggo', 'ing', 'jero', 'karo', 'saka', 'bakal', 'wis', 'bisa', 'ora', 'iku', 'ana', 'gawe', 'ngomong'],
      su: ['anu', 'jeung', 'ieu', 'eta', 'pikeun', 'di', 'jero', 'jeung', 'ti', 'bakal', 'geus', 'bisa', 'henteu', 'eta', 'aya', 'nyieun', 'ngomong'],
      ceb: ['nga', 'ug', 'kini', 'kana', 'para', 'sa', 'sa', 'ug', 'gikan', 'mahimong', 'na', 'makahimo', 'dili', 'kana', 'naa', 'buhat', 'ingon'],
      tl: ['na', 'at', 'ito', 'iyan', 'para', 'sa', 'sa', 'at', 'mula', 'maaari', 'na', 'maaari', 'hindi', 'ito', 'may', 'gawin', 'sabihin'],
      
      // Southeast Asian languages
      tr: ['bir', 'bu', 've', 'de', 'da', 'ile', 'için', 'var', 'olan', 'gibi', 'çok', 'daha', 'ama', 'ne', 'nasıl', 'olmak', 'sahip', 'yapmak', 'söylemek'],
      vi: ['của', 'và', 'có', 'trong', 'với', 'để', 'được', 'cho', 'từ', 'này', 'đó', 'là', 'cũng', 'rất', 'như', 'là', 'có', 'làm', 'nói'],
      th: ['ที่', 'และ', 'มี', 'ใน', 'กับ', 'เพื่อ', 'ได้', 'ให้', 'จาก', 'นี้', 'นั้น', 'เป็น', 'ก็', 'มาก', 'เหมือน', 'เป็น', 'มี', 'ทำ', 'พูด'],
      km: ['ដែល', 'និង', 'មាន', 'ក្នុង', 'ជាមួយ', 'សម្រាប់', 'បាន', 'ឱ្យ', 'ពី', 'នេះ', 'នោះ', 'ជា', 'ក៏', 'ច្រើន', 'ដូច', 'ជា', 'មាន', 'ធ្វើ', 'និយាយ'],
      lo: ['ທີ່', 'ແລະ', 'ມີ', 'ໃນ', 'ກັບ', 'ສຳລັບ', 'ໄດ້', 'ໃຫ້', 'ຈາກ', 'ນີ້', 'ນັ້ນ', 'ເປັນ', 'ກໍ', 'ຫຼາຍ', 'ຄື', 'ເປັນ', 'ມີ', 'ເຮັດ', 'ເວົ້າ'],
      my: ['သော', 'နှင့်', 'ရှိ', 'အတွင်း', 'နှင့်အတူ', 'အတွက်', 'ရ', 'ပေး', 'မှ', 'ဤ', 'ထို', 'ဖြစ်', 'လည်း', 'များ', 'ကဲ့သို့', 'ဖြစ်', 'ရှိ', 'လုပ်', 'ပြော'],
      
      // African languages
      sw: ['ambayo', 'na', 'hii', 'ile', 'kwa', 'katika', 'na', 'kwa', 'kutoka', 'hii', 'ile', 'ni', 'pia', 'sana', 'kama', 'kuwa', 'kuwa', 'kufanya', 'kusema'],
      ha: ['wanda', 'da', 'wannan', 'wancan', 'ga', 'a', 'da', 'da', 'daga', 'wannan', 'wancan', 'ne', 'kuma', 'sosai', 'kamar', 'zama', 'da', 'yi', 'ce'],
      yo: ['ti', 'ati', 'eyi', 'iyen', 'fun', 'ni', 'pẹlu', 'pẹlu', 'lati', 'eyi', 'iyen', 'jẹ', 'tun', 'gan', 'bi', 'jẹ', 'ní', 'ṣe', 'sọ'],
      ig: ['nke', 'na', 'nke', 'nke', 'maka', 'na', 'na', 'na', 'site', 'nke', 'nke', 'bụ', 'kwa', 'nke', 'dị', 'bụ', 'nwere', 'mee', 'kwuo'],
      am: ['የሚሆን', 'እና', 'ይህ', 'ያ', 'ለ', 'ውስጥ', 'እና', 'እና', 'ከ', 'ይህ', 'ያ', 'ነው', 'ም', 'በጣም', 'እንደ', 'ሆን', 'አለው', 'ያድርግ', 'ንገር'],
      so: ['kaas', 'iyo', 'kani', 'kaas', 'u', 'ku', 'iyo', 'iyo', 'ka', 'kani', 'kaas', 'waa', 'sidoo', 'aad', 'sida', 'ah', 'leeyahay', 'samee', 'sheeg'],
      
      // Baltic languages
      et: ['mis', 'ja', 'see', 'on', 'et', 'kui', 'või', 'aga', 'kõik', 'see', 'see', 'on', 'olema', 'tegema', 'ütlema'],
      lv: ['kas', 'un', 'tas', 'ir', 'ka', 'kā', 'vai', 'bet', 'visi', 'tas', 'tas', 'ir', 'būt', 'darīt', 'teikt'],
      lt: ['kuris', 'ir', 'vienas', 'dėl', 'yra', 'kaip', 'daugiau', 'iš', 'ir', 'jų', 'šis', 'šis', 'yra', 'turėti', 'daryti', 'sakyti'],
      
      // Turkic languages
      az: ['hansı', 'ilə', 'bir', 'üçün', 'var', 'necə', 'daha', 'dan', 'və', 'onların', 'bu', 'bu', 'var', 'olmaq', 'etmək', 'demək'],
      
      // Other languages
      af: ['wat', 'met', 'een', 'vir', 'is', 'hoe', 'meer', 'van', 'en', 'har', 'dit', 'dit', 'is', 'hawwe', 'dwaan', 'sizze'],
      zu: ['okuthi', 'futhi', 'lena', 'leyo', 'uku', 'ngaphakathi', 'futhi', 'futhi', 'kusuka', 'lena', 'leyo', 'kukhona', 'futhi', 'kakhulu', 'njenga', 'ukuba', 'ukuba', 'ukwenza', 'ukusho'],
      xh: ['okuthi', 'kunye', 'le', 'leyo', 'uku', 'ngaphakathi', 'kunye', 'kunye', 'ukusuka', 'le', 'leyo', 'kukhona', 'kunye', 'kakhulu', 'njenga', 'ukuba', 'ukuba', 'ukwenza', 'ukuthetha'],
      st: ['e', 'le', 'ena', 'eona', 'bakeng', 'ka', 'le', 'le', 'ho', 'ena', 'eona', 'ke', 'le', 'haholo', 'joalo', 'ho', 'ho', 'ho', 'ho'],
      tn: ['e', 'le', 'eno', 'eono', 'go', 'ka', 'le', 'le', 'go', 'eno', 'eono', 'ke', 'le', 'that', 'jaaka', 'go', 'go', 'go', 'go'],
      ss: ['le', 'ne', 'leli', 'lelo', 'ku', 'ku', 'ne', 'ne', 'ku', 'leli', 'lelo', 'kukhona', 'ne', 'kakhulu', 'njenga', 'kuba', 'kuba', 'kwenta', 'kusho'],
      ve: ['tshi', 'na', 'tshi', 'tsho', 'tsha', 'tsha', 'na', 'na', 'tsha', 'tshi', 'tsho', 'ndi', 'na', 'nga', 'sa', 'vha', 'vha', 'vha', 'vha'],
      ts: ['loko', 'na', 'leri', 'lero', 'ku', 'ku', 'na', 'na', 'ku', 'leri', 'lero', 'ku', 'na', 'swinene', 'swa', 'ku', 'ku', 'ku', 'ku'],
      nr: ['okuthi', 'kanye', 'le', 'leyo', 'uku', 'ngaphakathi', 'kanye', 'kanye', 'ukusuka', 'le', 'leyo', 'kukhona', 'kanye', 'kakhulu', 'njenga', 'ukuba', 'ukuba', 'ukwenza', 'ukuthetha'],
      rw: ['ubwo', 'na', 'iyi', 'iyo', 'ku', 'mu', 'na', 'na', 'kuva', 'iyi', 'iyo', 'ni', 'kandi', 'cyane', 'nk', 'kuba', 'kuba', 'gukora', 'kuvuga'],
      rn: ['ubwo', 'na', 'iyi', 'iyo', 'ku', 'mu', 'na', 'na', 'kuva', 'iyi', 'iyo', 'ni', 'kandi', 'cyane', 'nk', 'kuba', 'kuba', 'gukora', 'kuvuga'],
      lg: ['ekyo', 'ne', 'kino', 'ekyo', 'oku', 'mu', 'ne', 'ne', 'okuva', 'kino', 'ekyo', 'kiri', 'ne', 'nyo', 'nga', 'okuba', 'okuba', 'okukola', 'okugamba'],
      ak: ['a', 'ne', 'yi', 'yi', 'ma', 'mu', 'ne', 'ne', 'fi', 'yi', 'yi', 'yɛ', 'ne', 'pii', 'te', 'yɛ', 'wɔ', 'yɛ', 'ka'],
      tw: ['a', 'ne', 'yi', 'yi', 'ma', 'mu', 'ne', 'ne', 'fi', 'yi', 'yi', 'yɛ', 'ne', 'pii', 'te', 'yɛ', 'wɔ', 'yɛ', 'ka'],
      ff: ['ɗo', 'e', 'go', 'ɗo', 'ɓe', 'ɗo', 'e', 'e', 'ɓe', 'ɗo', 'ɗo', 'ɗo', 'e', 'ɗo', 'ɗo', 'ɗo', 'ɗo', 'ɗo', 'ɗo'],
      wo: ['ku', 'ak', 'li', 'li', 'ngal', 'ci', 'ak', 'ak', 'ci', 'li', 'li', 'dafa', 'ak', 'gën', 'ci', 'dafa', 'am', 'def', 'wax'],
      bm: ['min', 'fɛ', 'kelen', 'fɛ', 'bɛ', 'kɔnɔ', 'fɛ', 'fɛ', 'fɛ', 'min', 'min', 'bɛ', 'fɛ', 'cam', 'kɛ', 'bɛ', 'bɛ', 'kɛ', 'fɔ'],
      dyu: ['min', 'fɛ', 'kelen', 'fɛ', 'bɛ', 'kɔnɔ', 'fɛ', 'fɛ', 'fɛ', 'min', 'min', 'bɛ', 'fɛ', 'cam', 'kɛ', 'bɛ', 'bɛ', 'kɛ', 'fɔ'],
      ee: ['si', 'kple', 'e', 'e', 'na', 'le', 'kple', 'kple', 'tso', 'e', 'e', 'le', 'kple', 'gã', 'bĩ', 'le', 'le', 'wɔ', 'gblɔ'],
      gaa: ['ke', 'kɛ', 'ke', 'ke', 'ma', 'le', 'kɛ', 'kɛ', 'le', 'ke', 'ke', 'le', 'kɛ', 'gã', 'bĩ', 'le', 'le', 'wɔ', 'gblɔ'],
      ti: ['ዘ', 'ከ', 'ሓ', 'ን', 'ዘ', 'ከ', 'ከ', 'ከ', 'ከ', 'ዘ', 'ዘ', 'ዘ', 'ከ', 'ዘ', 'ዘ', 'ዘ', 'ዘ', 'ዘ', 'ዘ'],
      om: ['kan', 'fi', 'tokko', 'fi', 'kan', 'keessa', 'fi', 'fi', 'irraa', 'kan', 'kan', 'dha', 'fi', 'baay', 'akka', 'dha', 'qaba', 'gochuu', 'jedhu'],
      
      // Pacific languages
      mi: ['ko', 'me', 'tetahi', 'mo', 'he', 'pehea', 'atu', 'mai', 'me', 'o', 'tenei', 'tenei', 'he', 'whai', 'mahi', 'korero'],
      sm: ['o', 'ma', 'se', 'mo', 'o', 'faapefea', 'sili', 'mai', 'ma', 'o', 'lenei', 'lenei', 'o', 'maua', 'faia', 'fai'],
      to: ['oku', 'mo', 'e', 'ki', 'oku', 'pehea', 'atu', 'mai', 'mo', 'ona', 'eni', 'eni', 'oku', 'ma', 'faia', 'tala'],
      fj: ['o', 'kei', 'e', 'vei', 'o', 'vaka', 'levu', 'mai', 'kei', 'ona', 'o', 'o', 'o', 'tiko', 'cakava', 'vosa'],
      haw: ['ka', 'me', 'kekahi', 'no', 'he', 'pehea', 'oi', 'mai', 'me', 'ona', 'keia', 'keia', 'he', 'loaa', 'hana', 'olelo'],
      
      // Other languages
      eo: ['kiu', 'kun', 'unu', 'por', 'estas', 'kiel', 'pli', 'de', 'kaj', 'ilia', 'tiu', 'tiu', 'estas', 'havi', 'fari', 'diri'],
      la: ['qui', 'cum', 'unus', 'pro', 'est', 'quomodo', 'plus', 'de', 'et', 'eorum', 'hic', 'haec', 'est', 'habere', 'facere', 'dicere'],
      hmn: ['uas', 'thiab', 'ib', 'rau', 'yog', 'li cas', 'ntau', 'los', 'thiab', 'lawv', 'no', 'no', 'yog', 'muaj', 'ua', 'hais'],
      co: ['chì', 'cù', 'unu', 'per', 'hè', 'cum', 'più', 'da', 'è', 'so', 'questu', 'questa', 'hè', 'avè', 'fà', 'dì'],
      fy: ['dy', 'mei', 'ien', 'foar', 'is', 'hoe', 'mear', 'fan', 'en', 'har', 'dit', 'dit', 'is', 'hawwe', 'dwaan', 'sizze'],
      ht: ['ki', 'ak', 'yon', 'pou', 'se', 'kijan', 'plis', 'soti', 'ak', 'yo', 'sa', 'sa', 'se', 'gen', 'fè', 'di'],
      lb: ['deen', 'mat', 'een', 'fir', 'ass', 'wéi', 'méi', 'vun', 'an', 'hir', 'dëst', 'dëst', 'ass', 'hunn', 'maachen', 'soen'],
      mg: ['izay', 'sy', 'iray', 'ho', 'dia', 'ahoana', 'be', 'avy', 'sy', 'izy', 'ity', 'ity', 'dia', 'manana', 'manao', 'miteny'],
      ny: ['yomwe', 'ndi', 'chimodzi', 'cha', 'ndi', 'bwanji', 'kwambiri', 'kuchokera', 'ndi', 'awo', 'ichi', 'ichi', 'ndi', 'kukhala', 'chita', 'nena'],
      sn: ['iyo', 'uye', 'imwe', 'ye', 'iri', 'sei', 'zvikuru', 'kubva', 'uye', 'avo', 'ichi', 'ichi', 'iri', 'kuva', 'ita', 'taura'],
      be: ['які', 'з', 'адзін', 'для', 'ёсць', 'як', 'больш', 'з', 'і', 'іх', 'гэты', 'гэта', 'ёсць', 'мець', 'рабіць', 'гаварыць'],
      uk: ['який', 'з', 'один', 'для', 'є', 'як', 'більше', 'з', 'і', 'їх', 'цей', 'ця', 'є', 'мати', 'робити', 'говорити'],
    };

    let maxScore = 0;
    let detectedLang = 'en';

    for (const [lang, indicators] of Object.entries(languageIndicators)) {
      const matches = words.filter(word => indicators.includes(word)).length;
      const score = matches / Math.min(words.length, 20); // Normalize by text length
      
      if (score > maxScore) {
        maxScore = score;
        detectedLang = lang;
      }
    }

    if (maxScore > 0.1) {
      return detectedLang;
    }
  }

  // Default to English
  return 'en';
};

// Validate and sanitize language code
export const validateLanguageCode = (lang: string): string => {
  const supportedLanguages = [
    // Major languages
    'en', 'ar', 'zh', 'hi', 'es', 'fr', 'de', 'ja', 'ko', 'pt', 'it', 'ru', 'tr', 'nl', 'sv', 'da', 'no', 'fi', 'pl', 'cs', 'hu', 'ro', 'bg', 'hr', 'sk', 'sl', 'et', 'lv', 'lt', 'el', 'he', 'th', 'vi', 'id', 'ms', 'tl', 'bn', 'ur', 'fa', 'ta', 'te', 'ml', 'kn', 'gu', 'pa', 'or', 'as', 'mr', 'ne', 'si', 'my', 'km', 'lo', 'sw', 'ha', 'yo', 'ig', 'am', 'so', 'zu', 'xh', 'af', 'sq', 'mk', 'be', 'uk', 'kk', 'ky', 'uz', 'tk', 'tg', 'mn', 'ka', 'hy', 'az',
    // Additional languages
    'ku', 'ps', 'sd', 'ug', 'ckb', 'yi', 'jv', 'su', 'ceb', 'haw', 'mi', 'sm', 'to', 'fj', 'eo', 'la', 'hmn', 'co', 'fy', 'ht', 'lb', 'mg', 'ny', 'sn', 'ff', 'wo', 'bm', 'dyu', 'ee', 'gaa', 'ti', 'om'
  ];
  return supportedLanguages.includes(lang) ? lang : 'en';
};
